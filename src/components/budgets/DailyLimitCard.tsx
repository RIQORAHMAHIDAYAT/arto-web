import type { DailyLimitInfo } from '@/types'
import { formatRupiah, formatNumber } from '@/lib/currency'
import { formatDateShort } from '@/lib/date'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { isWithinDailyLimit } from '@/domain/dailyLimit'

export function DailyLimitCard({ dailyLimit }: { dailyLimit: DailyLimitInfo }) {
  const safe = isWithinDailyLimit(dailyLimit.spentToday, dailyLimit.dailyLimit)
  const usedOfLimit = dailyLimit.dailyLimit > 0 ? dailyLimit.spentToday / dailyLimit.dailyLimit : (dailyLimit.spentToday > 0 ? 1 : 0)
  const label = dailyLimit.dailyLimit <= 0 ? 'Batas tercapai' : safe ? 'Aman' : 'Melebihi'

  return (
    <div className={`rounded-2xl p-6 shadow-xl ring-1 ${safe ? 'bg-success/5 ring-success/20' : 'bg-danger/5 ring-danger/20'}`}>
      <div className="flex flex-col items-center justify-center text-center">
        <h2 className="text-sm font-bold tracking-wider text-muted uppercase">Sisa Jatah Harian Anda</h2>
        <p className={`mt-2 text-4xl sm:text-5xl font-black tabular-nums tracking-tight ${safe ? 'text-success' : 'text-danger'}`}>
          {formatRupiah(dailyLimit.remainingToday)}
        </p>
        <p className="mt-2 text-sm text-muted">
          Rekomendasi maksimal: {formatRupiah(dailyLimit.dailyLimit)} / hari
        </p>
        {label === 'Melebihi' && (
          <div className="mt-4 inline-block rounded-full bg-danger/20 px-3 py-1 text-xs font-bold text-danger">
            ⚠️ Anda sudah melebihi batas harian!
          </div>
        )}
        {label === 'Batas tercapai' && (
          <div className="mt-4 inline-block rounded-full bg-warning/20 px-3 py-1 text-xs font-bold text-warning">
            ⚠️ Budget periode ini sudah habis.
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-border/50 pt-4 grid grid-cols-2 gap-4 text-center">
        <div>
           <p className="text-xs text-muted">Terpakai Hari Ini</p>
           <p className="text-lg font-bold text-foreground">{formatRupiah(dailyLimit.spentToday)}</p>
        </div>
        <div>
           <p className="text-xs text-muted">Sisa Jatah Bulanan</p>
           <p className="text-lg font-bold text-foreground">{formatRupiah(dailyLimit.remainingBudget)}</p>
        </div>
      </div>
      <ProgressBar value={usedOfLimit} tone={safe ? 'success' : 'danger'} className="mt-4" />
      <p className="mt-3 text-center text-xs text-muted">
        Dibagi untuk {formatNumber(dailyLimit.remainingDays)} hari tersisa (berakhir {formatDateShort(dailyLimit.periodEnd)}).
      </p>
    </div>
  )
}