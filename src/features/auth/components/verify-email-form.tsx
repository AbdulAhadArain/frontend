'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { IconLoader2, IconMail } from '@tabler/icons-react';
import { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from '@/components/ui/input-otp';
import apiClient from '@/lib/api-client';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { setAuthCookies, setRefreshTokenCookie } from '@/lib/auth-cookie';
import { identifyUser, trackUserLoggedIn } from '@/lib/analytics';
import { pushToDataLayer, generateEventId } from '@/lib/gtm';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthTokens,
  User
} from '@/types/auth';

const RESEND_COOLDOWN = 60;

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { setTokens } = useAuthStore();

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      router.replace('/login');
    }
  }, [email, router]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = useCallback(
    async (otp: string) => {
      if (otp.length !== 6) return;
      setIsVerifying(true);
      try {
        const response = await apiClient.post<ApiSuccessResponse<AuthTokens>>(
          '/auth/verify-email',
          { email, code: otp }
        );
        const data = response.data.data;

        // Same token handling as login/register
        setRefreshTokenCookie(data.refreshToken);

        // Fetch user profile for role + analytics
        try {
          const whoRes = await axios.get<ApiSuccessResponse<User>>(
            '/backend/auth/who-am-i',
            {
              headers: {
                Authorization: `Bearer ${data.accessToken}`,
                'Cache-Control': 'no-store'
              }
            }
          );
          const u = whoRes.data.data;
          setAuthCookies(u.role);
          try {
            identifyUser(u);
            trackUserLoggedIn(u.id, 'email');
            pushToDataLayer({
              event: 'login',
              event_id: generateEventId('login'),
              user_id: u.id
            });
          } catch {}
          const dest = u.role === 'ADMIN' ? '/admin' : '/dashboard';
          window.location.replace(dest);
        } catch {
          setAuthCookies('USER');
          window.location.replace('/dashboard');
        }
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const message =
          axiosError.response?.data?.message?.[0] ||
          'Verification failed. Please try again.';
        toast.error(message);
        setCode('');
      } finally {
        setIsVerifying(false);
      }
    },
    [email, setTokens]
  );

  async function handleResend() {
    setIsResending(true);
    try {
      await apiClient.post('/auth/resend-verification', { email });
      toast.success('A new verification code has been sent to your email.');
      setCooldown(RESEND_COOLDOWN);
      setCode('');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message?.[0] ||
        'Failed to resend code. Please try again.';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  }

  if (!email) return null;

  return (
    <div className='flex flex-col gap-6 px-4 py-6 sm:p-8'>
      {/* Header */}
      <div className='flex flex-col items-center text-center'>
        <div className='mb-4 flex size-12 items-center justify-center rounded-sm border border-border bg-muted'>
          <IconMail className='size-6 text-muted-foreground' />
        </div>
        <h2 className='font-heading text-2xl font-bold text-foreground'>
          Check your email
        </h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          We sent a 6-digit verification code to{' '}
          <span className='font-medium text-foreground'>{email}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className='flex flex-col items-center gap-4'>
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(value) => {
            setCode(value);
            if (value.length === 6) {
              handleVerify(value);
            }
          }}
          disabled={isVerifying}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        <Button
          className='mt-2 w-full'
          disabled={code.length !== 6 || isVerifying}
          onClick={() => handleVerify(code)}
        >
          {isVerifying ? (
            <>
              <IconLoader2 className='mr-2 size-4 animate-spin' />
              Verifying...
            </>
          ) : (
            'Verify email'
          )}
        </Button>
      </div>

      {/* Resend */}
      <div className='text-center'>
        <p className='text-sm text-muted-foreground'>
          Didn&apos;t receive a code?{' '}
          {cooldown > 0 ? (
            <span className='font-mono text-xs text-muted-foreground'>
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              type='button'
              className='font-medium text-primary hover:underline disabled:opacity-50'
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          )}
        </p>
      </div>

      {/* Back to login */}
      <p className='mt-2 text-center text-sm text-muted-foreground'>
        Wrong email?{' '}
        <Link
          href='/login'
          className='font-medium text-primary hover:underline'
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
