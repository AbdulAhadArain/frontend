# CloutIQ Frontend

AI-powered content intelligence platform for short-form video creators. Analyze scripts, get viral scores, retention predictions, script rewrites, and distribution packs.

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router)
- **Language** — [TypeScript](https://www.typescriptlang.org) (strict mode)
- **Auth** — Custom JWT (Google OAuth + email/password)
- **Error Tracking** — [Sentry](https://sentry.io)
- **Analytics** — [PostHog](https://posthog.com)
- **Payments** — [Stripe](https://stripe.com)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com)
- **Components** — [shadcn/ui](https://ui.shadcn.com)
- **State Management** — [Zustand](https://zustand-demo.pmnd.rs)
- **URL State** — [Nuqs](https://nuqs.47ng.com/)
- **Tables** — [TanStack Data Tables](https://tanstack.com/table)
- **Charts** — [Recharts](https://recharts.org)
- **Forms** — [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev)
- **Animations** — [Framer Motion](https://www.framer.com/motion/)
- **Command Palette** — [kbar](https://kbar.vercel.app/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (preferred) or Node.js
- Git

### Setup

```bash
# Clone the repo
git clone https://github.com/Cloutiq/frontend.git
cd frontend

# Install dependencies
bun install

# Set up environment variables
cp env.example.txt .env.local
# Edit .env.local with your API keys (see Environment Variables below)

# Start dev server
bun run dev
```

The app will be available at http://localhost:3000.

### Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (`https://api.cloutiq.ai` prod, `http://localhost:3000` dev) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (default `https://us.i.posthog.com`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN |
| `NEXT_PUBLIC_SENTRY_DISABLED` | Set `"true"` to disable Sentry in dev |

## Development Commands

```bash
bun run dev              # Dev server
bun run build            # Production build
bun run start            # Production server
bun run lint             # Run ESLint
bun run lint:fix         # Fix lint issues + format
bun run lint:strict      # Zero warnings mode
bun run format           # Format with Prettier
bun run format:check     # Check formatting
```

## Project Structure

```
src/
├── app/                     # Next.js App Router (routes)
│   ├── page.tsx             # Landing page (public, marketing)
│   ├── login/               # Login (email/password + Google)
│   ├── register/            # Registration
│   ├── forgot-password/     # Password reset request
│   ├── reset-password/      # Password reset (token-based)
│   ├── dashboard/           # Script analysis + file upload
│   │   └── history/         # Past analyses
│   ├── settings/            # User profile + password management
│   └── admin/               # Admin panel (ADMIN role only)
├── features/                # Feature-based modules
│   ├── analysis/            # Script analysis UI (12 output sections)
│   ├── auth/                # Custom JWT auth + token management
│   ├── history/             # Analysis history
│   ├── admin/               # Admin user management + stats
│   └── landing/             # Landing page components
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── layout/              # Sidebar, header, providers
├── config/                  # Nav config with RBAC
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities (cn, API client, parsers)
├── styles/                  # Global CSS + theme tokens
└── types/                   # TypeScript types
```

## Features

- Script analysis with 12-section output (viral scoring, retention curve, script rewrite, distribution pack)
- Audio/video file upload + transcription (Whisper)
- Google OAuth + email/password authentication
- JWT token management with automatic refresh
- Plan-based usage limits (FREE: 3/month, CREATOR: unlimited)
- Stripe checkout for plan upgrades
- Admin dashboard with user management
- Dark/light theme with custom design system
- Arabic RTL support for analysis results
- PostHog event tracking
- Mobile responsive

## Design System

- **Dark mode default** — Linear.app + Vercel dashboard aesthetic
- **Sharp edges** — no rounded corners (`rounded-none` or `rounded-sm` max)
- **Flat surfaces** — no gradients, subtle borders
- **Fonts:** Barlow Condensed (headings), Barlow (body), JetBrains Mono (metrics)
- **Score colors:** Green (70-100), Amber (40-69), Red (0-39)

## Documentation

- [CLAUDE.md](./CLAUDE.md) — full development guide for AI assistants
- [FRONTEND_HANDOFF.md](./FRONTEND_HANDOFF.md) — API specs, request/response examples, UI requirements

## Based On

This project is based on [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) by Kiranism, with Clerk auth replaced by custom JWT and all demo features replaced with CloutIQ functionality.
