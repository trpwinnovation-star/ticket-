import { prisma } from '@/lib/prisma';
import { TicketStatus, Role } from '@prisma/client';

export class AdminService {
  /**
   * Calculate global Super Admin metrics, approval SLAs, logged hours, and audit logs
   */
  static async getPlatformMetrics() {
    const [totalTickets, pendingApproval, approvedCount, completedCount, workLogs, teamsCount, usersCount] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: TicketStatus.PENDING_APPROVAL } }),
      prisma.ticket.count({
        where: {
          status: {
            in: [
              TicketStatus.APPROVED,
              TicketStatus.ASSIGNED,
              TicketStatus.IN_PROGRESS,
              TicketStatus.PENDING_TESTING,
              TicketStatus.RESOLVED,
              TicketStatus.COMPLETED,
              TicketStatus.CLOSED,
            ],
          },
        },
      }),
      prisma.ticket.count({
        where: { status: { in: [TicketStatus.RESOLVED, TicketStatus.COMPLETED, TicketStatus.CLOSED] } },
      }),
      prisma.workLog.findMany({ include: { user: true, ticket: true }, orderBy: { createdAt: 'desc' } }),
      prisma.team.count(),
      prisma.user.count(),
    ]);

    const totalHoursLogged = workLogs.reduce((acc: number, log: { hoursSpent: number }) => acc + log.hoursSpent, 0);
    const approvalRate = totalTickets > 0 ? Math.round(((totalTickets - pendingApproval) / totalTickets) * 100) : 100;
    const resolutionRate = totalTickets > 0 ? Math.round((completedCount / totalTickets) * 100) : 0;

    return {
      source: 'prisma_database',
      metrics: {
        totalTickets,
        pendingApprovalTickets: pendingApproval,
        approvedTickets: approvedCount,
        completedTickets: completedCount,
        approvalRate,
        resolutionRate,
        totalHoursLogged: Math.round(totalHoursLogged * 10) / 10,
        totalTeams: teamsCount,
        totalUsers: usersCount,
        recentWorkLogs: workLogs,
      },
    };
  }

  /**
   * Get all registered platform users for Super Admin management (with multi-team support)
   */
  static async getAllUsers() {
    const [users, teams] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          jobTitle: true,
          avatar: true,
          teamId: true,
          team: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.team.findMany({
        include: { members: true },
      }),
    ]);

    const usersWithTeams = users.map((u) => {
      const assignedTeams = teams.filter(
        (t) => t.members.some((m) => m.id === u.id) || t.id === u.teamId
      );
      return {
        ...u,
        teams: assignedTeams,
      };
    });

    return { users: usersWithTeams };
  }

  /**
   * Update a user's access role level (Super Admin action)
   */
  static async updateUserRole(userId: string, newRole: Role) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        avatar: true,
        teamId: true,
        team: true,
        createdAt: true,
      },
    });
    return { user: updated };
  }

  /**
   * Update a user's subcontractor team assignment
   */
  static async updateUserTeam(userId: string, teamId: string | null) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { teamId: teamId || null },
      include: { team: true },
    });
    return { user: updated };
  }
}


