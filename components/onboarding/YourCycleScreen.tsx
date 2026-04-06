'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { seasonJumpStartDate } from '@/lib/cycle'

interface YourCycleScreenProps {
  onComplete: (data: {
    startDate: string
    startingWeek: number
    category: number | null
  }) => void
  onBack: () => void
  loading?: boolean
}

const categoryDescriptions = [
  {
    value: 1,
    label: 'Category 1',
    description: 'You have reached your primary health or weight goal and are ready to gradually reintroduce less-sweet fruits.',
  },
  {
    value: 2,
    label: 'Category 2 (default)',
    description: 'You have made significant progress but haven\'t fully reached your goal. Deep Spring guidelines continue.',
  },
  {
    value: 3,
    label: 'Category 3',
    description: 'You are in the early stages of progress. Most restrictive Spring guidelines apply.',
  },
]

export function YourCycleScreen({ onComplete, onBack, loading }: YourCycleScreenProps) {
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [startingWeek, setStartingWeek] = useState(1)
  const [category, setCategory] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const showCategorySelector = startingWeek === 9 || startingWeek === 10

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!startDate) {
      setError('Please select a start date.')
      return
    }

    onComplete({ startDate, startingWeek, category })
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8">
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={onBack}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Go back"
        >
          ←
        </button>
        <span className="text-sm text-[var(--text-muted)]">Step 3 of 3</span>
      </div>

      <div className="max-w-sm w-full mx-auto flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Your cycle</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Tell us where you are in the program.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Start date */}
          <Input
            label="Cycle start date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            helpText="The date you began (or plan to begin) Week 1."
          />

          {/* Starting week */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Starting week
            </label>
            <select
              value={startingWeek}
              onChange={e => {
                const w = parseInt(e.target.value, 10)
                setStartingWeek(w)
                // Reset category if leaving weeks 9–10
                if (w !== 9 && w !== 10) setCategory(null)
                // Auto-adjust start date per helper text
                if (w === 1) {
                  setStartDate(today)
                } else {
                  const computed = seasonJumpStartDate(w, 'UTC')
                  if (computed) setStartDate(computed)
                }
              }}
              className="w-full rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--text-muted)]">
              If you are mid-cycle, choose your current week. The start date will be adjusted automatically.
            </p>
          </div>

          {/* Category selector — only for weeks 9 and 10 */}
          {showCategorySelector && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Your category</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Weeks 9 and 10 have different food guidelines depending on your progress. Defaults to Category 2 if you&apos;re not sure.
                </p>
              </div>
              <div className="space-y-2">
                {categoryDescriptions.map(cat => (
                  <label
                    key={cat.value}
                    className={[
                      'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                      category === cat.value
                        ? 'border-[var(--color-primary)] bg-[var(--bg-card-highlight)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-card)]',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={category === cat.value}
                      onChange={() => setCategory(cat.value)}
                      className="mt-0.5 accent-[var(--color-primary)]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{cat.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{cat.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-[var(--destructive)]" role="alert">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            Start My Cycle
          </Button>
        </form>
      </div>
    </div>
  )
}
