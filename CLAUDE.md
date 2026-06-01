@AGENTS.md

# FocusVille — Developer Guide

## Project overview
Gamified productivity app: users complete tasks + focus sessions → earn Energy (⚡) and Gold (🪙) → build a city. Live at `feelingtycoon.dekds.com`.

## Tech stack
- **Next.js 16** (App Router, Turbopack) — read `node_modules/next/dist/docs/` before writing Next.js code
- **TypeScript** strict mode — no `any`
- **Tailwind CSS v4** — utility classes only, no new CSS files
- **Prisma 7 + PostgreSQL (Neon)** — all DB access through Prisma
- **NextAuth 5 beta** — `auth()` server helper, `signIn`/`signOut` from `next-auth/react`
- **Sonner** — toast notifications via `fvToast` helper in `lib/toast.ts`
- **Framer Motion** — page/component animations
- **Recharts** — charts on the progress page

## Running locally
```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npx prisma db push
npx prisma db seed
npm run dev
```

## Environment variables
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random string ≥32 chars |
| `NEXTAUTH_URL` | ✅ (prod) | Full URL e.g. `https://feelingtycoon.dekds.com` |
| `GOOGLE_CLIENT_ID` | optional | For Google OAuth |
| `GOOGLE_CLIENT_SECRET` | optional | For Google OAuth |

Validated at startup via `lib/env.ts` — missing vars crash with a clear message.

## Key architectural decisions
- **Dual currency**: Energy (⚡) earned via focus sessions; Gold (🪙) earned by completing tasks
- **Game state**: Extended `User` model + separate `GameState` model (1:1) for complex JSON fields (era, citizens, events)
- **State management**: React Context (`lib/store.tsx`) + localStorage cache. Hydrated from `/api/user/state` on load.
- **Server Actions only** for mutations — no API routes for writes. All actions in `lib/actions/`.
- **Optimistic UI**: Shop uses `useOptimistic` for instant feedback; server action validates and either confirms or rolls back.
- **Toasts**: Always use `fvToast.*` from `lib/toast.ts` — never raw `toast()` calls.
- **Auth expiry**: 401 from API → auto-redirect to `/login?redirect=<currentPath>`
- **Streak**: 36-hour window (not strict 24h) via `lib/streak-utils.ts`

## File structure
```
app/                  Route pages (App Router)
  dashboard/          Main dashboard with event card, streak, tasks
  focus/              Pomodoro-style focus timer
  community/          City builder (4 district zones)
  rewards/            Shop with dual-currency
  plan/               AI-powered goal → task planner
  progress/           Stats, achievements, focus charts
  settings/           User settings
components/
  focusville/         Core shell, mascot, currency display
  city/               DistrictGrid (new) + CityGrid (legacy)
  game/               Game UI: events, happiness, maintenance, streak
  ui/                 Shared: LoadingButton, ErrorBoundary
lib/
  actions/            All server actions
  store.tsx           Global app state (React Context)
  types.ts            TypeScript types
  game-utils.ts       Pure helpers (happiness multiplier, streak milestones)
  streak-utils.ts     Streak calculation (36h window)
  toast.ts            Typed toast helper
  env.ts              Runtime env validation
  hooks/              useCountUp (animated number counter)
prisma/
  schema.prisma       DB schema
  seed.ts             Achievement + demo data seed
```

## Database commands
```bash
npx prisma db push          # sync schema to DB (no migration files)
npx prisma generate         # regenerate Prisma client after schema changes
npx prisma db seed          # seed achievements + demo user
npx prisma studio           # visual DB browser
```

## Linting / TypeScript
```bash
npm run lint                # ESLint (0 warnings policy)
npx tsc --noEmit            # TypeScript check
npm run build               # Full production build
```

## Game systems (implemented)
1. **Dual currency** — Energy from focus, Gold from tasks; happiness multiplier on earnings
2. **Happiness** (0–100) — affects earnings; tracked via `User.happiness`
3. **Passive income** — buildings earn offline (capped at 8h), welcome-back toast
4. **Building health/decay** — weekly maintenance; healthy → due_soon → deteriorating → collapsed
5. **Districts** — 4 zones (Residential/Industrial/Green/Knowledge), 6 slots each, mastery at 4+ correct buildings
6. **Citizens** — residents in Residential buildings, flee when happiness < 30
7. **Daily events** — deterministic daily event card with 2 choices and consequences
8. **Era progression** — Pioneer → Modern (10 buildings) → Metropolis (25 + 30-day streak)
9. **Streak milestones** — tiered rewards at 3/7/14/21/30 days
10. **Prestige** — reset at Metropolis with +10% permanent multiplier
