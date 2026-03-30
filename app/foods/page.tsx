'use client'

import React, { useEffect, useState } from 'react'
import { FoodList } from '@/components/foods/FoodList'
import { FoodSearch } from '@/components/foods/FoodSearch'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { logSessionEvent } from '@/lib/analytics'
import { recordNavigation } from '@/lib/install-prompt'
import { buildIndex } from '@/lib/food-search'
import { saveFoodsToCache, loadFoodsFromCache, getCacheUpdatedAt } from '@/lib/food-cache'
import type { ComputedCycleState, CycleNotConfigured, FoodItem } from '@/types'

type CycleData = ComputedCycleState | CycleNotConfigured | null

export default function FoodsPage() {
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [cycleData, setCycleData] = useState<CycleData>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState(false)

  useEffect(() => {
    recordNavigation()
    loadData()
  }, [])

  async function loadData() {
    try {
      // Load foods and cycle state in parallel
      const [foodsRes, cycleRes] = await Promise.all([
        fetch('/api/foods'),
        fetch('/api/cycle'),
      ])

      // Handle foods
      if (foodsRes.ok) {
        const { foods: fetchedFoods, updated_at } = await foodsRes.json() as { foods: FoodItem[]; updated_at: string }
        const cachedUpdatedAt = getCacheUpdatedAt()
        if (cachedUpdatedAt !== updated_at) {
          saveFoodsToCache(fetchedFoods, updated_at)
        }
        buildIndex(fetchedFoods)
        setFoods(fetchedFoods)
      } else {
        // Try cache
        const cached = loadFoodsFromCache()
        if (cached) {
          buildIndex(cached)
          setFoods(cached)
        }
      }

      // Handle cycle
      if (cycleRes.ok) {
        const data = await cycleRes.json()
        setCycleData(data)
        if (data.configured) {
          logSessionEvent('foods', data.computed_week)
        } else {
          logSessionEvent('foods', null)
        }
      }
    } catch (err) {
      console.error(err)
      // Try loading from cache when offline
      const cached = loadFoodsFromCache()
      if (cached) {
        buildIndex(cached)
        setFoods(cached)
      } else {
        setError('Unable to load foods. Connect to the internet once to load the food database for offline use.')
      }
    } finally {
      setLoading(false)
    }
  }

  const week = cycleData?.configured ? cycleData.computed_week : 1
  const category = (cycleData?.configured ? cycleData.category : null) ?? 2

  const contextHeader = `Week ${week} — ${getSeasonLabel(week)}`

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-4 w-40 rounded" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error && foods.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-[var(--text-secondary)]">{error}</p>
        <Button variant="secondary" onClick={loadData}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Search / browse toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSearchMode(false)}
          className={[
            'flex-1 py-2 rounded-xl text-sm font-medium transition-colors',
            !searchMode
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
          ].join(' ')}
        >
          Browse
        </button>
        <button
          onClick={() => setSearchMode(true)}
          className={[
            'flex-1 py-2 rounded-xl text-sm font-medium transition-colors',
            searchMode
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
          ].join(' ')}
        >
          Search
        </button>
      </div>

      {/* Context header */}
      <p className="text-sm font-medium text-[var(--text-muted)]">{contextHeader}</p>

      {searchMode ? (
        <FoodSearch week={week} category={category} autoFocus />
      ) : (
        <FoodList foods={foods} week={week} category={category} />
      )}
    </div>
  )
}

function getSeasonLabel(week: number): string {
  if (week <= 3) return 'Fall'
  if (week <= 6) return 'Winter'
  if (week <= 10) return 'Spring'
  if (week === 11) return 'Spring Exit'
  return 'Transition'
}
