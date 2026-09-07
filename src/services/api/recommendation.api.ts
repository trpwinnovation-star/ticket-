import { apiClient } from '@/lib/apiClient';

export interface CreateRecommendationPayload {
  title: string;
  description: string;
  websiteName: string;
  moduleName: string;
  screenshotUrl?: string;
  authorId: string;
}

export interface AssignRecommendationPayload {
  teamId?: string | null;
  assignedToId?: string | null;
  status?: string;
}

export const recommendationApi = {
  getAll: () => 
    apiClient('/api/v1/recommendations'),

  create: (payload: CreateRecommendationPayload) => 
    apiClient('/api/v1/recommendations', { method: 'POST', body: payload }),

  toggleUpvote: (id: string) => 
    apiClient(`/api/v1/recommendations/${id}/upvote`, { method: 'POST' }),

  updateStatus: (id: string, status: string) => 
    apiClient(`/api/v1/recommendations/${id}/status`, { method: 'PATCH', body: { status } }),

  assign: (id: string, payload: AssignRecommendationPayload) => 
    apiClient(`/api/v1/recommendations/${id}/assign`, { method: 'POST', body: payload }),

  convertToTicket: (id: string, teamId?: string, assignedToId?: string) => 
    apiClient(`/api/v1/recommendations/${id}/convert-to-ticket`, { method: 'POST', body: { teamId, assignedToId } }),
};
