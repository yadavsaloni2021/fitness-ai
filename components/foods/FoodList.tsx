'use client'

import React, { useState, useMemo } from 'react'
import type { FoodItem as FoodItemType, FoodStatus } from '@/types'
import { FoodItem } from './FoodItem'

interface FoodListProps {
  foods: FoodItemType[]
  week: number
  category: number
}

type FilterTab = 'all' | FoodStatus

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'In Season' },
  { value: 'moderation', label: 'Moderation' },
  { value: 'out', label: 'Out of Season' },
]

function computeStatus(food: FoodItemType, week: number, category: number): FoodStatus {
  const w = String(week)
  const c = String(category)
  if ((week === 9 || week === 10) && food.category_override) {
    const override = food.category_override[w]
    if (override && override[c] !== undefined) {
      return override[c]
    }
  }
  return food.week_status[w] ?? 'out'
}

export function FoodList({ foods, week, category }: FoodListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const filteredFoods = useMemo(() => {
    const sorted = [...foods].sort((a, b) => a.name.localeCompare(b.name))
    if (activeFilter === 'all') return sorted
    return sorted.filter(f => computeStatus(f, week, category) === activeFilter)
  }, [foods, week, category, activeFilter])

  // Group alphabetically
  const groups = useMemo(() => {
    const map = new Map<string, FoodItemType[]>()
    for (const food of filteredFoods) {
      const letter = food.name[0].toUpperCase()
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter)!.push(food)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredFoods])

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              activeFilter === tab.value
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty state for filter */}
      {filteredFoods.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p>Nothing matches this filter for Week {week}.</p>
          <p className="mt-1 text-sm">Try removing the filter to see all foods.</p>
        </div>
      )}

      {/* Alphabetical groups */}
      {groups.map(([letter, items]) => (
        <div key={letter} className="mb-4">
          <h3 className="px-4 py-1 text-xs font-semibold text-[var(--text-muted)] bg-[var(--border-subtle)] uppercase tracking-widest">
            {letter}
          </h3>
          <div className="bg-[var(--bg-card)] rounded-xl overflow-hidden border border-[var(--border-subtle)]">
            {items.map(food => (
              <FoodItem
                key={food.id}
                food={food}
                week={week}
                category={category}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
