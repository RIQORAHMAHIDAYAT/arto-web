import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type StatTone = 'neutral' | 'income' | 'expense' | 'info'

const iconTone: Record<StatTone, string> = {
  neutral: 'bg-primary/10 text-primary',
  income: 'bg-success/10 text-success',
  expense: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'neutral',
  hint,
}: {
  label: string
  value: string
  icon: ReactNode
  tone?: StatTone
  hint?: string
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-card)] ring-1 ring-border sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconTone[tone])} aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-1 truncate text-xl font-extrabold tabular-nums text-foreground sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}