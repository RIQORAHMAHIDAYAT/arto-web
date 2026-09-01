import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Budget, BudgetInput, Category } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getErrorMessage } from '@/lib/errorMessage'
import { toISODate } from '@/lib/date'
import { createCategory } from '@/data/api/categoriesApi'

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
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

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
      {showNewCategory ? (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Kategori Baru"
              autoFocus
              placeholder="Misal: Jajan Kucing"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
          <Button
            type="button"
            loading={creatingCategory}
            onClick={async () => {
              if (!newCategoryName.trim()) return
              try {
                setCreatingCategory(true)
                const created = await createCategory({ name: newCategoryName.trim(), icon: '📦', type: 'expense' })
                categories.push(created)
                setCategoryId(created.id)
                setShowNewCategory(false)
                setNewCategoryName('')
              } catch (err) {
                setSubmitError(getErrorMessage(err))
              } finally {
                setCreatingCategory(false)
              }
            }}
          >
            Buat
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowNewCategory(false)}>Batal</Button>
        </div>
      ) : (
        <Select
          label="Kategori"
          required
          value={categoryId}
          onChange={(e) => {
            if (e.target.value === '__NEW__') {
              setShowNewCategory(true)
              setCategoryId('')
            } else {
              setCategoryId(e.target.value)
            }
          }}
          options={[
            { value: '__NEW__', label: '➕ Buat Kategori Baru...' },
            ...expenseCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))
          ]}
        />
      )}
      <Input
        label="Nominal Budget (Rp)"
        inputMode="numeric"
        required
        placeholder="contoh: 1000000"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            const d = new Date()
            setPeriodStart(toISODate(new Date(d.getFullYear(), d.getMonth(), 1)))
            setPeriodEnd(toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0)))
          }}
        >
          Bulan Ini
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            const d = new Date()
            const day = d.getDay()
            const diff = d.getDate() - day + (day === 0 ? -6 : 1)
            const start = new Date(d.setDate(diff))
            const end = new Date(d.setDate(diff + 6))
            setPeriodStart(toISODate(start))
            setPeriodEnd(toISODate(end))
          }}
        >
          Minggu Ini
        </Button>
      </div>
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