import React from 'react'

interface ProgressBarProps {
  cycleDay: number
}

// Fall = Days 1–21 (amber)
// Winter = Days 22–42 (sky-blue)
// Spring = Days 43–84 (forest-green)
const FALL_END = 21
const WINTER_END = 42
const TOTAL_DAYS = 84

export function ProgressBar({ cycleDay }: ProgressBarProps) {
  const clampedDay = Math.max(0, Math.min(cycleDay, TOTAL_DAYS))
  const progressPercent = (clampedDay / TOTAL_DAYS) * 100

  // Width percentages for each season segment
  const fallWidth = (FALL_END / TOTAL_DAYS) * 100      // 25%
  const winterWidth = ((WINTER_END - FALL_END) / TOTAL_DAYS) * 100  // 25%
  const springWidth = ((TOTAL_DAYS - WINTER_END) / TOTAL_DAYS) * 100  // 50%

  // Position of the indicator (0–100%)
  const indicatorLeft = progressPercent

  return (
    <div className="w-full space-y-2">
      {/* Labels */}
      <div className="flex text-xs text-[var(--text-muted)] font-medium">
        <span style={{ width: `${fallWidth}%` }} className="text-center">Fall</span>
        <span style={{ width: `${winterWidth}%` }} className="text-center">Winter</span>
        <span style={{ width: `${springWidth}%` }} className="text-center">Spring</span>
      </div>

      {/* Bar */}
      <div
        className="relative h-4 rounded-full overflow-hidden flex"
        role="progressbar"
        aria-valuenow={clampedDay}
        aria-valuemin={0}
        aria-valuemax={TOTAL_DAYS}
        aria-label={`Cycle progress: Day ${clampedDay} of ${TOTAL_DAYS}`}
      >
        {/* Fall segment */}
        <div
          className="h-full"
          style={{
            width: `${fallWidth}%`,
            backgroundColor: 'var(--season-fall)',
            opacity: 0.4,
          }}
        />
        {/* Winter segment */}
        <div
          className="h-full"
          style={{
            width: `${winterWidth}%`,
            backgroundColor: 'var(--season-winter)',
            opacity: 0.4,
          }}
        />
        {/* Spring segment */}
        <div
          className="h-full"
          style={{
            width: `${springWidth}%`,
            backgroundColor: 'var(--season-spring)',
            opacity: 0.4,
          }}
        />

        {/* Filled progress overlay */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${indicatorLeft}%`,
            background: clampedDay <= FALL_END
              ? 'var(--season-fall)'
              : clampedDay <= WINTER_END
              ? `linear-gradient(to right, var(--season-fall) ${fallWidth}%, var(--season-winter))`
              : `linear-gradient(to right, var(--season-fall) ${fallWidth}%, var(--season-winter) ${fallWidth + winterWidth}%, var(--season-spring))`,
          }}
        />
      </div>

      {/* Day markers */}
      <div className="flex text-xs text-[var(--text-muted)]">
        <span>Day 1</span>
        <span className="ml-auto" style={{ marginLeft: `${fallWidth}%`, transform: 'translateX(-50%)' }}>21</span>
        <span className="ml-auto" style={{ marginLeft: `calc(${winterWidth}% - 2rem)`, transform: 'translateX(-50%)' }}>42</span>
        <span className="ml-auto">84</span>
      </div>
    </div>
  )
}
