'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'

interface WelcomeScreenProps {
  onGetStarted: () => void
  onSignIn: () => void
  onContinueGuest: () => void
}

export function WelcomeScreen({ onGetStarted, onSignIn, onContinueGuest }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center">
      <div className="max-w-sm w-full space-y-8">
        {/* Logo / branding */}
        <div className="space-y-3">
          <span className="text-6xl" role="img" aria-label="Live WildFit">🌿</span>
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">
            Live WildFit
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium">
            The most effortless way to stay in season
          </p>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Instant food lookup for every week of your WILDFIT® cycle. Know exactly what to eat — at the grocery store, at a restaurant, or at home.
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onGetStarted}
          >
            Get Started
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onSignIn}
          >
            Sign In
          </Button>
          <button
            onClick={onContinueGuest}
            className="text-sm text-[var(--text-muted)] underline hover:text-[var(--text-secondary)] transition-colors"
          >
            Continue without account
          </button>
        </div>
      </div>
    </div>
  )
}
