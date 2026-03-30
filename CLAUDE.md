# Live WildFit — CLAUDE.md

## Documents — read these before anything else

- **PRD.md** — full product requirements, feature specs, UX rules, design system, legal constraints. Read before implementing any feature.
- **TDD.md** — tech stack, file structure, database schema, SQL migrations, build sequence detail. Read before writing any code. **If TDD.md does not exist, generate it first and stop for review.**
- **foods-seed.json** — canonical food database, 539 entries, at the project root. Single source of truth for all food data. Never modify food status logic without cross-referencing this file.

## Hard constraints — never violate these

- **Free tier only.** All services (Vercel/Netlify, Supabase, any API) must stay on their free plans. Never introduce a paid feature, tier, or service.
- **Food status is always computed server-side.** Never compute In Season / Moderation / Out of Season / Not Recommended on the client.
- **foods-seed.json is the source of truth.** Never hardcode food status in application code. All status data flows from this seed file into the database.
- **No WILDFIT® intellectual property.** No verbatim text, food lists, or materials from WILDFIT® source documents in code, comments, or data files. See PRD.md §7.
- **TDD.md must be reviewed before any application code is written.** Generate it first, then stop and wait.

## Codebase conventions

- **Mobile-first.** Bottom tab bar on mobile; top nav on desktop.
- **Offline-first for food lookup.** Cache the food database on first load; search must work without a network connection.
- All colours via CSS custom properties. No hardcoded hex values in components.
- **Skeleton screens, not spinners.** Every data-fetching screen needs a skeleton matching the content layout.
- **No raw errors shown to users.** Catch all errors; show plain-English messages. Log technical details to console only.
- **Confirm before destructive actions.** Season jump, cycle reset, and account deletion each require a confirmation dialog.
