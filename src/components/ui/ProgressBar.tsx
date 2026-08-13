import { cn } from '@/lib/cn'

type Tone = 'success' | 'danger' | 'warning' | 'info' | 'secondary'

const barTone: Record<Tone, string> = {
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
  secondary: 'bg-secondary',
}

export function ProgressBar({
  value,
  tone = 'secondary',
  className,
  showLabel,
}: {
  /** Nilai 0..1 */
  value: number
  tone?: Tone
  className?: string
  showLabel?: boolean
}) {
  const percent = Math.max(0, Math.min(100, value * 100))
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-muted/20">
        <div className={cn('h-full rounded-full transition-[width] duration-500', barTone[tone])} style={{ width: `${percent}%` }} />
      </div>
      {showLabel && (
        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">{Math.round(percent)}%</span>
      )}
    </div>
  )
}