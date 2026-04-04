'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen'
import { CreateAccountScreen } from '@/components/onboarding/CreateAccountScreen'
import { YourCycleScreen } from '@/components/onboarding/YourCycleScreen'
import { createClient } from '@/lib/supabase/client'
import { logSessionEvent } from '@/lib/analytics'
import { seasonJumpStartDate } from '@/lib/cycle'

type OnboardingStep = 'welcome' | 'create-account' | 'your-cycle'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [savingCycle, setSavingCycle] = useState(false)

  useEffect(() => {
    // If already authenticated, go directly to cycle setup or home
    checkSession()
  }, [])

  async function checkSession() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Check if cycle is already configured
      const res = await fetch('/api/cycle')
      if (res.ok) {
        const data = await res.json()
        if (data.configured) {
          router.replace('/')
          return
        }
      }
      // Has session but no cycle — go to cycle setup
      setStep('your-cycle')
    }
  }

  const handleGetStarted = () => {
    setStep('create-account')
  }

  const handleSignIn = () => {
    router.push('/auth/login')
  }

  const handleContinueGuest = async () => {
    // Sign in anonymously
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('Anonymous sign-in failed:', error.message)
    }
    setStep('your-cycle')
  }

  const handleAccountCreated = () => {
    setStep('your-cycle')
  }

  const handleAccountSkipped = async () => {
    // Skip account creation — sign in anonymously if not already signed in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      await supabase.auth.signInAnonymously()
    }
    setStep('your-cycle')
  }

  const handleCycleComplete = async (data: {
    startDate: string
    startingWeek: number
    category: number | null
  }) => {
    setSavingCycle(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user session')

      // Compute start_date aligned to clean week boundary if starting mid-cycle
      const startDate = data.startingWeek > 1
        ? seasonJumpStartDate(data.startingWeek, 'UTC')
        : data.startDate

      // Save cycle state
      const res = await fetch('/api/cycle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate,
          current_week: data.startingWeek,
          category: data.category,
        }),
      })

      if (!res.ok) throw new Error('Failed to save cycle')

      logSessionEvent('onboarding', data.startingWeek)
      router.push('/')
    } catch (err) {
      console.error('Failed to save cycle:', err)
      setSavingCycle(false)
    }
  }

  return (
    <>
      {step === 'welcome' && (
        <WelcomeScreen
          onGetStarted={handleGetStarted}
          onSignIn={handleSignIn}
          onContinueGuest={handleContinueGuest}
        />
      )}
      {step === 'create-account' && (
        <CreateAccountScreen
          onSuccess={handleAccountCreated}
          onSkip={handleAccountSkipped}
          onBack={() => setStep('welcome')}
        />
      )}
      {step === 'your-cycle' && (
        <YourCycleScreen
          onComplete={handleCycleComplete}
          onBack={() => setStep('create-account')}
          loading={savingCycle}
        />
      )}
    </>
  )
}
