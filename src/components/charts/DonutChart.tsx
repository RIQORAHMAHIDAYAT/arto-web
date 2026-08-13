import type { ReactNode } from 'react'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerSub?: string
}

const FALLBACK_COLORS = ['#16A34A', '#2563EB', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16']

export function DonutChart({ segments, size = 160, thickness = 22, centerLabel, centerSub }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let offset = 0
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg, i) => {
      const fraction = total > 0 ? seg.value / total : 0
      const arc = {
        id: `${seg.label}-${i}`,
        color: seg.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        dash: fraction * circumference,
        gap: Math.max(2, circumference * 0.004),
        offset,
      }
      offset += fraction * circumference
      return arc
    })

  const label = centerLabel ?? (total > 0 ? String(Math.round(total)) : '0')

  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={arcs.map((a) => a.id).join(', ')}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={thickness} className="stroke-muted/20" />
        {arcs.map((arc) => (
          <circle
            key={arc.id}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={thickness}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold tabular-nums text-foreground">{label}</span>
        {centerSub && <span className="text-xs text-muted">{centerSub}</span>}
      </div>
    </div>
  )
}

export function DonutLegend({ segments, renderLabel }: { segments: DonutSegment[]; renderLabel?: (s: DonutSegment) => ReactNode }) {
  return (
    <ul className="mt-4 space-y-2">
      {segments.map((s, i) => (
        <li key={`${s.label}-${i}`} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }} aria-hidden="true" />
            <span className="truncate text-foreground">{renderLabel ? renderLabel(s) : s.label}</span>
          </span>
          <span className="tabular-nums text-muted">{Math.round((s.value / (segments.reduce((a, b) => a + b.value, 0) || 1)) * 100)}%</span>
        </li>
      ))}
    </ul>
  )
}