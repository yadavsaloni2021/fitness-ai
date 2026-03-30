import React from 'react'
import type { FoodStatus } from '@/types'

interface BadgeProps {
  status: FoodStatus
  className?: string
}

const statusConfig: Record<FoodStatus, { label: string; style: string }> = {
  in: {
    label: 'IN SEASON',
    style: 'bg-[var(--status-in-bg)] text-[var(--status-in-text)] border border-[var(--status-in-border)]',
  },
  moderation: {
    label: 'MODERATION',
    style: 'bg-[var(--status-moderation-bg)] text-[var(--status-moderation-text)] border border-[var(--status-moderation-border)]',
  },
  out: {
    label: 'OUT OF SEASON',
    style: 'bg-[var(--status-out-bg)] text-[var(--status-out-text)] border border-[var(--status-out-border)]',
  },
  never: {
    label: 'NOT RECOMMENDED',
    style: 'bg-[var(--status-never-bg)] text-[var(--status-never-text)] border border-[var(--status-never-border)]',
  },
}

export function Badge({ status, className = '' }: BadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide',
        config.style,
        className,
      ].join(' ')}
    >
      {config.label}
    </span>
  )
}
