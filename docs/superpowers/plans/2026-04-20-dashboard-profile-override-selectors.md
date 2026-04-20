# Dashboard Profile Override Selectors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 ephemeral override dropdowns to `/dashboard` (between script textarea and action buttons) that let a user change `platform`, `niche`, `audienceAgeRange`, `audienceRegion`, `averageViewCount` for a single Analyze or Transcribe run. Values initialize from the user's onboarding baseline, never persist client-side, and reset after every run (success or error) or when the page unmounts.

**Architecture:** Pure local React state (`useState`) inside the dashboard page component, no global store. A `useProfileDraft(baseline)` hook owns draft + touched state, exposes `setField` / `reset` / `buildOverridePayload`. A `<ProfileSelectors />` component renders the row of shadcn `<Select>` dropdowns. The existing inline axios calls on the dashboard get extracted into `analyzeScript` / `transcribeFile` functions that accept an optional `profileOverride` arg and forward it per the backend contract (JSON key for analyze, stringified form field for transcribe).

**Tech Stack:** Next.js 16 App Router, TypeScript (strict), shadcn/ui `<Select>` (Radix under the hood), Zustand (for reading `useAuthStore().user`), axios + `apiClient`, PostHog (existing `posthog.capture` helper).

**Testing:** The project has no test harness configured. Per the design decision captured in the spec (`docs/superpowers/specs/2026-04-20-dashboard-profile-override-selectors-design.md`), this PR ships without automated tests. Each feature-touching task ends with **manual browser verification** in `bun run dev`. Setting up vitest / RTL is explicitly out of scope.

**Spec reference:** `docs/superpowers/specs/2026-04-20-dashboard-profile-override-selectors-design.md` — all API contract details, reset-trigger rationale, and label reuse decisions live there.

---

## File Structure

Files created:
- `src/features/analysis/types/profile-override.ts` — shared TS types (`ProfileField`, `ProfileBaseline`, `ProfileDraft`, `ProfileOverride`)
- `src/features/analysis/api/analyze-script.ts` — `analyzeScript({ scriptText, language, profileOverride? })`
- `src/features/analysis/api/transcribe-file.ts` — `transcribeFile({ file, analyze, language?, profileOverride? })`
- `src/features/analysis/hooks/use-profile-draft.ts` — the state hook
- `src/features/analysis/components/profile-selectors.tsx` — the UI row

Files modified:
- `src/lib/analytics.ts` — append `trackProfileOverrideUsed(fields)`
- `src/app/(app)/dashboard/page.tsx` — replace inline axios calls with extracted functions; render `<ProfileSelectors />`; wire hook; pass overrides; `finally { reset() }`; fire `trackProfileOverrideUsed` on success

---

## Task 1: Define shared types for profile override

**Files:**
- Create: `src/features/analysis/types/profile-override.ts`

- [ ] **Step 1: Create the types file**

```ts
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
```

`PROFILE_FIELDS` is exported so the hook and component can iterate over the fields in a stable order without duplicating the union as a literal array.

- [ ] **Step 2: Verify TypeScript accepts the file**

Run: `bun run lint`
Expected: No new errors introduced by this file.

- [ ] **Step 3: Commit**

```bash
git add src/features/analysis/types/profile-override.ts
git commit -m "feat(analysis): add profile-override types"
```

---

## Task 2: Add `trackProfileOverrideUsed` analytics helper

**Files:**
- Modify: `src/lib/analytics.ts` (append new export at end)

- [ ] **Step 1: Append the tracker function**

Open `src/lib/analytics.ts`. After the existing `trackPlanUpdatedByAdmin` function (currently the last export), append:

```ts
export function trackProfileOverrideUsed(fields: string[]) {
  posthog.capture('profile_override_used', { fields });
}
```

Do NOT reorder or modify any existing exports. The file imports at the top stay as-is.

- [ ] **Step 2: Verify lint passes**

Run: `bun run lint`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics.ts
git commit -m "feat(analytics): add trackProfileOverrideUsed event helper"
```

---

## Task 3: Extract `analyzeScript` API function

**Files:**
- Create: `src/features/analysis/api/analyze-script.ts`

- [ ] **Step 1: Create the analyze function**

```ts
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
```

Key contract rule: `profileOverride` is only added to the body when defined. Never send `profileOverride: undefined` or `profileOverride: {}`.

- [ ] **Step 2: Verify the import paths resolve**

Run: `bun run lint`
Expected: No errors. If import paths fail, double-check:
- `@/lib/api-client` exports `apiClient` as the default export (it does — confirmed at `src/lib/api-client.ts`)
- `@/types/analysis` exports `Analysis` and `AnalysisLanguage`
- `@/types/auth` exports `ApiSuccessResponse`

- [ ] **Step 3: Commit**

```bash
git add src/features/analysis/api/analyze-script.ts
git commit -m "feat(analysis): extract analyzeScript API function"
```

---

## Task 4: Extract `transcribeFile` API function

**Files:**
- Create: `src/features/analysis/api/transcribe-file.ts`

- [ ] **Step 1: Create the transcribe function**

```ts
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
```

Behavior preserved from existing inline code:
- Only append `analyze` / `language` when `analyze === true` (matches current dashboard logic which only appends these when `analyzeWithTranscription` is checked)
- `timeout: 0` kept (transcription can take 30–60s)
- Direct-to-backend `axios`, not `apiClient` — bypasses Vercel `/backend` proxy body-size limit
- Content-Type header is NOT set manually (browser picks multipart boundary)

- [ ] **Step 2: Verify lint passes**

Run: `bun run lint`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/analysis/api/transcribe-file.ts
git commit -m "feat(analysis): extract transcribeFile API function"
```

---

## Task 5: Refactor dashboard to use extracted API functions (no feature changes)

This is a pure refactor — behavior must be identical. Override wiring comes in Task 9.

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Update imports**

At the top of `src/app/(app)/dashboard/page.tsx`, remove the now-unused `axios` import and add the two new API functions.

Find (line 6):
```ts
import axios, { AxiosError } from 'axios';
```

Replace with:
```ts
import { AxiosError } from 'axios';
```

Find (line 21):
```ts
import apiClient from '@/lib/api-client';
```

Keep that line (still used for `/api/latest-purchase` and `/auth/who-am-i`). Directly below it, add:
```ts
import { analyzeScript } from '@/features/analysis/api/analyze-script';
import { transcribeFile } from '@/features/analysis/api/transcribe-file';
```

- [ ] **Step 2: Replace the analyze call in `handleAnalyze`**

Find the existing analyze call (lines ~311-318):
```ts
    try {
      const res = await apiClient.post<ApiSuccessResponse<Analysis>>(
        '/api/analyze',
        {
          scriptText: scriptText.trim(),
          language: selectedLanguage
        }
      );
```

Replace with:
```ts
    try {
      const res = await analyzeScript({
        scriptText: scriptText.trim(),
        language: selectedLanguage
      });
```

The rest of the `handleAnalyze` body (setAnalysis, refreshUser, trackScriptAnalyzed, catch/finally) stays exactly as-is.

- [ ] **Step 3: Replace the transcribe call in `handleTranscribe`**

Find the existing transcribe block (lines ~352-371):
```ts
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (analyzeWithTranscription) {
        formData.append('analyze', 'true');
        formData.append('language', selectedLanguage);
      }

      // Post directly to backend API (bypass Vercel proxy which has body size limits)
      const { accessToken } = useAuthStore.getState();
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transcribe`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          timeout: 0
        }
      );
```

Replace with:
```ts
    try {
      const res = await transcribeFile({
        file,
        analyze: analyzeWithTranscription,
        language: analyzeWithTranscription ? selectedLanguage : undefined
      });
```

The rest of `handleTranscribe` (setScriptText from transcript, setAnalysis, tracking, refreshUser, setFile(null), catch/finally) stays as-is.

- [ ] **Step 4: Verify lint passes**

Run: `bun run lint`
Expected: No new errors. If `axios` shows as "imported but unused" anywhere, confirm only the `AxiosError` import remains at the top.

- [ ] **Step 5: Manual verification in browser**

Run: `bun run dev`, open http://localhost:3000/dashboard (log in if needed).

Verify:
1. Paste a short script → click "Analyse Script" → results render as before.
2. Drag-and-drop a small audio/video file → click "Transcribe" → script populates from transcript; if "Also analyse" is checked, results also render.

If either path regresses, the refactor introduced a bug. Do NOT proceed to the next task until both paths pass. Open DevTools Network tab to confirm request bodies still match the old shape (analyze: JSON body with just `scriptText` + `language`; transcribe: multipart with just `file` + optionally `analyze` + `language`).

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "refactor(dashboard): use extracted analyzeScript/transcribeFile fns"
```

---

## Task 6: Build `useProfileDraft` hook

**Files:**
- Create: `src/features/analysis/hooks/use-profile-draft.ts`

- [ ] **Step 1: Create the hook file**

```ts
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
```

Why the `eslint-disable-next-line`: the ESLint exhaustive-deps rule wants the `baseline` object listed, but that's exactly what we're avoiding — listing primitives is intentional.

- [ ] **Step 2: Verify lint passes**

Run: `bun run lint`
Expected: No new errors. The eslint-disable comment should silence the exhaustive-deps warning on the `useEffect`.

- [ ] **Step 3: Commit**

```bash
git add src/features/analysis/hooks/use-profile-draft.ts
git commit -m "feat(analysis): add useProfileDraft hook"
```

---

## Task 7: Build `<ProfileSelectors />` component

**Files:**
- Create: `src/features/analysis/components/profile-selectors.tsx`

- [ ] **Step 1: Create the component file**

```tsx
// src/features/analysis/components/profile-selectors.tsx
'use client';

import Link from 'next/link';
import { IconRotateClockwise2 } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  PLATFORM_OPTIONS,
  NICHE_OPTIONS,
  AGE_RANGE_OPTIONS,
  REGION_OPTIONS,
  VIEW_COUNT_OPTIONS
} from '@/features/onboarding/types/onboarding';
import type {
  ProfileBaseline,
  ProfileDraft,
  ProfileField
} from '../types/profile-override';

interface ProfileSelectorsProps {
  baseline: ProfileBaseline;
  draft: ProfileDraft;
  touched: Set<ProfileField>;
  onChange: (field: ProfileField, value: string) => void;
  onReset: () => void;
}

type OptionList = readonly { readonly value: string; readonly label: string }[];

interface FieldConfig {
  field: ProfileField;
  label: string;
  options: OptionList;
}

const FIELDS: FieldConfig[] = [
  { field: 'platform', label: 'Platform', options: PLATFORM_OPTIONS },
  { field: 'niche', label: 'Niche', options: NICHE_OPTIONS },
  { field: 'audienceAgeRange', label: 'Audience age', options: AGE_RANGE_OPTIONS },
  { field: 'audienceRegion', label: 'Audience region', options: REGION_OPTIONS },
  { field: 'averageViewCount', label: 'Average views', options: VIEW_COUNT_OPTIONS }
];

export function ProfileSelectors({
  draft,
  touched,
  onChange,
  onReset
}: ProfileSelectorsProps) {
  const hasEdits = touched.size > 0;

  return (
    <div className='mt-4 rounded-[4px] border border-border bg-[rgba(13,17,23,0.6)] p-3.5'>
      <div className='mb-3 flex items-center justify-between'>
        <span className='font-mono text-[11px] text-muted-foreground'>
          Customize for this run
        </span>
        <Button
          variant='ghost'
          size='sm'
          onClick={onReset}
          disabled={!hasEdits}
          className='h-7 gap-1.5 px-2 text-[11px]'
        >
          <IconRotateClockwise2 className='size-3.5' />
          Reset
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:flex-wrap'>
        {FIELDS.map(({ field, label, options }) => {
          const isTouched = touched.has(field);
          const value = draft[field];
          return (
            <div key={field} className='flex flex-col gap-1 md:min-w-[140px] md:flex-1'>
              <label className='flex items-center font-mono text-[11px] text-muted-foreground'>
                {isTouched && (
                  <span
                    aria-hidden
                    className='mr-1.5 inline-block size-1.5 rounded-full bg-primary'
                  />
                )}
                {label}
              </label>
              <Select
                value={value ?? undefined}
                onValueChange={(v) => onChange(field, v)}
              >
                <SelectTrigger className='h-9 text-[13px]'>
                  <SelectValue placeholder='Select…' />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <p className='mt-3 text-[11px] text-muted-foreground'>
        These changes apply only to this run. Update your saved profile in{' '}
        <Link href='/settings' className='text-primary hover:underline'>
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
```

Design notes:
- Wrapper classes match the existing script textarea's card styling (`rounded-[4px] border border-border bg-[rgba(13,17,23,0.6)]`) so the row slots in visually under the textarea.
- Dot uses `bg-primary` (shadcn's accent semantic token) — the spec called for `bg-[var(--accent)]`, and `primary` maps to the same color in the CloutIQ Tailwind config. If the implementer sees a visible color mismatch, swap to `bg-[var(--accent)]`.
- Icon uses `IconRotateClockwise2` from `@tabler/icons-react` (already in use elsewhere on the dashboard) to avoid adding a new icon library.
- Desktop layout uses `md:flex md:flex-wrap` so the 5 selects wrap naturally on narrow widths within desktop. Tablet falls back to 2-column grid, mobile to 1 column.

- [ ] **Step 2: Verify the component type-checks**

Run: `bun run lint`
Expected: No new errors. If `OptionList` complains about `readonly` variance vs. the `as const` tuples from onboarding, the fix is in the code above — the `readonly` on both the array and element object keeps TS happy.

- [ ] **Step 3: Commit**

```bash
git add src/features/analysis/components/profile-selectors.tsx
git commit -m "feat(analysis): add ProfileSelectors component"
```

---

## Task 8: Wire selectors into dashboard

This task composes the hook, the component, and the override plumbing into `handleAnalyze` / `handleTranscribe`. The earlier refactor in Task 5 already routed the dashboard through `analyzeScript` / `transcribeFile`, so this task only adds arguments and wrapping state.

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Update imports**

At the top of the dashboard page, add the new imports alongside existing ones (do NOT remove anything):

```ts
import { useMemo } from 'react';
```

Merge with the existing `useState, useCallback, useEffect, useRef` import on line 3 — final line becomes:

```ts
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
```

Then add three new imports below the existing analytics import block (around line 29):

```ts
import { trackProfileOverrideUsed } from '@/lib/analytics';
```

And below the existing analyze/transcribe API imports (added in Task 5):

```ts
import { useProfileDraft } from '@/features/analysis/hooks/use-profile-draft';
import { ProfileSelectors } from '@/features/analysis/components/profile-selectors';
import type { ProfileBaseline } from '@/features/analysis/types/profile-override';
```

Note: `trackProfileOverrideUsed` can be added to the existing multi-line analytics import (lines 22-29) as an additional named import instead of a separate `import` statement. Either placement is fine.

- [ ] **Step 2: Add baseline + hook wiring inside the component**

Inside `DashboardPage`, below the existing `const [messageFade, setMessageFade] = useState(true);` block and before the `// Handle ?checkout=success` effect (around line 142), insert:

```ts
  const baseline: ProfileBaseline = useMemo(
    () => ({
      platform: user?.platform ?? null,
      niche: user?.niche ?? null,
      audienceAgeRange: user?.audienceAgeRange ?? null,
      audienceRegion: user?.audienceRegion ?? null,
      averageViewCount: user?.averageViewCount ?? null
    }),
    [
      user?.platform,
      user?.niche,
      user?.audienceAgeRange,
      user?.audienceRegion,
      user?.averageViewCount
    ]
  );

  const profileDraft = useProfileDraft(baseline);
```

The `useMemo` with primitive-field deps gives the hook a stable `baseline` object reference when the saved profile hasn't actually changed — this matters because the hook's `useEffect` re-syncs when `baseline.platform` etc. change, and we don't want Zustand's re-render identity to trigger it.

- [ ] **Step 3: Pass overrides to `handleAnalyze`**

In `handleAnalyze` (currently around lines 303-336), update the call and add the success-path analytics + the finally-reset. Replace the entire try/catch/finally block:

Find:
```ts
    setLoadingMode('analyze');
    setLoading(true, 'Analysing your script...');
    try {
      const res = await analyzeScript({
        scriptText: scriptText.trim(),
        language: selectedLanguage
      });
      setAnalysis(res.data.data);
      refreshUser();
      try {
        if (user?.id) {
          trackScriptAnalyzed(
            user.id,
            user.plan,
            res.data.data.viralScore,
            selectedLanguage
          );
        }
      } catch {}
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
```

Replace with:
```ts
    setLoadingMode('analyze');
    setLoading(true, 'Analysing your script...');
    const override = profileDraft.buildOverridePayload();
    try {
      const res = await analyzeScript({
        scriptText: scriptText.trim(),
        language: selectedLanguage,
        profileOverride: override
      });
      setAnalysis(res.data.data);
      refreshUser();
      if (override) {
        try {
          trackProfileOverrideUsed(Object.keys(override));
        } catch {}
      }
      try {
        if (user?.id) {
          trackScriptAnalyzed(
            user.id,
            user.plan,
            res.data.data.viralScore,
            selectedLanguage
          );
        }
      } catch {}
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
      profileDraft.reset();
    }
```

- [ ] **Step 4: Pass overrides to `handleTranscribe`**

In `handleTranscribe` (currently around lines 338-408), similarly update:

Find:
```ts
    try {
      const res = await transcribeFile({
        file,
        analyze: analyzeWithTranscription,
        language: analyzeWithTranscription ? selectedLanguage : undefined
      });

      const data = res.data.data;

      if (data.transcript?.text) {
        setScriptText(data.transcript.text);
      }
      if (data.analysis) {
        setAnalysis(data.analysis);
        try {
          if (user?.id) {
            trackScriptAnalyzed(
              user.id,
              user.plan,
              data.analysis.viralScore,
              selectedLanguage
            );
          }
        } catch {}
      }
      try {
        if (user?.id) {
          trackFileTranscribed(
            user.id,
            user.plan,
            selectedLanguage,
            analyzeWithTranscription
          );
        }
      } catch {}
      refreshUser();
      setFile(null);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
```

Replace with:
```ts
    const override = profileDraft.buildOverridePayload();
    try {
      const res = await transcribeFile({
        file,
        analyze: analyzeWithTranscription,
        language: analyzeWithTranscription ? selectedLanguage : undefined,
        profileOverride: override
      });

      const data = res.data.data;

      if (data.transcript?.text) {
        setScriptText(data.transcript.text);
      }
      if (data.analysis) {
        setAnalysis(data.analysis);
        if (override) {
          try {
            trackProfileOverrideUsed(Object.keys(override));
          } catch {}
        }
        try {
          if (user?.id) {
            trackScriptAnalyzed(
              user.id,
              user.plan,
              data.analysis.viralScore,
              selectedLanguage
            );
          }
        } catch {}
      }
      try {
        if (user?.id) {
          trackFileTranscribed(
            user.id,
            user.plan,
            selectedLanguage,
            analyzeWithTranscription
          );
        }
      } catch {}
      refreshUser();
      setFile(null);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
      profileDraft.reset();
    }
```

`trackProfileOverrideUsed` fires inside the `if (data.analysis)` branch so transcription-only runs (where the backend doesn't apply the override) don't emit a misleading event.

- [ ] **Step 5: Render `<ProfileSelectors />` in the input view**

Find the existing language selector block (around lines 610-628) — it starts with `{/* Language selector */}` and ends with its closing `</div>` / `</div>`. Directly **above** that block (so the selectors sit between the file-upload area and the language selector), insert:

```tsx
            {/* Profile override selectors */}
            <ProfileSelectors
              baseline={baseline}
              draft={profileDraft.draft}
              touched={profileDraft.touched}
              onChange={profileDraft.setField}
              onReset={profileDraft.reset}
            />
```

Placement rationale: the spec says "below the script input and above the Analyze / Upload & Transcribe buttons." Putting it between the file upload / analyze-toggle block and the language selector keeps input → selectors → language → buttons in a clean top-to-bottom flow.

- [ ] **Step 6: Verify lint passes**

Run: `bun run lint`
Expected: No new errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "feat(dashboard): wire profile override selectors into analyze/transcribe"
```

---

## Task 9: Manual browser verification

No automated tests; this task is the safety net. Run through all 5 reset triggers and confirm the network payload shape.

- [ ] **Step 1: Start the dev server**

Run: `bun run dev`
Open: http://localhost:3000/dashboard

Log in as a user whose onboarding is complete (so `platform`, `niche`, etc. have non-null values in `who-am-i`).

- [ ] **Step 2: Verify baseline pre-fill**

The 5 dropdowns should show the user's saved onboarding values (labels from `PLATFORM_OPTIONS` etc.). No dots visible. Reset button is disabled.

If any dropdown shows "Select…" despite onboarding being complete, confirm the user record from `/auth/who-am-i` actually contains the field in question — check the Network tab.

- [ ] **Step 3: Verify per-field dot + reset enable**

Open Platform dropdown → pick a different platform than the baseline.
Expected: small colored dot appears next to "Platform" label; Reset button becomes enabled. No other dots change.

Pick a second field (e.g., Niche).
Expected: two dots now visible.

Change Platform back to its original baseline value.
Expected: Platform's dot disappears; Reset button still enabled (Niche still touched).

- [ ] **Step 4: Verify Reset button**

With at least one dot visible, click the Reset button.
Expected: all dropdowns snap back to baseline values; all dots disappear; Reset button becomes disabled again.

- [ ] **Step 5: Verify analyze payload shape (no override)**

Open DevTools Network tab. Without touching any dropdown, enter a script and click "Analyse Script". Find the `/api/analyze` request.
Expected request body: `{ "scriptText": "...", "language": "en" }` — **no `profileOverride` key**.

- [ ] **Step 6: Verify analyze payload shape (with override) + reset on success**

Change Platform to something different from baseline. Enter a script. Click "Analyse Script".

Network tab — `/api/analyze` request body should contain:
```json
{
  "scriptText": "...",
  "language": "en",
  "profileOverride": { "platform": "YOUTUBE" }
}
```

**CRITICAL contract invariant — do not skip this check:** `profileOverride` must contain ONLY touched fields, never the full draft. If the user changed only Platform, the object must have exactly one key: `platform`. It must NOT include `niche`, `audienceAgeRange`, `audienceRegion`, or `averageViewCount`.

Why this matters: the backend merges override-over-base per field with `?? base` fallback. Sending untouched fields would override the DB values with the dashboard's stale display copy — causing drift if Settings was updated in another tab. Touched-only keeps the contract safe.

After results render, navigate back to the input view (click "New Analysis"). All dropdowns should show baseline values; no dots.

- [ ] **Step 6b: Verify touched-only payload with multi-field edits + revert**

Still on the dashboard input view, do this exact sequence:
1. Change Platform (e.g., TIKTOK → YOUTUBE). Dot appears on Platform.
2. Change Niche (e.g., FOOD → EDUCATION). Dot appears on Niche. Two dots total.
3. Change Platform *back* to its original baseline value (YOUTUBE → TIKTOK). Platform's dot disappears. Niche's dot remains.
4. Click "Analyse Script".

Network tab — the `/api/analyze` body must be:
```json
{
  "scriptText": "...",
  "language": "en",
  "profileOverride": { "niche": "EDUCATION" }
}
```

Exactly one key in `profileOverride`: `niche`. Platform must NOT appear even though it was changed and reverted. If Platform appears, the `setField` toggle logic in the hook is broken — go back to Task 6 and fix before continuing.

- [ ] **Step 7: Verify reset on error**

Log in as a FREE user who has exhausted their 3 analyses for the month (or stub a 403 via the backend if easier). Change Platform, click Analyse.
Expected: upgrade modal appears (403 Plan Limit Reached), and after dismissing it, the Platform dropdown has snapped back to baseline — no dot. This confirms `finally { reset() }` runs on error paths.

Alternative if you can't produce a real 403: temporarily stop the backend (or block `/api/analyze` in DevTools → Network → Block request URL) to force a 500-class failure, verify the dropdowns reset after the toast appears, then unblock.

- [ ] **Step 8: Verify transcribe payload shape + reset**

Upload a small audio file. Leave "Also analyse" checked. Change Platform. Click Transcribe.

Network tab — `/api/transcribe` request should have a multipart body containing:
- `file` — the upload
- `analyze` — `true`
- `language` — `en`
- `profileOverride` — JSON string `{"platform":"YOUTUBE"}`

After the request completes (success or error), dropdowns should be back at baseline.

Also verify: with **no** edits made, the transcribe request has no `profileOverride` form field at all.

- [ ] **Step 9: Verify baseline re-sync on Settings save**

Keep the dashboard tab open. In a second tab, open `/settings` → "Edit Profile" → change the platform → save.

Switch back to the dashboard tab. The dropdown should now reflect the newly saved platform as the baseline. (This relies on Settings invalidating the user slice; if it doesn't, that's a Settings-side bug outside this plan's scope, but flag it.)

- [ ] **Step 10: Verify unmount reset**

Change several dropdowns on the dashboard. Without clicking Analyse, navigate to `/history`. Navigate back to `/dashboard`.
Expected: dropdowns show baseline values, no dots. This confirms the component's local state resets on remount.

- [ ] **Step 11: Verify PostHog event (optional if PostHog devtools available)**

Open the PostHog browser extension or inspect the network requests to PostHog's ingestion endpoint. After a successful analyse with an override, confirm `profile_override_used` is captured with `fields: ['platform']` (or whichever fields were touched).

- [ ] **Step 12: If all pass, nothing to commit — proceed to Task 10. If any fail, fix in a new commit and re-verify.**

---

## Task 10: Final lint + build check

- [ ] **Step 1: Run strict lint**

Run: `bun run lint:strict`
Expected: zero warnings, zero errors.

If warnings surface from the new files, fix inline (don't suppress unless the suppression matches existing codebase conventions).

- [ ] **Step 2: Run production build**

Run: `bun run build`
Expected: build succeeds with no errors. Watch for any type errors in the compiled output that don't appear in `bun run lint`.

- [ ] **Step 3: If fixes were needed, commit them**

```bash
git add -A
git commit -m "chore: lint/build fixes for profile override feature"
```

---

## Task 11: Push to both remotes

Per CLAUDE.md: Vercel deploys from `myfork` (`AbdulAhadArain/frontend`); both remotes must stay in sync. But this is the **final push** — confirm with the user before executing, because they may want a PR-based flow instead of direct push to `main`.

- [ ] **Step 1: Confirm push strategy with the user**

Ask: "Ready to ship. Do you want (A) a PR from dev into main on both remotes, or (B) a direct `git push origin dev:main && git push myfork dev:main` per the CLAUDE.md deploy instruction? Or (C) just push dev to both remotes and open the PR manually?"

Wait for the user's answer before running any push command.

- [ ] **Step 2: Execute the chosen strategy**

If A: open PR from dev → main on origin, then mirror to myfork.
If B: `git push origin dev:main && git push myfork dev:main` — this deploys to production.
If C: `git push origin dev && git push myfork dev`.

---

## Self-Review

Spec coverage (checking each spec requirement against a task):

| Spec requirement | Task |
|---|---|
| 5 dropdowns with exact enum values | Task 7 (uses onboarding option constants) |
| Labels reuse existing onboarding labels | Task 7 (imports `PLATFORM_OPTIONS` etc.) |
| Baseline from `who-am-i` via Zustand | Task 8, Step 2 |
| `draft` / `touched` local state only | Task 6 (`useState` inside hook) |
| `useProfileDraft` hook with `buildOverridePayload` | Task 6 |
| `<ProfileSelectors />` component | Task 7 |
| `analyzeScript` / `transcribeFile` fns w/ `profileOverride` | Tasks 3, 4 |
| `profileOverride` only when touched.size > 0 | Task 3 (`if (profileOverride)`) |
| Only touched fields in payload | Task 6 (`buildOverridePayload` iterates `touched`) |
| Multipart `profileOverride` as JSON.stringify | Task 4 |
| Reset on success | Task 8, Step 3-4 (`finally { reset() }`) |
| Reset on error | Same (finally covers both) |
| Reset on baseline change | Task 6 (`useEffect` on primitive deps) |
| Reset on unmount | Implicit — `useState` inside page component, verified Task 9 Step 10 |
| Manual Reset button | Task 7 + Task 8 Step 5 |
| Dot indicator for touched fields | Task 7 |
| Reset button disabled when no edits | Task 7 (`disabled={!hasEdits}`) |
| Helper text linking to Settings | Task 7 |
| Responsive layout (desktop/tablet/mobile) | Task 7 (grid → flex) |
| Null baseline handling (placeholder) | Task 7 (`value={value ?? undefined}`, `placeholder='Select…'`) |
| PostHog `profile_override_used` event | Task 2 (helper) + Task 8 Steps 3-4 (firing) |
| Fire analytics only on success | Task 8 (inside try, not finally) |

Placeholder scan: no TBD / TODO / "handle edge cases" without code. All code blocks are complete and compilable. The `/* the existing "also analyze" toggle state */` comment from the spec was replaced in Task 8 Step 4 with the actual variable name `analyzeWithTranscription` (read from dashboard page.tsx).

Type consistency: `ProfileField`, `ProfileBaseline`, `ProfileDraft`, `ProfileOverride` used consistently across all tasks. `buildOverridePayload` return type is `ProfileOverride | undefined` in both the hook definition and call sites. `setField(field, value)` signature consistent. `PROFILE_FIELDS` array used in Task 6 for iteration order.

No gaps identified.
