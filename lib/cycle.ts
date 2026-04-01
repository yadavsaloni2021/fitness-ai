// Cycle state computation utilities
// All date arithmetic uses UTC midnight to avoid DST issues.
// User timezone is only used to determine "today" in the user's local time.

/**
 * Get today's date as YYYY-MM-DD in the given timezone.
 */
function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Parse a YYYY-MM-DD string as a UTC midnight Date object.
 */
function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z')
}

/**
 * Compute the current cycle day (1-based) from start_date.
 * Day 1 = start_date. Returns 0 if cycle hasn't started yet.
 */
export function computeCycleDay(startDate: string, timezone: string): number {
  const today = parseDate(todayInTimezone(timezone))
  const start = parseDate(startDate)
  const diffMs = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

/**
 * Compute the current week number (1–12) from the cycle day.
 * Returns 1 if before start. Returns 12 if past day 84 (cycle complete).
 */
export function computeCurrentWeek(cycleDay: number): number {
  if (cycleDay <= 0) return 1
  if (cycleDay > 84) return 12
  return Math.min(12, Math.ceil(cycleDay / 7))
}

/**
 * Compute days remaining in the 84-day cycle.
 * Returns 84 if cycle hasn't started. Returns 0 if complete.
 */
export function computeDaysRemaining(cycleDay: number): number {
  if (cycleDay <= 0) return 84
  if (cycleDay > 84) return 0
  return 84 - cycleDay + 1
}

/**
 * Returns true if the cycle is complete (day 85+).
 */
export function isCycleComplete(cycleDay: number): boolean {
  return cycleDay > 84
}

/**
 * Returns true if the cycle start date is in the future.
 */
export function isCycleFuture(cycleDay: number): boolean {
  return cycleDay <= 0
}

/**
 * Compute the start_date for a season jump to targetWeek.
 * Aligns to the most recent Monday in the user's timezone,
 * then subtracts (targetWeek - 1) * 7 days so that "this week"
 * is exactly targetWeek.
 *
 * Returns null if the inputs are invalid or the date cannot be computed.
 */
export function seasonJumpStartDate(targetWeek: number, userTimezone: string): string | null {
  if (!Number.isFinite(targetWeek) || targetWeek < 1 || targetWeek > 12) {
    console.error('[seasonJumpStartDate] invalid targetWeek:', targetWeek)
    return null
  }

  try {
    const todayStr = todayInTimezone(userTimezone)
    const today = parseDate(todayStr)

    if (isNaN(today.getTime())) return null

    const dayOfWeek = today.getUTCDay() // 0 = Sunday
    const daysSinceMonday = (dayOfWeek + 6) % 7

    // Most recent Monday
    const thisMonday = new Date(today)
    thisMonday.setUTCDate(today.getUTCDate() - daysSinceMonday)

    // start_date = thisMonday - ((targetWeek - 1) * 7) days
    const start = new Date(thisMonday)
    start.setUTCDate(thisMonday.getUTCDate() - (targetWeek - 1) * 7)

    if (isNaN(start.getTime())) return null

    return start.toISOString().split('T')[0]
  } catch (err) {
    console.error('[seasonJumpStartDate] date computation failed:', err)
    return null
  }
}

/**
 * Get the season name for a given week number.
 */
export function getSeasonForWeek(week: number): string {
  if (week <= 3) return 'Fall'
  if (week === 4) return 'Fall → Winter'
  if (week <= 6) return 'Winter'
  if (week <= 8) return 'Spring'
  if (week <= 10) return 'Spring'
  if (week === 11) return 'Spring Exit'
  return 'Transition'
}

/**
 * Get the season label (short form) for a given week number.
 */
export function getSeasonLabel(week: number): string {
  if (week <= 3) return 'Fall'
  if (week === 4) return 'Winter'
  if (week <= 6) return 'Winter'
  if (week <= 10) return 'Spring'
  if (week === 11) return 'Spring'
  return 'Transition'
}

/**
 * Get the phase label for a given week number.
 */
export function getPhaseLabel(week: number): string {
  const phases: Record<number, string> = {
    1: 'Observation Week',
    2: 'Sugar Vacation Begins',
    3: 'Sugar Awareness',
    4: 'Grain & Dairy Exit',
    5: 'Full Detox Entry',
    6: 'Deep Winter',
    7: 'Spring Begins',
    8: 'Deep Spring',
    9: 'Spring — Category Split',
    10: 'Spring Continuation',
    11: 'Coming Out of Spring',
    12: 'Spring Reset Preparation',
  }
  return phases[week] ?? 'Unknown'
}
