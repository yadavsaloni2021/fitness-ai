-- ============================================================
-- Live WildFit — Initial Schema Migration
-- Run this in the Supabase SQL Editor or via CLI.
-- Idempotent: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  timezone      TEXT        NOT NULL DEFAULT 'UTC',
  theme         TEXT        NOT NULL DEFAULT 'system'
                            CHECK (theme IN ('light', 'dark', 'system')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cycle_state (
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

-- food_items removed: food data is served from foods-seed.json at the server layer.

CREATE TABLE IF NOT EXISTS public.session_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screen_name TEXT        NOT NULL,
  cycle_week  SMALLINT    CHECK (cycle_week >= 1 AND cycle_week <= 12),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_session_events_user_id
  ON public.session_events (user_id);

CREATE INDEX IF NOT EXISTS idx_session_events_created_at
  ON public.session_events (created_at);

CREATE INDEX IF NOT EXISTS idx_session_events_user_week
  ON public.session_events (user_id, cycle_week);

-- ============================================================
-- TRIGGERS — updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cycle_state_updated_at ON public.cycle_state;
CREATE TRIGGER trg_cycle_state_updated_at
  BEFORE UPDATE ON public.cycle_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: users read own" ON public.profiles;
CREATE POLICY "profiles: users read own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: users insert own" ON public.profiles;
CREATE POLICY "profiles: users insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: users update own" ON public.profiles;
CREATE POLICY "profiles: users update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: users delete own" ON public.profiles;
CREATE POLICY "profiles: users delete own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- cycle_state
ALTER TABLE public.cycle_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cycle_state: users read own" ON public.cycle_state;
CREATE POLICY "cycle_state: users read own"
  ON public.cycle_state FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cycle_state: users insert own" ON public.cycle_state;
CREATE POLICY "cycle_state: users insert own"
  ON public.cycle_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cycle_state: users update own" ON public.cycle_state;
CREATE POLICY "cycle_state: users update own"
  ON public.cycle_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cycle_state: users delete own" ON public.cycle_state;
CREATE POLICY "cycle_state: users delete own"
  ON public.cycle_state FOR DELETE
  USING (auth.uid() = user_id);

-- session_events
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_events: users insert own" ON public.session_events;
CREATE POLICY "session_events: users insert own"
  ON public.session_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "session_events: users read own" ON public.session_events;
CREATE POLICY "session_events: users read own"
  ON public.session_events FOR SELECT
  USING (auth.uid() = user_id);
