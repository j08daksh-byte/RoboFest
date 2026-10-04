import { create } from 'zustand';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  user: null, // Would normally persist user info or decode JWT, but simplified here

  login: async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token);
        }
        set({ token: data.token, user: data.user });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    set({ token: null, user: null });
  }
}));
