/**
 * Turn Around Time (TAT) Calculation & SLA Engine
 * Tracks ticket lifecycle duration starting immediately upon Admin / Super Admin approval.
 */

export interface TATResult {
  isApproved: boolean;
  approvedAt: Date | null;
  approvedByRole: string | null;
  approvedByName: string | null;
  isClosed: boolean;
  closedAt: Date | null;
  targetClosureDate: Date | null;
  elapsedMs: number;
  formattedElapsed: string;
  isOverdue: boolean;
  overdueMs: number;
  formattedOverdue: string;
  remainingMs: number;
  formattedRemaining: string;
  badgeText: string;
  badgeVariant: 'emerald' | 'amber' | 'red' | 'blue' | 'slate';
  slaStatus: 'ON_TRACK' | 'BREACHED' | 'MET' | 'MISSED' | 'NO_SLA' | 'PENDING_APPROVAL';
  slaLabel: string;
}

export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;

  if (days > 0) {
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (totalHours > 0) {
    return remainingMinutes > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalHours}h`;
  }
  if (totalMinutes > 0) {
    return `${totalMinutes}m`;
  }
  return '< 1m';
}

export function getTicketTAT(ticket: any): TATResult {
  if (!ticket) {
    return {
      isApproved: false,
      approvedAt: null,
      approvedByRole: null,
      approvedByName: null,
      isClosed: false,
      closedAt: null,
      targetClosureDate: null,
      elapsedMs: 0,
      formattedElapsed: '0m',
      isOverdue: false,
      overdueMs: 0,
      formattedOverdue: '',
      remainingMs: 0,
      formattedRemaining: '',
      badgeText: 'Awaiting Approval',
      badgeVariant: 'slate',
      slaStatus: 'PENDING_APPROVAL',
      slaLabel: 'Awaiting Approval',
    };
  }

  const approvedStatuses = [
    'APPROVED',
    'ASSIGNED',
    'IN_PROGRESS',
    'NEED_MORE_DETAILS',
    'PENDING_TESTING',
    'RESOLVED',
    'COMPLETED',
    'CLOSED',
  ];

  const isApproved = Boolean(ticket.approvedAt) || approvedStatuses.includes(ticket.status);
  const isClosed = ['RESOLVED', 'COMPLETED', 'CLOSED'].includes(ticket.status);

  if (!isApproved) {
    return {
      isApproved: false,
      approvedAt: null,
      approvedByRole: null,
      approvedByName: null,
      isClosed,
      closedAt: null,
      targetClosureDate: null,
      elapsedMs: 0,
      formattedElapsed: 'N/A',
      isOverdue: false,
      overdueMs: 0,
      formattedOverdue: '',
      remainingMs: 0,
      formattedRemaining: '',
      badgeText: ticket.status === 'REJECTED' ? 'Rejected' : 'Awaiting Approval',
      badgeVariant: ticket.status === 'REJECTED' ? 'red' : 'amber',
      slaStatus: 'PENDING_APPROVAL',
      slaLabel: ticket.status === 'REJECTED' ? 'Rejected by Management' : 'Awaiting Admin Approval',
    };
  }

  const approvedAt = ticket.approvedAt
    ? new Date(ticket.approvedAt)
    : new Date(ticket.createdAt);

  const closedAt = isClosed
    ? ticket.closedAt
      ? new Date(ticket.closedAt)
      : ticket.updatedAt
      ? new Date(ticket.updatedAt)
      : new Date()
    : null;

  const targetClosureDate = ticket.targetClosureDate ? new Date(ticket.targetClosureDate) : null;
  const now = new Date();

  const endTimestamp = isClosed && closedAt ? closedAt.getTime() : now.getTime();
  const elapsedMs = Math.max(0, endTimestamp - approvedAt.getTime());
  const formattedElapsed = formatDuration(elapsedMs);

  let badgeVariant: TATResult['badgeVariant'] = 'blue';
  let badgeText = `TAT: ${formattedElapsed}`;

  if (isClosed) {
    badgeVariant = 'emerald';
    badgeText = `Final TAT: ${formattedElapsed}`;
  } else {
    badgeVariant = 'blue';
    badgeText = `TAT: ${formattedElapsed}`;
  }

  return {
    isApproved: true,
    approvedAt,
    approvedByRole: ticket.approvedByRole || 'MANAGER',
    approvedByName: ticket.approvedByName || 'Manager',
    isClosed,
    closedAt,
    targetClosureDate,
    elapsedMs,
    formattedElapsed,
    isOverdue: false,
    overdueMs: 0,
    formattedOverdue: '',
    remainingMs: 0,
    formattedRemaining: '',
    badgeText,
    badgeVariant,
    slaStatus: 'NO_SLA',
    slaLabel: '',
  };
}
