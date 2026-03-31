'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)
    if (signInError) {
      setError(signInError.message)
    } else {
      router.push('/')
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })
    if (oauthError) setError(oauthError.message)
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address first, then click Forgot password.')
      return
    }
    setError(null)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/settings`,
    })
    if (resetError) {
      setError(resetError.message)
    } else {
      setSuccessMessage('Check your email for a password reset link.')
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <span className="text-4xl" role="img" aria-label="Live WildFit">🌿</span>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back</h1>
          <p className="text-sm text-[var(--text-muted)]">Sign in to your Live WildFit account</p>
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
        <form onSubmit={handleEmailSignIn} className="space-y-4">
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
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-[var(--destructive)]" role="alert">{error}</p>
          )}
          {successMessage && (
            <p className="text-sm text-[var(--color-primary)]">{successMessage}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            Sign In
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-[var(--text-muted)] underline hover:text-[var(--text-secondary)]"
            >
              Forgot password?
            </button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-[var(--text-muted)]">
            Don&apos;t have an account?{' '}
            <Link href="/auth/onboarding" className="text-[var(--color-primary)] underline hover:opacity-80">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
