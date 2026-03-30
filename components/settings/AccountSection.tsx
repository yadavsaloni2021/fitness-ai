'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AccountSectionProps {
  isAnonymous: boolean
  onCycleReset: () => void
}

export function AccountSection({ isAnonymous, onCycleReset }: AccountSectionProps) {
  const router = useRouter()
  const supabase = createClient()

  // Reset cycle dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  // Delete account dialog — two step
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0) // 0=closed, 1=first confirm, 2=final confirm
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Upgrade to full account
  const [upgradeEmail, setUpgradeEmail] = useState('')
  const [upgradePassword, setUpgradePassword] = useState('')
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  const handleResetCycle = async () => {
    setResetting(true)
    setResetError(null)
    setResetDialogOpen(false)

    try {
      const res = await fetch('/api/cycle', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to reset')
      onCycleReset()
    } catch (err) {
      console.error(err)
      setResetError('Failed to reset your cycle. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.')
      return
    }

    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete request failed')
      // Session is now invalid — sign out locally and redirect
      await supabase.auth.signOut()
      router.push('/auth/onboarding')
    } catch (err) {
      console.error(err)
      setDeleteError('Failed to delete account. Please try again or contact support.')
    } finally {
      setDeleting(false)
      setDeleteStep(0)
    }
  }

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpgrading(true)
    setUpgradeError(null)

    const { error } = await supabase.auth.updateUser({
      email: upgradeEmail,
      password: upgradePassword,
    })

    setUpgrading(false)
    if (error) {
      setUpgradeError(error.message)
    } else {
      setUpgradeSuccess(true)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Account</h2>

      {/* Upgrade to full account (anon users only) */}
      {isAnonymous && !upgradeSuccess && (
        <div className="bg-[var(--bg-card-highlight)] rounded-2xl border border-[var(--border-default)] p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Save your progress</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Create a full account to access your cycle data on any device.
            </p>
          </div>
          <form onSubmit={handleUpgrade} className="space-y-3">
            <Input
              type="email"
              placeholder="Email address"
              value={upgradeEmail}
              onChange={e => setUpgradeEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password (8+ characters)"
              value={upgradePassword}
              onChange={e => setUpgradePassword(e.target.value)}
              required
              minLength={8}
            />
            {upgradeError && (
              <p className="text-xs text-[var(--destructive)]" role="alert">{upgradeError}</p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full"
              loading={upgrading}
            >
              Upgrade to Full Account
            </Button>
          </form>
        </div>
      )}

      {isAnonymous && upgradeSuccess && (
        <div className="bg-[var(--bg-card-highlight)] rounded-2xl border border-[var(--border-default)] p-4">
          <p className="text-sm text-[var(--text-primary)]">
            Check your email to confirm your account upgrade. Your data is safe.
          </p>
        </div>
      )}

      {/* Notifications */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Friday notifications</p>
            <p className="text-xs text-[var(--text-muted)]">Coming soon</p>
          </div>
          <div className="w-10 h-6 rounded-full bg-[var(--border-subtle)] opacity-50 cursor-not-allowed" aria-disabled="true" />
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Danger zone</h3>

        {/* Reset cycle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Reset cycle</p>
            <p className="text-xs text-[var(--text-muted)]">Restart from Week 1 today</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            loading={resetting}
          >
            Reset
          </Button>
        </div>
        {resetError && (
          <p className="text-xs text-[var(--destructive)]" role="alert">{resetError}</p>
        )}

        {/* Delete account */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--destructive)]">Delete account</p>
            <p className="text-xs text-[var(--text-muted)]">Permanently delete all data</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteStep(1)}
          >
            Delete
          </Button>
        </div>
        {deleteError && (
          <p className="text-xs text-[var(--destructive)]" role="alert">{deleteError}</p>
        )}
      </div>

      {/* Reset cycle confirmation dialog */}
      <Dialog
        open={resetDialogOpen}
        title="Reset your cycle?"
        message="This will restart your cycle from Week 1 today. This cannot be undone. Reset?"
        confirmLabel="Reset cycle"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={handleResetCycle}
        onCancel={() => setResetDialogOpen(false)}
      />

      {/* Delete account — step 1 */}
      <Dialog
        open={deleteStep === 1}
        title="Are you sure?"
        message="This will permanently delete your account and all associated data. This action is irreversible. Do you want to continue?"
        confirmLabel="Yes, I want to delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={() => setDeleteStep(2)}
        onCancel={() => setDeleteStep(0)}
      />

      {/* Delete account — step 2: type DELETE to confirm */}
      {deleteStep === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteStep(0)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-[var(--bg-card)] p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-[var(--destructive)]">Final confirmation</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Type <strong>DELETE</strong> to permanently delete your account. This cannot be undone.
            </p>
            <input
              type="text"
              placeholder="Type DELETE"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--destructive)]"
            />
            {deleteError && (
              <p className="text-xs text-[var(--destructive)]" role="alert">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setDeleteStep(0); setDeleteConfirmText('') }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                loading={deleting}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                Delete my account
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
