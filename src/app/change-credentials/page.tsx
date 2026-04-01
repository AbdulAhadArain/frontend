'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { setAuthCookies, setMustChangeCookie, setRefreshTokenCookie } from '@/lib/auth-cookie';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthTokens,
  User
} from '@/types/auth';

const schema = z
  .object({
    newEmail: z.string().email('Enter a valid email'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number'),
    confirmPassword: z.string().min(1, 'Confirm your password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type FormData = z.infer<typeof schema>;

export default function ChangeCredentialsPage() {
  const router = useRouter();
  const { user, setTokens, setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      newEmail: user?.email || ''
    }
  });

  async function onSubmit(formData: FormData) {
    try {
      const response = await apiClient.patch<ApiSuccessResponse<AuthTokens>>(
        '/auth/change-credentials',
        {
          newEmail: formData.newEmail,
          newPassword: formData.newPassword
        }
      );

      const data = response.data.data;
      setTokens(data.accessToken, data.refreshToken);
      setRefreshTokenCookie(data.refreshToken);
      setMustChangeCookie(false);

      // Fetch updated user profile
      try {
        const profileRes = await apiClient.get<ApiSuccessResponse<User>>(
          '/auth/who-am-i'
        );
        setUser(profileRes.data.data);
        setAuthCookies(profileRes.data.data.role);
      } catch {}

      toast.success('Credentials updated. Welcome to CloutIQ.');
      router.replace('/dashboard');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message?.[0] ||
        'Failed to update credentials. Please try again.';
      toast.error(message);
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <div className='card-glow w-full max-w-md p-8'>
        <h1 className='font-heading text-2xl font-bold text-foreground'>
          Set your credentials
        </h1>
        <p className='mb-6 mt-1 text-sm text-muted-foreground'>
          You must update your email and password before continuing
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='newEmail'>New email</Label>
            <Input
              id='newEmail'
              type='email'
              placeholder='you@example.com'
              autoComplete='email'
              disabled={isSubmitting}
              {...register('newEmail')}
            />
            {errors.newEmail && (
              <p className='text-xs text-destructive'>
                {errors.newEmail.message}
              </p>
            )}
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='newPassword'>New password</Label>
            <div className='relative'>
              <Input
                id='newPassword'
                type={showPassword ? 'text' : 'password'}
                placeholder='Min 8 chars, 1 uppercase, 1 number'
                autoComplete='new-password'
                disabled={isSubmitting}
                {...register('newPassword')}
              />
              <button
                type='button'
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <IconEyeOff className='size-4' />
                ) : (
                  <IconEye className='size-4' />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className='text-xs text-destructive'>
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='confirmPassword'>Confirm password</Label>
            <div className='relative'>
              <Input
                id='confirmPassword'
                type={showConfirm ? 'text' : 'password'}
                placeholder='Repeat your password'
                autoComplete='new-password'
                disabled={isSubmitting}
                {...register('confirmPassword')}
              />
              <button
                type='button'
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
              >
                {showConfirm ? (
                  <IconEyeOff className='size-4' />
                ) : (
                  <IconEye className='size-4' />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className='text-xs text-destructive'>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type='submit' className='mt-6 w-full' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <IconLoader2 className='mr-2 size-4 animate-spin' />
                Updating...
              </>
            ) : (
              'Update credentials'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
