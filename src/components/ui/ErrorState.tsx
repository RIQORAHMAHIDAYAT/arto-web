import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
  children?: ReactNode
}

export function ErrorState({
  title = 'Terjadi kesalahan',
  message,
  onRetry,
  className,
  children,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center rounded-xl border border-danger/20 bg-danger/5 px-6 py-10 text-center', className)}
    >
      <span className="mb-3 text-4xl" role="img" aria-hidden="true">
        ⚠️
      </span>
      <h3 className="text-base font-bold text-danger">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-surface"
        >
          Coba lagi
        </button>
      )}
      {children}
    </div>
  )
}