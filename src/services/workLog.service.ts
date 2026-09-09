import { prisma } from '@/lib/prisma';
import { TicketStatus } from '@prisma/client';

export interface LogWorkHoursDTO {
  ticketId: string;
  userId: string;
  hoursSpent: number;
  description: string;
  workDate?: string;
  environment?: string | null;
  branchName?: string | null;
}

export class WorkLogService {
  /**
   * Fetch all IT logged work hours / timesheets
   */
  static async getAllWorkLogs() {
    const logs = await prisma.workLog.findMany({
      include: {
        user: true,
        ticket: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { source: 'prisma_database', logs };
  }

  /**
   * Log technical work hours spent on a ticket
   */
  static async logHours(dto: LogWorkHoursDTO) {
    if (!Number.isFinite(dto.hoursSpent) || dto.hoursSpent <= 0 || dto.hoursSpent > 24) {
      throw new Error('hoursSpent must be between 0 and 24.');
    }
    if (!dto.description || dto.description.length > 5000) throw new Error('Invalid work log description.');
    const ticket = await prisma.ticket.findUnique({ where: { id: dto.ticketId } });
    if (!ticket) throw new Error('Ticket not found.');
    const user = await prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new Error('User not found.');
    if (user.role !== 'IT_SOFTWARE' && user.role !== 'MANAGER' && user.role !== 'SUPER_ADMIN') throw new Error('Only staff may log work.');
    if (user.role === 'IT_SOFTWARE' && ticket.assignedToId !== user.id && ticket.teamId !== user.teamId) {
      throw new Error('You are not assigned to this ticket.');
    }
    let userId = dto.userId;
    const workLog = await prisma.workLog.create({
      data: {
        ticketId: dto.ticketId,
        userId: userId,
        hoursSpent: dto.hoursSpent,
        description: dto.description,
        workDate: dto.workDate ? new Date(dto.workDate) : new Date(),
        environment: dto.environment || null,
        branchName: dto.branchName || null,
      },
      include: {
        user: true,
        ticket: true,
      },
    });

    // Update ticket status to IN_PROGRESS if ASSIGNED, and set active environment/branch if provided
    const ticketDataToUpdate: any = { status: TicketStatus.IN_PROGRESS };
    if (dto.environment) ticketDataToUpdate.environment = dto.environment;
    if (dto.branchName) ticketDataToUpdate.branchName = dto.branchName;

    await prisma.ticket.update({
      where: { id: dto.ticketId },
      data: ticketDataToUpdate,
    });

    return { source: 'prisma_database', workLog };
  }
}

