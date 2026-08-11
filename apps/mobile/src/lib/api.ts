import type { ApiErrorBody, AuthResponse } from '@student-rental/contracts';
import { getStored, removeStored, setStored } from './storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_KEY = 'student-rental.access-token';
const REFRESH_KEY = 'student-rental.refresh-token';
export const USER_KEY = 'student-rental.user';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}

export async function saveSession(response: AuthResponse) {
  await Promise.all([setStored(ACCESS_KEY, response.tokens.accessToken), setStored(REFRESH_KEY, response.tokens.refreshToken), setStored(USER_KEY, JSON.stringify(response.user))]);
}

export async function clearSession() { await Promise.all([removeStored(ACCESS_KEY), removeStored(REFRESH_KEY), removeStored(USER_KEY)]); }

async function rawRequest<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 204 || response.status === 202 && !response.headers.get('content-type')) return undefined as T;
  const body = await response.json().catch(() => ({})) as T | ApiErrorBody;
  if (!response.ok) { const error = (body as ApiErrorBody).error; throw new ApiError(response.status, error?.code ?? 'REQUEST_FAILED', error?.message ?? 'Request failed', error?.details); }
  return body as T;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, authenticated = false): Promise<T> {
  const accessToken = authenticated ? await getStored(ACCESS_KEY) : null;
  try { return await rawRequest<T>(path, options, accessToken); } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !authenticated || path === '/auth/refresh') throw error;
    const refreshToken = await getStored(REFRESH_KEY);
    if (!refreshToken) throw error;
    try {
      const refreshed = await rawRequest<AuthResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
      await saveSession(refreshed);
      return rawRequest<T>(path, options, refreshed.tokens.accessToken);
    } catch (refreshError) { await clearSession(); throw refreshError; }
  }
}

export const jsonBody = (value: unknown): Pick<RequestInit, 'body'> => ({ body: JSON.stringify(value) });

