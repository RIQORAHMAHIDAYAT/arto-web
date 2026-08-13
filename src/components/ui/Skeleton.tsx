import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'h-4 w-full rounded-md bg-muted/15 bg-[linear-gradient(90deg,transparent,rgba(148,163,184,0.15),transparent)] bg-[length:800px_100%]',
        className,
      )}
    />
  )
}

export function SkeletonCardCount({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}