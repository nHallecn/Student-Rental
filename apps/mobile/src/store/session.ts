import type { AuthResponse, PublicUser } from '@student-rental/contracts';
import { create } from 'zustand';
import { apiRequest, clearSession, jsonBody, saveSession, USER_KEY } from '@/lib/api';
import { getStored } from '@/lib/storage';

interface SessionState {
  user?: PublicUser;
  hydrated: boolean;
  hydrate(): Promise<void>;
  signIn(identity: string, password: string): Promise<PublicUser>;
  register(input: Record<string, unknown>): Promise<PublicUser>;
  signInWithOtp(identity: string, code: string): Promise<PublicUser>;
  signOut(): Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  hydrated: false,
  async hydrate() { const saved = await getStored(USER_KEY); set({ user: saved ? JSON.parse(saved) as PublicUser : undefined, hydrated: true }); },
  async signIn(identity, password) { const response = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', ...jsonBody({ identity, password }) }); await saveSession(response); set({ user: response.user }); return response.user; },
  async register(input) { const response = await apiRequest<AuthResponse>('/auth/register', { method: 'POST', ...jsonBody(input) }); await saveSession(response); set({ user: response.user }); return response.user; },
  async signInWithOtp(identity, code) { const response = await apiRequest<AuthResponse>('/auth/verify-otp', { method: 'POST', ...jsonBody({ identity, code, purpose: 'SIGN_IN' }) }); await saveSession(response); set({ user: response.user }); return response.user; },
  async signOut() { await clearSession(); set({ user: undefined }); },
}));
