import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Budget, BudgetInput } from '@/types'
import { useAsync } from '@/hooks/useAsync'
import { listCategories } from '@/data/api/categoriesApi'
import { createBudget, deleteBudget, listBudgets, updateBudget, type BudgetWithMeta } from '@/data/api/budgetsApi'
import { PageHeader } from '@/pages/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Modal } from '@/components/ui/Modal'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/icons'
import { formatRupiah } from '@/lib/currency'
import { formatDateShort } from '@/lib/date'
import { budgetStatus } from '@/domain/budget'
import { getErrorMessage } from '@/lib/errorMessage'

export function BudgetsPage() {
  const [modal, setModal] = useState<{ open: boolean; editing: Budget | null }>({ open: false, editing: null })
  const { data, loading, error, refetch } = useAsync(async () => {
    const [budgets, categories] = await Promise.all([listBudgets(), listCategories()])
    return { budgets, categories }
  }, [])

  const runMutation = async (operation: () => Promise<unknown>) => {
    try {
      await operation()
      await refetch()
      return null
    } catch (err) {
      return getErrorMessage(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus budget ini?')) return
    const err = await runMutation(() => deleteBudget(id))
    if (err) window.alert(err)
  }

  if (loading && !data) return <LoadingBlock label="Memuat budget…" />
  if (error && !data) return <ErrorState title="Gagal memuat budget" message={getErrorMessage(error)} onRetry={refetch} />

  return (
    <div>
      <PageHeader
        title="Budget"
        description="Atur batas pengeluaran per kategori dan lihat limit harian otomatis."
        action={
          <Button onClick={() => setModal({ open: true, editing: null })}>
            <PlusIcon className="h-4 w-4" />
            Buat Budget
          </Button>
        }
      />

      {data && data.budgets.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Belum ada budget"
          description="Buat budget untuk kategori tertentu supaya ARTO bisa menghitung batas pengeluaran harianmu."
          action={<Button size="sm" onClick={() => setModal({ open: true, editing: null })}>Buat Budget</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data?.budgets ?? []).map((b: BudgetWithMeta) => {
            const tone = budgetStatus(b.spent, b.amount)
            const badgeTone = tone === 'danger' ? 'danger' : tone === 'warn' ? 'warning' : 'success'
            return (
              <Card key={b.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-foreground">
                      {b.categoryIcon} {b.categoryName}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatDateShort(b.periodStart)} – {formatDateShort(b.periodEnd)}
                    </p>
                  </div>
                  <Badge tone={badgeTone}>{Math.round(b.utilization * 100)}%</Badge>
                </div>
                <ProgressBar value={b.utilization} tone={badgeTone} className="mt-4" showLabel />
                <p className="mt-2 text-sm text-muted">
                  Terpakai <span className="font-semibold text-foreground">{formatRupiah(b.spent)}</span> dari{' '}
                  {formatRupiah(b.amount)}
                </p>
                {b.utilization >= 1 && <p className="mt-1 text-sm font-semibold text-danger">Budget sudah melebihi batas.</p>}
                {b.utilization >= 0.8 && b.utilization < 1 && (
                  <p className="mt-1 text-sm font-semibold text-warning">Hampir mencapai batas budget.</p>
                )}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <Link
                    to={`/budgets/${b.id}`}
                    className="text-sm font-semibold text-secondary hover:underline"
                  >
                    Lihat limit harian →
                  </Link>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setModal({ open: true, editing: b })}
                      className="rounded-md p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                      aria-label={`Ubah budget ${b.categoryName}`}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="rounded-md p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label="Hapus budget"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {data && (
        <BudgetModal
          open={modal.open}
          onClose={() => setModal({ open: false, editing: null })}
          categories={data.categories}
          editing={modal.editing}
          onSubmit={async (input: BudgetInput) => {
            const err = await runMutation(() => (modal.editing ? updateBudget(modal.editing.id, input) : createBudget(input)))
            if (err) throw new Error(err)
          }}
        />
      )}
    </div>
  )
}

function BudgetModal({
  open,
  onClose,
  categories,
  editing,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  categories: Parameters<typeof BudgetForm>[0]['categories']
  editing: Budget | null
  onSubmit: (input: BudgetInput) => Promise<void>
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Ubah Budget' : 'Buat Budget'}
      description={editing ? 'Perbarui batas pengeluaran kategori ini.' : 'Tentukan batas pengeluaran untuk satu kategori.'}
    >
      <BudgetForm
        categories={categories}
        initial={editing ?? undefined}
        onCancel={onClose}
        onSubmit={async (input) => {
          await onSubmit(input)
          onClose()
        }}
      />
    </Modal>
  )
}