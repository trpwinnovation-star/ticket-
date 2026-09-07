import { prisma } from '@/lib/prisma';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { NotificationService } from './notification.service';
import crypto from 'crypto';

type Actor = { id: string; role: 'GUEST_USER' | 'IT_SOFTWARE' | 'MANAGER' | 'SUPER_ADMIN'; teamId?: string | null; };

function canAccessTicket(ticket: { createdById: string; assignedToId: string | null; teamId: string | null }, actor: Actor) {
  return actor.role === 'SUPER_ADMIN' || actor.role === 'MANAGER' || ticket.createdById === actor.id || ticket.assignedToId === actor.id || (Boolean(ticket.teamId) && ticket.teamId === actor.teamId);
}

export interface CreateTicketDTO {
  title: string;
  description: string;
  websiteName: string;
  module: string;
  category: string;
  priority?: TicketPriority;
  createdById: string;
  attachments?: { fileName: string; fileUrl: string; fileType: string; fileSize: number }[];
}

export interface ApproveTicketDTO {
  ticketId: string;
  assignedToId?: string;
  teamId?: string;
  priority?: TicketPriority;
  targetClosureDate?: string | Date;
}

export interface RejectTicketDTO {
  ticketId: string;
  rejectionReason: string;
}

export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  websiteName?: string;
  module?: string;
  category?: string;
  priority?: TicketPriority;
}

export class TicketService {
  /**
   * Fetch all tickets with full relations
   */
  static async getAllTickets(actor: Actor) {
    const where = actor.role === 'SUPER_ADMIN' || actor.role === 'MANAGER'
      ? undefined
      : { OR: [{ createdById: actor.id }, { assignedToId: actor.id }, { team: { members: { some: { id: actor.id } } } }] };
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
        workLogs: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { source: 'prisma_database', tickets };
  }

  /**
   * Get single ticket by ID
   */
  static async getTicketById(id: string, actor: Actor) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
        workLogs: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
    });

    if (!ticket) {
      throw new Error(`Ticket with ID ${id} not found.`);
    }
    if (!canAccessTicket(ticket, actor)) throw new Error('Ticket not found.');
    return { source: 'prisma_database', ticket };
  }

  /**
   * Create a new ticket (Level 1 Guest submission)
   */
  static async createTicket(dto: CreateTicketDTO) {
    const count = await prisma.ticket.count();
      const ticketNumber = `TKT-${Date.now()}-${crypto.randomInt(1000, 9999)}`;

    let userId = dto.createdById;
    if (!userId) {
      throw new Error('User authentication required to submit a ticket.');
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User account not found.');
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: dto.title,
        description: dto.description,
        websiteName: dto.websiteName,
        module: dto.module,
        category: dto.category,
        priority: dto.priority || TicketPriority.MEDIUM,
        status: TicketStatus.PENDING_APPROVAL,
        createdById: userId,
        attachments: {
          create: (dto.attachments || []).slice(0, 5).map((att) => ({
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileType: att.fileType || 'image/png',
            fileSize: Math.min(Math.max(Number(att.fileSize) || 0, 0), 5 * 1024 * 1024),
          })),
        },
      },
      include: {
        createdBy: true,
        attachments: true,
      },
    });
    return { source: 'prisma_database', ticket };
  }

  /**
   * Add a comment (Public or Internal IT note) to a ticket
   */
  static async addComment(ticketId: string, authorId: string, content: string, isInternal: boolean = false, actor?: Actor) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Ticket not found');
    if (actor && !canAccessTicket(ticket, actor)) throw new Error('Ticket not found.');
    if (isInternal && actor && !['IT_SOFTWARE', 'MANAGER', 'SUPER_ADMIN'].includes(actor.role)) throw new Error('Internal comments are restricted.');

    if (!authorId) {
      throw new Error('Author identity required to post comment.');
    }
    const author = await prisma.user.findUnique({ where: { id: authorId } });
    if (!author) {
      throw new Error('Author user account not found.');
    }
    const validAuthorId = authorId;

    const comment = await prisma.comment.create({
      data: {
        ticketId,
        authorId: validAuthorId,
        content,
        isInternal,
      },
      include: {
        author: true,
      },
    });

    // Send notifications to stakeholders
    try {
      const authorName = comment.author?.name || 'Someone';
      const isNeedInfo = ticket.status === 'NEED_MORE_DETAILS' || content.toLowerCase().includes('more detail') || content.toLowerCase().includes('clarification');
      
      const recipients = isInternal
        ? [ticket.assignedToId] // Internal notes only notify IT staff
        : [ticket.createdById, ticket.assignedToId]; // Public comments notify submitter + developer

      await NotificationService.notifyStakeholders({
        recipientIds: recipients,
        excludeUserId: validAuthorId,
        title: isInternal ? `Internal IT Note on ${ticket.ticketNumber}` : `New Comment on ${ticket.ticketNumber}`,
        message: `${authorName}: "${content.substring(0, 70)}${content.length > 70 ? '...' : ''}"`,
        type: isNeedInfo ? 'NEED_INFO' : 'COMMENT',
        link: `/tickets/${ticketId}`,
      });
    } catch (e) {
      console.warn('Failed to dispatch comment notification:', e);
    }

    return { source: 'prisma_database', comment };
  }

  /**
   * Manager Approve Ticket (Level 3 Manager action)
   */
  static async approveTicket(dto: ApproveTicketDTO) {
    const updated = await prisma.ticket.update({
      where: { id: dto.ticketId },
      data: {
        status: (dto.assignedToId || dto.teamId) ? TicketStatus.ASSIGNED : TicketStatus.APPROVED,
        priority: dto.priority || undefined,
        assignedToId: dto.assignedToId || undefined,
        teamId: dto.teamId || undefined,
        targetClosureDate: dto.targetClosureDate ? new Date(dto.targetClosureDate) : undefined,
      },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
      },
    });

    try {
      await NotificationService.notifyStakeholders({
        recipientIds: [updated.createdById, updated.assignedToId],
        title: `Ticket ${updated.ticketNumber} Approved`,
        message: `Your ticket has been approved by management and is ready for work.`,
        type: 'STATUS_CHANGE',
        link: `/tickets/${updated.id}`,
      });
    } catch (e) {
      console.warn('Approval notification failed:', e);
    }

    return { source: 'prisma_database', ticket: updated };
  }

  /**
   * Manager Reject Ticket (Level 3 Manager action)
   */
  static async rejectTicket(dto: RejectTicketDTO) {
    const updated = await prisma.ticket.update({
      where: { id: dto.ticketId },
      data: {
        status: TicketStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
        closedAt: new Date(),
      },
    });

    try {
      await NotificationService.notifyStakeholders({
        recipientIds: [updated.createdById],
        title: `Ticket ${updated.ticketNumber} Rejected`,
        message: `Reason: ${dto.rejectionReason}`,
        type: 'STATUS_CHANGE',
        link: `/tickets/${updated.id}`,
      });
    } catch (e) {
      console.warn('Rejection notification failed:', e);
    }

    return { source: 'prisma_database', ticket: updated };
  }

  /**
   * Update Technical Status (Level 2 IT Team action)
   */
  static async updateStatus(ticketId: string, status: TicketStatus, actor?: Actor) {
    const current = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!current) throw new Error('Ticket not found.');
    if (actor?.role === 'IT_SOFTWARE' && current.assignedToId !== actor.id && (!current.teamId || current.teamId !== actor.teamId)) {
      throw new Error('You are not assigned to this ticket.');
    }
    const isClosed = status === TicketStatus.RESOLVED || status === TicketStatus.COMPLETED || status === TicketStatus.CLOSED;
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        closedAt: isClosed ? new Date() : undefined,
      },
    });

    try {
      await NotificationService.notifyStakeholders({
        recipientIds: [updated.createdById, updated.assignedToId],
        title: `Status Update on Ticket ${updated.ticketNumber}`,
        message: `Ticket status has been changed to ${status.replace('_', ' ')}.`,
        type: status === 'NEED_MORE_DETAILS' ? 'NEED_INFO' : 'STATUS_CHANGE',
        link: `/tickets/${updated.id}`,
      });
    } catch (e) {
      console.warn('Status update notification failed:', e);
    }

    return { source: 'prisma_database', ticket: updated };
  }

  /**
   * Manager Assign / Reassign IT Specialist or Team with optional targetClosureDate
   */
  static async assignTicket(
    ticketId: string,
    assignedToId?: string | null,
    teamId?: string | null,
    targetClosureDate?: string | Date | null,
    priority?: TicketPriority
  ) {
    let finalTeamId = teamId || null;
    let finalAssigneeId = assignedToId || null;

    if (finalAssigneeId) {
      const user = await prisma.user.findUnique({ where: { id: finalAssigneeId } });
      if (user && user.teamId) {
        finalTeamId = user.teamId;
      }
    }

    if (finalTeamId && finalAssigneeId) {
      const user = await prisma.user.findUnique({ where: { id: finalAssigneeId } });
      if (user && user.teamId && user.teamId !== finalTeamId) {
        finalAssigneeId = null;
      }
    }

    const dataObj: any = {
      assignedToId: finalAssigneeId,
      teamId: finalTeamId,
      status: (finalAssigneeId || finalTeamId) ? TicketStatus.ASSIGNED : TicketStatus.APPROVED,
    };
    if (targetClosureDate !== undefined) {
      dataObj.targetClosureDate = targetClosureDate ? new Date(targetClosureDate) : null;
    }
    if (priority !== undefined) {
      dataObj.priority = priority;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: dataObj,
      include: {
        assignedTo: true,
        createdBy: true,
        team: true,
      },
    });

    if (finalAssigneeId) {
      try {
        await NotificationService.notifyStakeholders({
          recipientIds: [finalAssigneeId],
          title: `Assigned to Ticket ${updated.ticketNumber}`,
          message: `You have been assigned as the specialist for ticket: "${updated.title}".`,
          type: 'ASSIGNMENT',
          link: `/tickets/${updated.id}`,
        });
      } catch (e) {
        console.warn('Assignment notification failed:', e);
      }
    }

    return { source: 'prisma_database', ticket: updated };
  }

  /**
   * Manager / Admin Update Urgency / Priority Level
   */
  static async updatePriority(ticketId: string, priority: TicketPriority) {
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { priority },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
      },
    });

    try {
      await NotificationService.notifyStakeholders({
        recipientIds: [updated.createdById, updated.assignedToId],
        title: `Priority Updated on Ticket ${updated.ticketNumber}`,
        message: `Priority level was updated to ${priority}.`,
        type: 'STATUS_CHANGE',
        link: `/tickets/${updated.id}`,
      });
    } catch (e) {
      console.warn('Priority notification failed:', e);
    }

    return { source: 'prisma_database', ticket: updated };
  }

  /**
   * Edit / Update Ticket details (by Ticket Creator, Manager, or Admin)
   */
  static async updateTicket(ticketId: string, dto: UpdateTicketDTO, actor: Actor) {
    const current = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!current) {
      throw new Error('Ticket not found.');
    }

    const isManagerOrAdmin = actor.role === 'MANAGER' || actor.role === 'SUPER_ADMIN';
    const isCreator = current.createdById === actor.id;

    if (!isManagerOrAdmin && !isCreator) {
      throw new Error('You do not have permission to edit this ticket.');
    }

    if (isCreator && !isManagerOrAdmin) {
      if (['RESOLVED', 'COMPLETED', 'CLOSED'].includes(current.status)) {
        throw new Error('Ticket details cannot be edited once resolved or closed.');
      }
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        websiteName: dto.websiteName !== undefined ? dto.websiteName : undefined,
        module: dto.module !== undefined ? dto.module : undefined,
        category: dto.category !== undefined ? dto.category : undefined,
        priority: dto.priority !== undefined ? dto.priority : undefined,
      },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
        attachments: true,
      },
    });

    try {
      await NotificationService.notifyStakeholders({
        recipientIds: [updated.createdById, updated.assignedToId],
        excludeUserId: actor.id,
        title: `Ticket ${updated.ticketNumber} Details Updated`,
        message: `Ticket details were updated by ${isCreator ? 'creator' : 'manager'}.`,
        type: 'STATUS_CHANGE',
        link: `/tickets/${updated.id}`,
      });
    } catch (e) {
      console.warn('Update notification failed:', e);
    }

    return { source: 'prisma_database', ticket: updated };
  }
}

