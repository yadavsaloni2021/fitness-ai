'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { CycleSection } from '@/components/settings/CycleSection'
import { CategorySection } from '@/components/settings/CategorySection'
import { AppearanceSection } from '@/components/settings/AppearanceSection'
import { AccountSection } from '@/components/settings/AccountSection'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { logSessionEvent } from '@/lib/analytics'
import { recordNavigation } from '@/lib/install-prompt'
import { createClient } from '@/lib/supabase/client'
import type { Profile, ComputedCycleState, CycleNotConfigured } from '@/types'

type CycleData = ComputedCycleState | CycleNotConfigured | null

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [cycleData, setCycleData] = useState<CycleData>(null)
  const [email, setEmail] = useState<string | undefined>(undefined)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    recordNavigation()
    loadData()
  }, [])

  async function loadData() {
    try {
      // Get user info
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/onboarding')
        return
      }

      setEmail(user.email)
      setIsAnonymous(user.is_anonymous ?? false)

      // Load profile and cycle in parallel
      const [profileRes, cycleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        fetch('/api/cycle'),
      ])

      if (profileRes.data) {
        setProfile(profileRes.data as Profile)
        // Apply saved theme
        const theme = (profileRes.data as Profile).theme
        if (theme && theme !== 'system') {
          document.documentElement.setAttribute('data-theme', theme)
        }
      } else {
        // Create default profile if missing
        const { data: newProfile } = await supabase
          .from('profiles')
          .upsert({ id: user.id, display_name: null })
          .select()
          .single()
        if (newProfile) setProfile(newProfile as Profile)
      }

      if (cycleRes.ok) {
        const data = await cycleRes.json()
        setCycleData(data)
        logSessionEvent('settings', data.configured ? data.computed_week : null)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/onboarding')
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-24 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="rounded-xl bg-[var(--status-moderation-bg)] border border-[var(--status-moderation-border)] px-4 py-4 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-[var(--status-moderation-text)]">{error}</p>
          <Button variant="secondary" size="sm" onClick={loadData}>Retry</Button>
        </div>
      </div>
    )
  }

  const timezone = profile?.timezone ?? 'UTC'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>

      {/* Profile */}
      {profile && (
        <ProfileSection
          profile={profile}
          email={email}
          isAnonymous={isAnonymous}
          onUpdate={updates => setProfile(prev => prev ? { ...prev, ...updates } : prev)}
        />
      )}

      {/* Cycle */}
      {cycleData?.configured && (
        <CycleSection
          cycleState={cycleData}
          timezone={timezone}
          onUpdate={loadData}
        />
      )}

      {/* Category (Weeks 9-10 only) */}
      {cycleData?.configured && (cycleData.computed_week === 9 || cycleData.computed_week === 10) && (
        <CategorySection
          cycleState={cycleData}
          onUpdate={loadData}
        />
      )}

      {/* Appearance */}
      {profile && (
        <AppearanceSection
          currentTheme={profile.theme}
          userId={profile.id}
          onThemeChange={theme =>
            setProfile(prev => prev ? { ...prev, theme } : prev)
          }
        />
      )}

      {/* Account */}
      <AccountSection
        isAnonymous={isAnonymous}
        onCycleReset={loadData}
      />

      {/* Attribution */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 space-y-2">
        <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">About</h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Live WildFit is an independent personal project inspired by nutritional seasonality principles.
          It is not affiliated with, endorsed by, or sponsored by WILDFIT® or Eric Edmeades.
        </p>
      </div>

      {/* Sign out */}
      <div className="pb-8">
        <Button
          variant="ghost"
          size="md"
          className="w-full text-[var(--text-muted)]"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}
