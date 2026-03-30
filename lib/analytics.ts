/**
 * Log a session event for WAUR analytics.
 * Fire-and-forget — never blocks UI, never surfaces errors to the user.
 */
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
