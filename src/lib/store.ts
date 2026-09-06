// Client State Management and Persistence Store
import {
  Ticket,
  Recommendation,
  WorkLog,
  Team,
  User,
  Comment,
  DEMO_TICKETS,
  DEMO_RECOMMENDATIONS,
  DEMO_TEAMS,
  DEMO_USERS,
  TicketStatus,
  TicketPriority,
  RecommendationStatus,
} from './db';

const TICKETS_KEY = 'tm_tickets_v3';
const RECS_KEY = 'tm_recommendations_v3';
const TEAMS_KEY = 'tm_teams_v3';
const USERS_KEY = 'tm_users_v3';

// Helper to safely parse local storage
function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export class TicketStore {
  // --- USERS ---
  static getUsers(): User[] {
    return getStorage<User[]>(USERS_KEY, DEMO_USERS);
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  // --- TEAMS ---
  static getTeams(): Team[] {
    return getStorage<Team[]>(TEAMS_KEY, DEMO_TEAMS);
  }

  static createTeam(name: string, description: string, leadId: string): Team {
    const teams = this.getTeams();
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name,
      description,
      leadId,
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };
    teams.push(newTeam);
    setStorage(TEAMS_KEY, teams);
    return newTeam;
  }

  static deleteTeam(teamId: string): boolean {
    const teams = this.getTeams();
    const filtered = teams.filter((t) => t.id !== teamId);
    setStorage(TEAMS_KEY, filtered);
    return true;
  }

  // --- TICKETS ---
  static getTickets(): Ticket[] {
    return getStorage<Ticket[]>(TICKETS_KEY, DEMO_TICKETS);
  }

  static getTicketById(id: string): Ticket | undefined {
    return this.getTickets().find((t) => t.id === id || t.ticketNumber === id);
  }

  static createTicket(data: {
    title: string;
    description: string;
    websiteName: string;
    module: string;
    category: string;
    priority: TicketPriority;
    createdById: string;
    attachments?: { fileName: string; fileUrl: string; fileType: string; fileSize: number }[];
  }): Ticket {
    const tickets = this.getTickets();
    const users = this.getUsers();
    const creator = users.find((u) => u.id === data.createdById) || users[0];

    const nextNum = 1000 + tickets.length + 1;
    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-${nextNum}`,
      title: data.title,
      description: data.description,
      websiteName: data.websiteName,
      module: data.module,
      category: data.category,
      priority: data.priority,
      status: 'PENDING_APPROVAL', // Goes directly to Manager Inbox for Level 3 review
      createdById: creator.id,
      createdBy: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        avatar: creator.avatar,
      },
      attachments: (data.attachments || []).map((att, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileSize: att.fileSize,
        createdAt: new Date().toISOString(),
      })),
      comments: [
        {
          id: `cmt-${Date.now()}`,
          ticketId: `tkt-${Date.now()}`,
          authorId: creator.id,
          authorName: creator.name,
          authorRole: creator.role,
          authorAvatar: creator.avatar,
          content: `Ticket created and submitted for Manager approval.`,
          isInternal: false,
          createdAt: new Date().toISOString(),
        },
      ],
      workLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tickets.unshift(newTicket);
    setStorage(TICKETS_KEY, tickets);
    return newTicket;
  }

  // --- MANAGER ACTIONS ---
  static approveTicket(
    ticketId: string,
    assignedToId?: string,
    teamId?: string,
    priority?: TicketPriority
  ): Ticket | undefined {
    const tickets = this.getTickets();
    const users = this.getUsers();
    const teams = this.getTeams();
    const tIdx = tickets.findIndex((t) => t.id === ticketId);

    if (tIdx === -1) return undefined;

    const ticket = tickets[tIdx];
    ticket.status = assignedToId ? 'ASSIGNED' : 'APPROVED';
    ticket.updatedAt = new Date().toISOString();

    if (priority) ticket.priority = priority;

    if (assignedToId) {
      const assignee = users.find((u) => u.id === assignedToId);
      if (assignee) {
        ticket.assignedToId = assignee.id;
        ticket.assignedTo = {
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
          avatar: assignee.avatar,
        };
      }
    }

    if (teamId) {
      const team = teams.find((tm) => tm.id === teamId);
      if (team) {
        ticket.teamId = team.id;
        ticket.teamName = team.name;
      }
    }

    ticket.comments.push({
      id: `cmt-${Date.now()}`,
      ticketId: ticket.id,
      authorId: 'usr-4', // Manager ID
      authorName: 'Rajesh Singhania',
      authorRole: 'MANAGER',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      content: `Ticket APPROVED by Manager.${
        ticket.assignedTo ? ` Assigned to ${ticket.assignedTo.name}.` : ''
      }`,
      isInternal: false,
      createdAt: new Date().toISOString(),
    });

    tickets[tIdx] = ticket;
    setStorage(TICKETS_KEY, tickets);
    return ticket;
  }

  static rejectTicket(ticketId: string, reason: string): Ticket | undefined {
    const tickets = this.getTickets();
    const tIdx = tickets.findIndex((t) => t.id === ticketId);
    if (tIdx === -1) return undefined;

    const ticket = tickets[tIdx];
    ticket.status = 'REJECTED';
    ticket.rejectionReason = reason;
    ticket.updatedAt = new Date().toISOString();

    ticket.comments.push({
      id: `cmt-${Date.now()}`,
      ticketId: ticket.id,
      authorId: 'usr-4',
      authorName: 'Rajesh Singhania',
      authorRole: 'MANAGER',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      content: `Ticket REJECTED by Manager. Reason: ${reason}`,
      isInternal: false,
      createdAt: new Date().toISOString(),
    });

    tickets[tIdx] = ticket;
    setStorage(TICKETS_KEY, tickets);
    return ticket;
  }

  // --- IT TEAM ACTIONS ---
  static updateStatus(ticketId: string, status: TicketStatus, userId: string): Ticket | undefined {
    const tickets = this.getTickets();
    const users = this.getUsers();
    const tIdx = tickets.findIndex((t) => t.id === ticketId);
    if (tIdx === -1) return undefined;

    const ticket = tickets[tIdx];
    const updater = users.find((u) => u.id === userId) || users[1];

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    ticket.comments.push({
      id: `cmt-${Date.now()}`,
      ticketId: ticket.id,
      authorId: updater.id,
      authorName: updater.name,
      authorRole: updater.role,
      authorAvatar: updater.avatar,
      content: `Status updated from ${oldStatus.replace(/_/g, ' ')} to ${status.replace(/_/g, ' ')}.`,
      isInternal: false,
      createdAt: new Date().toISOString(),
    });

    tickets[tIdx] = ticket;
    setStorage(TICKETS_KEY, tickets);
    return ticket;
  }

  static logWorkHours(
    ticketId: string,
    userId: string,
    hoursSpent: number,
    description: string,
    workDate: string
  ): WorkLog | undefined {
    const tickets = this.getTickets();
    const users = this.getUsers();
    const tIdx = tickets.findIndex((t) => t.id === ticketId);
    if (tIdx === -1) return undefined;

    const ticket = tickets[tIdx];
    const user = users.find((u) => u.id === userId) || users[1];

    const workLog: WorkLog = {
      id: `wl-${Date.now()}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      ticketTitle: ticket.title,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      hoursSpent,
      workDate,
      description,
      createdAt: new Date().toISOString(),
    };

    ticket.workLogs.push(workLog);
    ticket.updatedAt = new Date().toISOString();

    // Auto update status to IN_PROGRESS if currently ASSIGNED
    if (ticket.status === 'ASSIGNED') {
      ticket.status = 'IN_PROGRESS';
    }

    tickets[tIdx] = ticket;
    setStorage(TICKETS_KEY, tickets);
    return workLog;
  }

  static addComment(
    ticketId: string,
    authorId: string,
    content: string,
    isInternal: boolean
  ): Comment | undefined {
    const tickets = this.getTickets();
    const users = this.getUsers();
    const tIdx = tickets.findIndex((t) => t.id === ticketId);
    if (tIdx === -1) return undefined;

    const ticket = tickets[tIdx];
    const author = users.find((u) => u.id === authorId) || users[0];

    const comment: Comment = {
      id: `cmt-${Date.now()}`,
      ticketId: ticket.id,
      authorId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorAvatar: author.avatar,
      content,
      isInternal,
      createdAt: new Date().toISOString(),
    };

    ticket.comments.push(comment);
    ticket.updatedAt = new Date().toISOString();

    tickets[tIdx] = ticket;
    setStorage(TICKETS_KEY, tickets);
    return comment;
  }

  // --- RECOMMENDATIONS ---
  static getRecommendations(): Recommendation[] {
    return getStorage<Recommendation[]>(RECS_KEY, DEMO_RECOMMENDATIONS);
  }

  static createRecommendation(data: {
    title: string;
    description: string;
    websiteName: string;
    moduleName: string;
    screenshotUrl?: string;
    authorId: string;
  }): Recommendation {
    const recs = this.getRecommendations();
    const users = this.getUsers();
    const author = users.find((u) => u.id === data.authorId) || users[0];

    const newRec: Recommendation = {
      id: `rec-${Date.now()}`,
      title: data.title,
      description: data.description,
      websiteName: data.websiteName,
      moduleName: data.moduleName,
      screenshotUrl: data.screenshotUrl,
      status: 'SUBMITTED',
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatar,
      upvotes: 1,
      userVoted: true,
      createdAt: new Date().toISOString(),
    };

    recs.unshift(newRec);
    setStorage(RECS_KEY, recs);
    return newRec;
  }

  static toggleUpvote(recId: string, userId?: string): Recommendation | undefined {
    const recs = this.getRecommendations();
    const idx = recs.findIndex((r) => r.id === recId);
    if (idx === -1) return undefined;

    const rec = recs[idx];
    if (!rec.votedUserIds) rec.votedUserIds = [];

    const uid = userId || 'demo-user';
    const hasVoted = rec.votedUserIds.includes(uid) || (rec.userVoted && rec.votedUserIds.length === 0);

    if (hasVoted) {
      rec.upvotes = Math.max(0, rec.upvotes - 1);
      rec.userVoted = false;
      rec.votedUserIds = rec.votedUserIds.filter((id) => id !== uid);
    } else {
      rec.upvotes += 1;
      rec.userVoted = true;
      if (!rec.votedUserIds.includes(uid)) {
        rec.votedUserIds.push(uid);
      }
    }

    recs[idx] = rec;
    setStorage(RECS_KEY, recs);
    return rec;
  }

  static updateRecommendationStatus(
    recId: string,
    status: RecommendationStatus
  ): Recommendation | undefined {
    const recs = this.getRecommendations();
    const idx = recs.findIndex((r) => r.id === recId);
    if (idx === -1) return undefined;

    recs[idx].status = status;
    setStorage(RECS_KEY, recs);
    return recs[idx];
  }

  // --- ANALYTICS / SUPER ADMIN STATS ---
  static getSuperAdminMetrics() {
    const tickets = this.getTickets();
    const recs = this.getRecommendations();
    const teams = this.getTeams();
    const users = this.getUsers();

    let totalHoursLogged = 0;
    const allWorkLogs: WorkLog[] = [];

    tickets.forEach((t) => {
      t.workLogs.forEach((wl) => {
        totalHoursLogged += wl.hoursSpent;
        allWorkLogs.push(wl);
      });
    });

    // Sort work logs by date desc
    allWorkLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const approvedCount = tickets.filter((t) =>
      ['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'NEED_MORE_DETAILS', 'PENDING_TESTING', 'RESOLVED', 'COMPLETED', 'CLOSED'].includes(t.status)
    ).length;

    const approvalRate = tickets.length > 0 ? Math.round((approvedCount / tickets.length) * 100) : 100;

    const completedCount = tickets.filter((t) => ['RESOLVED', 'COMPLETED', 'CLOSED'].includes(t.status)).length;
    const resolutionRate = tickets.length > 0 ? Math.round((completedCount / tickets.length) * 100) : 0;

    return {
      totalTickets: tickets.length,
      pendingApprovalTickets: tickets.filter((t) => t.status === 'PENDING_APPROVAL').length,
      inProgressTickets: tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length,
      completedTickets: completedCount,
      approvedCount,
      approvalRate,
      resolutionRate,
      totalHoursLogged: Math.round(totalHoursLogged * 10) / 10,
      totalRecommendations: recs.length,
      totalTeams: teams.length,
      totalUsers: users.length,
      recentWorkLogs: allWorkLogs,
    };
  }

  // --- RESET ALL DATA ---
  static resetToDemoData() {
    setStorage(TICKETS_KEY, DEMO_TICKETS);
    setStorage(RECS_KEY, DEMO_RECOMMENDATIONS);
    setStorage(TEAMS_KEY, DEMO_TEAMS);
    setStorage(USERS_KEY, DEMO_USERS);
  }
}
