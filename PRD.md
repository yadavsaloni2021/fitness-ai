🌿

**Live WildFit**

*Product Requirements Document*

Version 1.4  —  MVP  |  PM Document

*Companion document: Live WildFit Technical Design Document v1.0*

**App Name**

Live WildFit

**Version**

1.4 (MVP)

**Document Owner**

Product Manager — this document contains no implementation code

**Companion Document**

Live WildFit Technical Design Document v1.0 — read alongside this PRD for full implementation context

**Platform**

Progressive Web App (PWA) — iOS 16.4+, Android, Desktop

**Last Updated**

March 2026

**Status**

Final — Ready for Technical Design handoff

**Copyright Notice**

Inspired by WILDFIT® by Eric Edmeades. Original content. Not affiliated with or endorsed by WILDFIT®.

# **Revision Log**

**Version**

**Date**

**Changes**

1.0

Mar 2026

Initial PRD draft.

1.1

Mar 2026

13 PM peer-review issues resolved. Meal planner added. Problem statement and metrics updated.

1.2

Mar 2026

20 engineering gaps resolved. Engineering implementation details added (later refactored out in v1.3).

1.3

Mar 2026

Document ownership refactored. All implementation details (SQL schema, package choices, code blocks, Claude Code instructions, seed scripts, bootstrap commands) moved to companion Technical Design Document v1.0. PRD now contains only product requirements, user experience specifications, and high-level technical constraints. The PRD is a PM document; the TDD is an engineering document.

1.4

Mar 2026

Food suggestion feature moved to v2. No-results empty state updated: guidance is now to avoid any food not in the database for the season. 'Suggest this food' link removed from MVP. Food Suggestions added to v2 roadmap table. MVP scope bullet updated to remove suggest-a-food.

# **1. Executive Summary**

## **1.1 The Problem**

People who have completed the WILDFIT® 90-day program and want to run a repeat cycle face two compounding friction problems:

- Memory friction: They cannot reliably remember which specific foods are in season, in moderation, or to be avoided for their current week. 12 weeks × hundreds of foods × a category split at Week 9 is impossible to hold in working memory while cooking, grocery shopping, or eating at a restaurant.
- Planning friction: Translating rules into practical decisions at the moment of action — standing at a grocery shelf, reading a menu — is hard without an instant reference. Without a tool answering 'is this item OK this week?', people guess. Guessing leads to rule-breaking, guilt, and abandoning the cycle.

## **1.2 The Solution**

Live WildFit is a Progressive Web App serving as the definitive food reference and cycle companion for repeat WILDFIT® cyclists. It solves one thing extraordinarily well: telling a user, at any given week, what they can eat — instantly, clearly, with zero cognitive load.

## **1.3 Metrics**

**Metric**

**Definition & Rationale**

**North Star Metric**

Weekly Active Usage Rate (WAUR) — % of users who open the app 3+ times in a given week, across all 12 weeks of their cycle. High-frequency usage is the best available proxy for dietary adherence given that food logging is out of scope.

**MVP Success Threshold**

60% of active users maintain WAUR of 3+ opens/week for at least 10 of their 12 cycle weeks.

**Measurement Method**

Session events logged per user per screen visit, with the current cycle week recorded alongside. WAUR is computed from this event stream. See TDD for schema details.

**Secondary Metric (v2)**

Season Completion Rate — % of users progressing through all 12 weeks without abandoning. Requires 3+ months of data to be meaningful.

# **2. Product Vision & Strategy**

## **2.1 Vision Statement**

***"The most effortless way for a repeat WILDFIT® cycler to stay in season — every week, every meal, every grocery run."***

## **2.2 Strategic Positioning**

Live WildFit is NOT a calorie counter, meal logger, recipe app, or general wellness platform. It is a precision food reference tool and cycle progress companion. Every design decision is filtered through a single question: does this reduce cognitive load for the user at the moment of a food decision?

## **2.3 Primary Persona**

**Attribute**

**Detail**

**Name**

Returning Cycler — "Alex"

**Background**

Has completed WILDFIT® once or more. Fully understands the seasons, philosophy, and why the program works. Does not need to be taught the concepts.

**Core Pain**

Cannot hold 12 weeks × hundreds of foods × category variations in working memory. Needs an instant, reliable reference at the point of decision — grocery store, restaurant, meal prep, or fridge.

**Behavior**

Opens app multiple times per day for food checks. Checks weekly progress Monday mornings. Uses food lookup at grocery stores and restaurants. Expects the app to be faster than Googling.

**Device**

Primarily mobile (app installed on home screen). Occasional desktop use for weekly planning.

**NOT in scope**

New WILDFIT® students, general public, anyone who has not completed the program.

# **3. Program Structure & Knowledge Base**

*All content in this section is original material authored for this app. No WILDFIT® text is reproduced. Attribution: inspired by the WILDFIT® program by Eric Edmeades — www.getwildfit.com*

## **3.1 The 12-Week Season Map**

**Week**

**Season**

**Phase**

**Key Nutritional Focus**

1

Fall

Observation

Eat normally. Begin water, breathing, Food Dialogue.

2

Fall

Sugar Vacation

Remove refined sugar. Add fruit (morning). Start Alkagizer Mild.

3

Fall

Sugar Awareness

Deepen sugar vacation. Learn 65+ hidden names of sugar.

4

Fall→Winter

Grain & Dairy Exit

Remove all grains and dairy.

5–6

Winter

Full Detox

Remove food additives, alcohol, caffeine, nicotine.

7–8

Spring Entry

Deep Spring

Spring food list only. Lean protein. Nuts moderation. 12 glasses water.

9

Spring

Category Split

Cat 1: less-sweet fruit reintroduced. Cat 2 & 3: deep Spring continues.

10

Spring

Spring Continuation

Cat 1: add berries/low-glycemic fruit. Cat 2 & 3: final deep Spring week.

11

Spring Exit

Coming Out

All categories: root veg + low-glycemic fruit reintroduced gradually.

12

Transition

Reset Prep

Sweet foods removed. Signal body back to Spring state.

## **3.2 The Category System (Weeks 9–10)**

- Category 1: User has reached their primary health or weight goal. Ready to gradually reintroduce less-sweet fruit.
- Category 2 (default): Progress made but goal not fully reached. Deep Spring continues. This is the default when a user has not yet selected a category.
- Category 3: Early stages of progress. Most restrictive Spring guidelines (same food list as Category 2 for MVP purposes).

*Product behavior: starting Week 9, the app shows a dismissible daily prompt asking the user to self-select their category. It does not block access. It defaults to Category 2 behavior until the user makes a selection. The prompt reappears once per day until confirmed.*

## **3.3 Food Status Taxonomy**

Every food in the app has one of four statuses for each week. These statuses are the language used throughout the entire product — in badges, filters, notifications, and the meal planner.

**Status**

**Display**

**User-facing meaning**

**In Season**

Green — IN SEASON

Eat freely within reasonable portions.

**Moderation**

Amber — MODERATION

Acceptable in small quantities. A brief contextual note is shown to the user.

**Out of Season**

Red — OUT OF SEASON

Take a break from this food during the current week.

**Not Recommended**

Gray — NOT RECOMMENDED

Not recommended at any point in any cycle (e.g., peanuts, cashews). Clearly distinguished from 'out of season' — this is permanent, not cyclical.

# **4. Features & Requirements**

## **4.1 Feature Inventory**

**ID**

**Feature**

**Description**

**Pri**

**Status**

**F-01**

**Onboarding & Profile**

Account creation with multiple auth options (including guest/anonymous). Start date, season jump, category selection. Completable under 90 seconds.

**P0**

**In Scope**

**F-02**

**Cycle Progress Tracker**

Visual progress indicator showing the user's position in the 12-week cycle. Season-color-coded segments. Day and week counters.

**P0**

**In Scope**

**F-03**

**Weekly Program Guide**

Per-week content card showing the current season, phase name, what changed this week, and 3–4 focus items. All 12 weeks covered.

**P0**

**In Scope**

**F-04**

**Food Lookup — Browse**

Browse the full food database filtered by current week and category. Status badges on every item. Filter by In Season / Moderation / Out.

**P0**

**In Scope**

**F-05**

**Food Lookup — Search**

Instant search by food name, including alias matching (e.g., 'corn' finds 'maize'). Results must return within 200ms and must work without internet connectivity.

**P0**

**In Scope**

**F-06**

**Season Jump**

User can change their current week at any time from Settings. Progress tracker recalibrates accordingly.

**P1**

**In Scope**

**F-07**

**Settings Screen**

Edit profile, cycle state, category, appearance, timezone. Account management including upgrade and deletion.

**P1**

**In Scope**

**F-08**

**Camera / Food Scan**

Point device camera at a food item to identify it and get its seasonal status. Uses AI image recognition.

**P1**

**v1.5**

**F-09**

**Friday Notifications**

Weekly push notification every Friday: week completed, current season, what changes Monday.

**P2**

**v2**

**F-10**

**Measurements Tracker**

Body measurement logging at program milestones with progress visualization.

**P2**

**v2**

**F-11**

**AI Meal Planner**

Two modes: (1) generate a full week's meals with a shopping list, (2) suggest meals from the user's existing pantry ingredients. All suggestions validated against current week's in-season food list.

**P2**

**v2**

**F-12**

**AI Wellness Coach**

Conversational question-and-answer about foods and the program. Answers grounded in the app's food database, not general AI knowledge.

**P2**

**v2**

## **4.2 F-01: Onboarding & Profile Setup**

### **User Story**

As a returning cycler, I want to set up my cycle in under 2 minutes without creating an account if I choose, so I can immediately start using the food lookup tool.

### **Acceptance Criteria**

1. User can create a full account (email, password, or Google sign-in).
2. User can skip account creation and use the app immediately. Their cycle data is saved and accessible on the same device. If they later create an account, all their data is carried over — nothing is lost.
3. Onboarding collects: display name, program start date (defaults to today), starting week (default Week 1, user can choose any week 1–12).
4. If the user selects Week 9 or 10 as their starting week, they are prompted to select their category (1, 2, or 3) with a plain-English explanation of what each means.
5. Friday notification opt-in is presented during onboarding. In MVP, this toggle is visible but marked as 'coming soon'. It does not need to be functional in v1.
6. Users who have not created an account see a persistent, non-blocking prompt to save their progress by creating one.
7. The entire onboarding flow is completable in under 90 seconds with a maximum of 3 screens.

### **Onboarding Flow**

**Screen**

**Name**

**Content**

1 of 3

**Welcome**

App name, tagline, one-sentence description. Two primary CTAs: 'Get Started' (leads to account creation) and 'Sign In'. A low-emphasis link: 'Continue without account'.

2 of 3

**Create Account**

Name, email, password, or Google sign-in. Terms acceptance. 'Skip for now' link for users who don't want an account yet.

3 of 3

**Your Cycle**

Date selector for cycle start date. Week selector (1–12). Category selector appears inline if Week 9 or 10 is selected. Single CTA: 'Start My Cycle'.

## **4.3 F-02 & F-03: Cycle Progress Tracker + Weekly Guide**

### **User Story**

As a user mid-cycle, I want to open the app on Monday morning and immediately see which week I'm in, how many days I have left, and what I should focus on this week — without navigating anywhere.

### **Home Dashboard — Layout**

**Zone**

**Content & Behavior**

**Season Badge**

A prominent, pill-shaped badge showing the current season name in its seasonal color. Week number and phase name displayed below it.

**Progress Bar**

A horizontal segmented bar representing the full 84-day cycle. Three color-coded segments: Fall (amber), Winter (blue), Spring (green). The user's current position is marked. Segment boundaries are labeled.

**Day Counter**

'Day X of 84 · Week X of 12'. Secondary line: 'X days until [next season change / end of cycle]'.

**This Week Card**

The current week's phase name as a heading. 3–4 original focus items for the week. A 'What changed this week' line if anything changed from the previous week (e.g., 'Grains removed this week').

**Food Search Shortcut**

A prominent search field below the week card. Tapping it opens the food lookup screen with the keyboard immediately active.

### **Progress Bar — Behavior**

- Total cycle duration: 84 days (12 weeks).
- Fall = Days 1–21. Winter = Days 22–42. Spring = Days 43–84.
- For users who start mid-cycle (season jump), the bar shows their position correctly within the 84-day span.
- All date calculations happen when the app opens, not on a real-time background timer. If a week boundary is crossed while the app is open, the UI updates on the user's next navigation action.

### **Cycle Edge Cases**

**Edge Case**

**Required Behavior**

**Start date is in the future**

Progress bar shows 0%. Counter reads 'Your cycle starts in X days'. Week card shows Week 1 content. No error state.

**Day 85+ (cycle complete)**

Progress bar shows 100% with a completion indicator. A congratulations banner appears. A 'Start a new cycle' CTA is available. The app does not auto-reset. Food lookup continues to work, defaulting to Week 12 status.

**No start date set**

Home screen shows a prompt to set a start date. Food lookup works using Week 1 as the default.

**User is a guest (no account)**

All features work normally. A persistent, non-blocking banner reminds the user to save their progress by creating an account.

## **4.4 F-04 & F-05: Food Lookup — Browse & Search**

### **User Story**

As a user standing in a grocery store, I want to type or say a food name and immediately see whether it's safe to eat this week — without an internet connection, within 2 seconds, with no ambiguity.

### **Food Lookup — Requirements**

- The food database is the single source of truth for all seasonal status information. Its content is derived from the program source material and is stored server-side.
- Every food item in the database has a defined status (In Season, Moderation, Out of Season, or Not Recommended) for each of the 12 weeks.
- Status is always computed based on the user's current week and, for Weeks 9–10, their selected category.
- Status computation is always performed server-side to ensure correctness and to protect the integrity of the food database.

### **Search — Functional Requirements**

- The user can search by typing any part of a food name. The search must handle common aliases (e.g., typing 'corn' should return 'maize'; typing 'zucchini' should return 'courgette'; typing 'eggplant' should return 'aubergine').
- Search results must appear within 200 milliseconds of the user typing.
- Search must work without an internet connection, provided the user has opened the app at least once while connected. Engineering is responsible for choosing the caching and search approach that meets this performance and offline requirement.
- Results are ranked by relevance — exact matches first, then partial matches.
- Each result shows the food name, its status badge for the current week, and a brief contextual note for Moderation items.

*Note on search implementation: the 200ms offline search requirement is a product constraint, not an implementation directive. Engineering should choose the search technology that best satisfies this constraint. See the Technical Design Document for the chosen implementation approach and rationale.*

### **Browse — Functional Requirements**

- Default view (no search query): all foods grouped by category, alphabetical within each group. A context header shows the current week and season.
- Filter tabs allow the user to filter by: All / In Season / Moderation / Out of Season.
- For Weeks 9–10: a sub-filter allows the user to view results for their specific category.

### **Empty States**

**State**

**Required User-Facing Text**

**No search query entered**

Show all foods. Header: 'Week X — [Season Name]'.

**No results found**

'We don't have [query] in our database yet. If a food isn't in the database, avoid it for the season.'

**Filter returns nothing**

'Nothing matches this filter for Week X. Try removing the filter to see all foods.'

**Offline, no cached data**

'Connect to the internet once to load the food database for offline use.'

## **4.5 F-06: Season Jump**

### **User Story**

As a user who is 6 weeks into my cycle but just discovered this app, I want to tell the app I'm on Week 6 so it shows me the right food guidelines and progress position.

### **Requirements**

- The user can change their current week at any time from Settings.
- The progress bar and weekly guide update immediately to reflect the new position.
- When a user jumps to a new week, the app aligns their cycle to a clean week boundary (Monday start) so that the weekly guide and any future notification logic remain coherent. The user does not need to understand this — the app handles it silently.
- The user sees a confirmation dialog before the change is applied: 'This will set your cycle to Week [N] starting [date]. Continue?'

## **4.6 F-07: Settings Screen**

**Setting**

**Required Behavior**

**Display name**

Editable. Changes save automatically.

**Email address**

Read-only. A 'Change email' option triggers the platform's email change flow. Hidden for users without an account.

**Cycle start date**

Date selector. A change recalculates the current week and days remaining. Requires confirmation.

**Current week (season jump)**

1–12 selector. Applies the season jump logic. Requires confirmation.

**Category (Weeks 9–10 only)**

Dropdown with Category 1, 2, or 3. Only visible when the user is in Week 9 or 10. Change takes effect immediately on food lookup.

**Notifications**

Toggle visible in MVP but non-functional. Labeled 'Friday notifications — coming soon'. Will be activated in v2.

**Appearance**

Light / Dark / System selector. Default: System. Applies immediately. Preference is saved to the user's account.

**Timezone**

Displayed and editable. Auto-detected from device on first load. Relevant for v2 notification scheduling.

**Upgrade to full account**

Visible for guest/anonymous users only. Creates a full account and converts all existing data over. Nothing is lost.

**Reset cycle**

Resets to Week 1 from today. Confirmation required: 'This will restart your cycle from Week 1 today. This cannot be undone. Reset?'

**Delete account**

Permanently deletes all user data. Two-step confirmation requiring explicit user input to proceed. Irreversible.

## **4.7 F-11: AI Meal Planner (v2)**

*Scoped for v2. Fully specified here so no PRD revision is needed when v2 begins.*

### **Overview**

The Meal Planner helps users translate their current week's food rules into an actual eating plan. It removes the planning burden of figuring out what to cook. It operates in two modes.

### **Mode 1 — Full Week Meal Plan**

User Story: As a user on Sunday evening, I want to describe how I want to eat this week and receive a complete meal plan with a shopping list, so I can shop on Monday and follow a clear plan.

- User inputs: number of daily meals (breakfast, lunch, dinner, snacks), variety preference (repeat simple meals vs. full variety), any dietary exclusions or allergies, number of servings, optional cuisine style preference.
- Outputs: a 7-day meal plan grid, a recipe for each meal with ingredient quantities and preparation steps, and a consolidated shopping list grouped by category (produce, protein, pantry).
- Timing rule: if the user opens the planner Monday–Thursday, the plan covers the current week. If Friday–Sunday, it plans for the upcoming week. The target week is clearly displayed to the user.
- All proposed meals and ingredients are validated against the current week's in-season food list before being shown. No out-of-season ingredients appear.

### **Mode 2 — Pantry-Based Suggestions**

User Story: As a user who has already shopped, I want to enter the ingredients I have and receive meal ideas that use them — so I don't waste food or need to shop again.

- User inputs: a list of ingredients they currently have. Optional: meal type preference, number of suggestions desired (default 3).
- Outputs: 3–5 meal ideas using primarily the listed ingredients. Each suggestion shows the meal name, which pantry ingredients are used, and any minimal additions needed (e.g., 'You may need: olive oil, salt'). Seasonings are always exempt from guidelines.
- All suggestions are validated against the current week's in-season list. No out-of-season items are ever proposed.

# **5. UX & Design System**

## **5.1 Design Philosophy**

Warm, natural, effortless. The app should feel like a premium wellness journal — grounded, calm, and trustworthy. The visual language should reinforce the feeling of being on a nature-aligned health journey. Every interaction should reduce stress, not add to it.

## **5.2 Color System**

**Token**

**Hex**

**Usage**

**Forest Green (primary)**

#2D6A4F

Primary CTAs, headings, IN SEASON badge, Spring progress segment

**Mid Green (secondary)**

#52B788

Card borders, dividers, accent elements

**Pale Green (surface)**

#D8F3DC

IN SEASON badge background, highlighted card fills

**Warm Amber**

#D4A017

MODERATION badge, Fall segment of progress bar

**Sky Blue**

#AED6F1

Winter segment of progress bar

**Alert Red**

#C0392B

OUT OF SEASON badge, destructive actions only

**Warm Cream (bg)**

#FAF7F0

App background in light mode. Never pure white.

**Charcoal**

#2C2C2C

All primary body text in light mode

## **5.3 Dark Mode**

- Dark mode must be fully supported and must respect the user's system preference by default.
- A Light / Dark / System toggle is available in Settings. The preference is saved per user.
- Dark mode uses a dark background (not pure black), dark surface for cards and modals, and warm off-white for primary text to maintain the warm brand feel.
- All status badge colors are identical in dark and light mode. They are semantic colors, not theme colors.
- Progress bar segment colors are identical in both modes. They encode program data, not theme state.

## **5.4 Loading States**

- All screens that fetch data must show a loading state while data is being retrieved. The loading state must use skeleton shapes that match the layout of the content being loaded — not a generic spinner.
- Skeletons should be visible immediately on navigation. If data has not loaded within 3 seconds, the error state should be displayed instead.
- The skeleton animation must respect the user's 'reduce motion' accessibility setting.

## **5.5 Error States**

- The app must never display a raw error message or crash screen to the user. All errors are caught and handled gracefully.
- Network and server errors: display a warm amber retry banner with a plain-English message and a retry button. Log the technical error in the console, not on screen.
- Expired session: redirect silently to login. No error banner needed.
- Offline with no cached data: display a message explaining that the user needs to connect once to load the food database.

## **5.6 Navigation**

**Screen**

**Route**

**Purpose**

**Home**

/

Progress, season badge, week card, food search entry point.

**Food Lookup**

/foods

Full food database browse and search.

**Weekly Guide**

/weeks/[week]

Detailed per-week guide. All 12 weeks accessible.

**Settings**

/settings

Profile, cycle state, appearance, and account management.

Mobile: bottom tab bar with four tabs (Home, Foods, Weeks, Settings). Desktop: top navigation bar.

# **6. Technical Requirements & Constraints**

*This section defines what the system must do and the constraints it must operate within. It does not specify how to build it. All implementation decisions — technology choices, database schema, package selection, infrastructure configuration — are documented in the Technical Design Document.*

## **6.1 Platform Requirements**

- The app must function as an installable Progressive Web App (PWA) on iOS 16.4+, Android, and desktop browsers.
- The app must be installable to the device home screen and launch in full-screen mode without a browser bar.
- The app must prompt users to install it after sufficient engagement (not on first visit).

## **6.2 Performance Requirements**

**Requirement**

**Target**

**Food search response time**

Results must appear within 200ms of user input, including when the device has no internet connection.

**App initial load**

The home dashboard and food search must be usable within 3 seconds on a standard mobile connection.

**Offline capability**

The food lookup feature must be fully functional without internet connectivity after the user has loaded the app at least once while connected.

**Data freshness**

The food database cache is refreshed each time the user opens the app while online. The user always sees the most current data when connected.

## **6.3 Data & Storage Requirements**

- All user data (cycle state, preferences, account info) must be stored server-side to support cross-device access. Local-only storage is not acceptable for authenticated users.
- Users who have not created an account (guests) must be able to store cycle state that persists across app sessions on the same device and can be migrated to a full account without data loss.
- The food database must be the single source of truth for all food seasonal status information. No food status logic is hardcoded in the application layer.
- Food status must always be computed server-side based on the user's current week and category. It must not be computed on the client device.

## **6.4 Authentication Requirements**

- The app must support three authentication modes: email and password, Google sign-in, and anonymous/guest access.
- An anonymous user who later creates a full account must have all their existing data (cycle state, preferences) seamlessly migrated. Nothing is lost.
- All user data in the database must be access-controlled such that one user cannot read or modify another user's data.
- The food database must be readable by all users, including anonymous/unauthenticated users, to support food lookup before account creation.

## **6.5 Deployment Requirements**

- The app must be deployable to a free-tier cloud hosting platform (Vercel or Netlify).
- The database must be hosted on a managed service with automatic backups (Supabase).
- The database must remain active and responsive at all times. If using a free-tier database that auto-pauses after inactivity, a keep-alive mechanism must be implemented.

## **6.6 Analytics Requirements**

- The app must log a session event each time a user visits a screen. Each event records: which user, which screen, which cycle week the user is currently in, and a timestamp.
- This event data is the source for computing the North Star Metric (WAUR). No third-party analytics tool is required in MVP — internal queries on this event table are sufficient.

# **7. Copyright, Legal & Attribution**

## **7.1 Copyright Position**

This app is an independent personal portfolio project inspired by the nutritional seasonality framework popularized by the WILDFIT® program. It does not reproduce any copyrighted text, food lists, program materials, or intellectual property from WILDFIT®.

## **7.2 Required Attribution**

*"Live WildFit is an independent personal project inspired by nutritional seasonality principles. It is not affiliated with, endorsed by, or sponsored by WILDFIT® or Eric Edmeades. WILDFIT® is a registered trademark of Eric Edmeades. For the official WILDFIT® program, visit www.getwildfit.com."*

This statement must appear in: (1) the app footer on every screen, (2) the README.md prominently at the top, (3) an About section in Settings.

## **7.3 What the App Must Not Contain**

- No verbatim text from any WILDFIT® document, video, course material, or assignment.
- No reproduction of WILDFIT® weekly guides, food lists, or program descriptions.
- No WILDFIT® PDFs or source materials committed to the source code repository.
- No use of the WILDFIT® name or logo in a way that implies affiliation or endorsement.

# **8. Scope & Release Plan**

## **8.1 MVP — In Scope**

- Authentication: email, Google sign-in, anonymous/guest sessions.
- Onboarding: name, start date, starting week, category selection.
- Home dashboard: progress bar, season badge, day/week counters, weekly guide card, food search shortcut.
- Food lookup: browse by status, instant search with alias matching, status badges.
- All 12 weekly guide cards.
- Season jump with confirmation.
- Full Settings screen.
- Dark mode.
- PWA: installable, offline food lookup, install prompt.
- Session event logging for WAUR measurement.

## **8.2 Deferred from MVP**

- Push notifications (F-09) — v2.
- Camera / food scan (F-08) — v1.5.

## **8.3 v2 Roadmap**

**Version**

**Feature**

**Notes**

v1.5

Camera / Food Scan (F-08)

AI image recognition. Returns seasonal status for photographed food item.

v2.0

Friday Notifications (F-09)

Push notification every Friday. In-app banner fallback for iOS non-installed PWA users.

v2.0

AI Meal Planner (F-11)

Full spec in Section 4.7. Two modes: weekly plan + shopping list, pantry-based suggestions.

v2.0

Measurements Tracker (F-10)

Body measurements at program milestones. Progress visualization.

v2.0

AI Wellness Coach (F-12)

Conversational Q&A grounded in the app's food database and weekly guides.

v2.0

Food Suggestions

Allow users to suggest foods missing from the database via a 'Suggest this food' link on the no-results empty state. Suggestions stored server-side for product team review.

# **Appendix: Weekly Guide Content (All 12 Weeks)**

*Original content for all 12 weekly guide cards. This is the source material for the app's weekly guide feature. All content is original — no WILDFIT® text reproduced.*

### **Week 1 — Fall — Observation Week**

**Season**

Fall

**Phase**

Observation Week

**What changed**

Program begins — no food changes yet

**Weekly focus**

- Continue eating as you normally would
- Add 6–8 glasses of filtered water daily
- Begin the 5-5-5-5 breathing exercise twice daily
- Start observing your Food Dialogue — notice how foods make you feel

### **Week 2 — Fall — Sugar Vacation Begins**

**Season**

Fall

**Phase**

Sugar Vacation Begins

**What changed**

Refined sugar removed; fruit and Alkagizer Mild added

**Weekly focus**

- Take a vacation from all added and refined sugar
- Have 2–3 pieces of fruit on an empty stomach each morning (30 min before other food)
- Start the Alkagizer Mild daily
- Continue 6–8 glasses of water daily

### **Week 3 — Fall — Sugar Awareness**

**Season**

Fall

**Phase**

Sugar Awareness

**What changed**

No new removals — deepen sugar awareness

**Weekly focus**

- Continue your vacation from refined sugar
- Learn to identify the 65+ hidden names of sugar on ingredient labels
- Avocado, tomato, olives, dabai, and lemon/lime are always available
- Raw honey, maple syrup, and coconut sugar acceptable in very small amounts if previously used

### **Week 4 — Fall → Winter — Grain & Dairy Exit**

**Season**

Fall → Winter

**Phase**

Grain & Dairy Exit

**What changed**

All grains and dairy removed this week

**Weekly focus**

- Step away from all grains: bread, pasta, rice, oats, and all cereal grains
- Take a break from all dairy (cow, goat, sheep milk products)
- Dairy alternatives allowed: almond milk, hemp milk, coconut milk — oat and rice milk are out
- Continue the Alkagizer Mild supplement daily

### **Week 5 — Winter — Full Detox Entry**

**Season**

Winter

**Phase**

Full Detox Entry

**What changed**

Food additives, alcohol, caffeine, and nicotine removed

**Weekly focus**

- Take a break from all food additives, alcohol, caffeine, and nicotine
- Expect 1–5 days of mild adjustment if you consume caffeine — this is normal and will pass
- Continue 6–8 glasses of water daily
- Focus on whole, unprocessed vegetables and quality protein

### **Week 6 — Winter — Deep Winter**

**Season**

Winter

**Phase**

Deep Winter

**What changed**

No new removals — hold and deepen

**Weekly focus**

- Hold all current guidelines — this is your deepest detox week
- Prioritize sleep and stress reduction
- Continue the Alkagizer Mild daily
- Notice improvements in energy, skin, and sleep quality

### **Week 7 — Spring Entry — Spring Begins**

**Season**

Spring Entry

**Phase**

Spring Begins

**What changed**

Spring food list begins; water increases to 12 glasses; Alkagizer Prime starts

**Weekly focus**

- Increase water to 12 glasses daily
- Maximize vegetable variety at every meal
- Lean quality protein: wild-caught fish preferred, then organic/pastured
- Nuts in moderation — one small handful per day (no peanuts or cashews)
- Begin the Alkagizer Prime supplement daily

### **Week 8 — Spring — Deep Spring**

**Season**

Spring

**Phase**

Deep Spring

**What changed**

No new changes — maintain Spring guidelines

**Weekly focus**

- Continue all Spring guidelines with consistency
- Continue 12 glasses of water daily
- Maintain the 5-5-5-5 breathing exercise daily
- Keep Alkagizer Prime daily — vary the greens you use

### **Week 9 — Spring — Spring — Category Split**

**Season**

Spring

**Phase**

Spring — Category Split

**What changed**

Category 1 users may begin reintroducing less-sweet fruit

**Weekly focus**

- Category 1: Begin adding small amounts of less-sweet fruits (berries, citrus, guava)
- Categories 2 & 3: Continue deep Spring guidelines — stay the course
- Fruit (if reintroducing) is consumed in the morning on an empty stomach only
- Move back to 8–10 glasses of water daily

### **Week 10 — Spring — Spring Continuation**

**Season**

Spring

**Phase**

Spring Continuation

**What changed**

Category 1 adds more fruit; Categories 2 & 3 hold — final Spring week

**Weekly focus**

- Category 1: Continue adding berries and low-glycemic fruit slowly
- Categories 2 & 3: This is your final full week of deep Spring — finish strong
- Continue Alkagizer Prime daily
- Do not let yourself go hungry — eat vegetables and protein abundantly

### **Week 11 — Spring Exit — Coming Out of Spring**

**Season**

Spring Exit

**Phase**

Coming Out of Spring

**What changed**

Root vegetables and low-glycemic fruit reintroduced for all categories

**Weekly focus**

- All categories: gradually add root vegetables (except white potato) and berries
- Add new foods slowly — one at a time — and observe how you feel
- Move back to 8–10 glasses of water daily
- The further you move toward Summer foods, the harder it is to return to Spring

### **Week 12 — Transition — Spring Reset Preparation**

**Season**

Transition

**Phase**

Spring Reset Preparation

**What changed**

Sweet foods removed again to prepare body for Spring state

**Weekly focus**

- Steer clear of fruits, sweet vegetables, beans, and honey this week
- Avoid sweet-tasting foods to signal the body back into Spring state
- Increase water back to 12 glasses daily
- Begin Alkagizer Prime daily if you stopped
- This is temporary — prepare for your next cycle

*End of Document — Live WildFit PRD v1.4*

Companion document: Live WildFit Technical Design Document v1.0