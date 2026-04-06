'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { seasonJumpStartDate } from '@/lib/cycle'
import type { ComputedCycleState } from '@/types'

interface CycleSectionProps {
  cycleState: ComputedCycleState
  timezone: string
  onUpdate: () => void
}

export function CycleSection({ cycleState, timezone, onUpdate }: CycleSectionProps) {
  const [targetWeek, setTargetWeek] = useState(cycleState.current_week)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<number>(cycleState.category ?? 2)
  const [savingCategory, setSavingCategory] = useState(false)

  useEffect(() => {
    setCategory(cycleState.category ?? 2)
  }, [cycleState.category])

  const proposedStartDate = useMemo(
    () => seasonJumpStartDate(targetWeek, timezone),
    [targetWeek, timezone]
  )

  const handleWeekChange = (week: number) => {
    setTargetWeek(week)
    setError(null)
  }

  const handleJumpRequest = () => {
    setError(null)
    if (targetWeek === cycleState.current_week) return
    if (!proposedStartDate) {
      setError('Unable to calculate the new cycle date. Please try again.')
      return
    }
    setDialogOpen(true)
  }

  const handleConfirmJump = async () => {
    setSaving(true)
    setError(null)
    setDialogOpen(false)

    try {
      const res = await fetch('/api/cycle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_week: targetWeek }),
      })

      if (!res.ok) {
        throw new Error('Failed to update cycle')
      }

      onUpdate()
    } catch (err) {
      console.error(err)
      setError('Failed to update your cycle. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCategory = async () => {
    setSavingCategory(true)
    setError(null)

    try {
      const res = await fetch('/api/cycle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })

      if (!res.ok) {
        throw new Error('Failed to update category')
      }

      onUpdate()
    } catch (err) {
      console.error(err)
      setError('Failed to update your category. Please try again.')
    } finally {
      setSavingCategory(false)
    }
  }

  function formatDate(dateStr: string, options: Intl.DateTimeFormatOptions): string {
    try {
      const d = new Date(dateStr + 'T00:00:00')
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-US', options)
    } catch {
      return dateStr
    }
  }

  const startDateFormatted = formatDate(cycleState.start_date, { month: 'long', day: 'numeric', year: 'numeric' })
  const proposedDateFormatted = proposedStartDate
    ? formatDate(proposedStartDate, { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Cycle</h2>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 space-y-4">
        {/* Current state */}
        <div className="text-sm text-[var(--text-muted)]">
          <p>Currently on <strong className="text-[var(--text-primary)]">Week {cycleState.computed_week}</strong></p>
          <p>Started: {startDateFormatted}</p>
        </div>

        {/* Season jump */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Jump to week
          </label>
          <div className="flex gap-2">
            <select
              value={targetWeek}
              onChange={e => handleWeekChange(parseInt(e.target.value, 10))}
              className="flex-1 rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="md"
              onClick={handleJumpRequest}
              loading={saving}
              disabled={saving || targetWeek === cycleState.current_week}
            >
              Apply
            </Button>
          </div>
        </div>

        {/* Category (Week 9+) */}
        {cycleState.computed_week >= 9 && (
          <div className="space-y-2 border-t border-[var(--border-subtle)] pt-4">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value={1}>Category 1</option>
              <option value={2}>Category 2</option>
              <option value={3}>Category 3</option>
            </select>
            <Button
              variant="secondary"
              size="md"
              onClick={handleSaveCategory}
              loading={savingCategory}
              disabled={savingCategory || category === cycleState.category}
            >
              Save category
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-[var(--destructive)]" role="alert">{error}</p>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog
        open={dialogOpen}
        title="Change your week?"
        message={`This will set your cycle to Week ${targetWeek} starting ${proposedDateFormatted}. Continue?`}
        confirmLabel="Yes, change week"
        cancelLabel="Cancel"
        onConfirm={handleConfirmJump}
        onCancel={() => setDialogOpen(false)}
      />
    </section>
  )
}
