# Live WildFit Technical Design Document

**Version:** 1.0
**Document Type:** Engineering Document — implementation decisions only
**Companion Document:** PRD.md
**Status:** Ready for Implementation

**Purpose:** This document is the single source of truth for all implementation decisions on the Live WildFit project. It specifies the tech stack, database schema, authentication architecture, offline search strategy, PWA configuration, API surface, analytics, and build sequence. It does not describe product requirements or user experience — those live in PRD.md. The intended audience is the engineer building this application. Read PRD.md first to understand what to build; read this document to understand how to build it.

---

## Section 1 — Architecture Overview

### 1.1 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENT  (Browser / PWA)                       │
│                                                                  │
│  ┌───────────────────────┐   ┌────────────────────────────────┐  │
│  │   Next.js App         │   │      Service Worker            │  │
│  │   (App Router)        │   │      (@serwist/next)           │  │
│  │                       │   │                                │  │
│  │  Server Components    │   │  Precache: app shell           │  │
│  │  Client Components    │   │  Runtime: /api/foods (SWR)     │  │
│  │  Route Handlers       │   │  Offline search: MiniSearch    │  │
│  └──────────┬────────────┘   │  Food DB: localStorage cache   │  │
│             │ fetch/actions  └────────────────────────────────┘  │
└─────────────┼────────────────────────────────────────────────────┘
              │ HTTPS
              ▼
┌──────────────────────────────────────────────────────────────────┐
│            Next.js API Routes  (Vercel — free tier)              │
│                                                                  │
│  GET  /api/foods            — full food list for offline cache   │
│  GET  /api/foods/status     — server-side status computation     │
│  GET  /api/cycle            — read user cycle state              │
│  PUT  /api/cycle            — update cycle state / season jump   │
│  POST /api/events           — log session event (WAUR)           │
│  GET  /api/keep-alive       — Supabase ping (Vercel Cron daily)  │
│  GET  /auth/callback        — OAuth redirect handler             │
└──────────────────────────┬───────────────────────────────────────┘
                           │ @supabase/ssr (anon key / service role)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Supabase  (free tier)                           │
│                                                                  │
│  PostgreSQL                   Auth                               │
│  ├── profiles                 ├── email + password               │
│  ├── cycle_state              ├── Google OAuth                   │
│  ├── food_items  ◄── seed     └── anonymous / guest              │
│  └── session_events                                              │
│                                                                  │
│  RLS on all tables            Auto-pause after 7 days inactivity │
│  Food table: public read      Keep-alive: Vercel Cron daily      │
└──────────────────────────────────────────────────────────────────┘

Anonymous → full account upgrade path:
  signInAnonymously()  →  user_id assigned (UUID)
  DB rows written with that user_id
  updateUser({ email, password })  OR  linkIdentity({ provider: 'google' })
  → user_id unchanged — all DB rows automatically belong to the full account
  → no data migration required
```

### 1.2 Technology Stack Decision Table

| Layer | Decision | Package / Service | Version | Rationale |
|---|---|---|---|---|
| Frontend framework | Next.js App Router | `next` | 15.x | App Router provides React Server Components, reducing client JS payload. Native Vercel deployment with zero config. Route-based code splitting satisfies the 3-second initial load target. |
| Language | TypeScript | `typescript` | 5.x | The schema has precise enums: status values (`in`, `moderation`, `out`, `never`), weeks 1–12, categories 1–3. TypeScript catches status/week mismatches at compile time rather than at runtime in a grocery store. |
| Styling | Tailwind CSS | `tailwindcss` | 4.x | Tailwind v4 uses CSS-first config — design tokens are native CSS custom properties by default. This satisfies the PRD requirement of no hardcoded hex values in components. Built-in dark mode support. Zero runtime CSS overhead. |
| PWA / service worker | Serwist | `@serwist/next` | 9.x | `next-pwa` is deprecated and unmaintained — do not use it. Serwist is the actively maintained successor, built on Workbox, and has explicit Next.js App Router + Turbopack support. It provides the fine-grained caching strategy API needed to serve the food database offline. |
| Supabase client | Supabase SSR | `@supabase/ssr` | 0.9.x | `@supabase/auth-helpers-nextjs` is deprecated — do not use it. `@supabase/ssr` is the official replacement for App Router. It provides `createServerClient()` for Server Components and Route Handlers, and `createBrowserClient()` for Client Components, with correct cookie management across the server/client boundary. |
| Supabase JS core | Supabase JS | `@supabase/supabase-js` | 2.x | Peer dependency of `@supabase/ssr`. Required for all Supabase operations. |
| Auth | Supabase Auth | Supabase free tier | — | Handles email/password, Google OAuth, and anonymous sessions natively. Anonymous-to-full-account upgrade preserves `user_id`, eliminating data migration. Free tier: 50,000 MAU — sufficient for MVP. |
| Database | PostgreSQL | Supabase free tier | — | Managed PostgreSQL with RLS, point-in-time backups, and a REST API. Free tier: 500MB storage — sufficient for 539 food items and user data at MVP scale. |
| Offline search | MiniSearch | `minisearch` | 7.x | Lightweight (~7KB gzip) in-memory full-text search engine. Indexes 539 items with aliases in ~30–50ms. Queries return in <5ms — 40× within the 200ms budget. Supports multi-field search (name + aliases), prefix matching, and BM25 scoring with field boost. Zero network dependency at query time. Chosen over Fuse.js (fuzzy-only, no field boost, weaker prefix support) and FlexSearch (heavier API, overkill at this data scale). |
| Analytics | Internal SQL | Supabase | — | WAUR is computed by querying `session_events` directly. No third-party analytics tool required in MVP (PRD §6.6 explicit). |
| Hosting | Vercel | Vercel free tier | — | Native Next.js support. Free tier includes Vercel Cron (1 daily job) — exactly what is needed for the Supabase keep-alive. Zero-config deploys from GitHub. |
| Package manager | pnpm | `pnpm` | 9.x | Faster installs than npm/yarn, strict dependency isolation, lower disk usage. Use pnpm consistently — do not mix with npm or yarn in this project. |

### 1.3 Folder Structure

```
live-wildfit/
├── app/
│   ├── layout.tsx                      # Root layout — nav, footer, providers
│   ├── page.tsx                        # / — Home dashboard (PRD §5.6)
│   ├── foods/
│   │   └── page.tsx                    # /foods — Food browse + search (PRD §5.6)
│   ├── weeks/
│   │   └── [week]/
│   │       └── page.tsx                # /weeks/[week] — Weekly guide, weeks 1–12 (PRD §5.6)
│   ├── settings/
│   │   └── page.tsx                    # /settings — Settings screen (PRD §5.6)
│   ├── auth/
│   │   ├── onboarding/
│   │   │   └── page.tsx                # Onboarding flow (3 screens)
│   │   ├── login/
│   │   │   └── page.tsx                # Sign-in page
│   │   └── callback/
│   │       └── route.ts                # OAuth redirect handler
│   └── api/
│       ├── foods/
│       │   ├── route.ts                # GET /api/foods
│       │   └── status/
│       │       └── route.ts            # GET /api/foods/status
│       ├── cycle/
│       │   └── route.ts                # GET, PUT /api/cycle
│       ├── events/
│       │   └── route.ts                # POST /api/events
│       └── keep-alive/
│           └── route.ts                # GET /api/keep-alive (Vercel Cron)
├── components/
│   ├── ui/                             # Primitives: Button, Badge, Skeleton, Dialog, Input
│   ├── layout/
│   │   ├── BottomTabBar.tsx            # Mobile nav (Home, Foods, Weeks, Settings)
│   │   ├── TopNav.tsx                  # Desktop nav
│   │   └── Footer.tsx                  # Attribution footer — required by PRD §7.2
│   ├── home/
│   │   ├── SeasonBadge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── DayCounter.tsx
│   │   └── WeekCard.tsx
│   ├── foods/
│   │   ├── FoodSearch.tsx              # Search input + MiniSearch integration
│   │   ├── FoodList.tsx                # Browse list with filter tabs
│   │   ├── FoodItem.tsx                # Single item row + status badge
│   │   └── StatusBadge.tsx             # IN SEASON / MODERATION / OUT / NOT REC
│   ├── settings/
│   │   ├── ProfileSection.tsx
│   │   ├── CycleSection.tsx
│   │   ├── AppearanceSection.tsx
│   │   └── AccountSection.tsx
│   └── onboarding/
│       ├── WelcomeScreen.tsx
│       ├── CreateAccountScreen.tsx
│       └── YourCycleScreen.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # createBrowserClient() — Client Components only
│   │   └── server.ts                   # createServerClient() — Server Components + Route Handlers
│   ├── cycle.ts                        # computeCurrentWeek(), daysRemaining(), seasonJumpDate()
│   ├── food-search.ts                  # MiniSearch instance, buildIndex(), search()
│   ├── food-cache.ts                   # localStorage read/write for food items
│   └── analytics.ts                   # logSessionEvent()
├── types/
│   └── index.ts                        # FoodItem, CycleState, Profile, SessionEvent, FoodStatus
├── scripts/
│   └── seed-foods.ts                   # Reads foods-seed.json, upserts into food_items
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon-192x192.png
│       ├── icon-512x512.png
│       └── apple-touch-icon.png        # 180×180, required for iOS home screen
├── foods-seed.json                     # Canonical food database — 539 entries (already present)
├── sw.ts                               # Serwist service worker entry point
├── middleware.ts                       # Route protection + session refresh
├── next.config.ts                      # withSerwist wrapper
├── tailwind.config.ts
├── vercel.json                         # Cron job configuration
├── .env.local.example
└── package.json
```

---

## Section 2 — Database Design

### 2.1 Schema Design Principles

**Food status storage — JSONB columns on a single table**

Store `week_status` and `category_override` as JSONB columns on the `food_items` table rather than as a separate `food_week_status` join table. Reasons:

1. The seed file (`foods-seed.json`) already uses this exact structure. Seeding is a direct upsert with zero transformation — the JSON is written as-is into the JSONB column.
2. The query pattern is always point-lookup: "give me the status for food X at week Y (and optionally category Z)." JSONB path access (`week_status->>'9'`) on a GIN-indexed column executes in O(1) without a join.
3. A fully normalised join table (539 items × 12 weeks × up to 3 categories = ~6,500+ rows) adds join overhead and write complexity with no query performance benefit at this data scale.
4. `category_override` is sparse: only 72 of 539 entries have it. A separate table would have 467 empty foreign key rows. JSONB stores the absence as `null` with no wasted space.

**Week 9–10 category split**

The `category_override` JSONB column stores per-category status only for the items and weeks where the status differs from the base `week_status`. Structure: `{"9": {"1": "moderation", "2": "out", "3": "out"}, "10": {...}}`. Status computation checks `category_override` first for weeks 9 and 10; falls back to `week_status` for all other weeks and for items with no override. If the user has not selected a category, default to category `2` (PRD §3.2).

**Anonymous user data storage**

Supabase `signInAnonymously()` creates a real row in `auth.users` with a real UUID and `is_anonymous = true`. Use that UUID as `user_id` in `profiles`, `cycle_state`, and `session_events` from the first interaction. When the user upgrades to a full account via `updateUser()` or `linkIdentity()`, Supabase preserves the `user_id` — no application-level data migration is needed.

**Row-level security strategy**

Enable RLS on every table. `food_items` is read-only for all roles, including unauthenticated requests (required by PRD §6.4). All user-specific tables restrict read and write to `auth.uid() = user_id`. Both anonymous and authenticated Supabase sessions carry a valid JWT, so RLS policies work identically for both.

### 2.2 Full SQL Schema

```sql
-- ============================================================
-- PROFILES
-- One row per user. Extends auth.users with display preferences.
-- Created during onboarding (step 3 — Your Cycle screen).
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  timezone      TEXT        NOT NULL DEFAULT 'UTC',
  theme         TEXT        NOT NULL DEFAULT 'system'
                            CHECK (theme IN ('light', 'dark', 'system')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CYCLE_STATE
-- One row per user (enforced by UNIQUE). Stores the user's
-- program position. Updated on season jump, cycle reset,
-- and category selection.
-- ============================================================
CREATE TABLE public.cycle_state (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date    DATE        NOT NULL,
  current_week  SMALLINT    NOT NULL DEFAULT 1
                            CHECK (current_week >= 1 AND current_week <= 12),
  category      SMALLINT    CHECK (category IN (1, 2, 3)),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ============================================================
-- FOOD_ITEMS
-- Canonical food database. Seeded once from foods-seed.json.
-- 539 entries: 467 food items + 72 sugar reference entries.
-- Sugar entries (is_sugar_name = true) are filtered from food
-- lookup UI but included in the hidden sugar names reference.
-- week_status and category_override mirror the seed JSON structure.
-- ============================================================
CREATE TABLE public.food_items (
  id                UUID        PRIMARY KEY,
  name              TEXT        NOT NULL,
  aliases           TEXT[]      NOT NULL DEFAULT '{}',
  category          TEXT        NOT NULL
                                CHECK (category IN (
                                  'beverages', 'condiments', 'dairy',
                                  'fruits', 'grains', 'nuts_seeds',
                                  'other', 'protein', 'vegetables'
                                )),
  week_status       JSONB       NOT NULL,
  -- {"1":"in","2":"in","3":"in",...,"12":"out"}
  -- Values: "in" | "moderation" | "out" | "never"
  category_override JSONB,
  -- {"9":{"1":"moderation","2":"out","3":"out"},"10":{...}}
  -- NULL for items with no category-specific override in weeks 9–10
  moderation_note   TEXT,
  never_friendly    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_sugar_name     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_food_items_name
  ON public.food_items (name);

CREATE INDEX idx_food_items_category
  ON public.food_items (category);

CREATE INDEX idx_food_items_aliases
  ON public.food_items USING GIN (aliases);

-- Note: no GIN index on week_status. Status is always fetched by primary key
-- for a single row — a GIN index would add seed write overhead with no read benefit.

-- ============================================================
-- SESSION_EVENTS
-- One row per screen visit. Source of truth for WAUR analytics.
-- cycle_week is nullable — NULL if user has no cycle configured yet.
-- ============================================================
CREATE TABLE public.session_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screen_name TEXT        NOT NULL,
  cycle_week  SMALLINT    CHECK (cycle_week >= 1 AND cycle_week <= 12),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_events_user_id
  ON public.session_events (user_id);

CREATE INDEX idx_session_events_created_at
  ON public.session_events (created_at);

CREATE INDEX idx_session_events_user_week
  ON public.session_events (user_id, cycle_week);
```

### 2.2.1 updated_at Auto-Update Trigger

The `updated_at` columns on `profiles` and `cycle_state` require a trigger to auto-update on every row modification. PostgreSQL does not update these columns automatically.

```sql
-- Reusable trigger function — create once
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Apply to cycle_state
CREATE TRIGGER trg_cycle_state_updated_at
  BEFORE UPDATE ON public.cycle_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

Run these statements in the same migration as the schema DDL. Do not rely on the application layer to set `updated_at` — the trigger is the single source of truth.

### 2.3 Row-Level Security (RLS) Policies

```sql
-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users read own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: users insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: users update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: users delete own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================
-- CYCLE_STATE
-- ============================================================
ALTER TABLE public.cycle_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cycle_state: users read own"
  ON public.cycle_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "cycle_state: users insert own"
  ON public.cycle_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cycle_state: users update own"
  ON public.cycle_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cycle_state: users delete own"
  ON public.cycle_state FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- FOOD_ITEMS
-- Public read for all roles including unauthenticated.
-- Required by PRD §6.4: food lookup must work before sign-up.
-- No client writes — food data is seeded server-side only.
-- ============================================================
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_items: public read"
  ON public.food_items FOR SELECT
  USING (true);

-- ============================================================
-- SESSION_EVENTS
-- ============================================================
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_events: users insert own"
  ON public.session_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_events: users read own"
  ON public.session_events FOR SELECT
  USING (auth.uid() = user_id);
```

### 2.4 Database Seed Strategy

The food database is seeded from `foods-seed.json` using a Node.js script executed with the service role key.

**Seed command:**
```bash
pnpm seed:foods
```

This runs `scripts/seed-foods.ts`, which:
1. Reads `foods-seed.json`
2. Extracts the `foods` array (539 items)
3. Upserts all rows into `public.food_items` using `onConflict: 'id'` — equivalent to `ON CONFLICT (id) DO UPDATE SET ...`

**The seed is idempotent.** Re-running it at any time is safe: existing rows are updated if the source data changed (e.g., a corrected `moderation_note`), and new rows are inserted. This makes it safe to run in any environment setup, not just once at project init. Run it whenever `foods-seed.json` is updated.

---

## Section 3 — Authentication Architecture

### 3.1 Auth Modes

**Email + password**
- Initiated on: Create Account screen (onboarding step 2)
- Supabase call: `supabase.auth.signUp({ email, password })`
- Supabase sends a confirmation email. After confirmation, the `/auth/callback` route handler calls `supabase.auth.exchangeCodeForSession(code)`
- On session established: `INSERT INTO profiles (id, display_name) ... ON CONFLICT DO UPDATE` with the returned `user.id`

**Google OAuth**
- Initiated on: "Continue with Google" button on Create Account screen
- Supabase call: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${siteUrl}/auth/callback` } })`
- `/auth/callback/route.ts` exchanges the code: `supabase.auth.exchangeCodeForSession(code)`
- Profile row upserted after session is established

**Anonymous / guest**
- Initiated on: "Continue without account" link on onboarding screen 1 or 2
- Supabase call: `supabase.auth.signInAnonymously()`
- Creates a real row in `auth.users` with `is_anonymous: true` and a real UUID
- Returns a valid session immediately — no email confirmation required
- All subsequent DB writes use this `user.id` exactly as a full account would
- The persistent "save your progress" banner is shown until the user upgrades

### 3.2 Guest → Full Account Migration

This is zero-work migration. Supabase anonymous auth assigns a real UUID on `signInAnonymously()`. That UUID is the `user_id` on every row the user writes. When the user upgrades, the UUID does not change — all rows remain intact and automatically belong to the full account.

**Step-by-step:**

1. User taps "Save my progress" in the persistent banner or Settings → "Upgrade to full account"
2. User chooses email/password or Google

**Email/password upgrade:**
```typescript
const { error } = await supabase.auth.updateUser({
  email: userEmail,
  password: userPassword,
})
// Supabase emails a confirmation link.
// After confirmation, auth.users.is_anonymous is set to false.
// user.id is unchanged.
```

**Google upgrade:**
```typescript
const { error } = await supabase.auth.linkIdentity({
  provider: 'google',
})
// OAuth redirect to /auth/callback.
// After callback, the anonymous account is linked to the Google identity.
// user.id is unchanged.
```

**Atomicity:** No application transaction is needed. Supabase handles the `auth.users` update atomically. Because all `profiles`, `cycle_state`, and `session_events` rows were written with the anonymous `user_id`, they are automatically and immediately associated with the full account the moment the upgrade completes.

**Post-upgrade check:** After `updateUser()` or `linkIdentity()` resolves successfully, call `supabase.auth.getUser()` and confirm `user.is_anonymous === false`. If the call fails, surface the error to the user — never swallow auth failures silently.

### 3.3 Session Management

**Session persistence:** `@supabase/ssr` stores the Supabase session in cookies, not localStorage. Cookies persist across browser sessions and PWA opens, including standalone mode (launched from the home screen). No additional persistence configuration is required.

**Token refresh:** `middleware.ts` calls `supabase.auth.getUser()` on every request. This silently exchanges an expired access token for a fresh one using the refresh token. If both tokens are expired (user inactive for the full refresh token lifetime), `getUser()` returns `{ user: null }`.

**Expired session redirect (silent, no error banner — PRD §5.5):**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isPublic =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/onboarding'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/).*)'],
}
```

---

## Section 4 — Food Lookup & Search Implementation

### 4.1 Offline Search Strategy

**Library:** MiniSearch (`minisearch` v7.x)

**Why it meets the 200ms requirement:**
At 539 items, MiniSearch builds the complete in-memory index in ~30–50ms on a mid-range mobile device. Individual queries return in <5ms — 40× within the 200ms budget. The index lives entirely in memory: no network call, no disk I/O, no Web Worker IPC. The constraint is satisfied with a large safety margin.

**How the food database reaches the offline index:**

```
First open (online)
  app loads → fetch /api/foods → 539 items returned as JSON
  → write to localStorage under key 'lw:foods:v1'
  → call buildIndex(foods) → MiniSearch index ready

Subsequent open (online)
  app loads → fetch /api/foods
  → compare response updated_at against localStorage['lw:foods:updated_at']
  → if unchanged: skip localStorage write, rebuild index from existing cache
  → if changed: update localStorage['lw:foods:v1'] and ['lw:foods:updated_at'], rebuild index

  Note: /api/foods returns an updated_at timestamp (the server's current UTC timestamp
  at response time, set as a response header and in the JSON body). The client stores
  this value in localStorage and uses it for freshness comparison on the next open.
  No ETag/304 infrastructure is needed — the service worker's SWR strategy already
  serves the cached response immediately; the freshness check only governs whether
  the localStorage copy is overwritten.

Open while offline
  fetch /api/foods fails (service worker returns stale or falls through)
  → read localStorage['lw:foods:v1']
  → if populated: call buildIndex(foods) → search works normally
  → if empty: do not call buildIndex → show "Offline, no cached data" state
```

**Index configuration:**

```typescript
// lib/food-search.ts
import MiniSearch from 'minisearch'
import type { FoodItem } from '@/types'

export const foodIndex = new MiniSearch<FoodItem>({
  idField: 'id',
  fields: ['name', 'aliases_flat'],   // aliases_flat = aliases.join(' ')
  storeFields: ['id'],                // store id only; full item fetched from cache map
  searchOptions: {
    boost: { name: 2 },              // name matches outrank alias matches
    prefix: true,                    // 'aub' → 'aubergine'
    fuzzy: 0.15,                     // 'zuchini' → 'zucchini'
  },
  extractField: (document, fieldName) => {
    if (fieldName === 'aliases_flat') {
      return (document.aliases ?? []).join(' ')
    }
    return String((document as Record<string, unknown>)[fieldName] ?? '')
  },
})

// foodMap is built alongside the index and used by search() to retrieve full items
// without storing all fields inside MiniSearch (storeFields: ['id'] only)
export let foodMap = new Map<string, FoodItem>()

export function buildIndex(foods: FoodItem[]): void {
  if (foodIndex.documentCount > 0) foodIndex.removeAll()
  foodIndex.addAll(foods)
  foodMap = new Map(foods.map(f => [f.id, f]))
}
```

**Alias matching examples (from seed data):**
- User types `eggplant` → matches alias on food name `Aubergine`
- User types `corn` → matches alias on food name `Maize`
- User types `zucchini` → matches alias on food name `Courgette`

**Cold offline (index not built):**
`FoodSearch.tsx` checks `foodIndex.documentCount === 0` before rendering the search input. If zero, it renders the "Offline, no cached data" empty state: `"Connect to the internet once to load the food database for offline use."` (PRD §4.4).

### 4.2 Food Status Computation

Food status is always computed server-side (PRD §4.4, §6.3). The client never derives status from the seed data — it calls the API.

**Route:** `GET /api/foods/status?food_id={uuid}&week={1-12}&category={1|2|3}`

**Category 2 default:** If `category` is not supplied or is `null`, default to `2`. This is enforced at the API boundary — the client passes `category ?? 2`.

```typescript
// app/api/foods/status/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type StatusValue = 'in' | 'moderation' | 'out' | 'never'

type FoodRow = {
  week_status: Record<string, StatusValue>
  category_override: Record<string, Record<string, StatusValue>> | null
  moderation_note: string | null
}

function computeStatus(food: FoodRow, week: number, category: number): StatusValue {
  const w = String(week)
  const c = String(category)

  // Weeks 9 and 10: check category_override first
  if ((week === 9 || week === 10) && food.category_override) {
    const override = food.category_override[w]
    if (override && override[c] !== undefined) {
      return override[c]
    }
  }

  // All other weeks, or weeks 9–10 with no override for this item
  return food.week_status[w]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const foodId = searchParams.get('food_id')
  const week   = parseInt(searchParams.get('week') ?? '1', 10)
  const category = parseInt(searchParams.get('category') ?? '2', 10) // default: 2

  if (
    !foodId ||
    isNaN(week) || week < 1 || week > 12 ||
    ![1, 2, 3].includes(category)
  ) {
    return Response.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // read-only route; no session writes needed
      },
    }
  )

  const { data: food, error } = await supabase
    .from('food_items')
    .select('week_status, category_override, moderation_note')
    .eq('id', foodId)
    .single<FoodRow>()

  if (error || !food) {
    return Response.json({ error: 'Food not found' }, { status: 404 })
  }

  const status = computeStatus(food, week, category)

  return Response.json({
    food_id: foodId,
    week,
    category,
    status,
    moderation_note: status === 'moderation' ? food.moderation_note : null,
  })
}
```

### 4.3 Search Ranking

MiniSearch uses BM25F scoring by default. With `boost: { name: 2 }`, matches on the food `name` field score twice as high as matches on `aliases_flat`. Within the same score, earlier positional matches rank higher.

Use a two-pass merge to enforce exact-before-fuzzy ordering:

```typescript
// lib/food-search.ts
export function search(query: string, foodMap: Map<string, FoodItem>): FoodItem[] {
  if (!query.trim()) return []

  // Pass 1: exact prefix, no fuzzy — highest confidence hits
  const exact = foodIndex.search(query, { prefix: true, fuzzy: false })

  // Pass 2: fuzzy — catches typos and close aliases
  const fuzzy = foodIndex.search(query, { prefix: true, fuzzy: 0.15 })

  // Merge: exact results first, then fuzzy results not already present
  const seen = new Set(exact.map(r => r.id))
  const merged = [
    ...exact,
    ...fuzzy.filter(r => !seen.has(r.id)),
  ]

  return merged
    .map(r => foodMap.get(r.id))
    .filter((item): item is FoodItem => item !== undefined)
}
```

---

## Section 5 — PWA Configuration

### 5.1 Service Worker Setup

**Library:** `@serwist/next` v9.x

**next.config.ts — wrap with withSerwist:**

```typescript
// next.config.ts
import withSerwist from '@serwist/next'

const withSerwistConfig = withSerwist({
  swSrc: 'sw.ts',           // service worker source at project root
  swDest: 'public/sw.js',   // compiled output served at /sw.js
  reloadOnOnline: true,     // reload page when connectivity is restored
})

export default withSerwistConfig({
  // other Next.js config here
})
```

**sw.ts — service worker entry point:**

```typescript
// sw.ts (project root)
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
} from 'serwist'
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[]
  }
}

declare const self: ServiceWorkerGlobalScope

const runtimeCaching: RuntimeCaching[] = [
  // /api/foods — Stale-While-Revalidate, 24h max-age
  // Serves cached food list immediately; refreshes in background when online.
  {
    matcher: ({ url }) => url.pathname === '/api/foods',
    handler: new StaleWhileRevalidate({
      cacheName: 'api-foods',
      plugins: [
        new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 }), // 24 hours
      ],
    }),
  },
  // /api/foods/status — Network-first, 1h cache fallback
  // Always attempts the network for authoritative status; falls back to cache offline.
  {
    matcher: ({ url }) => url.pathname === '/api/foods/status',
    handler: new NetworkFirst({
      cacheName: 'api-foods-status',
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({ maxAgeSeconds: 60 * 60 }), // 1 hour
      ],
    }),
  },
  // Static assets — Cache-first, immutable
  {
    matcher: ({ request }) =>
      request.destination === 'image' ||
      request.destination === 'font',
    handler: new CacheFirst({
      cacheName: 'static-assets',
      plugins: [
        new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365 }),
      ],
    }),
  },
  // All other routes — fall through to defaultCache
  ...defaultCache,
]

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
})

serwist.addEventListeners()
```

**app/layout.tsx — register the service worker:**

```typescript
// In the root layout, register sw.js client-side
// @serwist/next provides a hook for this:
import { Metadata } from 'next'
// Add to <head>:
// <link rel="manifest" href="/manifest.json" />
// Service worker registration is handled automatically by @serwist/next
// via the script injected during the build.
```

### 5.2 Web App Manifest

Colors sourced from PRD §5.2 color system.

```json
{
  "name": "Live WildFit",
  "short_name": "LiveWildFit",
  "description": "Your WILDFIT® cycle companion — instant food lookup for every week.",
  "theme_color": "#2D6A4F",
  "background_color": "#FAF7F0",
  "display": "standalone",
  "orientation": "portrait-primary",
  "start_url": "/",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

### 5.3 Caching Strategy

| Resource | Strategy | Rationale |
|---|---|---|
| App shell (HTML, JS, CSS) | Precache via `__SW_MANIFEST` | Versioned at build time. Served instantly from cache; new version activates on next open after deployment. |
| `/api/foods` response | Stale-While-Revalidate, 24h max-age | Serve cached food list immediately for fast offline load; revalidate in background when online. Food data changes rarely — stale data for one session is acceptable. |
| `/api/foods/status` responses | Network-first, 3s timeout, 1h cache fallback | Status computation is the authoritative server answer. Try network first; fall back to cached response if offline. Cache per `food_id+week+category` key. |
| User data (`/api/cycle`, Supabase auth) | Network-only, no service worker cache | Never cache user-specific data. Stale cycle state showing the wrong week status is a worse user experience than a loading spinner. |
| Static assets (icons, manifest) | Cache-first, immutable | These change only on deployment. Cache forever; evicted only when the service worker updates. |

### 5.4 Install Prompt

**Definition of sufficient engagement:** The user has navigated to at least **3 distinct screens** across any number of sessions.

```typescript
// types/index.ts — add this declaration; BeforeInstallPromptEvent is non-standard
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
```

```typescript
// lib/install-prompt.ts
const PROMPT_KEY       = 'lw:install:nav_count'
const PROMPT_SHOWN_KEY = 'lw:install:shown'
const THRESHOLD        = 3

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    maybeShowPrompt()
  })
}

export function recordNavigation(): void {
  if (localStorage.getItem(PROMPT_SHOWN_KEY)) return
  const count = parseInt(localStorage.getItem(PROMPT_KEY) ?? '0', 10) + 1
  localStorage.setItem(PROMPT_KEY, String(count))
  if (count >= THRESHOLD) maybeShowPrompt()
}

function maybeShowPrompt(): void {
  if (!deferredPrompt) return
  if (localStorage.getItem(PROMPT_SHOWN_KEY)) return
  const count = parseInt(localStorage.getItem(PROMPT_KEY) ?? '0', 10)
  if (count < THRESHOLD) return
  window.dispatchEvent(new CustomEvent('lw:show-install-prompt'))
}

export async function triggerInstall(): Promise<void> {
  if (!deferredPrompt) return
  await deferredPrompt.prompt()
  localStorage.setItem(PROMPT_SHOWN_KEY, '1')
  deferredPrompt = null
}
```

Call `recordNavigation()` in each page component's `useEffect`. Listen for `lw:show-install-prompt` in a global component to display the install banner.

---

## Section 6 — API Routes

| Route | Method | Auth Required | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/auth/callback` | GET | No | OAuth and email confirmation redirect handler. Exchanges `code` param for a session. | `?code=string` (query param) | Redirect to `/` on success, `/auth/login?error=...` on failure |
| `/api/foods` | GET | No (anon OK) | Returns full food item list for offline cache. Filters `is_sugar_name = true` entries from results. | — | `{ foods: FoodItem[], total: number, updated_at: string }` |
| `/api/foods/status` | GET | No (anon OK) | Computes authoritative server-side status for one food item. `category` defaults to `2` if omitted. | `?food_id=uuid&week=1-12&category=1-3` | `{ food_id, week, category, status, moderation_note }` |
| `/api/cycle` | GET | Yes | Returns the authenticated user's cycle state plus derived fields. Returns `{ configured: false }` with HTTP 200 if no `cycle_state` row exists yet (new user who has not completed onboarding). Client must handle this case by prompting the user to set up their cycle. | — | `{ configured: true, start_date, current_week, category, computed_week, cycle_day, days_remaining }` or `{ configured: false }` |
| `/api/cycle` | PUT | Yes | Upserts cycle state. Passing `current_week` triggers season jump: `start_date` is recalculated using `seasonJumpStartDate(targetWeek, userTimezone)`. | `{ start_date?: string, current_week?: number, category?: number \| null }` | `{ data: CycleState }` |
| `/api/cycle` | DELETE | Yes | Resets cycle: sets `start_date = today` and `current_week = 1` and `category = null`. Does NOT delete the `cycle_state` row or any `session_events`. Requires confirmation dialog in UI before calling. | — | `{ reset: true }` |
| `/api/events` | POST | Yes | Logs one session event for WAUR analytics. Never blocks UI — fire and forget. | `{ screen_name: string, cycle_week: number \| null }` | `{ logged: true }` |
| `/api/keep-alive` | GET | No (CRON_SECRET header) | Executes a trivial Supabase query to prevent free-tier auto-pause. Called by Vercel Cron daily. | `Authorization: Bearer ${CRON_SECRET}` header | `{ ok: true, timestamp: string }` |

**Notes:**
- Sign-up, sign-in, sign-out, and token refresh are handled by the Supabase client SDK and `@supabase/ssr`. No separate `/api/auth/*` Route Handlers are needed beyond `/auth/callback`.
- `/api/foods` and `/api/foods/status` are public per PRD §6.4. The service worker caches the `/api/foods` response for offline delivery.
- **`middleware.ts` does NOT protect API routes** — all `/api/*` paths are marked public in the middleware matcher to avoid blocking the service worker or unauthenticated food lookups. Auth-required route handlers (`/api/cycle`, `/api/events`) must check the session themselves:

```typescript
// Pattern for auth-required route handlers
const cookieStore = await cookies()
const supabase = createServerClient(/* ... */)
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**`PUT /api/cycle` season jump recalculation:**

Always use the user's stored `timezone` (from `profiles`) — never server local time. The user's "today" depends on their local timezone.

```typescript
// lib/cycle.ts
function seasonJumpStartDate(targetWeek: number, userTimezone: string): string {
  // Get today's date in the user's timezone as a YYYY-MM-DD string
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()) // en-CA gives YYYY-MM-DD format

  const today = new Date(todayStr + 'T00:00:00Z') // treat as UTC midnight for arithmetic
  const dayOfWeek = today.getUTCDay() // 0 = Sunday
  const daysSinceMonday = (dayOfWeek + 6) % 7

  // Most recent Monday in user's timezone
  const thisMonday = new Date(today)
  thisMonday.setUTCDate(today.getUTCDate() - daysSinceMonday)

  // start_date = thisMonday - ((targetWeek - 1) * 7) days
  const start = new Date(thisMonday)
  start.setUTCDate(thisMonday.getUTCDate() - (targetWeek - 1) * 7)

  // Return as ISO date string YYYY-MM-DD
  return start.toISOString().split('T')[0]
}
```

Fetch the user's `timezone` from `profiles` before calling this function. If `timezone` is `'UTC'` (the default), the result is always correct. If unset, fall back to `'UTC'` — never use `new Date()` server local time.

---

## Section 7 — Analytics Implementation

### 7.1 Session Event Logging

Log one event per screen visit. Call from a `useEffect` on each page component. Analytics failure must never surface to the user or block navigation.

```typescript
// lib/analytics.ts
export async function logSessionEvent(
  screenName: string,
  cycleWeek: number | null
): Promise<void> {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screen_name: screenName, cycle_week: cycleWeek }),
    })
  } catch {
    // Intentionally silent — analytics must not affect the user experience
    console.warn('[analytics] logSessionEvent failed', { screenName, cycleWeek })
  }
}
```

**Call site — every page component:**
```typescript
// Example: app/page.tsx (Home)
'use client'
useEffect(() => {
  logSessionEvent('home', currentWeek ?? null)
}, [])
```

**Screen name values:** `home`, `foods`, `weeks`, `settings`, `onboarding`, `login`

### 7.2 WAUR Computation Query

WAUR = percentage of (user, cycle_week) pairs where the user opened the app 3 or more times in that program week.

```sql
-- Compute current WAUR across all users and all program weeks.
-- "Week" is the user's cycle_week (1–12), not a calendar week.
-- Run this query directly in the Supabase SQL Editor.

WITH opens_per_user_week AS (
  SELECT
    user_id,
    cycle_week,
    COUNT(*) AS open_count
  FROM public.session_events
  WHERE cycle_week IS NOT NULL
  GROUP BY user_id, cycle_week
),
threshold_met AS (
  SELECT
    user_id,
    cycle_week,
    CASE WHEN open_count >= 3 THEN 1 ELSE 0 END AS met
  FROM opens_per_user_week
)
SELECT
  ROUND(
    100.0 * SUM(met)::NUMERIC / NULLIF(COUNT(*), 0),
    2
  )                        AS waur_percent,
  SUM(met)                 AS user_weeks_above_threshold,
  COUNT(*)                 AS total_user_weeks_observed,
  COUNT(DISTINCT user_id)  AS distinct_users
FROM threshold_met;
```

**MVP success threshold check (PRD §1.3):** 60% of active users must maintain WAUR of 3+ opens/week for at least 10 of their 12 cycle weeks. Query this by filtering to users with data across ≥10 distinct `cycle_week` values, then compute the per-user threshold-met rate.

---

## Section 8 — Environment Variables

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project API URL | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key. Safe to expose to the client — RLS controls access. | Supabase dashboard → Project Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — bypasses RLS. Used only in `scripts/seed-foods.ts` and server-only Route Handlers. Never pass to the client. | Supabase dashboard → Project Settings → API → `service_role` key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Full public URL of the deployed app. Used in OAuth `redirectTo` values. | Your Vercel deployment URL (e.g. `https://live-wildfit.vercel.app`) |
| `CRON_SECRET` | Yes | Bearer token that authenticates Vercel Cron requests to `/api/keep-alive`. Prevents public abuse of the endpoint. | Generate a random 32+ character string |

**.env.local.example:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App URL — change to your Vercel URL after deployment
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Vercel Cron authentication for /api/keep-alive
CRON_SECRET=replace-with-a-random-32-character-string
```

**Google OAuth** is configured inside the Supabase dashboard (Authentication → Providers → Google). The Google client ID and secret are entered there — they do not appear in `.env.local`.

---

## Section 9 — Bootstrap Commands

```bash
# Create the Next.js project (App Router, TypeScript, Tailwind, no /src dir)
pnpm create next-app@latest live-wildfit --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Enter the project directory
cd live-wildfit

# Install runtime dependencies
pnpm add @supabase/supabase-js @supabase/ssr minisearch @serwist/next serwist

# Install development dependencies
pnpm add -D tsx @types/node

# foods-seed.json is already present in the project root — no action needed

# Create your local environment file from the template
cp .env.local.example .env.local
# Open .env.local and fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL, and CRON_SECRET before continuing

# Install the Supabase CLI as a dev dependency
pnpm add -D supabase

# Log in to Supabase and link to your cloud project
# (Create a free project at supabase.com first if you haven't)
pnpm supabase login
pnpm supabase link --project-ref your-project-ref-from-dashboard

# Run the database schema migration
# Paste the SQL from TDD.md Section 2.2 into Supabase Dashboard → SQL Editor → Run
# Or, if using Supabase CLI migrations:
pnpm supabase db push

# Run the RLS policy migration
# Paste the SQL from TDD.md Section 2.3 into Supabase Dashboard → SQL Editor → Run
# (Or include it in the same migration file as the schema above)

# Seed the food database (requires SUPABASE_SERVICE_ROLE_KEY to be set in .env.local)
pnpm seed:foods

# Configure Google OAuth in Supabase dashboard:
# Authentication → Providers → Google → enter Client ID and Secret
# Add http://localhost:3000/auth/callback to Google Cloud Console Authorized Redirect URIs
# Add http://localhost:3000/auth/callback to Supabase Auth → URL Configuration → Redirect URLs

# Start the development server
pnpm dev

# Verify the app is running
# Open http://localhost:3000 — onboarding screen should appear
# Open http://localhost:3000/api/foods — should return JSON with 467 food items
```

Add this to `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "seed:foods": "tsx scripts/seed-foods.ts"
  }
}
```

---

## Section 10 — Deployment

### 10.1 Hosting (Vercel Free Tier)

**Deploy steps:**
1. Push the repository to GitHub
2. Connect the repo to Vercel at vercel.com (Import Project)
3. Add all environment variables from `.env.local` to Vercel → Project Settings → Environment Variables
4. Set `NEXT_PUBLIC_SITE_URL` to the Vercel deployment URL (e.g. `https://live-wildfit.vercel.app`)
5. Add the Vercel deployment URL to Supabase → Authentication → URL Configuration → Redirect URLs
6. All subsequent pushes to `main` deploy automatically

**vercel.json** (required for daily Cron job):
```json
{
  "crons": [
    {
      "path": "/api/keep-alive",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This schedules `/api/keep-alive` at 08:00 UTC daily. Vercel Hobby (free) tier supports one cron job at daily frequency — exactly what is needed.

### 10.2 Database (Supabase Free Tier)

**Free tier limits relevant to MVP:**

| Limit | Value |
|---|---|
| Database storage | 500MB |
| Monthly active users | 50,000 |
| Auto-pause after inactivity | 7 days |
| Automated backups | 7 days retention |

**Keep-alive mechanism:** The Vercel Cron job calls `GET /api/keep-alive` every 24 hours. This runs a trivial `SELECT id FROM food_items LIMIT 1` query, which counts as database activity and resets the 7-day inactivity clock. The daily interval provides a 7× safety margin over the auto-pause threshold.

```typescript
// app/api/keep-alive/route.ts
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { error } = await supabase
    .from('food_items')
    .select('id')
    .limit(1)

  if (error) {
    console.error('[keep-alive] Supabase ping failed:', error.message)
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, timestamp: new Date().toISOString() })
}
```

### 10.3 CI/CD

**Decision: No GitHub Actions workflow for MVP.**

Vercel's native GitHub integration handles build and deployment automatically on every push to `main`. A GitHub Actions workflow would duplicate this process and add maintenance overhead with no MVP benefit.

**Manual deploy process:**
1. Push changes to `main` on GitHub
2. Vercel detects the push and starts a build automatically
3. On build success, Vercel promotes the deployment to production
4. Monitor build status in the Vercel dashboard
5. If a deployment introduces a regression: use Vercel's one-click instant rollback from the Deployments tab

---

## Section 11 — Build Sequence

Build in this order. Each phase depends on the one before it.

| Phase | What to build | Why this order |
|---|---|---|
| 1 | Project scaffold — Next.js, Tailwind, TypeScript, pnpm, folder structure | Everything else depends on this |
| 2 | Supabase setup — schema migration (§2.2 + §2.2.1), RLS policies (§2.3), seed food database | Auth and all features depend on the database existing |
| 3 | Auth — anonymous sign-in, email/password sign-up, Google OAuth, `/auth/callback` route, middleware | Every authenticated route depends on this |
| 4 | Food lookup — `/api/foods` route, MiniSearch index, localStorage cache, `FoodSearch.tsx`, `FoodList.tsx`, `StatusBadge.tsx` | Core value proposition; validates that the food database and status computation work end-to-end |
| 5 | Food status computation — `/api/foods/status` route | Depends on food database; needed before any status badge renders correctly |
| 6 | Cycle state — `/api/cycle` GET/PUT/DELETE, `lib/cycle.ts` (week computation, season jump) | Home dashboard depends on this |
| 7 | Home dashboard — `SeasonBadge`, `ProgressBar`, `DayCounter`, `WeekCard`, all edge cases (future start, cycle complete, no start date) | Depends on cycle state API |
| 8 | Weekly guide — `/weeks/[week]/page.tsx`, all 12 weeks wired to PRD Appendix content | Standalone page; no other feature dependencies |
| 9 | Onboarding flow — 3 screens, guest path, account creation, cycle setup, category selection for weeks 9–10 | Depends on auth (phase 3) and cycle state (phase 6) |
| 10 | Settings screen — all settings from PRD §4.6, season jump confirmation dialog, account upgrade, cycle reset, delete account | Depends on auth, cycle state, and onboarding |
| 11 | Session event logging — `/api/events`, `lib/analytics.ts`, `logSessionEvent()` call on every page | Depends on auth; low risk, add last to avoid noise during development |
| 12 | PWA — `sw.ts` with custom runtime caching, `manifest.json`, `next.config.ts` with `withSerwist`, install prompt logic, offline empty states | Add last — requires a working app to test meaningfully |
| 13 | Supabase keep-alive — `/api/keep-alive` route, `vercel.json` cron, test the cron fires | Deploy-time concern; add before first production deploy |

---

## Section 12 — Known Risks & Open Questions

| Risk / Question | Impact | Recommendation |
|---|---|---|
| **Supabase free-tier auto-pause if Vercel Cron stops running** — If the Vercel project is suspended or the cron job is disabled, the database will pause after 7 days, causing full app outage. | High | Add a secondary keep-alive via UptimeRobot (free tier) as a redundant daily ping to `/api/keep-alive`. Monitor Vercel Cron execution logs. Supabase also emails the project owner before pausing. |
| **iOS PWA push notification limitations (v2)** — The v2 Friday Notifications feature (F-09) requires Web Push. iOS Safari only supports Web Push for PWAs installed to the home screen. Browser-tab sessions on iOS cannot receive push notifications. | Medium (v2 only) | Document this limitation clearly in the Settings notification toggle copy. The PRD already notes "in-app banner fallback for iOS non-installed PWA users" (PRD §8.3). Design the v2 notification flow with this in mind from day one. |
| **Anonymous session expiry before account upgrade** — Supabase anonymous sessions use the same token lifetime as regular sessions (access token: 1h, refresh token: configurable). If a user starts onboarding, leaves for an extended period, and returns, their refresh token may have expired. On re-open, `getUser()` returns null, `middleware.ts` redirects to `/auth/onboarding`, and `signInAnonymously()` creates a new UUID — orphaning the previous user's data. | Medium | In `middleware.ts`, detect the case where the user was previously anonymous (check a localStorage marker) before redirecting. Offer to recover: "We couldn't restore your session. Start fresh?" rather than silently losing data. |
| **foods-seed.json data correctness** — `food_items` is seeded once and treated as the single source of truth. A status error in the seed (e.g., wrong week_status value for a common food) affects every user until a corrected re-seed is deployed. | High | Write a validation script (`scripts/validate-seed.ts`) that checks every entry for required fields, valid status values, and valid week keys before seeding. Run it as a pre-seed step: `pnpm validate:foods && pnpm seed:foods`. |
| **MiniSearch rebuild cost on low-end Android** — Building the 539-item index takes ~30–50ms on a mid-range device, but could exceed 100ms on low-end Android (sub-$100 phones common in some markets). | Low | During beta, measure index build time on a low-end device. If >100ms, use `MiniSearch.loadJSON()` to deserialize a pre-serialized index from localStorage, skipping the rebuild. MiniSearch supports index serialization natively. |
| **Category default silently affecting food status** — Users in Weeks 9–10 who never select a category are silently shown Category 2 results. If they are genuinely Category 1, they see more restrictive guidance than warranted. | Low | The daily dismissible category prompt (PRD §3.2) is the primary mitigation. Make the prompt copy explicit: "Your food list for this week depends on your category. Tap to set it — takes 10 seconds." |
| **Season jump start date alignment** — The `seasonJumpStartDate()` function (Section 6) uses the user's stored `timezone` from `profiles`. If the user's stored timezone is stale or incorrect (e.g., they travelled), the computed week boundary may be off by one day. | Low | The Settings screen exposes timezone as an editable field (PRD §4.6). Auto-detect on first load. Prompt the user to confirm if device timezone differs from stored timezone. |
