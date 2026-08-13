import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function EmptyState({
  icon = '🗂️',
  title,
  description,
  action,
  className,
}: {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center', className)}>
      <span className="mb-3 text-4xl" role="img" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}