// src/features/analysis/types/profile-override.ts

export type ProfileField =
  | 'platform'
  | 'niche'
  | 'audienceAgeRange'
  | 'audienceRegion'
  | 'averageViewCount';

export const PROFILE_FIELDS: ProfileField[] = [
  'platform',
  'niche',
  'audienceAgeRange',
  'audienceRegion',
  'averageViewCount'
];

export type ProfileBaseline = Record<ProfileField, string | null>;
export type ProfileDraft = ProfileBaseline;
export type ProfileOverride = Partial<Record<ProfileField, string>>;
