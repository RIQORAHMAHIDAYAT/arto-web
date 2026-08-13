import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Budget, BudgetInput, Category } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getErrorMessage } from '@/lib/errorMessage'
import { toISODate } from '@/lib/date'

interface BudgetFormProps {
  categories: Category[]
  initial?: Budget
  loading?: boolean
  error?: string | null
  onCancel?: () => void
  onSubmit: (input: BudgetInput) => Promise<void>
}

export function BudgetForm({ categories, initial, loading, error, onCancel, onSubmit }: BudgetFormProps) {
  const expenseCategories = useMemo(() => categories.filter((c) => c.type === 'expense'), [categories])
  const now = new Date()
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [periodStart, setPeriodStart] = useState(initial?.periodStart ?? toISODate(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [periodEnd, setPeriodEnd] = useState(initial?.periodEnd ?? toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)))
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (expenseCategories.length > 0 && !categoryId) setCategoryId(expenseCategories[0].id)
  }, [expenseCategories, categoryId])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    const value = Number(amount.replace(/[^\d]/g, ''))
    if (!Number.isFinite(value) || value <= 0) {
      setSubmitError('Nominal budget harus berupa angka lebih dari 0.')
      return
    }
    if (!categoryId) {
      setSubmitError('Pilih kategori terlebih dahulu.')
      return
    }
    if (!periodStart || !periodEnd || periodEnd < periodStart) {
      setSubmitError('Periode budget tidak valid.')
      return
    }
    try {
      await onSubmit({ categoryId, amount: value, periodStart, periodEnd })
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  }

  const shownError = submitError ?? error

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Select
        label="Kategori"
        required
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={expenseCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
      />
      <Input
        label="Nominal Budget (Rp)"
        inputMode="numeric"
        required
        placeholder="contoh: 1000000"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Mulai" type="date" required value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        <Input label="Selesai" type="date" required value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
      </div>
      {shownError && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {shownError}
        </p>
      )}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {initial ? 'Simpan Perubahan' : 'Buat Budget'}
        </Button>
      </div>
    </form>
  )
}