import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-primary',
        className,
      )}
    />
  )
}