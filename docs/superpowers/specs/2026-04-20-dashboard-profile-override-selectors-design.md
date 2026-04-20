# Dashboard Profile Override Selectors — Design

**Status:** approved
**Date:** 2026-04-20
**Author:** Abdul Ahad Arain (spec), Claude (codebase translation)
**Branch:** `dev`

## Summary

Add a row of 5 pre-filled dropdowns to `/dashboard`, rendered between the script textarea and the Analyze / Transcribe buttons. Each dropdown reflects the user's onboarding answers from `GET /auth/who-am-i`. Users may change any value for a single Analyze or Transcribe run; selections are never persisted client-side. After the run settles (success or error), or when the user navigates away and back, the dropdowns reset to the saved onboarding baseline.

The 5 fields are: platform, niche, audience age, audience region, average view count.

## Motivation

Today the backend reads `platform` and `niche` (plus the other profile fields) from the user record and uses them to personalize analysis output. Users who want to test how their script reads for a different segment must currently edit their saved profile in Settings, run the analysis, then revert — four navigations for one experiment. This feature turns that into an inline, ephemeral override on the dashboard.

Non-goal: mutating the saved profile. Settings remains the only write path.

## The 5 fields

Enum values match the backend validator exactly. Labels reuse the existing onboarding constants in `src/features/onboarding/types/onboarding.ts` (`PLATFORM_OPTIONS`, `NICHE_OPTIONS`, `AGE_RANGE_OPTIONS`, `REGION_OPTIONS`, `VIEW_COUNT_OPTIONS`) so the same stored value is never shown with different words across onboarding, settings, and dashboard.

| Field | Backend key | Enum values |
|---|---|---|
| Platform | `platform` | `TIKTOK`, `REELS`, `SHORTS`, `YOUTUBE` |
| Niche | `niche` | `FOOD`, `LIFESTYLE`, `ENTERTAINMENT`, `EDUCATION`, `SPORTS`, `OTHER` |
| Audience age | `audienceAgeRange` | `13-17`, `18-24`, `25-34`, `35-44`, `45+` |
| Audience region | `audienceRegion` | `US`, `EU`, `MENA`, `South Asia`, `Latin America`, `Global` |
| Average views | `averageViewCount` | `<1K`, `1K-10K`, `10K-100K`, `100K-1M`, `1M+` |

No free text, no "custom" option. Out of scope: `audienceLanguage`, `biggestFrustration` (not included in override contract).

## Files

### New
- `src/features/analysis/types/profile-override.ts` — shared TS types
- `src/features/analysis/hooks/use-profile-draft.ts` — state hook
- `src/features/analysis/components/profile-selectors.tsx` — UI row
- `src/features/analysis/api/analyze-script.ts` — extracted analyze call
- `src/features/analysis/api/transcribe-file.ts` — extracted transcribe call

### Modified
- `src/app/(app)/dashboard/page.tsx` — render `<ProfileSelectors />`, replace inline `apiClient.post` / `axios.post` with the extracted functions, wrap each call in try/finally that calls `reset()`
- `src/lib/analytics.ts` — add `trackProfileOverrideUsed(fields)`

## Data model

```ts
// src/features/analysis/types/profile-override.ts
export type ProfileField =
  | 'platform'
  | 'niche'
  | 'audienceAgeRange'
  | 'audienceRegion'
  | 'averageViewCount';

export type ProfileBaseline = Record<ProfileField, string | null>;
export type ProfileDraft = ProfileBaseline;
export type ProfileOverride = Partial<Record<ProfileField, string>>;
```

`ProfileOverride` is the wire-format object sent to the backend. Keys are only present for fields the user touched; values are always strings (never null) because `buildOverridePayload` skips null draft values defensively.

## Hook — `useProfileDraft(baseline)`

**Signature:**
```ts
function useProfileDraft(baseline: ProfileBaseline): {
  draft: ProfileDraft;
  touched: Set<ProfileField>;
  setField: (field: ProfileField, value: string) => void;
  reset: () => void;
  buildOverridePayload: () => ProfileOverride | undefined;
};
```

**Internals:**
- `const [draft, setDraft] = useState<ProfileDraft>(baseline)`
- `const [touched, setTouched] = useState<Set<ProfileField>>(new Set())`
- `useEffect(() => { setDraft(baseline); setTouched(new Set()); }, [baseline.platform, baseline.niche, baseline.audienceAgeRange, baseline.audienceRegion, baseline.averageViewCount])` — deps list the primitive fields individually, not the baseline object. Zustand may re-render with a new object identity even when fields are unchanged; listing primitives avoids spurious re-syncs.
- `setField(field, value)` updates `draft[field] = value`, then adjusts `touched`:
  - If `value === baseline[field]`, remove `field` from touched (prevents redundant override when user toggles back to the original)
  - Otherwise add `field` to touched
- `reset()` → `setDraft(baseline); setTouched(new Set())`
- `buildOverridePayload()` iterates `touched`. Returns `undefined` when empty. Otherwise returns `{ [field]: draft[field] }` for each touched field, skipping any entry where `draft[field]` is null.

**Exposing the full draft to the component:** the component reads `draft[field]` to drive each Select's value prop and `touched.has(field)` to render the modified-dot.

## Component — `<ProfileSelectors />`

**Props:**
```ts
interface ProfileSelectorsProps {
  baseline: ProfileBaseline;
  draft: ProfileDraft;
  touched: Set<ProfileField>;
  onChange: (field: ProfileField, value: string) => void;
  onReset: () => void;
}
```

**Layout:**

```
┌─ "Customize for this run"              [↺ Reset] ─┐
│                                                    │
│  [Platform ▾] [Niche ▾] [Age ▾] [Region ▾] [Views ▾] │
│                                                    │
│  These changes apply only to this run.             │
│  Update your saved profile in Settings.            │
└────────────────────────────────────────────────────┘
```

- Wrapper: a plain `div` using the same border + background tokens as the surrounding dashboard sections. Match the existing input card's visual weight — the new row should not dominate. Specific classes to be picked during implementation by reading the dashboard page's current card styling.
- Header row: flex justify-between; title uses body text weight, Reset button is shadcn `<Button variant='ghost' size='sm'>` with a rotate-back-arrow icon (lucide `RotateCcw`), `disabled={touched.size === 0}`
- Selector row: `flex flex-wrap gap-3` at `md+`, `grid grid-cols-2 gap-3` at `sm`, `grid-cols-1` at base. Each field is a labelled group:
  ```
  <div>
    <label>
      {touched.has(field) && <span aria-hidden className="inline-block size-1.5 rounded-full bg-[var(--accent)] mr-1.5" />}
      Platform
    </label>
    <Select value={draft.platform ?? undefined} onValueChange={v => onChange('platform', v)}>
      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
      <SelectContent>
        {PLATFORM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
  ```
- Helper text: muted body text, "Settings" is a Next `<Link href="/settings">` styled as an inline link

## API functions

### `analyzeScript`
```ts
// src/features/analysis/api/analyze-script.ts
import { apiClient } from '@/lib/api-client';
import type { ProfileOverride } from '../types/profile-override';

interface AnalyzeScriptArgs {
  scriptText: string;
  language: AnalysisLanguage;
  profileOverride?: ProfileOverride;
}

export function analyzeScript({ scriptText, language, profileOverride }: AnalyzeScriptArgs) {
  const body: Record<string, unknown> = { scriptText, language };
  if (profileOverride) body.profileOverride = profileOverride;
  return apiClient.post<ApiSuccessResponse<Analysis>>('/api/analyze', body);
}
```

### `transcribeFile`
```ts
// src/features/analysis/api/transcribe-file.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import type { ProfileOverride } from '../types/profile-override';

interface TranscribeFileArgs {
  file: File;
  analyze: boolean;
  language?: AnalysisLanguage;
  profileOverride?: ProfileOverride;
}

export function transcribeFile({ file, analyze, language, profileOverride }: TranscribeFileArgs) {
  const accessToken = useAuthStore.getState().accessToken;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('analyze', String(analyze));
  if (language) fd.append('language', language);
  if (profileOverride) fd.append('profileOverride', JSON.stringify(profileOverride));
  return axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/transcribe`,
    fd,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}
```

Direct-to-backend `axios` (not `apiClient`) is intentional and matches the existing pattern — the `/backend` Vercel proxy has a body size limit that blocks large transcription uploads. Do not change this.

## Dashboard wiring

```ts
// src/app/(app)/dashboard/page.tsx
const user = useAuthStore((s) => s.user);

const baseline: ProfileBaseline = useMemo(() => ({
  platform: user?.platform ?? null,
  niche: user?.niche ?? null,
  audienceAgeRange: user?.audienceAgeRange ?? null,
  audienceRegion: user?.audienceRegion ?? null,
  averageViewCount: user?.averageViewCount ?? null,
}), [user?.platform, user?.niche, user?.audienceAgeRange, user?.audienceRegion, user?.averageViewCount]);

const { draft, touched, setField, reset, buildOverridePayload } = useProfileDraft(baseline);

async function handleAnalyze() {
  const override = buildOverridePayload();
  try {
    const res = await analyzeScript({ scriptText: scriptText.trim(), language: selectedLanguage, profileOverride: override });
    if (override) trackProfileOverrideUsed(Object.keys(override));
    // preserve existing success handling (setAnalysis, toasts, scroll, etc.)
  } catch (err) {
    // preserve existing error handling (toast with error message[0])
  } finally {
    reset();
  }
}

async function handleTranscribe() {
  const override = buildOverridePayload();
  const willAnalyze = /* the existing "also analyze" toggle state */;
  try {
    const res = await transcribeFile({ file, analyze: willAnalyze, language: willAnalyze ? selectedLanguage : undefined, profileOverride: override });
    if (override && willAnalyze) trackProfileOverrideUsed(Object.keys(override));
    // preserve existing success handling
  } catch (err) {
    // preserve existing error handling
  } finally {
    reset();
  }
}
```

> The existing loading state, progress ticker, error toast, and success hydration all remain. The only changes inside each handler are: (1) swap the inline `apiClient.post` / `axios.post` for the extracted `analyzeScript` / `transcribeFile` functions so the `profileOverride` arg has a home, (2) fire `trackProfileOverrideUsed` on success, (3) add the `finally { reset() }`. The plan step that implements this must read `src/app/(app)/dashboard/page.tsx` and preserve all other handler behavior verbatim.

`<ProfileSelectors baseline={baseline} draft={draft} touched={touched} onChange={setField} onReset={reset} />` renders between the script textarea and the action buttons.

`trackProfileOverrideUsed` only fires after a successful response. Transcribe fires it only when `analyze === true` (pure transcription doesn't use the override).

## Reset triggers — all 5

| Trigger | Mechanism |
|---|---|
| Analyze/Transcribe success | `finally { reset() }` in handler |
| Analyze/Transcribe error | same `finally` block |
| Baseline change (Settings save) | `useEffect` in hook, deps on each primitive baseline field |
| Dashboard unmount | `useState` inside page component dies with component. Verified the page component at `src/app/(app)/dashboard/page.tsx` is NOT the `(app)` route group layout, so soft nav to `/history` or `/settings` unmounts it. |
| Manual Reset button | `onReset` prop → `reset()` |

**Reset on error is deliberate.** A user who hits a 403 plan-limit or a 5xx loses their override selections and must re-pick before retrying. This matches the original spec's "once the process is completed" literal and keeps behavior predictable. If real-world usage shows this frustrates retries, flip to "reset only on success" in a follow-up — move `reset()` out of `finally` into the success path after `setAnalysis(...)`. Don't pre-optimize.

## Edge cases

- **User has not completed onboarding:** `user.platform` etc. may be null. The Select renders its `placeholder="Select…"` with no selected value. User can still pick and run — `buildOverridePayload` returns only fields that have non-null draft values. Do not block the run.
- **Admin user:** admins don't typically run analyses, but the dashboard is accessible. Selectors render and function normally for admins. No special-casing.
- **`user` is null (not loaded yet):** baseline is all-nulls, same as no-onboarding case. Once `user` resolves, the `useEffect` fires and the selects hydrate.
- **Redundant edit (pick X, then pick original):** `setField` removes the field from `touched` when value reverts to baseline, so the network payload stays clean.

## Analytics

```ts
// src/lib/analytics.ts — append
export function trackProfileOverrideUsed(fields: string[]) {
  posthog.capture('profile_override_used', { fields });
}
```

Fires on successful analyze/transcribe response when `buildOverridePayload()` returned a defined object. Property `fields` is the array of overridden field names (e.g., `['platform', 'niche']`).

## Non-goals

- No persistence of overrides anywhere client-side (no Zustand, no localStorage, no URL, no cookies).
- No mutation of the saved profile from the dashboard.
- No extra fields beyond the 5. `audienceLanguage` and `biggestFrustration` remain Settings-only.
- No free-text inputs.
- No new dependencies.
- No tests. The project has no test harness configured (`package.json` has no test script, no vitest/jest config). Adding test infrastructure is explicitly out of scope for this PR and is a separate decision.

## Out-of-scope notes (captured for future work)

- If Settings eventually triggers optimistic updates to the Zustand user slice, the dashboard `useEffect` will already pick them up — no change needed.
- If the list of override fields grows (e.g., add `audienceLanguage`), the `ProfileField` union is the single place to extend; the hook and component iterate over it generically where possible.
