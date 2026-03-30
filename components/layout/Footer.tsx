import React from 'react'

export function Footer() {
  return (
    <footer className="mt-auto py-6 px-4 border-t border-[var(--border-subtle)]">
      <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed max-w-2xl mx-auto">
        Live WildFit is an independent personal project inspired by nutritional seasonality
        principles. It is not affiliated with, endorsed by, or sponsored by WILDFIT® or Eric
        Edmeades. WILDFIT® is a registered trademark of Eric Edmeades. For the official
        WILDFIT® program, visit{' '}
        <a
          href="https://www.getwildfit.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[var(--text-secondary)] transition-colors"
        >
          www.getwildfit.com
        </a>
        .
      </p>
    </footer>
  )
}
