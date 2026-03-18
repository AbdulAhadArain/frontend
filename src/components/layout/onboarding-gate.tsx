'use client';

import { useAuthStore } from '@/stores/auth.store';
import { OnboardingModal } from '@/features/onboarding/components/onboarding-modal';
import apiClient from '@/lib/api-client';
import { trackOnboardingCompleted, identifyUser } from '@/lib/analytics';
import type { ApiSuccessResponse, User } from '@/types/auth';
import type { OnboardingData } from '@/features/onboarding/types/onboarding';

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, showOnboarding, setShowOnboarding, setUser } = useAuthStore();

  async function handleComplete(data: OnboardingData) {
    // Refresh user to get updated profile
    try {
      const res = await apiClient.get<ApiSuccessResponse<User>>(
        '/auth/who-am-i'
      );
      setUser(res.data.data);
      identifyUser(res.data.data);
    } catch {
      // Silently fail — onboarding was still saved server-side
    }

    try {
      if (user?.id) {
        trackOnboardingCompleted(user.id, data as unknown as Record<string, string | null>);
      }
    } catch {}

    setShowOnboarding(false);
  }

  return (
    <>
      {children}
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleComplete}
      />
    </>
  );
}
