'use client';

import { Suspense } from 'react';
import { VerifyEmailForm } from '@/features/auth/components/verify-email-form';
import { AuthLayout } from '@/features/auth/components/auth-layout';

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
