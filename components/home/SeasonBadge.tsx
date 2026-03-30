import React from 'react'

interface SeasonBadgeProps {
  season: string
  week: number
  phase: string
}

function getSeasonStyle(season: string): string {
  const s = season.toLowerCase()
  if (s.includes('fall')) return 'bg-[var(--season-fall)] text-white'
  if (s.includes('winter')) return 'bg-[var(--season-winter)] text-[var(--color-charcoal)]'
  if (s.includes('spring') || s.includes('transition')) return 'bg-[var(--season-spring)] text-white'
  return 'bg-[var(--color-mid-green)] text-white'
}

export function SeasonBadge({ season, week, phase }: SeasonBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={[
          'inline-flex items-center px-5 py-2 rounded-full text-base font-bold tracking-wide shadow-sm',
          getSeasonStyle(season),
        ].join(' ')}
      >
        {season}
      </span>
      <p className="text-sm text-[var(--text-secondary)]">
        Week {week} · {phase}
      </p>
    </div>
  )
}
