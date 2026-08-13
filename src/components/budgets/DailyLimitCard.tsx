import type { DailyLimitInfo } from '@/types'
import { formatRupiah, formatNumber } from '@/lib/currency'
import { formatDateShort } from '@/lib/date'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { isWithinDailyLimit } from '@/domain/dailyLimit'

export function DailyLimitCard({ dailyLimit }: { dailyLimit: DailyLimitInfo }) {
  const safe = isWithinDailyLimit(dailyLimit.spentToday, dailyLimit.dailyLimit)
  const usedOfLimit = dailyLimit.dailyLimit > 0 ? dailyLimit.spentToday / dailyLimit.dailyLimit : (dailyLimit.spentToday > 0 ? 1 : 0)
  const label = dailyLimit.dailyLimit <= 0 ? 'Batas tercapai' : safe ? 'Aman' : 'Melebihi'

  return (
    <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-card)] ring-1 ring-border">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-foreground">Batas Harian</h2>
        <Badge tone={label === 'Aman' ? 'success' : label === 'Melebihi' ? 'danger' : 'warning'}>
          {label}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted">
        Budget {dailyLimit.categoryName} · periode s.d. {formatDateShort(dailyLimit.periodEnd)}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-muted">Batas hari ini</p>
          <p className="text-lg font-extrabold tabular-nums text-foreground">{formatRupiah(dailyLimit.dailyLimit)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Terpakai hari ini</p>
          <p className="text-lg font-extrabold tabular-nums text-danger">{formatRupiah(dailyLimit.spentToday)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Sisa hari ini</p>
          <p className="text-lg font-extrabold tabular-nums text-success">{formatRupiah(dailyLimit.remainingToday)}</p>
        </div>
      </div>

      <ProgressBar value={usedOfLimit} tone={safe ? 'success' : 'danger'} className="mt-4" showLabel />
      <p className="mt-3 text-xs text-muted">
        Sisa budget {formatRupiah(dailyLimit.remainingBudget)} untuk {formatNumber(dailyLimit.remainingDays)} hari. Batas dihitung otomatis dari sisa budget dibagi sisa hari. Dihitung ulang setiap transaksi.
      </p>
    </div>
  )
}