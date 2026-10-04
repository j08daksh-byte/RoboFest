import { create } from 'zustand';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  status: 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'AUTH_ERROR';
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null, // Tokens are now HttpOnly cookies, this is just for legacy code references
  user: null,
  status: 'LOADING',

  login: async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, status: 'AUTHENTICATED' });
        return true;
      }
      set({ status: 'AUTH_ERROR' });
      return false;
    } catch (err) {
      console.error('Login failed', err);
      set({ status: 'AUTH_ERROR' });
      return false;
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed', err);
    }
    set({ token: null, user: null, status: 'UNAUTHENTICATED' });
  },

  initialize: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          set({ user: data.user, status: 'AUTHENTICATED' });
          return;
        }
      }
      set({ user: null, status: 'UNAUTHENTICATED' });
    } catch (err) {
      console.error('Auth initialization failed', err);
      set({ user: null, status: 'AUTH_ERROR' });
    }
  }
}));
