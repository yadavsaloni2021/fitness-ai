// Food status values
export type FoodStatus = 'in' | 'moderation' | 'out' | 'never'

// Food category (food group)
export type FoodCategory =
  | 'beverages'
  | 'condiments'
  | 'dairy'
  | 'fruits'
  | 'grains'
  | 'nuts_seeds'
  | 'other'
  | 'protein'
  | 'vegetables'

// A food item from the database
export interface FoodItem {
  id: string
  name: string
  aliases: string[]
  category: FoodCategory
  week_status: Record<string, FoodStatus>
  category_override: Record<string, Record<string, FoodStatus>> | null
  moderation_note: string | null
  never_friendly: boolean
  is_sugar_name: boolean
  // Computed at API level — only present in status responses
  status?: FoodStatus
}

// Cycle state from the database
export interface CycleState {
  id: string
  user_id: string
  start_date: string // ISO date string YYYY-MM-DD
  current_week: number // 1–12
  category: number | null // 1, 2, or 3
  created_at: string
  updated_at: string
}

// User profile
export interface Profile {
  id: string
  display_name: string | null
  timezone: string
  theme: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

// A session event for WAUR analytics
export interface SessionEvent {
  id: string
  user_id: string
  screen_name: string
  cycle_week: number | null
  created_at: string
}

// Computed cycle state derived from start_date and current_week
export interface ComputedCycleState {
  configured: true
  start_date: string
  current_week: number
  category: number | null
  computed_week: number
  cycle_day: number
  days_remaining: number
}

// Returned when no cycle_state row exists yet
export interface CycleNotConfigured {
  configured: false
}

// BeforeInstallPromptEvent is non-standard — not in TypeScript's lib
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
