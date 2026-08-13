import { useState } from 'react'
import type { FinancialGoal, FinancialGoalInput } from '@/types'
import { useAsync } from '@/hooks/useAsync'
import { createGoal, deleteGoal, listGoals, updateGoal } from '@/data/api/goalsApi'
import { PageHeader } from '@/pages/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Modal } from '@/components/ui/Modal'
import { GoalForm } from '@/components/goals/GoalForm'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/icons'
import { formatRupiah } from '@/lib/currency'
import { formatDateShort } from '@/lib/date'
import { getErrorMessage } from '@/lib/errorMessage'

export function GoalsPage() {
  const [modal, setModal] = useState<{ open: boolean; editing: FinancialGoal | null }>({ open: false, editing: null })
  const { data, loading, error, refetch } = useAsync(listGoals, [])

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
    if (!window.confirm('Hapus goal ini?')) return
    const err = await runMutation(() => deleteGoal(id))
    if (err) window.alert(err)
  }

  if (loading && !data) return <LoadingBlock label="Memuat goals…" />
  if (error && !data) return <ErrorState title="Gagal memuat goals" message={getErrorMessage(error)} onRetry={refetch} />

  const goals = data ?? []

  return (
    <div>
      <PageHeader
        title="Financial Goals"
        description="Tetapkan tujuan, pantau progres, dan hitung estimasi tabungan harian."
        action={
          <Button onClick={() => setModal({ open: true, editing: null })}>
            <PlusIcon className="h-4 w-4" />
            Buat Goal
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Belum ada goal"
          description="Mulai dari target kecil, misal dana darurat atau tabungan untuk sesuatu yang kamu impikan."
          action={<Button size="sm" onClick={() => setModal({ open: true, editing: null })}>Buat Goal</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const done = goal.progress >= 1
            const tone = done ? 'secondary' : goal.progress >= 0.7 ? 'info' : 'success'
            return (
              <Card key={goal.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-foreground">{goal.name}</h2>
                    <p className="mt-0.5 text-sm text-muted">
                      Target {formatRupiah(goal.targetAmount)}
                      {goal.deadline ? ` · target ${formatDateShort(goal.deadline)}` : ''}
                    </p>
                  </div>
                  {done ? <Badge tone="success">Tercapai</Badge> : <Badge tone="neutral">{Math.round(goal.progress * 100)}%</Badge>}
                </div>

                <ProgressBar value={goal.progress} tone={tone} className="mt-4" showLabel />

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted">
                    <span className="font-semibold text-foreground">{formatRupiah(goal.currentAmount)}</span> dari{' '}
                    {formatRupiah(goal.targetAmount)}
                  </p>
                  {goal.requiredDaily !== null && (
                    <p className="text-right text-xs text-muted">
                      Est. tabungan/hari
                      <span className="ml-1 block font-semibold text-foreground">{formatRupiah(goal.requiredDaily)}</span>
                    </p>
                  )}
                </div>

                {goal.remaining > 0 && <p className="mt-1 text-sm text-muted">Sisa {formatRupiah(goal.remaining)}</p>}

                <div className="mt-4 flex justify-end gap-1 border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => setModal({ open: true, editing: goal })}
                    className="rounded-md p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    aria-label={`Ubah goal ${goal.name}`}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id)}
                    className="rounded-md p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Hapus goal"
                  >
                    🗑
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Ubah Goal' : 'Buat Goal'}
        description={modal.editing ? 'Perbarui target dan nominal terkumpul.' : 'Tetapkan target nominal untuk tujuan finansialmu.'}
      >
        <GoalForm
          initial={modal.editing}
          onCancel={() => setModal({ open: false, editing: null })}
          onSubmit={async (input: FinancialGoalInput) => {
            const err = await runMutation(() => (modal.editing ? updateGoal(modal.editing.id, input) : createGoal(input)))
            if (err) throw new Error(err)
            setModal({ open: false, editing: null })
          }}
        />
      </Modal>
    </div>
  )
}