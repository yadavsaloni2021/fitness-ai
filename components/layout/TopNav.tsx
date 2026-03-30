'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/foods', label: 'Foods' },
  { href: '/weeks/1', label: 'Weekly Guide' },
  { href: '/settings', label: 'Settings' },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="hidden md:block sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-[var(--color-primary)] hover:opacity-80 transition-opacity"
        >
          🌿 Live WildFit
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map(link => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : link.href.startsWith('/weeks')
                ? pathname.startsWith('/weeks')
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
