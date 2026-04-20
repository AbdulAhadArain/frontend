// src/features/analysis/api/analyze-script.ts
import apiClient from '@/lib/api-client';
import type { Analysis, AnalysisLanguage } from '@/types/analysis';
import type { ApiSuccessResponse } from '@/types/auth';
import type { ProfileOverride } from '../types/profile-override';

interface AnalyzeScriptArgs {
  scriptText: string;
  language: AnalysisLanguage;
  profileOverride?: ProfileOverride;
}

export function analyzeScript({
  scriptText,
  language,
  profileOverride
}: AnalyzeScriptArgs) {
  const body: Record<string, unknown> = { scriptText, language };
  if (profileOverride) body.profileOverride = profileOverride;
  return apiClient.post<ApiSuccessResponse<Analysis>>('/api/analyze', body);
}
