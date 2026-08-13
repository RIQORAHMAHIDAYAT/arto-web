import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { getBudget, getDailyLimit } from '@/data/api/budgetsApi'
import { DailyLimitCard } from '@/components/budgets/DailyLimitCard'
import { listCategories } from '@/data/api/categoriesApi'
import { createTransaction } from '@/data/api/transactionsApi'
import { listAccounts } from '@/data/api/accountsApi'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { Card, CardHeader } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatRupiah } from '@/lib/currency'
import { formatDateShort } from '@/lib/date'
import { budgetStatus } from '@/domain/budget'
import { getErrorMessage } from '@/lib/errorMessage'


export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [modalOpen, setModalOpen] = useState(false)
  const { data, loading, error, refetch } = useAsync(async () => {
    const [budget, dailyLimit, categories, accounts] = await Promise.all([
      getBudget(id ?? ''),
      id ? getDailyLimit(id) : Promise.reject(new Error('id kosong')),
      listCategories(),
      listAccounts(),
    ])
    return { budget, dailyLimit, categories, accounts }
  }, [id])

  if (loading && !data) return <LoadingBlock label="Memuat detail budget…" />
  if (error && !data) return <ErrorState title="Gagal memuat detail" message={getErrorMessage(error)} onRetry={refetch} />
  if (!data) return null

  const { budget, dailyLimit, categories, accounts } = data
  const tone = budgetStatus(budget.spent, budget.amount)
  const badgeTone = tone === 'danger' ? 'danger' : tone === 'warn' ? 'warning' : 'success'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link to="/budgets" className="text-sm font-semibold text-secondary hover:underline">
          ← Kembali ke Budget
        </Link>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          Catat Transaksi Kategori Ini
        </Button>
      </div>

      <Card>
        <CardHeader
          title={`${budget.categoryIcon} ${budget.categoryName}`}
          subtitle={`${formatDateShort(budget.periodStart)} – ${formatDateShort(budget.periodEnd)}`}
          action={<Badge tone={badgeTone}>{Math.round(budget.utilization * 100)}% terpakai</Badge>}
        />
        <ProgressBar value={budget.utilization} tone={badgeTone} showLabel />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted">Total Budget</p>
            <p className="text-lg font-extrabold tabular-nums text-foreground">{formatRupiah(budget.amount)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Terpakai</p>
            <p className="text-lg font-extrabold tabular-nums text-danger">{formatRupiah(budget.spent)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Sisa</p>
            <p className="text-lg font-extrabold tabular-nums text-success">{formatRupiah(Math.max(0, budget.amount - budget.spent))}</p>
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <DailyLimitCard dailyLimit={dailyLimit} />
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        accounts={accounts}
        defaultType="expense"
        onSubmit={async (input) => {
          await createTransaction({ ...input, categoryId: budget.categoryId })
          await refetch()
        }}
      />
    </div>
  )
}