'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface ProfileSectionProps {
  profile: Profile
  email?: string
  isAnonymous?: boolean
  onUpdate: (updated: Partial<Profile>) => void
}

export function ProfileSection({ profile, email, isAnonymous, onUpdate }: ProfileSectionProps) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName || null })
      .eq('id', profile.id)

    setSaving(false)
    if (updateError) {
      setError('Failed to save. Please try again.')
    } else {
      setSaved(true)
      onUpdate({ display_name: displayName || null })
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profile</h2>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 space-y-4">
        <div className="flex items-end gap-3">
          <Input
            label="Display name"
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={e => {
              setDisplayName(e.target.value)
              setSaved(false)
            }}
            className="flex-1"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            {saved ? 'Saved!' : 'Save'}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-[var(--destructive)]" role="alert">{error}</p>
        )}

        {!isAnonymous && email && (
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Email address</p>
            <p className="text-sm text-[var(--text-muted)]">{email}</p>
          </div>
        )}
      </div>
    </section>
  )
}
