import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'

export function LoadingBlock({ label = 'Memuat…', className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-muted', className)}
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  )
}