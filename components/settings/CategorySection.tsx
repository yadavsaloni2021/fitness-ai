'use client'

import React, { useEffect, useState } from 'react'
import type { ComputedCycleState } from '@/types'

interface CategorySectionProps {
  cycleState: ComputedCycleState
  onUpdate: () => void
}

const categoryOptions = [
  { value: 1, label: 'Category 1' },
  { value: 2, label: 'Category 2' },
  { value: 3, label: 'Category 3' },
]

export function CategorySection({ cycleState, onUpdate }: CategorySectionProps) {
  const [category, setCategory] = useState(cycleState.category ?? 2)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCategory(cycleState.category ?? 2)
  }, [cycleState.category])

  const handleCategoryChange = async (nextCategory: number) => {
    setCategory(nextCategory)
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/cycle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: nextCategory }),
      })

      if (!res.ok) {
        throw new Error('Failed to update category')
      }

      onUpdate()
    } catch (err) {
      console.error(err)
      setError('Failed to save your category. Please try again.')
      setCategory(cycleState.category ?? 2)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Category</h2>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Your Week 9–10 category</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            This setting updates food status immediately.
          </p>
        </div>

        <select
          value={category}
          onChange={e => handleCategoryChange(parseInt(e.target.value, 10))}
          disabled={saving}
          className="w-full rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60"
        >
          {categoryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-sm text-[var(--destructive)]" role="alert">{error}</p>
        )}
      </div>
    </section>
  )
}
