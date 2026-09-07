import { apiClient } from '@/lib/apiClient';

export interface TargetWebsite {
  id: string;
  name: string;
  url?: string;
  createdAt: string;
}

export interface TargetModule {
  id: string;
  name: string;
  websiteId?: string;
  category?: string;
  createdAt: string;
}

export interface ConfigOptionsResponse {
  success: boolean;
  websites: TargetWebsite[];
  modules: TargetModule[];
}

export const configApi = {
  getOptions: () => 
    apiClient<ConfigOptionsResponse>('/api/v1/config/options'),

  addWebsite: (name: string, url?: string) => 
    apiClient('/api/v1/config/websites', { method: 'POST', body: { name, url } }),

  deleteWebsite: (id: string) => 
    apiClient(`/api/v1/config/websites/${id}`, { method: 'DELETE' }),

  addModule: (name: string, category?: string, websiteId?: string) => 
    apiClient('/api/v1/config/modules', { method: 'POST', body: { name, category, websiteId } }),

  deleteModule: (id: string) => 
    apiClient(`/api/v1/config/modules/${id}`, { method: 'DELETE' }),
};
