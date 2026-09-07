/**
 * Core HTTP Client for Enterprise Ticket Manager API
 * Automatically manages Authorization headers, JSON body serialization, and error handling.
 */

export interface ApiOptions extends RequestInit {
  body?: any;
}

export function getStoredAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('tp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiClient<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getStoredAuthHeaders(),
    ...(options.headers as Record<string, string>),
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body !== undefined && options.body !== null) {
    if (typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    } else {
      config.body = options.body;
    }
  }

  const res = await fetch(endpoint, config);
  let data: any;

  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  if (!res.ok || (data && data.success === false)) {
    const message = (data && (data.error || data.message)) || `HTTP ${res.status}: ${res.statusText}`;
    const error = new Error(message);
    (error as any).status = res.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}
