'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/lib/api-client';
import {
  getRefreshTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
  setAuthCookies
} from '@/lib/auth-cookie';
import type { ApiSuccessResponse, User } from '@/types/auth';

/**
 * Fetches user profile on mount if we have a token but no user data.
 * This handles page refreshes where Zustand state is lost but cookies persist.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, accessToken, setUser, setTokens } = useAuthStore();
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function restoreSession() {
      // Case 1: already have user — nothing to do
      if (user) {
        setReady(true);
        return;
      }

      // Case 2: have access token but no user — fetch profile
      if (accessToken && !user) {
        try {
          const res = await apiClient.get<ApiSuccessResponse<User>>(
            '/auth/who-am-i'
          );
          setUser(res.data.data);
        } catch {
          // Token may be invalid; interceptor will handle redirect
        }
        setReady(true);
        return;
      }

      // Case 3: no access token (page refresh) — try refresh token from cookie
      const savedRefreshToken = getRefreshTokenCookie();
      if (savedRefreshToken) {
        try {
          const refreshRes = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            { refreshToken: savedRefreshToken }
          );
          const {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          } = refreshRes.data.data;

          setTokens(newAccessToken, newRefreshToken);
          setRefreshTokenCookie(newRefreshToken);

          // Fetch user profile with the new token
          const userRes = await apiClient.get<ApiSuccessResponse<User>>(
            '/auth/who-am-i',
            { headers: { Authorization: `Bearer ${newAccessToken}` } }
          );
          const u = userRes.data.data;
          setUser(u);
          setAuthCookies(u.role);
        } catch {
          // Refresh token expired or invalid — clear everything
          clearAuthCookies();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return;
        }
      }

      setReady(true);
    }
    restoreSession();
  }, [accessToken, user, setUser, setTokens]);

  // Client-side role guard: admin cannot access /dashboard or /history
  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === 'ADMIN';
    const adminBlocked = ['/dashboard', '/history'];
    const userBlocked = ['/admin'];

    if (isAdmin && adminBlocked.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
      router.replace('/admin');
    }
    if (!isAdmin && userBlocked.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
      router.replace('/dashboard');
    }
  }, [user, pathname, router]);

  if (!ready) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
        <div className='size-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
      </div>
    );
  }

  // Block render while redirecting
  if (user) {
    const isAdmin = user.role === 'ADMIN';
    const adminBlocked = ['/dashboard', '/history'];
    const userBlocked = ['/admin'];
    if (isAdmin && adminBlocked.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
      return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
          <div className='size-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
        </div>
      );
    }
    if (!isAdmin && userBlocked.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
      return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
          <div className='size-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
        </div>
      );
    }
  }

  return <>{children}</>;
}
