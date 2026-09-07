import { apiClient } from '@/lib/apiClient';

export interface CreateTicketPayload {
  title: string;
  description: string;
  websiteName: string;
  module: string;
  category: string;
  priority: string;
  createdById: string;
  attachments?: any[];
}

export interface UpdateTicketPayload {
  title: string;
  description: string;
  category: string;
  websiteName: string;
  module: string;
  priority: string;
}

export interface AssignTicketPayload {
  assignedToId?: string | null;
  teamId?: string | null;
  targetClosureDate?: string | null;
}

export const ticketApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient(`/api/v1/tickets${query}`);
  },

  getById: (id: string) => 
    apiClient(`/api/v1/tickets/${id}`),

  create: (payload: CreateTicketPayload) => 
    apiClient('/api/v1/tickets', { method: 'POST', body: payload }),

  update: (id: string, payload: UpdateTicketPayload) => 
    apiClient(`/api/v1/tickets/${id}`, { method: 'PATCH', body: payload }),

  updateStatus: (id: string, status: string) => 
    apiClient(`/api/v1/tickets/${id}/status`, { method: 'PATCH', body: { status } }),

  updatePriority: (id: string, priority: string) => 
    apiClient(`/api/v1/tickets/${id}/priority`, { method: 'PATCH', body: { priority } }),

  assign: (id: string, payload: AssignTicketPayload) => 
    apiClient(`/api/v1/tickets/${id}/assign`, { method: 'POST', body: payload }),

  approve: (id: string, payload: Record<string, any>) => 
    apiClient(`/api/v1/tickets/${id}/approve`, { method: 'POST', body: payload }),

  reject: (id: string, rejectionReason: string) => 
    apiClient(`/api/v1/tickets/${id}/reject`, { method: 'POST', body: { rejectionReason } }),

  addComment: (id: string, content: string, isInternal: boolean, authorId?: string) => 
    apiClient(`/api/v1/tickets/${id}/comments`, { method: 'POST', body: { content, isInternal, authorId } }),
};
