import React from 'react'
import type { FoodStatus } from '@/types'

interface StatusBadgeProps {
  status: FoodStatus
  size?: 'sm' | 'md'
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

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-semibold tracking-wide whitespace-nowrap',
        config.style,
        sizeStyles[size],
      ].join(' ')}
    >
      {config.label}
    </span>
  )
}
