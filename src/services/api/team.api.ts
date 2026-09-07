import { apiClient } from '@/lib/apiClient';

export interface CreateTeamPayload {
  name: string;
  description?: string;
}

export interface CreateWorkLogPayload {
  ticketId: string;
  userId?: string;
  hoursSpent: number;
  description: string;
  workDate?: string;
}

export const teamApi = {
  getTeams: () => 
    apiClient('/api/v1/teams'),

  createTeam: (payload: CreateTeamPayload) => 
    apiClient('/api/v1/teams', { method: 'POST', body: payload }),

  getUsers: () => 
    apiClient('/api/v1/admin/users'),

  getAdminMetrics: (timeFilter?: string) => {
    const query = timeFilter ? `?filter=${timeFilter}` : '';
    return apiClient(`/api/v1/admin/metrics${query}`);
  },

  createWorkLog: (payload: CreateWorkLogPayload) => 
    apiClient('/api/v1/work-logs', { method: 'POST', body: payload }),
};
