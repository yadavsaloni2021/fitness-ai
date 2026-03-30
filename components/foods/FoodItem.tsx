import React from 'react'
import type { FoodItem as FoodItemType } from '@/types'
import { StatusBadge } from './StatusBadge'

interface FoodItemProps {
  food: FoodItemType
  week: number
  category: number
}

export function FoodItem({ food, week, category }: FoodItemProps) {
  // Compute display status client-side from cached week_status
  // NOTE: This is display-only. Authoritative status always comes from /api/foods/status.
  // For browse list, we use the status already embedded in the food item.
  const getStatus = () => {
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

  const status = getStatus()

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-[var(--border-subtle)] last:border-b-0 gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[var(--text-primary)] truncate">{food.name}</p>
        {food.aliases.length > 0 && (
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
            Also: {food.aliases.slice(0, 3).join(', ')}
            {food.aliases.length > 3 ? ` +${food.aliases.length - 3} more` : ''}
          </p>
        )}
        {status === 'moderation' && food.moderation_note && (
          <p className="text-xs text-[var(--status-moderation-text)] mt-1">
            {food.moderation_note}
          </p>
        )}
      </div>
      <StatusBadge status={status} size="sm" />
    </div>
  )
}
