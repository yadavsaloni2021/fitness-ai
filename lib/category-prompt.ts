const DISMISSED_DATE_KEY = 'lw:category-prompt:dismissed-date'
const DISMISSED_SESSION_KEY = 'lw:category-prompt:dismissed-session'

function getTodayLocalDate(timezone?: string): string {
  if (timezone) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    } catch {
      // Fall back to the local date when the supplied timezone is invalid.
    }
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shouldShowCategoryPrompt(
  week: number,
  category: number | null,
  timezone?: string
): boolean {
  if (typeof window === 'undefined') return false
  if (week < 9) return false
  if (category !== null) return false

  const today = getTodayLocalDate(timezone)

  try {
    const dismissedDate = window.localStorage.getItem(DISMISSED_DATE_KEY)
    const dismissedSession = window.sessionStorage.getItem(DISMISSED_SESSION_KEY) === '1'

    if (dismissedDate === today) return false
    if (dismissedSession) return false
    return true
  } catch {
    return true
  }
}

export function dismissCategoryPrompt(timezone?: string): void {
  if (typeof window === 'undefined') return
  const today = getTodayLocalDate(timezone)

  try {
    window.localStorage.setItem(DISMISSED_DATE_KEY, today)
    window.sessionStorage.setItem(DISMISSED_SESSION_KEY, '1')
  } catch {
    // Ignore storage failures so the page does not break in restricted environments.
  }
}
