import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
}

export function Input({
  label,
  error,
  helpText,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-xl border px-4 py-2.5 text-[var(--text-primary)] bg-[var(--bg-card)]',
          'placeholder:text-[var(--text-muted)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1',
          'transition-colors',
          error
            ? 'border-[var(--alert-red)] focus:ring-[var(--destructive)]'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p className="text-xs text-[var(--destructive)]" role="alert">
          {error}
        </p>
      )}
      {!error && helpText && (
        <p className="text-xs text-[var(--text-muted)]">{helpText}</p>
      )}
    </div>
  )
}
