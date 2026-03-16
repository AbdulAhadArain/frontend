'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/lib/api-client';
import type { ApiErrorResponse } from '@/types/auth';

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain 1 uppercase letter')
    .regex(/[0-9]/, 'Must contain 1 number')
});

const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain 1 uppercase letter')
      .regex(/[0-9]/, 'Must contain 1 number'),
    confirmPassword: z.string().min(1, 'Confirm your password')
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isGoogleOnly = !!user?.googleId;
  const [hasPassword, setHasPassword] = useState(!isGoogleOnly);

  return (
    <div className='max-w-2xl flex-1 p-6 md:p-8'>
      <h1 className='mb-6 font-heading text-2xl font-bold text-foreground'>
        Settings
      </h1>

      {/* Profile section */}
      <div className='mb-6 border border-border bg-card p-6'>
        <h2 className='mb-4 font-heading text-lg font-bold text-foreground'>
          Profile
        </h2>
        <div className='grid gap-3'>
          <div>
            <Label className='text-muted-foreground'>Name</Label>
            <p className='text-sm text-foreground'>{user?.name || '—'}</p>
          </div>
          <div>
            <Label className='text-muted-foreground'>Email</Label>
            <p className='text-sm text-foreground'>{user?.email || '—'}</p>
          </div>
          <div className='flex items-center gap-2'>
            <Label className='text-muted-foreground'>Plan</Label>
            {user?.plan === 'FREE' && (
              <Badge
                variant='outline'
                className='border-score-mid text-score-mid'
              >
                FREE
              </Badge>
            )}
            {user?.plan === 'CREATOR' && (
              <Badge className='bg-primary text-primary-foreground'>
                CREATOR
              </Badge>
            )}
            {user?.role === 'ADMIN' && (
              <Badge variant='outline' className='border-primary text-primary'>
                ADMIN
              </Badge>
            )}
          </div>
          {user?.plan === 'FREE' && (
            <p className='text-xs text-muted-foreground'>
              {user.analysesThisMonth}/3 analyses used this month
            </p>
          )}
        </div>
      </div>

      {/* Password section */}
      <div className='border border-border bg-card p-6'>
        <h2 className='mb-4 font-heading text-lg font-bold text-foreground'>
          Password
        </h2>
        {hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <SetPasswordForm onSuccess={() => setHasPassword(true)} />
        )}
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [show, setShow] = useState({ old: false, new: false });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(data: { oldPassword: string; newPassword: string }) {
    try {
      await apiClient.patch('/auth/change-password', data);
      toast.success('Password changed successfully');
      reset();
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Failed to change password';
      toast.error(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='oldPassword'>Current password</Label>
        <div className='relative'>
          <Input
            id='oldPassword'
            type={show.old ? 'text' : 'password'}
            disabled={isSubmitting}
            {...register('oldPassword')}
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            onClick={() => setShow((s) => ({ ...s, old: !s.old }))}
            tabIndex={-1}
          >
            {show.old ? <IconEyeOff className='size-4' /> : <IconEye className='size-4' />}
          </button>
        </div>
        {errors.oldPassword && (
          <p className='text-xs text-destructive'>{errors.oldPassword.message as string}</p>
        )}
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='newPassword'>New password</Label>
        <div className='relative'>
          <Input
            id='newPassword'
            type={show.new ? 'text' : 'password'}
            disabled={isSubmitting}
            {...register('newPassword')}
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            onClick={() => setShow((s) => ({ ...s, new: !s.new }))}
            tabIndex={-1}
          >
            {show.new ? <IconEyeOff className='size-4' /> : <IconEye className='size-4' />}
          </button>
        </div>
        {errors.newPassword && (
          <p className='text-xs text-destructive'>{errors.newPassword.message as string}</p>
        )}
      </div>
      <Button type='submit' disabled={isSubmitting}>
        {isSubmitting ? <IconLoader2 className='mr-2 size-4 animate-spin' /> : null}
        Change Password
      </Button>
    </form>
  );
}

function SetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [show, setShow] = useState({ pw: false, confirm: false });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(setPasswordSchema) });

  async function onSubmit(data: { password: string; confirmPassword: string }) {
    try {
      await apiClient.post('/auth/set-password', data);
      toast.success('Password set successfully');
      reset();
      onSuccess();
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const msg = axiosError.response?.data?.message?.[0] || 'Failed to set password';
      if (msg.includes('change-password')) {
        onSuccess(); // User already has a password
      } else {
        toast.error(msg);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <p className='text-sm text-muted-foreground'>
        You signed up with Google. Set a password to also log in with email.
      </p>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='password'>Password</Label>
        <div className='relative'>
          <Input
            id='password'
            type={show.pw ? 'text' : 'password'}
            disabled={isSubmitting}
            {...register('password')}
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            onClick={() => setShow((s) => ({ ...s, pw: !s.pw }))}
            tabIndex={-1}
          >
            {show.pw ? <IconEyeOff className='size-4' /> : <IconEye className='size-4' />}
          </button>
        </div>
        {errors.password && (
          <p className='text-xs text-destructive'>{errors.password.message as string}</p>
        )}
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='confirmPassword'>Confirm password</Label>
        <div className='relative'>
          <Input
            id='confirmPassword'
            type={show.confirm ? 'text' : 'password'}
            disabled={isSubmitting}
            {...register('confirmPassword')}
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
            tabIndex={-1}
          >
            {show.confirm ? <IconEyeOff className='size-4' /> : <IconEye className='size-4' />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className='text-xs text-destructive'>{errors.confirmPassword.message as string}</p>
        )}
      </div>
      <Button type='submit' disabled={isSubmitting}>
        {isSubmitting ? <IconLoader2 className='mr-2 size-4 animate-spin' /> : null}
        Set Password
      </Button>
    </form>
  );
}
