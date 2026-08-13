import { useMemo, useState } from 'react'
import type { Category, TransactionType } from '@/types'
import { useAsync } from '@/hooks/useAsync'
import { getDashboardSummary } from '@/data/api/dashboardApi'
import { listAccounts } from '@/data/api/accountsApi'
import { listCategories } from '@/data/api/categoriesApi'
import { createTransaction } from '@/data/api/transactionsApi'
import { PageHeader } from '@/pages/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { DailyLimitCard } from '@/components/budgets/DailyLimitCard'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { BarChart, ChartLegend } from '@/components/charts/BarChart'
import { PlusIcon, TrendDownIcon, TrendUpIcon } from '@/components/icons'
import { formatRupiah } from '@/lib/currency'
import { budgetStatus } from '@/domain/budget'
import { getErrorMessage } from '@/lib/errorMessage'

export function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<TransactionType>('expense')
  const { data, loading, error, refetch } = useAsync(async () => {
    const [summary, accounts, categories] = await Promise.all([getDashboardSummary(), listAccounts(), listCategories()])
    return { summary, accounts, categories }
  }, [])

  const metaMap = useMemo(() => {
    if (!data) return { categories: new Map<string, Category>(), accounts: new Map<string, string>() }
    const categories = new Map(data.categories.map((c) => [c.id, c]))
    const accounts = new Map(data.accounts.map((a) => [a.id, a.name]))
    return { categories, accounts }
  }, [data])

  const openModal = (type: TransactionType) => {
    setDefaultType(type)
    setModalOpen(true)
  }

  if (loading) return <LoadingBlock label="Memuat dashboard…" />
  if (error || !data) return <ErrorState title="Gagal memuat dashboard" message={getErrorMessage(error)} onRetry={refetch} />

  const { summary, accounts, categories } = data
  const chartData = summary.spendingChart.map((p) => ({
    label: p.date.slice(8),
    values: [
      { key: 'expense', value: p.expense, color: '#ef4444' },
      { key: 'income', value: p.income, color: '#22c55e' },
    ],
  }))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Ringkasan keuangan · ${summary.periodLabel}`}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => openModal('income')}>
              + Pemasukan
            </Button>
            <Button onClick={() => openModal('expense')}>
              <PlusIcon className="h-4 w-4" />
              Catat Transaksi
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Saldo" value={formatRupiah(summary.totalBalance)} icon={<span aria-hidden="true">💳</span>} tone="neutral" hint={`Bulan ini: masuk ${formatRupiah(summary.totalIncome)}`} />
        <StatCard label="Pemasukan Bulan Ini" value={formatRupiah(summary.totalIncome)} icon={<TrendUpIcon className="h-4 w-4" />} tone="income" />
        <StatCard label="Pengeluaran Bulan Ini" value={formatRupiah(summary.totalExpense)} icon={<TrendDownIcon className="h-4 w-4" />} tone="expense" />
      </div>

      {summary.dailyLimit && <div className="mt-4"><DailyLimitCard dailyLimit={summary.dailyLimit} /></div>}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Pengeluaran 7 Hari Terakhir</h2>
          </div>
          {chartData.every((d) => d.values.every((v) => v.value === 0)) ? (
            <EmptyState icon="📈" title="Belum ada data 7 hari" description="Catat transaksi untuk melihat grafik pengeluaranmu." />
          ) : (
            <>
              <BarChart data={chartData} />
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
          <h2 className="mb-4 text-base font-bold text-foreground">Transaksi Terakhir</h2>
          {summary.recentTransactions.length === 0 ? (
            <EmptyState icon="🧾" title="Belum ada transaksi" description="Mulai catat pengeluaran atau pemasukan pertamamu." action={<Button size="sm" onClick={() => openModal('expense')}>Catat Transaksi</Button>} />
          ) : (
            <ul className="divide-y divide-border">
              {summary.recentTransactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  category={metaMap.categories.get(t.categoryId)}
                  accountName={metaMap.accounts.get(t.accountId)}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {summary.budgetSummary.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-4 text-base font-bold text-foreground">Ringkasan Budget</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {summary.budgetSummary.slice(0, 6).map((b) => {
              const tone = budgetStatus(b.spent, b.amount)
              const badgeTone = tone === 'danger' ? 'danger' : tone === 'warn' ? 'warning' : 'success'
              return (
                <li key={b.budgetId} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {b.categoryIcon} {b.categoryName}
                    </span>
                    <Badge tone={badgeTone}>{Math.round(b.utilization * 100)}%</Badge>
                  </div>
                  <ProgressBar value={b.utilization} tone={badgeTone} className="mt-2" />
                  <p className="mt-2 text-xs text-muted">
                    {formatRupiah(b.spent)} dari {formatRupiah(b.amount)}
                  </p>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        accounts={accounts}
        defaultType={defaultType}
        onSubmit={async (input) => {
          await createTransaction(input)
          await refetch()
        }}
      />
    </div>
  )
}