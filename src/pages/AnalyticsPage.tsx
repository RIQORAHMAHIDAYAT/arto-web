import { useMemo, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { getAnalyticsSummary, getExpenseByCategory, getTrends, type AnalyticsRange } from '@/data/api/analyticsApi'
import { listBudgetSummary } from '@/data/api/budgetsApi'
import { PageHeader } from '@/pages/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { BarChart, ChartLegend } from '@/components/charts/BarChart'
import { DonutChart, DonutLegend } from '@/components/charts/DonutChart'
import { Card, CardHeader } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { TrendDownIcon, TrendUpIcon } from '@/components/icons'
import { formatRupiah } from '@/lib/currency'
import { toISODate } from '@/lib/date'
import { getErrorMessage } from '@/lib/errorMessage'

const DONUT_COLORS = ['#16A34A', '#2563EB', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16']

export function AnalyticsPage() {
  const now = new Date()
  const [fromDate, setFromDate] = useState(toISODate(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [toDate, setToDate] = useState(toISODate(now))
  const [bucket, setBucket] = useState<'day' | 'week'>('day')

  const range: AnalyticsRange = useMemo(() => ({ from: fromDate, to: toDate }), [fromDate, toDate])

  const { data, loading, error, refetch } = useAsync(
    async () => {
      const [summary, categories, trends, budgets] = await Promise.all([
        getAnalyticsSummary(range),
        getExpenseByCategory(range),
        getTrends(range, bucket),
        listBudgetSummary(),
      ])
      return { summary, categories, trends, budgets }
    },
    [range.from, range.to, bucket],
  )

  if (loading && !data) return <LoadingBlock label="Menghitung analitik…" />
  if (error && !data) return <ErrorState title="Gagal memuat analitik" message={getErrorMessage(error)} onRetry={refetch} />
  if (!data) return null

  const { summary, categories, trends, budgets } = data
  const hasExpense = summary.expense > 0

  const trendData = trends.map((t) => ({
    label: t.label,
    values: [
      { key: 'expense', value: t.expense, color: '#ef4444' },
      { key: 'income', value: t.income, color: '#22c55e' },
    ],
  }))

  return (
    <div>
      <PageHeader
        title="Analitik"
        description="Pahami pola pemasukan dan pengeluaranmu."
        action={
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-muted">Dari</span>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-muted">Sampai</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
              />
            </label>
            <Select
              aria-label="Periode grafik"
              value={bucket}
              onChange={(e) => setBucket(e.target.value as 'day' | 'week')}
              options={[
                { value: 'day', label: 'Per hari' },
                { value: 'week', label: 'Per minggu' },
              ]}
              className="w-32"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pemasukan" value={formatRupiah(summary.income)} icon={<TrendUpIcon className="h-4 w-4" />} tone="income" />
        <StatCard label="Pengeluaran" value={formatRupiah(summary.expense)} icon={<TrendDownIcon className="h-4 w-4" />} tone="expense" />
        <StatCard label="Selisih (Net)" value={formatRupiah(summary.net)} icon={<span aria-hidden="true">⚖️</span>} tone={summary.net >= 0 ? 'income' : 'expense'} />
        <StatCard label="Rata-rata/hari" value={formatRupiah(summary.averageSpending)} icon={<span aria-hidden="true">📅</span>} tone="info" hint={`${summary.transactionCount} transaksi`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pemasukan vs Pengeluaran" subtitle={bucket === 'day' ? 'Tren harian' : 'Tren mingguan'} />
          {trendData.every((d) => d.values.every((v) => v.value === 0)) ? (
            <EmptyState icon="📉" title="Belum ada data pada rentang ini" />
          ) : (
            <>
              <BarChart data={trendData} />
              <div className="mt-3">
                <ChartLegend
                  items={[
                    { key: 'expense', label: 'Pengeluaran', color: '#ef4444' },
                    { key: 'income', label: 'Pemasukan', color: '#22c55e' },
                  ]}
                />
              </div>
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Pengeluaran per Kategori" />
          {!hasExpense || categories.length === 0 ? (
            <EmptyState icon="🍩" title="Belum ada pengeluaran" description="Data pengeluaran akan muncul di sini setelah kamu mencatatnya." />
          ) : (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-around">
              <DonutChart
                segments={categories.slice(0, 8).map((c, i) => ({ label: c.categoryName, value: c.amount, color: DONUT_COLORS[i % DONUT_COLORS.length] }))}
                centerLabel={formatRupiah(summary.expense).replace('Rp', '')}
                centerSub="total"
              />
              <div className="w-full max-w-xs">
                <DonutLegend
                  segments={categories.slice(0, 8).map((c, i) => ({ label: `${c.categoryIcon} ${c.categoryName}`, value: c.amount, color: DONUT_COLORS[i % DONUT_COLORS.length] }))}
                  renderLabel={(s) => s.label}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {budgets.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Utilisasi Budget" subtitle="Seberapa dekat kamu dengan batas budget pada periode aktif." />
          <ul className="grid gap-4 sm:grid-cols-2">
            {budgets.map((b) => {
              const tone = b.utilization >= 1 ? 'danger' : b.utilization >= 0.8 ? 'warning' : 'success'
              return (
                <li key={b.budgetId}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {b.categoryIcon} {b.categoryName}
                    </span>
                    <span className="text-xs tabular-nums text-muted">
                      {formatRupiah(b.spent)} / {formatRupiah(b.amount)}
                    </span>
                  </div>
                  <ProgressBar value={b.utilization} tone={tone} showLabel />
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}