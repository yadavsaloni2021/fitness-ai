import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { weeklyGuide } from '@/lib/weekly-guide'
import type { Metadata } from 'next'

interface WeekPageProps {
  params: Promise<{ week: string }>
}

export async function generateStaticParams() {
  return Array.from({ length: 12 }, (_, i) => ({ week: String(i + 1) }))
}

export async function generateMetadata({ params }: WeekPageProps): Promise<Metadata> {
  const { week: weekStr } = await params
  const weekNum = parseInt(weekStr, 10)
  const guide = weeklyGuide.find(w => w.week === weekNum)
  if (!guide) return { title: 'Week Not Found' }
  return {
    title: `Week ${weekNum} — ${guide.phase} | Live WildFit`,
  }
}

export default async function WeekPage({ params }: WeekPageProps) {
  const { week: weekStr } = await params
  const weekNum = parseInt(weekStr, 10)

  if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
    notFound()
  }

  const guide = weeklyGuide.find(w => w.week === weekNum)
  if (!guide) notFound()

  const prevWeek = weekNum > 1 ? weekNum - 1 : null
  const nextWeek = weekNum < 12 ? weekNum + 1 : null

  function getSeasonStyle(season: string): string {
    const s = season.toLowerCase()
    if (s.includes('fall')) return 'text-[var(--season-fall)]'
    if (s.includes('winter')) return 'text-[var(--season-winter)]'
    return 'text-[var(--season-spring)]'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className={['text-sm font-semibold uppercase tracking-wide', getSeasonStyle(guide.season)].join(' ')}>
          {guide.season}
        </p>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Week {weekNum} — {guide.phase}
        </h1>
        {guide.what_changed && (
          <p className="text-sm text-[var(--text-muted)] italic">{guide.what_changed}</p>
        )}
      </div>

      {/* Focus items */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] p-5 space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-primary)]">This week&apos;s focus</h2>
        <ul className="space-y-3">
          {guide.focus.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-[var(--text-primary)]">
              <span className="text-[var(--color-primary)] font-bold flex-shrink-0">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* All 12 weeks navigation */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">All weeks</h2>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
            <Link
              key={w}
              href={`/weeks/${w}`}
              className={[
                'flex items-center justify-center h-10 rounded-xl text-sm font-medium transition-colors',
                w === weekNum
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border-default)] hover:text-white',
              ].join(' ')}
              aria-current={w === weekNum ? 'page' : undefined}
            >
              {w}
            </Link>
          ))}
        </div>
      </div>

      {/* Prev / next navigation */}
      <div className="flex justify-between">
        {prevWeek ? (
          <Link
            href={`/weeks/${prevWeek}`}
            className="text-sm text-[var(--color-primary)] underline hover:opacity-80"
          >
            ← Week {prevWeek}
          </Link>
        ) : <span />}
        {nextWeek ? (
          <Link
            href={`/weeks/${nextWeek}`}
            className="text-sm text-[var(--color-primary)] underline hover:opacity-80"
          >
            Week {nextWeek} →
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}
