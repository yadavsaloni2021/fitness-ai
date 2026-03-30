import React from 'react'
import type { WeekGuide } from '@/lib/weekly-guide'

interface WeekCardProps {
  guide: WeekGuide
}

export function WeekCard({ guide }: WeekCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-primary)]">
          {guide.phase}
        </h2>
        {guide.what_changed && (
          <p className="mt-1 text-sm text-[var(--text-secondary)] italic">
            {guide.what_changed}
          </p>
        )}
      </div>

      <ul className="space-y-2">
        {guide.focus.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-[var(--text-primary)]">
            <span className="mt-0.5 text-[var(--color-primary)] flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
