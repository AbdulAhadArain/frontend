'use client';
import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PostHogProvider } from '@/components/layout/posthog-provider';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <PostHogProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        {children}
      </GoogleOAuthProvider>
    </PostHogProvider>
  );
}
