import React from 'react'
import { getDaysUntilNextSeason } from '@/lib/cycle'

interface DayCounterProps {
  cycleDay: number
  week: number
  daysRemaining: number
  isFuture: boolean
  isComplete: boolean
  startDate?: string
}

export function DayCounter({
  cycleDay,
  week,
  daysRemaining,
  isFuture,
  isComplete,
  startDate,
}: DayCounterProps) {
  const displayDay = Math.max(1, Math.min(cycleDay, 84))

  if (isFuture && startDate) {
    const daysUntilStart = Math.abs(cycleDay - 1)
    return (
      <div className="text-center space-y-1">
        <p className="text-2xl font-bold text-[var(--text-primary)]">
          Your cycle starts in {daysUntilStart} day{daysUntilStart !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Starting {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="text-center space-y-1">
        <p className="text-2xl font-bold text-[var(--color-primary)]">
          Cycle complete! 🎉
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Day 84 of 84 · Week 12 of 12
        </p>
      </div>
    )
  }

  return (
    <div className="text-center space-y-1">
      <p className="text-2xl font-bold text-[var(--text-primary)]">
        Day {displayDay} of 84 · Week {week} of 12
      </p>
      <p className="text-sm text-[var(--text-muted)]">
        {(() => {
          const { days, label } = getDaysUntilNextSeason(cycleDay)
          return `${days} day${days !== 1 ? 's' : ''} until ${label}`
        })()}
      </p>
    </div>
  )
}
