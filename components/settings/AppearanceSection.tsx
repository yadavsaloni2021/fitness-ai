'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Theme = 'light' | 'dark' | 'system'

interface AppearanceSectionProps {
  currentTheme: Theme
  userId: string
  onThemeChange: (theme: Theme) => void
}

const themes: { value: Theme; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Always light mode' },
  { value: 'dark', label: 'Dark', description: 'Always dark mode' },
  { value: 'system', label: 'System', description: 'Follow your device setting' },
]

export function AppearanceSection({ currentTheme, userId, onThemeChange }: AppearanceSectionProps) {
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleThemeChange = async (theme: Theme) => {
    // Apply immediately and persist to localStorage for cross-page init
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme')
      localStorage.removeItem('lw-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('lw-theme', theme)
    }
    onThemeChange(theme)

    // Save to profile
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ theme })
      .eq('id', userId)
    setSaving(false)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Appearance {saving && <span className="text-xs text-[var(--text-muted)] font-normal ml-2">Saving...</span>}
      </h2>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
        {themes.map(theme => (
          <label
            key={theme.value}
            className={[
              'flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0 cursor-pointer transition-colors',
              currentTheme === theme.value ? 'bg-[var(--bg-card-highlight)]' : 'hover:bg-[var(--border-subtle)]',
            ].join(' ')}
          >
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{theme.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{theme.description}</p>
            </div>
            <input
              type="radio"
              name="theme"
              value={theme.value}
              checked={currentTheme === theme.value}
              onChange={() => handleThemeChange(theme.value)}
              className="accent-[var(--color-primary)]"
            />
          </label>
        ))}
      </div>
    </section>
  )
}
