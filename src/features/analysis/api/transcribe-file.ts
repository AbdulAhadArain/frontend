// src/features/analysis/api/transcribe-file.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import type { AnalysisLanguage } from '@/types/analysis';
import type { ProfileOverride } from '../types/profile-override';

interface TranscribeFileArgs {
  file: File;
  analyze: boolean;
  language?: AnalysisLanguage;
  profileOverride?: ProfileOverride;
}

export function transcribeFile({
  file,
  analyze,
  language,
  profileOverride
}: TranscribeFileArgs) {
  const { accessToken } = useAuthStore.getState();
  const fd = new FormData();
  fd.append('file', file);
  if (analyze) {
    fd.append('analyze', 'true');
    if (language) fd.append('language', language);
  }
  if (profileOverride) {
    fd.append('profileOverride', JSON.stringify(profileOverride));
  }
  return axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/transcribe`,
    fd,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 0
    }
  );
}
