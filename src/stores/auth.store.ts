import { create } from 'zustand';
import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  showOnboarding: boolean;

  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setShowOnboarding: (show: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  showOnboarding: false,

  setUser: (user) => set({ user }),
  setShowOnboarding: (show) => set({ showOnboarding: show }),

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      showOnboarding: false
    }),

  isAuthenticated: () => get().accessToken !== null
}));
