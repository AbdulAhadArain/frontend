// src/features/analysis/hooks/use-profile-draft.ts
import { useCallback, useEffect, useState } from 'react';
import {
  PROFILE_FIELDS,
  type ProfileBaseline,
  type ProfileDraft,
  type ProfileField,
  type ProfileOverride
} from '../types/profile-override';

export interface UseProfileDraftReturn {
  draft: ProfileDraft;
  touched: Set<ProfileField>;
  setField: (field: ProfileField, value: string) => void;
  reset: () => void;
  buildOverridePayload: () => ProfileOverride | undefined;
}

export function useProfileDraft(baseline: ProfileBaseline): UseProfileDraftReturn {
  const [draft, setDraft] = useState<ProfileDraft>(baseline);
  const [touched, setTouched] = useState<Set<ProfileField>>(new Set());

  // Re-sync draft to baseline when the saved profile changes (Settings save).
  // Deps list primitive field values, not the baseline object, so identity-only
  // changes from Zustand re-renders don't trigger spurious resets.
  useEffect(() => {
    setDraft(baseline);
    setTouched(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    baseline.platform,
    baseline.niche,
    baseline.audienceAgeRange,
    baseline.audienceRegion,
    baseline.averageViewCount
  ]);

  const setField = useCallback(
    (field: ProfileField, value: string) => {
      setDraft((d) => ({ ...d, [field]: value }));
      setTouched((t) => {
        const next = new Set(t);
        if (value === baseline[field]) {
          next.delete(field);
        } else {
          next.add(field);
        }
        return next;
      });
    },
    [baseline]
  );

  const reset = useCallback(() => {
    setDraft(baseline);
    setTouched(new Set());
  }, [baseline]);

  const buildOverridePayload = useCallback((): ProfileOverride | undefined => {
    if (touched.size === 0) return undefined;
    const payload: ProfileOverride = {};
    for (const field of PROFILE_FIELDS) {
      if (touched.has(field)) {
        const value = draft[field];
        if (value != null) payload[field] = value;
      }
    }
    // Defensive: if every touched field had a null draft (shouldn't happen, but guards
    // against a race with a stale baseline), return undefined to avoid sending `{}`.
    return Object.keys(payload).length === 0 ? undefined : payload;
  }, [touched, draft]);

  return { draft, touched, setField, reset, buildOverridePayload };
}
