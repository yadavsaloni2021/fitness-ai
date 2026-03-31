'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SeasonBadge } from '@/components/home/SeasonBadge'
import { ProgressBar } from '@/components/home/ProgressBar'
import { DayCounter } from '@/components/home/DayCounter'
import { WeekCard } from '@/components/home/WeekCard'
import { FoodSearch } from '@/components/foods/FoodSearch'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { logSessionEvent } from '@/lib/analytics'
import { recordNavigation } from '@/lib/install-prompt'
import { buildIndex } from '@/lib/food-search'
import { saveFoodsToCache, loadFoodsFromCache, getCacheUpdatedAt } from '@/lib/food-cache'
import { getWeekGuide } from '@/lib/weekly-guide'
import {
  getSeasonForWeek,
  getPhaseLabel,
  isCycleComplete,
  isCycleFuture,
} from '@/lib/cycle'
import { createClient } from '@/lib/supabase/client'
import type { ComputedCycleState, CycleNotConfigured, FoodItem } from '@/types'

type CycleData = ComputedCycleState | CycleNotConfigured | null

export default function HomePage() {
  const router = useRouter()
  const [cycleData, setCycleData] = useState<CycleData>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)

  useEffect(() => {
    recordNavigation()
    loadCycleAndFoods()
  }, [])

  async function loadCycleAndFoods() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsAnonymous(user.is_anonymous ?? false)
      }

      // Load cycle state
      const cycleRes = await fetch('/api/cycle')
      if (cycleRes.status === 401) {
        router.push('/auth/onboarding')
        return
      }
      if (!cycleRes.ok) throw new Error('Failed to load cycle state')
      const data = await cycleRes.json()
      setCycleData(data)

      // Log session event
      const week = data.configured ? data.computed_week : null
      logSessionEvent('home', week)

      // Load and cache food index
      await loadFoodIndex()
    } catch (err) {
      console.error(err)
      setError('Unable to load your cycle data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadFoodIndex() {
    try {
      const foodsRes = await fetch('/api/foods')
      if (!foodsRes.ok) {
        // Try from cache
        const cached = loadFoodsFromCache()
        if (cached) {
          buildIndex(cached)
        }
        return
      }
      const { foods, updated_at } = await foodsRes.json() as { foods: FoodItem[]; updated_at: string }

      const cachedUpdatedAt = getCacheUpdatedAt()
      if (cachedUpdatedAt !== updated_at) {
        saveFoodsToCache(foods, updated_at)
      }
      buildIndex(foods)
    } catch {
      // Offline — try from cache
      const cached = loadFoodsFromCache()
      if (cached) buildIndex(cached)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-32 rounded-full mx-auto" />
        <Skeleton className="h-4 w-48 rounded mx-auto" />
        <Skeleton className="h-6 w-full rounded-full" />
        <Skeleton className="h-12 w-64 rounded mx-auto" />
        <SkeletonCard />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-[var(--text-secondary)]">{error}</p>
        <Button variant="secondary" onClick={loadCycleAndFoods}>Retry</Button>
      </div>
    )
  }

  // Not configured — prompt to set up cycle
  if (!cycleData || !cycleData.configured) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
        <span className="text-5xl" role="img" aria-label="plant">🌿</span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome to Live WildFit</h1>
          <p className="text-[var(--text-secondary)]">Set up your cycle to get started.</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => router.push('/auth/onboarding')}>
          Set up my cycle
        </Button>
      </div>
    )
  }

  const { computed_week, cycle_day, days_remaining, start_date, category } = cycleData
  const effectiveCategory = category ?? 2
  const isFuture = isCycleFuture(cycle_day)
  const isComplete = isCycleComplete(cycle_day)
  const season = getSeasonForWeek(computed_week)
  const phase = getPhaseLabel(computed_week)
  const guide = getWeekGuide(computed_week)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Anonymous save-progress banner */}
      {isAnonymous && (
        <div className="rounded-xl bg-[var(--status-moderation-bg)] border border-[var(--status-moderation-border)] px-4 py-3 text-sm text-[var(--status-moderation-text)]">
          <span className="font-medium">Save your progress</span> — create an account to access your data on any device.{' '}
          <Link href="/settings" className="underline font-medium">Go to Settings</Link>
        </div>
      )}

      {/* Cycle complete banner */}
      {isComplete && (
        <div className="rounded-xl bg-[var(--bg-card-highlight)] border border-[var(--border-default)] px-4 py-4 text-center space-y-3">
          <p className="text-xl font-bold text-[var(--color-primary)]">Congratulations! 🎉</p>
          <p className="text-sm text-[var(--text-secondary)]">You have completed your 12-week cycle. Food lookup continues using Week 12 guidelines.</p>
          <Button variant="secondary" size="sm" onClick={() => router.push('/settings')}>
            Start a new cycle
          </Button>
        </div>
      )}

      {/* Season badge */}
      <div className="flex justify-center">
        <SeasonBadge season={season} week={computed_week} phase={phase} />
      </div>

      {/* Progress bar */}
      <ProgressBar cycleDay={cycle_day} />

      {/* Day counter */}
      <DayCounter
        cycleDay={cycle_day}
        week={computed_week}
        daysRemaining={days_remaining}
        isFuture={isFuture}
        isComplete={isComplete}
        startDate={start_date}
      />

      {/* Week card */}
      {guide && <WeekCard guide={guide} />}

      {/* Food search shortcut */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Quick food lookup</h2>
        <FoodSearch week={computed_week} category={effectiveCategory} />
      </div>

      {/* Link to full guide */}
      <div className="text-center">
        <Link
          href={`/weeks/${computed_week}`}
          className="text-sm text-[var(--color-primary)] underline hover:opacity-80 transition-opacity"
        >
          View full Week {computed_week} guide →
        </Link>
      </div>
    </div>
  )
}
