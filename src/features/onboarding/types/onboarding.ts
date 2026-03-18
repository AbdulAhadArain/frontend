export interface OnboardingData {
  platform: string | null;
  niche: string | null;
  audienceAgeRange: string | null;
  audienceRegion: string | null;
  audienceLanguage: string | null;
  averageViewCount: string | null;
  biggestFrustration: string | null;
}

export interface OnboardingStepProps {
  data: OnboardingData;
  onUpdate: (fields: Partial<OnboardingData>) => void;
}

export const PLATFORM_OPTIONS = [
  { value: 'TIKTOK', label: 'TikTok', icon: '🎵' },
  { value: 'REELS', label: 'Instagram Reels', icon: '📸' },
  { value: 'SHORTS', label: 'YouTube Shorts', icon: '▶️' },
  { value: 'YOUTUBE', label: 'YouTube', icon: '🎬' }
] as const;

export const NICHE_OPTIONS = [
  { value: 'FOOD', label: 'Food' },
  { value: 'LIFESTYLE', label: 'Lifestyle' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'OTHER', label: 'Other' }
] as const;

export const AGE_RANGE_OPTIONS = [
  { value: '13-17', label: '13-17' },
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45+', label: '45+' }
] as const;

export const REGION_OPTIONS = [
  { value: 'US', label: 'North America' },
  { value: 'EU', label: 'Europe' },
  { value: 'MENA', label: 'Middle East' },
  { value: 'South Asia', label: 'South Asia' },
  { value: 'Latin America', label: 'Latin America' },
  { value: 'Global', label: 'Global' }
] as const;

export const AUDIENCE_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'tr', label: 'Turkish' },
  { value: 'bn', label: 'Bengali' }
] as const;

export const VIEW_COUNT_OPTIONS = [
  { value: '<1K', label: 'Under 1K' },
  { value: '1K-10K', label: '1K - 10K' },
  { value: '10K-100K', label: '10K - 100K' },
  { value: '100K-1M', label: '100K - 1M' },
  { value: '1M+', label: '1M+' }
] as const;

export const FRUSTRATION_OPTIONS = [
  { value: 'LOW_VIEWS', label: 'Low views on good content', icon: '📉' },
  { value: 'DONT_KNOW_WHAT_TO_POST', label: "Don't know what to post", icon: '📊' },
  { value: 'SLOW_SCRIPTING', label: 'Takes too long to script', icon: '💡' },
  { value: 'HARD_TO_STAY_CONSISTENT', label: 'Hard to stay consistent', icon: '💬' }
] as const;

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  platform: null,
  niche: null,
  audienceAgeRange: null,
  audienceRegion: null,
  audienceLanguage: null,
  averageViewCount: null,
  biggestFrustration: null
};
