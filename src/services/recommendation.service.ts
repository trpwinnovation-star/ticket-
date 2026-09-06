import { prisma } from '@/lib/prisma';
import { RecommendationStatus } from '@prisma/client';

export interface CreateRecommendationDTO {
  title: string;
  description: string;
  websiteName: string;
  moduleName: string;
  screenshotUrl?: string;
  authorId: string;
}

export class RecommendationService {
  /**
   * Safe helper to populate assignedTo user and team without triggering ungenerated Prisma relation errors
   */
  private static async populateRelations(recs: any[]) {
    const userIds = recs.map((r) => r.assignedToId).filter(Boolean);
    let teamIds = recs.map((r) => r.teamId).filter(Boolean);

    const users = userIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : [];

    for (const u of users) {
      if (u.teamId && !teamIds.includes(u.teamId)) {
        teamIds.push(u.teamId);
      }
    }

    const teams = teamIds.length > 0 ? await prisma.team.findMany({ where: { id: { in: teamIds } } }) : [];

    const userMap = new Map(users.map((u) => [u.id, u]));
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    return recs.map((r) => {
      const assignedUser = r.assignedToId ? userMap.get(r.assignedToId) || null : null;
      const effectiveTeamId = r.teamId || (assignedUser ? assignedUser.teamId : null);
      const assignedTeam = effectiveTeamId ? teamMap.get(effectiveTeamId) || null : null;

      return {
        ...r,
        teamId: effectiveTeamId,
        assignedTo: assignedUser,
        team: assignedTeam,
      };
    });
  }

  /**
   * Get all recommendations with author details, assigned team, assigned specialist & upvotes
   */
  static async getAll() {
    const recommendations: any[] = await prisma.$queryRaw`
      SELECT r.*,
             json_build_object(
               'id', u.id,
               'name', u.name,
               'email', u.email,
               'avatar', u.avatar,
               'role', u.role
             ) as author
      FROM "Recommendation" r
      LEFT JOIN "User" u ON r."authorId" = u.id
      ORDER BY r."createdAt" DESC
    `;

    const populatedRecs = await RecommendationService.populateRelations(recommendations);

    let votes: any[] = [];
    try {
      if ((prisma as any).recommendationVote?.findMany) {
        votes = await (prisma as any).recommendationVote.findMany();
      } else {
        votes = await prisma.$queryRaw`SELECT * FROM "RecommendationVote"`;
      }
    } catch (e) {
      console.warn('Failed to fetch recommendation votes:', e);
    }

    const recsWithVotes = populatedRecs.map((rec) => ({
      ...rec,
      votes: votes.filter((v) => v.recommendationId === rec.id),
    }));

    return { source: 'prisma_database', recommendations: recsWithVotes };
  }

  /**
   * Submit new recommendation with screenshot
   */
  static async create(dto: CreateRecommendationDTO) {
    let authorId = dto.authorId;
    if (!authorId) {
      throw new Error('Author authentication required to submit a recommendation.');
    }
    const author = await prisma.user.findUnique({ where: { id: authorId } });
    if (!author) {
      throw new Error('Author user account not found.');
    }

    const rec = await prisma.recommendation.create({
      data: {
        title: dto.title,
        description: dto.description,
        websiteName: dto.websiteName,
        moduleName: dto.moduleName,
        screenshotUrl: dto.screenshotUrl,
        authorId: authorId,
        upvotes: 1,
      },
      include: { author: true },
    });

    // Create the initial vote record for the author
    try {
      if ((prisma as any).recommendationVote?.create) {
        await (prisma as any).recommendationVote.create({
          data: {
            recommendationId: rec.id,
            userId: authorId,
          },
        });
      } else {
        const voteId = `vote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await prisma.$executeRaw`INSERT INTO "RecommendationVote" ("id", "recommendationId", "userId", "createdAt") VALUES (${voteId}, ${rec.id}, ${authorId}, NOW())`;
      }
    } catch (e) {
      console.warn('Failed to create initial recommendation vote record:', e);
    }

    const [populated] = await RecommendationService.populateRelations([rec]);
    return { source: 'prisma_database', recommendation: { ...populated, votes: [{ userId: authorId }] } };
  }

  /**
   * Toggle Upvote on suggestion (1 upvote maximum per user account)
   */
  static async toggleUpvote(recId: string, userId: string) {
    if (!userId) {
      throw new Error('User account identification required to upvote.');
    }

    // Check if this user has already voted for this recommendation
    let existingVote: any = null;
    try {
      if ((prisma as any).recommendationVote?.findFirst) {
        existingVote = await (prisma as any).recommendationVote.findFirst({
          where: {
            recommendationId: recId,
            userId: userId,
          },
        });
      } else {
        const rows: any[] = await prisma.$queryRaw`SELECT * FROM "RecommendationVote" WHERE "recommendationId" = ${recId} AND "userId" = ${userId} LIMIT 1`;
        existingVote = rows[0] || null;
      }
    } catch (e) {
      console.warn('Failed to query vote record:', e);
    }

    if (existingVote) {
      // Remove upvote (toggle off)
      try {
        if ((prisma as any).recommendationVote?.delete) {
          await (prisma as any).recommendationVote.delete({
            where: { id: existingVote.id },
          });
        } else {
          await prisma.$executeRaw`DELETE FROM "RecommendationVote" WHERE "id" = ${existingVote.id}`;
        }
      } catch (e) {
        console.warn('Failed to delete vote record:', e);
      }

      const updated = await prisma.recommendation.update({
        where: { id: recId },
        data: { upvotes: { decrement: 1 } },
        include: { author: true },
      });
      const [populated] = await RecommendationService.populateRelations([updated]);
      return { source: 'prisma_database', recommendation: populated, hasVoted: false };
    } else {
      // Add upvote (toggle on)
      try {
        if ((prisma as any).recommendationVote?.create) {
          await (prisma as any).recommendationVote.create({
            data: {
              recommendationId: recId,
              userId: userId,
            },
          });
        } else {
          const voteId = `vote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          await prisma.$executeRaw`INSERT INTO "RecommendationVote" ("id", "recommendationId", "userId", "createdAt") VALUES (${voteId}, ${recId}, ${userId}, NOW())`;
        }
      } catch (e) {
        console.warn('Failed to insert vote record:', e);
      }

      const updated = await prisma.recommendation.update({
        where: { id: recId },
        data: { upvotes: { increment: 1 } },
        include: { author: true },
      });
      const [populated] = await RecommendationService.populateRelations([updated]);
      return { source: 'prisma_database', recommendation: populated, hasVoted: true };
    }
  }

  /**
   * Update recommendation status and team/specialist assignment (Level 3/4 action)
   */
  static async updateStatus(
    recId: string,
    status: RecommendationStatus,
    teamId?: string | null,
    assignedToId?: string | null
  ) {
    const rec = await prisma.recommendation.findUnique({ where: { id: recId } });
    if (!rec) throw new Error(`Recommendation ${recId} not found.`);

    let newTeamId = (rec as any).teamId || null;
    let newAssignedToId = (rec as any).assignedToId || null;

    if (teamId !== undefined) newTeamId = teamId || null;
    if (assignedToId !== undefined) newAssignedToId = assignedToId || null;

    await prisma.$executeRaw`
      UPDATE "Recommendation"
      SET "teamId" = ${newTeamId},
          "assignedToId" = ${newAssignedToId},
          "status" = ${status}::"RecommendationStatus"
      WHERE "id" = ${recId}
    `;

    const updated = await prisma.recommendation.findUnique({
      where: { id: recId },
      include: { author: true },
    });
    const [populated] = await RecommendationService.populateRelations([updated]);
    return { source: 'prisma_database', recommendation: populated };
  }

  /**
   * Assign recommendation to an operational team and/or specialist
   */
  static async assign(recId: string, teamId?: string | null, assignedToId?: string | null, status?: RecommendationStatus) {
    const rec = await prisma.recommendation.findUnique({ where: { id: recId } });
    if (!rec) throw new Error(`Recommendation ${recId} not found.`);

    let newTeamId = (rec as any).teamId || null;
    let newAssignedToId = (rec as any).assignedToId || null;

    if (teamId !== undefined) {
      newTeamId = teamId || null;
    }

    if (assignedToId !== undefined) {
      newAssignedToId = assignedToId || null;
      if (assignedToId) {
        const user = await prisma.user.findUnique({ where: { id: assignedToId } });
        if (user && user.teamId) {
          newTeamId = user.teamId;
        } else {
          const teamMember = await prisma.team.findFirst({
            where: { members: { some: { id: assignedToId } } },
          });
          if (teamMember) {
            newTeamId = teamMember.id;
          }
        }
      }
    }

    const targetStatus = status || RecommendationStatus.IN_DEVELOPMENT;

    await prisma.$executeRaw`
      UPDATE "Recommendation"
      SET "teamId" = ${newTeamId},
          "assignedToId" = ${newAssignedToId},
          "status" = ${targetStatus}::"RecommendationStatus"
      WHERE "id" = ${recId}
    `;

    const updated = await prisma.recommendation.findUnique({
      where: { id: recId },
      include: { author: true },
    });
    const [populated] = await RecommendationService.populateRelations([updated]);
    return { source: 'prisma_database', recommendation: populated };
  }

  /**
   * Convert an approved recommendation into an active support ticket assigned to a team/specialist
   */
  static async convertToTicket(recId: string, teamId?: string | null, assignedToId?: string | null) {
    const rec = await prisma.recommendation.findUnique({
      where: { id: recId },
      include: { author: true, attachments: true },
    });

    if (!rec) {
      throw new Error(`Recommendation ${recId} not found.`);
    }

    // Block converting a suggestion multiple times
    if (rec.status === RecommendationStatus.IN_DEVELOPMENT || rec.status === RecommendationStatus.IMPLEMENTED) {
      throw new Error(`This suggestion has already been converted into a ticket and is currently in ${rec.status.replace('_', ' ')} status.`);
    }

    const existingTicket = await prisma.ticket.findFirst({
      where: {
        title: `[Suggestion] ${rec.title}`,
        createdById: rec.authorId,
      },
    });

    if (existingTicket) {
      throw new Error(`This suggestion has already been converted into active Ticket #${existingTicket.ticketNumber}! Multiple conversions are not allowed.`);
    }

    const count = await prisma.ticket.count();
    const ticketNumber = `TKT-${1001 + count}`;
    const targetTeam = teamId !== undefined ? teamId : (rec as any).teamId;
    const targetAssignee = assignedToId !== undefined ? assignedToId : (rec as any).assignedToId;

    // Build attachments array to carry over screenshots and files to the ticket
    const attachmentsToCreate: any[] = [];
    if (rec.screenshotUrl) {
      attachmentsToCreate.push({
        fileName: 'Suggestion_Screenshot.png',
        fileUrl: rec.screenshotUrl,
        fileType: 'image/png',
        fileSize: 1024,
      });
    }

    if (rec.attachments && rec.attachments.length > 0) {
      for (const att of rec.attachments) {
        if (att.fileUrl !== rec.screenshotUrl) {
          attachmentsToCreate.push({
            fileName: att.fileName || 'Attachment.png',
            fileUrl: att.fileUrl,
            fileType: att.fileType || 'image/png',
            fileSize: att.fileSize || 1024,
          });
        }
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: `[Suggestion] ${rec.title}`,
        description: rec.description,
        websiteName: rec.websiteName,
        module: rec.moduleName,
        category: 'Feature Access / Enhancement',
        priority: 'MEDIUM',
        status: (targetTeam || targetAssignee) ? 'ASSIGNED' : 'APPROVED',
        createdById: rec.authorId,
        teamId: targetTeam || null,
        assignedToId: targetAssignee || null,
        attachments: attachmentsToCreate.length > 0 ? { create: attachmentsToCreate } : undefined,
      },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
        attachments: true,
      },
    });

    await prisma.$executeRaw`
      UPDATE "Recommendation"
      SET "teamId" = ${targetTeam || null},
          "assignedToId" = ${targetAssignee || null},
          "status" = 'IN_DEVELOPMENT'::"RecommendationStatus"
      WHERE "id" = ${recId}
    `;

    const updatedRec = await prisma.recommendation.findUnique({
      where: { id: recId },
      include: { author: true },
    });

    const [populatedRec] = await RecommendationService.populateRelations([updatedRec]);
    return { source: 'prisma_database', ticket, recommendation: populatedRec };
  }
}

