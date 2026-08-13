import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface BarDatum {
  label: string
  values: Array<{ key: string; value: number; color: string }>
}

interface BarChartProps {
  data: BarDatum[]
  height?: number
  unit?: string
}

function maxValue(data: BarDatum[]): number {
  let max = 0
  for (const d of data) {
    for (const v of d.values) if (v.value > max) max = v.value
  }
  return max || 1
}

export function BarChart({ data, height = 180 }: BarChartProps) {
  const max = maxValue(data)
  return (
    <div className="w-full">
      <div className="flex items-end gap-1 sm:gap-2" style={{ height }} role="img" aria-label="Grafik batang">
        {data.map((d) => (
          <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full max-w-10 items-end justify-center gap-0.5">
              {d.values.map((v) => {
                const percent = Math.max(2, (v.value / max) * 100)
                return (
                  <div
                    key={v.key}
                    className="w-full rounded-t-sm transition-[height] duration-500"
                    style={{ height: `${percent}%`, backgroundColor: v.color }}
                    title={`${d.label} · ${v.value}`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 truncate text-center text-[10px] text-muted sm:text-xs">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartLegend({ items }: { items: Array<{ key: string; label: string; color: string }> }) {
  return (
    <div className="flex items-center gap-4 text-xs text-muted">
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl bg-surface p-5 shadow-[var(--shadow-card)] ring-1 ring-border', className)}>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {subtitle && <p className="mb-3 mt-0.5 text-xs text-muted">{subtitle}</p>}
      {children}
    </div>
  )
}