import { prisma } from '@/lib/prisma';

export interface CreateTeamDTO {
  name: string;
  description?: string;
  leadId?: string;
}

export class TeamService {
  /**
   * Fetch all subcontractor IT teams
   */
  static async getAllTeams() {
    const teams = await prisma.team.findMany({
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });
    return { source: 'prisma_database', teams };
  }

  /**
   * Create a new subcontractor team
   */
  static async createTeam(dto: CreateTeamDTO) {
    const team = await prisma.team.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
    return { source: 'prisma_database', team };
  }

  /**
   * Add a user to a subcontractor team (supports multi-team assignment)
   */
  static async addMemberToTeam(teamId: string, userId: string) {
    try {
      const team = await prisma.team.update({
        where: { id: teamId },
        data: {
          members: {
            connect: { id: userId },
          },
        },
        include: { members: true },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { teamId },
      }).catch(() => { });
      return { source: 'prisma_database', team };
    } catch {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { teamId },
      });
      return { source: 'prisma_database', user };
    }
  }

  /**
   * Remove a user from a specific team
   */
  static async removeMemberFromTeam(teamId: string, userId: string) {
    try {
      const team = await prisma.team.update({
        where: { id: teamId },
        data: {
          members: {
            disconnect: { id: userId },
          },
        },
        include: { members: true },
      });
      return { source: 'prisma_database', team };
    } catch {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { teamId: null },
      });
      return { source: 'prisma_database', user };
    }
  }

  /**
   * Delete a team and dissociate associated tickets & members
   */
  static async deleteTeam(teamId: string) {
    // Unlink tickets assigned to this team
    await prisma.ticket.updateMany({
      where: { teamId },
      data: { teamId: null },
    });

    // Unlink users assigned to this team
    await prisma.user.updateMany({
      where: { teamId },
      data: { teamId: null },
    });

    // Delete the team record
    await prisma.team.delete({
      where: { id: teamId },
    });

    return { source: 'prisma_database', success: true };
  }
}

