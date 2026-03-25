# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CloutIQ — AI-powered content intelligence platform for short-form video creators (TikTok, Reels, Shorts). Users paste a script or upload audio/video and receive viral scoring, hook analysis, retention predictions, script rewrites, and distribution packs.

**Stack:** Next.js 16 (App Router), TypeScript 5.7 (strict), Tailwind CSS v4, shadcn/ui (New York style), Zustand, Nuqs, React Hook Form + Zod, custom JWT auth (NOT NextAuth/Clerk), PostHog, Sentry, Stripe.

**Built on:** [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) — dashboard layout, sidebar, shadcn components pre-wired. CloutIQ customizations layered on top.

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Dev server at http://localhost:3000
bun run build            # Production build
bun run lint             # ESLint
bun run lint:fix         # ESLint fix + Prettier format
bun run lint:strict      # Zero warnings
bun run format           # Prettier format all
npx shadcn add <name>    # Add a shadcn component
```

No test suite configured.

## Folder Structure

```
src/
├── app/                     # Next.js App Router
│   ├── page.tsx             # Landing page (public, marketing)
│   ├── login/               # Login page (email/password + Google OAuth)
│   ├── register/            # Registration page (email/password + Google)
│   ├── forgot-password/     # Forgot password (email form)
│   ├── reset-password/      # Reset password (token from URL)
│   ├── dashboard/           # Main app (auth required)
│   │   ├── page.tsx         # Script input + analysis output
│   │   └── history/         # Past analyses list
│   ├── settings/            # User settings (profile, password, subscription, billing)
│   ├── admin/               # Admin panel (role: ADMIN only)
│   ├── terms/               # Terms of Service (public, SEO indexable)
│   ├── privacy/             # Privacy Policy — Termly embed (public, SEO indexable)
│   └── layout.tsx           # Root layout (fonts, providers, theme)
├── features/                # Feature modules
│   ├── analysis/            # Script analysis UI (12 output sections)
│   ├── auth/                # Auth logic (custom JWT, token mgmt)
│   ├── history/             # Analysis history
│   ├── admin/               # Admin user management + stats
│   ├── landing/             # Landing page components
│   └── onboarding/          # 5-step onboarding wizard (modal + steps)
├── components/
│   ├── ui/                  # shadcn components (don't modify; extend)
│   ├── layout/              # Sidebar, header, providers
│   └── chatwoot.tsx         # Chatwoot live chat widget (identifies users, hides on auth pages)
├── config/
│   └── nav-config.ts        # Navigation items with RBAC
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities (cn, api client, parsers)
├── styles/
│   ├── globals.css          # Tailwind + CloutIQ theme tokens
│   ├── landing.css          # Landing page styles (custom CSS, not Tailwind)
│   └── themes/              # Theme CSS files
└── types/                   # TypeScript types
```

## Backend Integration

- **Production:** `https://api.cloutiq.ai` (env: `NEXT_PUBLIC_API_URL`)
- **Local dev:** `http://localhost:8080`
- **Swagger:** `{BACKEND_URL}/api`

### Response Envelope

```
Success: { "message": "...", "data": { ... } }
Error:   { "error": "Error Type", "message": ["..."], "statusCode": 400 }
```

Always show `message[0]` from error responses to the user. The `message` field in errors is always an **array of strings**.

### Auth Flow (Custom JWT — NOT Clerk, NOT NextAuth)

CloutIQ uses its own JWT auth backend. Clerk is from the starter template and must be fully replaced.

- **Access token:** JWT, 15-min expiry, store in memory (NOT localStorage — XSS risk)
- **Refresh token:** opaque hex, 7-day expiry, rotates on each refresh (one-time use)
- **Regular users:** email/password registration OR Google OAuth → `POST /auth/google` with Google ID token
- **Admin login:** email/password → `POST /auth/login`
- **Token refresh flow:** 401 → `POST /auth/refresh` → retry request → if refresh fails → redirect to `/login`
- **`mustChangeCredentials`:** when `true`, block all navigation, force `PATCH /auth/change-credentials` (admin-created accounts only). All other protected endpoints return 403 until credentials are changed.
- **Account linking:** If a user registered with email/password and later signs in with Google (same email), backend silently links the Google account. Either method works after linking.

### Password States (for Settings page)

| User Type | `googleId` | Can email/password login? | Settings shows |
|---|---|---|---|
| Manual signup | `null` | Yes | "Change Password" form |
| Google-only | Set | No | "Set Password" form |
| Google + password set | Set | Yes | "Change Password" form |

- `googleId !== null` and user has never set password → show "Set Password" (`POST /auth/set-password`)
- Otherwise → show "Change Password" (`PATCH /auth/change-password`)
- `who-am-i` now exposes `hasPassword: boolean` — use this instead of `googleId` heuristic for password section.

### Onboarding Flow

- **Trigger:** `who-am-i` returns `onboardingCompleted` falsy AND `role !== 'ADMIN'`
- **Where checked:** login form, register form, AuthGuard (all 3 code paths)
- **Modal:** 5-step wizard (non-dismissible on first login, dismissible when editing from Settings)
- **Steps:** Platform → Niche → Audience (age/region/language) → View Count → Frustration
- **Submit:** `PATCH /auth/onboarding` with 7 fields using backend enum values
- **Backend enums:** `TIKTOK`/`REELS`/`SHORTS`/`YOUTUBE`, `FOOD`/`LIFESTYLE`/`ENTERTAINMENT`/`EDUCATION`/`SPORTS`/`OTHER`, `LOW_VIEWS`/`DONT_KNOW_WHAT_TO_POST`/`SLOW_SCRIPTING`/`HARD_TO_STAY_CONSISTENT`, etc.
- **After completion:** refresh user via `who-am-i`, re-identify PostHog, track `onboarding_completed`
- **Settings:** Creator Profile section shows saved values + "Edit Profile" reopens modal pre-filled
- **Personalisation:** backend reads niche + platform from user profile automatically — do NOT pass them in analysis/transcribe requests

### Key Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/auth/register` | POST | No | Register (name, email, password) |
| `/auth/login` | POST | No | Login (email/password) |
| `/auth/google` | POST | No | Google OAuth sign-in (idToken) |
| `/auth/refresh` | POST | No | Rotate token pair |
| `/auth/logout` | POST | No | Invalidate refresh token |
| `/auth/who-am-i` | GET | Yes | Current user profile + plan + usage + onboarding + hasPassword |
| `/auth/onboarding` | PATCH | Yes | Save 5-step onboarding answers (7 fields) |
| `/auth/change-credentials` | PATCH | Yes | Forced credential change (admin first login) |
| `/auth/change-password` | PATCH | Yes | Password change (oldPassword + newPassword) |
| `/auth/set-password` | POST | Yes | Set password for Google-only users (password + confirmPassword) |
| `/auth/forgot-password` | POST | No | Send password reset email (rate limited: 3/hour) |
| `/auth/reset-password` | POST | No | Reset password with token from email link |
| `/users` | CRUD | Admin | User management |
| `/api/analyze` | POST | Yes | Analyze script text |
| `/api/transcribe` | POST | Yes | Transcribe file (multipart, max 25 MB) |
| `/api/creator/:id/history` | GET | Yes | Past analyses (paginated, Phase 2) |
| `/admin/stats` | GET | Admin | Platform stats (users, analyses, plans) |
| `/admin/recent-signups` | GET | Admin | Last 20 user signups |
| `/admin/users/:id/plan` | PATCH | Admin | Change user plan (FREE/CREATOR) |
| `/admin/revenue` | GET | Admin | Current month Stripe revenue |
| `/api/create-checkout` | POST | Yes | Stripe checkout session |
| `/api/cancel-subscription` | POST | Yes | Cancel active subscription (effective at period end) |
| `/api/resume-subscription` | POST | Yes | Resume a canceling subscription |
| `/api/billing-history` | GET | Yes | User's billing history (payments + events) |
| `/api/waitlist` | POST | No | Landing page email capture |
| `/api/webhook` | POST | No | Stripe webhook handler |

### Analysis Response (`POST /api/analyze`)

Request: `{ "scriptText": "...", "language": "en" | "ar" | "hi" | "es" | "fr" | "de" | "tr" | "bn" }`

Validation: `scriptText` must not be empty or whitespace-only. Enforce on frontend too.

Response time: 15-30 seconds. Show loading state.

Returns `viralScore` (0-100) + `result` containing:
1. `hookStrength` — score + explanation
2. `emotionalIntensity` — score + explanation
3. `curiosityGap` — score + explanation
4. `clarity` — score + explanation
5. `viralProbability` — score + explanation
6. `first5Seconds` — openerType (question|statement|shock|statistic|story|challenge|other), hookQuality, 3 alternativeHooks
7. `retentionCurve` — predictions (6 entries: timestamp, retentionPercent, reasoning, fix) + averageRetention
8. `scriptRewrite` — rewrittenScript with `[PATTERN INTERRUPT: ...]` and `[B-ROLL: ...]` markers + patternInterrupts[] + bRollSuggestions[]
9. `distributionPack` — captionVariants[], hashtags[], thumbnailConcept, bRollShotList[], onScreenText[{text, timing}], trendingSoundSuggestions[]

All scores are integers 0-100. Retention curve always has exactly 6 entries.

403 with `"Plan Limit Reached"` → FREE users get instant rejection (no processing delay).

### Transcription (`POST /api/transcribe`)

Multipart form-data: field `file` (MP3/MP4/WAV, max 25 MB).

Optional fields: `analyze` ("true"/"false"), `language` (required when analyze=true).

Response times: transcription only 10-30s, transcription + analysis 30-60s.

Returns: `transcriptionId`, `transcript` (text, language, duration, segments[{id, start, end, text}]).

When `analyze=true`: also returns `analysis` with same shape as `POST /api/analyze`.

Early plan check: when `analyze=true`, plan limit checked before transcription starts (instant 403 for FREE users at limit).

**Transcription-only (`analyze=false`) does NOT count against plan limit.**

Do NOT set `Content-Type` header manually — browser sets multipart boundary automatically.

### Subscription Management

**Cancel:** `POST /api/cancel-subscription` — cancels at period end, user keeps access until `subscriptionEndDate`.

**Resume:** `POST /api/resume-subscription` — resumes a canceling subscription, restores auto-renewal.

**Billing History:** `GET /api/billing-history` — returns `{ data: { history: BillingHistoryEntry[] } }` sorted newest first.

```typescript
type BillingHistoryEntry = {
  type: 'payment' | 'event';
  id: string;
  event: string;       // 'payment' | 'subscribed' | 'canceled' | 'reactivated' | 'renewed' | 'expired'
  amount: number | null; // dollars (not cents) — only for payments
  currency: string | null;
  status: string | null; // 'succeeded' | 'failed' — only for payments
  details: Record<string, unknown> | null;
  date: string;        // ISO timestamp
};
```

**User subscription fields** (from `who-am-i`): `subscriptionStatus: 'active' | 'canceling' | null`, `subscriptionEndDate: string | null`.

## User Roles & Plans

| Role | Plan | Limits |
|---|---|---|
| USER | FREE | 3 analyses/month |
| USER | CREATOR | Unlimited ($10/month via Stripe) |
| ADMIN | null | No limits, manages users |

- Check via `GET /auth/who-am-i` → `plan` + `analysesThisMonth`
- FREE plan: show usage counter ("2/3 analyses used"), proactively block at limit
- Backend returns 403 `"Plan Limit Reached"` → show upgrade modal
- Stripe flow: `POST /api/create-checkout` → redirect to Stripe → webhook updates plan
- Counter resets automatically on 1st of each month (server-side cron)
- Both `/api/analyze` and `/api/transcribe?analyze=true` count against limit

## Pages (11 total)

### 1. Landing (`/`) — Public
- Full marketing page with custom CSS (`src/styles/landing.css`)
- Fonts: Instrument Serif, DM Sans, DM Mono (loaded via Google Fonts in layout)
- Sections: nav (with dark/light toggle), ticker, hero with animated score card, logo wall, problem section, before/after comparison, how it works, features, who it's for, pricing (Free/Creator/Agency), testimonials, FAQ (accordion), bottom CTA with email capture, footer
- Email capture → `POST /api/waitlist`
- "Start free" CTA → `/register`, "Log in" → `/login`
- Light/dark theme toggle in nav
- Mobile responsive with breakpoints at 768px and 900px
- Contact email: `team@cloutiq.ai`

### 2. Login (`/login`) — Public
- Email/password login form
- "Sign in with Google" button (Google Sign-In SDK → sends ID token to `POST /auth/google`)
- "Forgot Password?" link → `/forgot-password`
- "Don't have an account? Sign Up" link → `/register`
- Handle `mustChangeCredentials: true` → redirect to change-credentials page
- Handle Google-only user error → show message + "Login with Google" button

### 3. Register (`/register`) — Public
- Name, email, password form with client-side validation (8+ chars, 1 uppercase, 1 number)
- "Sign up with Google" button
- "Already have an account? Login" link → `/login`
- Consent line: "By creating an account you agree to our Terms of Service and Privacy Policy" (linked)
- On success: store tokens, redirect to `/dashboard`

### 4. Forgot Password (`/forgot-password`) — Public
- Email input form
- Submit → `POST /auth/forgot-password`
- Always show success: "If that email exists, a reset link has been sent."
- Handle 429 rate limit error

### 5. Reset Password (`/reset-password?token=...`) — Public
- Read `token` from URL query string
- New password + confirm password form
- Submit → `POST /auth/reset-password` with token + passwords
- On success → redirect to `/login` with success message
- Handle invalid/expired token → show "Request new reset link" button

### 6. Dashboard (`/dashboard`) — Auth Required
- **Script input:** large textarea, language selector (8 languages: en/ar/hi/es/fr/de/tr/bn), "Analyze" button
- **File upload:** drag-and-drop area, accepted formats (MP3/MP4/WAV, 25 MB), "Also analyze" toggle, language selector (when analyze on), "Transcribe" button
- **Analysis output — 12 sections:**
  1. Viral Probability — hero score (large circular gauge / score card)
  2. Hook Strength — score progress bar + explanation
  3. Emotional Intensity — score progress bar + explanation
  4. Curiosity Gap — score progress bar + explanation
  5. Clarity — score progress bar + explanation
  6. First 5 Seconds — opener type badge, hook quality text, 3 alternative hooks (copyable)
  7. Retention Curve — line chart (6 data points, X: timestamp, Y: retention%), tooltip with reasoning + fix
  8. Script Rewrite — full text with `[PATTERN INTERRUPT]` and `[B-ROLL]` markers highlighted
  9. Caption Variants — copyable list (copy-to-clipboard buttons)
  10. Hashtags — copyable tag pills
  11. Thumbnail Concept — description text
  12. Distribution Pack — B-roll shots, on-screen text with timing, trending sounds
- **Usage counter** (FREE plan): "2/3 analyses used this month"
- **Transcription output:** timestamped segments with start/end times

### 7. Settings (`/settings`) — Auth Required
- Profile info display (name, email, role, plan)
- Creator Profile section (non-admin only): shows platform, niche, audience, view count, frustration + "Edit Profile" button reopens onboarding modal pre-filled
- **Subscription section** (non-admin only):
  - Active: plan name, price, next billing date, "Cancel Subscription" button with confirmation modal
  - Canceling: plan name, access-until date, warning message, "Resume Subscription" button with confirmation modal
  - Free: usage info, "Upgrade to Creator — $10/month" button with Stripe consent line
  - Cancel → `POST /api/cancel-subscription`, Resume → `POST /api/resume-subscription`
- **Billing history section** (non-admin only): fetches from `GET /api/billing-history`, shows date/event/amount table
- Password section: uses `hasPassword` from backend — "Set Password" when false, "Change Password" when true

### 8. History (`/history`) — Auth Required
- Paginated list of past analyses
- Each entry: script preview (truncated), viral score, language, date
- Click to expand full analysis result
- `GET /api/creator/:id/history` (paginated)

### 9. Terms (`/terms`) — Public
- Full Terms of Service text (effective March 25, 2026)
- Server component, SEO indexable
- Clean typography with numbered sections, bullet lists
- Back-to-home link, card-glow container
- Contact: `team@cloutiq.ai`

### 10. Privacy (`/privacy`) — Public
- Placeholder for Termly privacy policy embed
- Server component, SEO indexable
- Will contain Termly embed script once provided by client
- Contact: `team@cloutiq.ai`

### 11. Admin (`/admin`) — Auth Required, role: ADMIN
- Non-admin users → 403 / redirect
- User management table (CRUD via `/users` endpoints)
- Stats dashboard: 8 stat cards (total users, new this month, free/creator breakdown, analyses today/week/month, revenue)
- Plan distribution bar (free vs creator visual)
- Merged users table: recent 20 signups pinned at top with NEW badge, then all other users
- Search + pagination (20/page)
- Plan override dropdown per user (PATCH /admin/users/:id/plan)
- Revenue card from GET /admin/revenue
- Auto-refresh every 60s with "Updated Xs ago" indicator

## Design System

### Aesthetic
- **Dark mode is the default** — light mode toggle must work
- **Reference:** Linear.app + Vercel dashboard
- **Sharp edges** — `rounded-none` or `rounded-sm` max, never `rounded-lg`/`rounded-xl`
- **Flat surfaces** — no gradients on cards, use `--bg-secondary` + subtle border
- **No pastel colors, no generic SaaS purple**
- **Scores are the hero element** — visually dominant, large, bold, animated

### Color Tokens (CSS custom properties)

| Token | Dark (default) | Light | Usage |
|---|---|---|---|
| `--bg-primary` | `#0d1117` | `#f8fafc` | Page background |
| `--bg-secondary` | `#161b22` | `#ffffff` | Cards, panels, sidebars |
| `--accent` | `#38bdf8` | `#2563eb` | CTAs, links, active states |
| `--text-primary` | `#e8edf5` | `#0f172a` | Headings, body text |
| `--score-high` | `#16a34a` | `#16a34a` | Score 70-100 (green) |
| `--score-mid` | `#d97706` | `#d97706` | Score 40-69 (amber) |
| `--score-low` | `#dc2626` | `#dc2626` | Score 0-39 (red) |

### Typography (3 font families — all must be loaded)

| Font | Weight | CSS Variable | Usage |
|---|---|---|---|
| **Barlow Condensed** | 600, 700 | `--font-heading` | Headings, score numbers, section titles |
| **Barlow** | 400, 500 | `--font-sans` | Body text, labels, descriptions, explanations |
| **JetBrains Mono** | 400, 500 | `--font-mono` | Metrics, tags, timestamps, code-like values |

### Score Display Rules

```tsx
function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--score-high)';
  if (score >= 40) return 'var(--score-mid)';
  return 'var(--score-low)';
}
```

- Score numbers: large, bold (Barlow Condensed 700)
- Score bars: animate on load (CSS transition or framer-motion)
- Apply color coding to: viral probability (hero), all 5 dimension scores, average retention, per-timestamp retention

## Language Support

`language` param: `en`, `ar`, `hi`, `es`, `fr`, `de`, `tr`, `bn` — controls analysis output language, NOT input language.

- **Arabic (`ar`):** results section must use `dir="rtl"`, but scores/charts stay LTR
- Backend rejects invalid language values with 400
- Whisper transcription auto-detects input language (90+ languages) — no language param needed for transcription itself

## Loading States

- "Analyze" button → spinner + "Analyzing..." (15-30 seconds)
- "Transcribe" button → spinner + "Transcribing..." (10-30 seconds)
- "Transcribe + Analyze" → spinner + "Transcribing & Analyzing..." (30-60 seconds)
- Page loads → skeleton screens for data-dependent sections
- Token refresh → silent (no visible indicator)

## Error Handling

| Status | Action |
|---|---|
| 400 | Show `message[0]` as toast or inline validation |
| 401 | Attempt token refresh → if fails, redirect to `/login` |
| 403 `"Plan Limit Reached"` | Show upgrade modal |
| 403 `"Forbidden"` / `mustChangeCredentials` | Show access denied or force credential change |
| 404 | Show not found |
| 429 | Show "Too many requests, try again later" (forgot-password rate limit) |
| 500 | Show "Something went wrong, please try again" |

### Key Error Messages

| Error Message | Frontend Action |
|---|---|
| `"Invalid email or password."` | Show on login form |
| `"No password set for this account..."` | Show message + "Login with Google" button |
| `"Use change-password endpoint..."` | Redirect to change-password flow |
| `"Passwords do not match."` | Highlight confirm password field |
| `"Invalid or expired reset token."` | Show error + "Request new reset link" button |
| `"Too many reset attempts..."` | Show countdown/message |
| `"You have used all 3 free analyses..."` | Show upgrade prompt/modal |
| `"Email ... is already taken"` | Show on registration form |

## Upgrade Prompt Modal

- Triggered on 403 `"Plan Limit Reached"` or proactively when `analysesThisMonth >= 3`
- Content: "You've used all 3 free analyses this month", Creator plan benefits, $10/month price
- "Upgrade to Creator" CTA → `POST /api/create-checkout` → redirects to Stripe checkout
- "Maybe later" dismiss button
- Stripe consent line: "By subscribing you agree to our Terms of Service including the payment and cancellation terms."

## Analytics (PostHog)

Events to track:

| Event | When | Properties |
|---|---|---|
| `user_signed_up` | After registration or first Google sign-in | `userId, authMethod: 'google' \| 'email'` |
| `user_logged_in` | After successful login | `userId, authMethod: 'google' \| 'email'` |
| `script_analyzed` | After successful analysis | `userId, plan, viralScore, language` |
| `file_transcribed` | After successful transcription | `userId, plan, language, withAnalysis: boolean` |
| `limit_reached` | 403 Plan Limit Reached | `userId, plan: 'FREE', analysesThisMonth: 3` |
| `upgrade_clicked` | Click "Upgrade to Creator" CTA | `userId, plan: 'FREE'` |
| `upgrade_completed` | Stripe checkout success redirect | `userId, plan: 'CREATOR'` |
| `password_reset_requested` | After forgot-password call | `email` |
| `onboarding_completed` | After onboarding modal submit | `userId, platform, niche, audienceAgeRange, audienceRegion, averageViewCount, biggestFrustration` |
| `plan_updated_by_admin` | Admin changes user plan | `adminId, userId, newPlan, oldPlan` |

After login: `posthog.identify(userId, { email, plan, role, platform?, niche?, onboardingCompleted })`

## Monitoring (Sentry)

Keep Sentry on frontend (already configured in starter). Captures unhandled errors and failed API responses. Alert rule: email when any error exceeds 3 occurrences in 10 minutes.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (`https://api.cloutiq.ai` prod, `http://localhost:8080` dev) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID (must match backend's Google Cloud project) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (default `https://us.i.posthog.com`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for checkout |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (already in starter) |
| `NEXT_PUBLIC_SENTRY_DISABLED` | Set `"true"` to disable in dev |
| `NEXT_PUBLIC_CHATWOOT_URL` | Chatwoot base URL (`https://app.chatwoot.com`) |
| `NEXT_PUBLIC_CHATWOOT_TOKEN` | Chatwoot website token for live chat widget |

## Key Conventions

- **Path alias:** `@/*` → `src/*`
- **Server components by default** — only add `'use client'` for browser APIs or hooks
- **Function declarations** for components: `function ComponentName() {}`
- **Props:** interface named `{ComponentName}Props`
- **Class merging:** always use `cn()` from `@/lib/utils`, never manual concatenation
- **Formatting:** single quotes, no trailing commas, 2-space indent, semicolons (Prettier + tailwind plugin)
- **ESLint:** `@typescript-eslint/no-unused-vars` warns, `no-console` warns
- **Toast notifications:** use `sonner` (already installed) for transient errors
- **Animations:** use `motion` (framer-motion, already installed) for score bars and transitions
- **File uploads:** use `react-dropzone` (already installed) for drag-and-drop

## Performance Targets

- Analysis response: under 15 seconds (300-500 word script)
- Transcription: under 60 seconds (3-minute audio)
- Initial page load: under 3 seconds
- Mobile responsive: full functionality on iOS Safari + Android Chrome

## Starter Template Migration

The codebase was forked from `next-shadcn-dashboard-starter`. Several things must be replaced or removed.

### Must Remove
- **Clerk auth** — `@clerk/nextjs`, `@clerk/themes` packages + all Clerk imports (providers, `useUser()`, `useOrganization()`, `auth()`, org switcher, `<SignIn/>`, `<SignUp/>`, `<Protect/>`)
- **Demo routes** — `overview/` (parallel routes), `product/`, `kanban/`, `workspaces/`, `billing/`, `exclusive/`, `profile/`, `about/`, `privacy-policy/`, `terms-of-service/`
- **Demo features** — `src/features/products/`, `src/features/kanban/`, `src/features/overview/`, `src/features/profile/`
- **All 6 starter themes** — `src/styles/themes/` (vercel, claude, neobrutualism, supabase, mono, notebook) + theme switcher UI
- **11 starter fonts** — Geist, Inter, Mulish, Outfit, etc. from `src/components/themes/font.config.ts`
- **Mock data** — `src/constants/mock-api.ts` (Faker.js demo data)
- **Cleanup scripts** — `__CLEANUP__/` directory (no longer needed after migration)

### Must Add (npm packages)
- `@react-oauth/google` — Google Sign-In button
- `posthog-js` — event analytics
- `@stripe/stripe-js` — Stripe checkout redirect

### Must Change
- **Theme default** — `defaultTheme='system'` → `defaultTheme='dark'` in ThemeProvider
- **Fonts** — replace all 11 fonts with Barlow Condensed, Barlow, JetBrains Mono
- **Color tokens** — replace OKLCh shadcn zinc palette with CloutIQ hex tokens
- **Border radius** — `radius: 0.5rem` → `0` or `0.125rem` globally
- **Nav config** — replace 12 demo items with CloutIQ nav (Dashboard, History, Settings, Admin)
- **Sidebar** — rewire from Clerk user hooks to custom JWT auth context
- **Landing page** — replace auth redirect in `src/app/page.tsx` with marketing page
- **`env.example.txt`** — replace Clerk vars with CloutIQ vars

### Reusable From Starter (keep as-is)
- Dashboard shell layout (sidebar + header + content area)
- All 59 shadcn/ui components in `src/components/ui/`
- Sentry client + server instrumentation
- Tailwind CSS v4 + PostCSS setup
- `sonner` (toasts), `motion` (animations), `react-dropzone` (file upload), `recharts` (charts)
- `@tanstack/react-table` (admin table, history table)
- Zustand, Nuqs, React Hook Form + Zod
- KBar command palette
- Husky + lint-staged pre-commit hooks
- `cn()` utility in `src/lib/utils.ts`

### Must Build From Scratch
- API client with auth header injection, 401 refresh interceptor, response unwrapping
- JWT token store (in-memory via Zustand — NOT localStorage)
- `middleware.ts` for route protection (auth check, admin role check)
- `mustChangeCredentials` guard/screen
- All 12 analysis output section components
- Score bar components with animated color coding
- Retention curve chart (6-point Recharts line chart)
- File upload UI (drag-and-drop with format/size validation)
- Upgrade prompt modal (plan limit paywall)
- Usage counter component ("2/3 analyses used")
- Landing page (marketing, email capture, before/after example)
- Login page (email/password + Google OAuth button)
- Register page (name/email/password + Google OAuth button)
- Forgot password page (email form, success message)
- Reset password page (token from URL, new password form)
- Settings page (profile info, set/change password)
- History page (paginated list with expand)
- Admin dashboard (user table, stats, plan override, Stripe revenue)
- Arabic RTL container (`dir="rtl"` on results when `language === 'ar'`)
- PostHog provider + 8 tracked events + identify call

## Google OAuth Setup

1. Google Cloud Console → Credentials → OAuth 2.0 Client ID (Web application)
2. Authorized JavaScript origins: `https://cloutiq.ai`, `http://localhost:3000`
3. Frontend uses `@react-oauth/google` → `GoogleOAuthProvider` + `GoogleLogin` component
4. On success: send `response.credential` as `idToken` to `POST /auth/google`
5. Frontend and backend must use the same Google Cloud project's Client ID

## Test Credentials

| Account | Email | Password | Role |
|---|---|---|---|
| Admin | `admin@cloutiq.com` | `Admin123!` | ADMIN (unlimited) |

## Milestones (Phase 1)

- **M1 (Week 1):** Backend AI pipeline — no frontend work
- **M2 (Week 2):** Frontend + Auth + Landing Page — this is the main frontend build
- **M3 (Week 3):** Stripe payments + Admin dashboard + Multilingual QA + Production deploy

## Card Style (Global)

All cards use the `.card-glow` CSS class defined in `globals.css`:
- Dark: `rgba(22,27,34,0.85)` bg, cyan outer glow on hover, layered shadows
- Light: `rgba(255,255,255,0.9)` bg, blue glow on hover
- Applied via shadcn Card component default + manually on all card-like containers
- Border radius: 6px

## Deployment

- **Hosting:** Vercel (connected via fork: `AbdulAhadArain/frontend`)
- **Production branch:** `main`
- **Preview branch:** `dev`
- **Build command:** `npm run build`
- **Git remotes:** `origin` → `Cloutiq/frontend`, `myfork` → `AbdulAhadArain/frontend`
- **IMPORTANT:** Always push to BOTH remotes when deploying:
  ```bash
  git push origin dev:main && git push myfork dev:main
  ```
  Vercel deploys from `myfork` (`AbdulAhadArain/frontend`). Both repos must stay in sync.

## Legal Pages

- `/terms` — Terms of Service, server-rendered, public, SEO indexable
- `/privacy` — Privacy Policy via Termly embed (placeholder until Termly script provided), public, SEO indexable
- Both linked from: landing page footer, app sidebar footer
- Consent lines present on: register form, upgrade modal, settings upgrade button
- Contact email: `team@cloutiq.ai` (NOT `hello@cloutiq.ai`)
- Required for Google Ads approval

## Chatwoot (Live Chat)

- Widget component: `src/components/chatwoot.tsx`
- Loaded in root layout (`src/app/layout.tsx`)
- Identifies logged-in users (name, email) to Chatwoot
- Hidden on auth pages: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Env vars: `NEXT_PUBLIC_CHATWOOT_URL`, `NEXT_PUBLIC_CHATWOOT_TOKEN`

## Reference

- `FRONTEND_HANDOFF.md` — full API specs, request/response examples, UI requirements, error message catalog (gitignored, local only)
- `Cloutiq_Project_Specification.pdf` — milestone plan, approval criteria, scope (gitignored, local only)
- `docs.txt` — Terms & Conditions text + developer implementation brief for legal pages
- `cloutiq-landing (1).html` — original landing page HTML design (reference for landing page styling)
- `AGENTS.md` — starter template architecture docs (pre-migration, some info outdated)
- `docs/` — starter template docs (Clerk setup, RBAC, theming — will be replaced)
