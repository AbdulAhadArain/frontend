import { posthog } from '@/components/layout/posthog-provider';
import type { User } from '@/types/auth';
import type { AnalysisLanguage } from '@/types/analysis';

export function identifyUser(user: User) {
  posthog.identify(user.id, {
    email: user.email,
    plan: user.plan,
    role: user.role,
    name: user.name,
    ...(user.platform && { platform: user.platform }),
    ...(user.niche && { niche: user.niche }),
    ...(user.audienceAgeRange && { audienceAgeRange: user.audienceAgeRange }),
    ...(user.audienceRegion && { audienceRegion: user.audienceRegion }),
    onboardingCompleted: user.onboardingCompleted
  });
}

export function trackSignUp(userId: string, authMethod: 'google' | 'email') {
  posthog.capture('user_signed_up', { userId, authMethod });
}

export function trackUserLoggedIn(
  userId: string,
  authMethod: 'google' | 'email'
) {
  posthog.capture('user_logged_in', { userId, authMethod });
}

export function trackPasswordResetRequested(email: string) {
  posthog.capture('password_reset_requested', { email });
}

export function trackFileTranscribed(
  userId: string,
  plan: string | null,
  language: AnalysisLanguage,
  withAnalysis: boolean
) {
  posthog.capture('file_transcribed', {
    userId,
    plan,
    language,
    withAnalysis
  });
}

export function trackScriptAnalyzed(
  userId: string,
  plan: string | null,
  viralScore: number,
  language: AnalysisLanguage
) {
  posthog.capture('script_analyzed', { userId, plan, viralScore, language });
}

export function trackLimitReached(userId: string, analysesThisMonth: number) {
  posthog.capture('limit_reached', {
    userId,
    plan: 'FREE',
    analysesThisMonth
  });
}

export function trackUpgradeClicked(userId: string) {
  posthog.capture('upgrade_clicked', { userId, plan: 'FREE' });
}

export function trackUpgradeCompleted(userId: string) {
  posthog.capture('upgrade_completed', { userId, plan: 'CREATOR' });
}

export function trackOnboardingCompleted(
  userId: string,
  data: Record<string, string | null>
) {
  posthog.capture('onboarding_completed', { userId, ...data });
}

export function trackPlanUpdatedByAdmin(
  adminId: string,
  userId: string,
  newPlan: string,
  oldPlan: string
) {
  posthog.capture('plan_updated_by_admin', {
    adminId,
    userId,
    newPlan,
    oldPlan
  });
}

export function trackProfileOverrideUsed(fields: string[]) {
  posthog.capture('profile_override_used', { fields });
}
