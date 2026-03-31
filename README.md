# Live WildFit

**A 12-week food reference companion for repeat WILDFIT® cyclers.**

> Live WildFit is an independent personal project inspired by nutritional seasonality principles. It is not affiliated with, endorsed by, or sponsored by WILDFIT® or Eric Edmeades. WILDFIT® is a registered trademark of Eric Edmeades. For the official WILDFIT® program, visit [www.getwildfit.com](https://www.getwildfit.com).

**[Live Demo →](https://fitness-ai-beta-five.vercel.app)**

---

## The Problem

People who repeat the WILDFIT® 90-day program face two compounding friction points:

- **Memory friction** — 12 weeks × hundreds of foods × a category split at Week 9 is impossible to hold in working memory while cooking, shopping, or eating out.
- **Planning friction** — Without an instant reference, people guess. Guessing leads to rule-breaking, guilt, and abandoning the cycle.

## The Solution

Live WildFit answers one question extraordinarily well: *"Can I eat this right now?"* — instantly, clearly, with zero cognitive load. It is a precision food reference tool and cycle progress companion, not a calorie counter, meal logger, or general wellness platform.

---

## Screenshots

*Coming soon*

---

## Features (MVP)

- **Food Lookup** — Browse or search 539 foods. Every item shows its status for the current week: In Season, Moderation, Out of Season, or Not Recommended. Alias matching included (e.g., "corn" finds "maize").
- **Offline Search** — Food lookup works without an internet connection after the first load. Search returns results in under 200ms.
- **12-Week Cycle Tracker** — Visual progress bar with season-color-coded segments (Fall / Winter / Spring). Day and week counters. Season jump at any time.
- **Weekly Guide** — Per-week content cards for all 12 weeks: current season, phase name, focus items, and what changed from the prior week.
- **Category System** — Weeks 9–10 split users into three categories based on goal progress, each with a different food status. The app prompts for selection and defaults to Category 2 until confirmed.
- **Auth** — Email/password, Google sign-in, and anonymous guest sessions. Guests can upgrade to a full account without losing any data.
- **PWA** — Installable to the home screen. Launches full-screen. Install prompt shown after sufficient engagement.
- **Dark Mode** — Full dark mode support, respects system preference by default.

### Roadmap

| Version | Feature |
|---|---|
| v1.5 | Camera / Food Scan — point camera at a food item to get its seasonal status |
| v2.0 | Friday Notifications — weekly push notification on week completion |
| v2.0 | AI Meal Planner — generate a week's meal plan + shopping list, or suggest meals from pantry ingredients |
| v2.0 | Measurements Tracker — body measurements at program milestones |
| v2.0 | AI Wellness Coach — conversational Q&A grounded in the food database |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Database | Supabase (PostgreSQL + Auth) |
| PWA / Service Worker | Serwist |
| Offline Search | MiniSearch |
| Hosting | Vercel (free tier) |

---

## Architecture

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
└──────────────────────────┬───────────────────────────────────────┘
                           │ @supabase/ssr
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Supabase  (free tier)                           │
│                                                                  │
│  PostgreSQL                   Auth                               │
│  ├── profiles                 ├── email + password               │
│  ├── cycle_state              ├── Google OAuth                   │
│  └── session_events           └── anonymous / guest              │
└──────────────────────────────────────────────────────────────────┘
```

Food status is always computed server-side. The client never determines whether a food is in season — the API does.

Anonymous sessions use a real Supabase UUID from first interaction. When the user upgrades to a full account, the `user_id` is preserved — no data migration needed.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 9+
- A [Supabase](https://supabase.com) project (free tier)

### 1. Clone and install

```bash
git clone https://github.com/your-username/live-wildfit.git
cd live-wildfit
pnpm install
```

### 2. Set up environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Apply database migrations

Run the migrations in order from `supabase/migrations/`:

```
001_initial_schema.sql
002_drop_food_items.sql
```

You can apply them via the Supabase dashboard SQL editor or the Supabase CLI.

### 4. Seed the food database

```bash
pnpm seed:foods
```

This reads `foods-seed.json` (539 food items) and upserts the data into your Supabase database.

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deployment

The app is designed to deploy to [Vercel](https://vercel.com) with zero configuration. Connect your GitHub repository, add the three environment variables above, and deploy.

`vercel.json` includes a daily cron job (`/api/keep-alive`) to prevent Supabase from auto-pausing on the free tier.

---

## Concepts Learned

*This section will document key concepts, patterns, and non-obvious decisions encountered during the build — things worth remembering for future projects.*

*Coming soon.*

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE)
