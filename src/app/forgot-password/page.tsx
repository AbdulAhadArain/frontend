'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { IconLoader2, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import apiClient from '@/lib/api-client';
import { trackPasswordResetRequested } from '@/lib/analytics';
import type { ApiErrorResponse } from '@/types/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email')
});

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}

function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data: { email: string }) {
    try {
      await apiClient.post('/auth/forgot-password', data);
      try {
        trackPasswordResetRequested(data.email);
      } catch {}
      setSent(true);
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Something went wrong';
      toast.error(msg);
    }
  }

  if (sent) {
    return (
      <div className='flex flex-col gap-4'>
        <h2 className='font-heading text-2xl font-bold text-foreground'>
          Check your email
        </h2>
        <p className='text-sm text-muted-foreground'>
          If an account exists with that email, we&apos;ve sent password reset
          instructions.
        </p>
        <Link
          href='/login'
          className='mt-4 flex items-center gap-1 text-sm text-primary hover:underline'
        >
          <IconArrowLeft className='size-3.5' />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <div>
        <h2 className='font-heading text-2xl font-bold text-foreground'>
          Forgot password
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='email'>Email</Label>
        <Input
          id='email'
          type='email'
          placeholder='you@example.com'
          disabled={isSubmitting}
          {...register('email')}
        />
        {errors.email && (
          <p className='text-xs text-destructive'>
            {errors.email.message as string}
          </p>
        )}
      </div>

      <Button type='submit' disabled={isSubmitting}>
        {isSubmitting ? (
          <IconLoader2 className='mr-2 size-4 animate-spin' />
        ) : null}
        Send Reset Link
      </Button>

      <Link
        href='/login'
        className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
      >
        <IconArrowLeft className='size-3.5' />
        Back to login
      </Link>
    </form>
  );
}
