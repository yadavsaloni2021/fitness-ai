'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { FoodItem } from '@/types'
import { search, isIndexReady } from '@/lib/food-search'
import { StatusBadge } from './StatusBadge'

interface FoodSearchProps {
  week: number
  category: number
  autoFocus?: boolean
}

type FoodStatus = 'in' | 'moderation' | 'out' | 'never'

function computeStatus(food: FoodItem, week: number, category: number): FoodStatus {
  const w = String(week)
  const c = String(category)
  if ((week === 9 || week === 10) && food.category_override) {
    const override = food.category_override[w]
    if (override && override[c] !== undefined) {
      return override[c] as FoodStatus
    }
  }
  return (food.week_status[w] ?? 'out') as FoodStatus
}

export function FoodSearch({ week, category, autoFocus = false }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [indexReady, setIndexReady] = useState(false)

  // Check if index is ready
  useEffect(() => {
    setIndexReady(isIndexReady())
  }, [])

  // Search on query change
  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (!q.trim()) {
      setResults([])
      return
    }
    const found = search(q)
    setResults(found)
  }, [])

  // Offline with no cached data
  if (!indexReady && query === '') {
    return (
      <div className="space-y-3">
        <div className="relative">
          <input
            type="search"
            placeholder="Search foods..."
            className="w-full rounded-xl border border-[var(--border-subtle)] px-4 py-3 pr-10 bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            autoFocus={autoFocus}
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            🔍
          </span>
        </div>
        <div className="text-center py-8 text-[var(--text-muted)]">
          <p className="text-sm">Connect to the internet once to load the food database for offline use.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <input
          type="search"
          placeholder="Search foods..."
          className="w-full rounded-xl border border-[var(--border-subtle)] px-4 py-3 pr-10 bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          autoFocus={autoFocus}
          value={query}
          onChange={e => handleSearch(e.target.value)}
          aria-label="Search foods"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          🔍
        </span>
      </div>

      {/* No query — prompt */}
      {!query && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4">
          Week {week} — {getSeasonLabel(week)}
        </p>
      )}

      {/* No results */}
      {query && results.length === 0 && (
        <div className="text-center py-8 text-[var(--text-muted)]">
          <p>
            We don&apos;t have <strong>{query}</strong> in our database yet.
          </p>
          <p className="mt-1 text-sm">
            If a food isn&apos;t in the database, avoid it for the season.
          </p>
        </div>
      )}

      {/* Results */}
      {query && results.length > 0 && (
        <ul className="bg-[var(--bg-card)] rounded-xl overflow-hidden border border-[var(--border-subtle)]">
          {results.map(food => {
            const status = computeStatus(food, week, category)
            return (
              <li
                key={food.id}
                className="flex items-center justify-between py-3 px-4 border-b border-[var(--border-subtle)] last:border-b-0 gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--text-primary)]">{food.name}</p>
                  {food.aliases.length > 0 && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Also: {food.aliases.slice(0, 3).join(', ')}
                    </p>
                  )}
                  {status === 'moderation' && food.moderation_note && (
                    <p className="text-xs text-[var(--status-moderation-text)] mt-1">
                      {food.moderation_note}
                    </p>
                  )}
                </div>
                <StatusBadge status={status} size="sm" />
              </li>
            )
          })}
        </ul>
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
