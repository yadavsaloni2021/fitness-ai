'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

interface CreateAccountScreenProps {
  onSuccess: () => void
  onSkip: () => void
  onBack: () => void
}

export function CreateAccountScreen({ onSuccess, onSkip, onBack }: CreateAccountScreenProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!termsAccepted) {
      setError('Please accept the Terms and Privacy Policy to continue.')
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        // Upsert profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: name || null,
        })
        onSuccess()
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)

    if (!termsAccepted) {
      setError('Please accept the Terms and Privacy Policy to continue.')
      return
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })
    if (oauthError) {
      setError(oauthError.message)
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8">
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={onBack}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Go back"
        >
          ←
        </button>
        <span className="text-sm text-[var(--text-muted)]">Step 2 of 3</span>
      </div>

      <div className="max-w-sm w-full mx-auto flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create account</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Save your cycle data across devices.
          </p>
        </div>

        {/* Google sign-in */}
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleGoogleSignIn}
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-[var(--border-subtle)]" />
          <span className="text-xs text-[var(--text-muted)]">or</span>
          <div className="flex-1 border-t border-[var(--border-subtle)]" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <Input
            label="Display name"
            type="text"
            placeholder="Alex"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="alex@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="8+ characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <label htmlFor="terms-checkbox" className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
            <input
              id="terms-checkbox"
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--border-subtle)] text-[var(--accent-400)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
            <span>I agree to the Terms and Privacy Policy.</span>
          </label>

          {error && (
            <p className="text-sm text-[var(--destructive)]" role="alert">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            Create Account
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-sm text-[var(--text-muted)] underline hover:text-[var(--text-secondary)] transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
