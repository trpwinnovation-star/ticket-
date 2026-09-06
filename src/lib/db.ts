// Comprehensive Data Layer & Seed Database for Ticket Manager App

export type Role = 'GUEST_USER' | 'IT_SOFTWARE' | 'MANAGER' | 'SUPER_ADMIN';

export type TicketStatus =
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'NEED_MORE_DETAILS'
  | 'PENDING_TESTING'
  | 'RESOLVED'
  | 'COMPLETED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type RecommendationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PLANNED'
  | 'IN_DEVELOPMENT'
  | 'IMPLEMENTED'
  | 'DECLINED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  jobTitle: string;
  teamId?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  leadId: string;
  memberCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  authorAvatar: string;
  content: string;
  isInternal: boolean; // Level 2 IT Team internal note vs Public comment
  createdAt: string;
}

export interface WorkLog {
  id: string;
  ticketId: string;
  ticketNumber: string;
  ticketTitle: string;
  userId: string;
  userName: string;
  userAvatar: string;
  hoursSpent: number;
  workDate: string;
  description: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  websiteName: string;
  module: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  rejectionReason?: string;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
  teamId?: string;
  teamName?: string;
  attachments: Attachment[];
  comments: Comment[];
  workLogs: WorkLog[];
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  websiteName: string;
  moduleName: string;
  screenshotUrl?: string;
  status: RecommendationStatus;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  upvotes: number;
  userVoted?: boolean;
  votedUserIds?: string[];
  createdAt: string;
}

// Initial Mock Seed Dataset
export const DEMO_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@acmeretail.com',
    role: 'GUEST_USER',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    jobTitle: 'Portal Guest / End Customer',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr-2',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@itcore.io',
    role: 'IT_SOFTWARE',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    jobTitle: 'Senior DevOps & Software Specialist',
    teamId: 'team-1',
    createdAt: '2026-01-05T08:00:00Z',
  },
  {
    id: 'usr-3',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@itcore.io',
    role: 'IT_SOFTWARE',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    jobTitle: 'Fullstack Systems Engineer',
    teamId: 'team-2',
    createdAt: '2026-01-08T08:00:00Z',
  },
  {
    id: 'usr-4',
    name: 'Rajesh Singhania',
    email: 'rajesh.singhania@orglead.com',
    role: 'MANAGER',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    jobTitle: 'Client Account Manager / Owner',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-5',
    name: 'Kavita Reddy',
    email: 'kavita.reddy@platformglobal.org',
    role: 'SUPER_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    jobTitle: 'Global Platform Administrator',
    createdAt: '2025-12-01T08:00:00Z',
  },
];

export const DEMO_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'Cloud DevOps Subcontractor',
    description: 'Handles server deployments, CI/CD pipelines, database optimization, and infrastructure uptime.',
    leadId: 'usr-2',
    memberCount: 4,
    createdAt: '2026-01-05T08:00:00Z',
  },
  {
    id: 'team-2',
    name: 'Core Application Engineering',
    description: 'Responsible for core software modules, API integrations, billing engines, and UI bug resolution.',
    leadId: 'usr-3',
    memberCount: 6,
    createdAt: '2026-01-08T08:00:00Z',
  },
  {
    id: 'team-3',
    name: 'Security & Compliance Team',
    description: 'Subcontractor security audit, authentication patches, and access control management.',
    leadId: 'usr-2',
    memberCount: 3,
    createdAt: '2026-01-12T08:00:00Z',
  },
];



export const DEMO_TICKETS: Ticket[] = [];

export const DEMO_RECOMMENDATIONS: Recommendation[] = [];
