import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', width, height, style }: SkeletonProps) {
  return (
    <div
      className={['skeleton', className].join(' ')}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={['space-y-2', className].join(' ')}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 rounded"
          style={{ width: i === lines - 1 ? '75%' : '100%' } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 space-y-3',
        className,
      ].join(' ')}
    >
      <Skeleton className="h-6 w-32 rounded" />
      <SkeletonText lines={3} />
    </div>
  )
}
