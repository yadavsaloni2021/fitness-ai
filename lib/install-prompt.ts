import type { BeforeInstallPromptEvent } from '@/types'

const PROMPT_KEY       = 'lw:install:nav_count'
const PROMPT_SHOWN_KEY = 'lw:install:shown'
const THRESHOLD        = 3

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    maybeShowPrompt()
  })
}

export function recordNavigation(): void {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem(PROMPT_SHOWN_KEY)) return
  const count = parseInt(localStorage.getItem(PROMPT_KEY) ?? '0', 10) + 1
  localStorage.setItem(PROMPT_KEY, String(count))
  if (count >= THRESHOLD) maybeShowPrompt()
}

function maybeShowPrompt(): void {
  if (!deferredPrompt) return
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem(PROMPT_SHOWN_KEY)) return
  const count = parseInt(localStorage.getItem(PROMPT_KEY) ?? '0', 10)
  if (count < THRESHOLD) return
  window.dispatchEvent(new CustomEvent('lw:show-install-prompt'))
}

export async function triggerInstall(): Promise<void> {
  if (!deferredPrompt) return
  await deferredPrompt.prompt()
  localStorage.setItem(PROMPT_SHOWN_KEY, '1')
  deferredPrompt = null
}
