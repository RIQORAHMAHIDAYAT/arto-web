import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Account, Category, Transaction, TransactionInput, TransactionType } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getErrorMessage } from '@/lib/errorMessage'
import { parseAmountText, sanitizeAmountInput } from '@/lib/currency'
import { createCategory } from '@/data/api/categoriesApi'

interface TransactionFormProps {
  categories: Category[]
  accounts: Account[]
  initial?: Transaction | null
  defaultType?: TransactionType
  loading?: boolean
  error?: string | null
  onCancel?: () => void
  onSubmit: (input: TransactionInput, recurring?: { frequency: string; endDate?: string }) => Promise<void>
}

export function TransactionForm({
  categories,
  accounts,
  initial,
  defaultType = 'expense',
  loading,
  error,
  onCancel,
  onSubmit,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? defaultType)
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [accountId, setAccountId] = useState(initial?.accountId ?? '')
  const [date, setDate] = useState(initial?.transactionDate ?? new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState(initial?.note ?? '')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('monthly')
  const [endDate, setEndDate] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const matchingCategories = useMemo(() => categories.filter((c) => c.type === type), [categories, type])

  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id)
  }, [accounts, accountId])

  useEffect(() => {
    if (matchingCategories.length > 0 && !matchingCategories.some((c) => c.id === categoryId)) {
      setCategoryId(matchingCategories[0].id)
    }
    if (matchingCategories.length === 0) setCategoryId('')
  }, [matchingCategories, categoryId])

  const switchType = (next: TransactionType) => {
    setType(next)
    setCategoryId('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    const value = parseAmountText(amount)
    if (value === null) {
      setSubmitError('Nominal harus berupa angka yang valid.')
      return
    }
    if (!categoryId) {
      setSubmitError('Pilih kategori terlebih dahulu.')
      return
    }
    if (!accountId) {
      setSubmitError('Pilih akun terlebih dahulu.')
      return
    }
    if (!date) {
      setSubmitError('Tanggal wajib diisi.')
      return
    }
    try {
      await onSubmit(
        { type, amount: value, categoryId, accountId, transactionDate: date, note },
        isRecurring ? { frequency, endDate: endDate || undefined } : undefined
      )
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  }

  const shownError = submitError ?? error

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div role="radiogroup" aria-label="Jenis transaksi" className="grid grid-cols-2 gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => switchType(t)}
            className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
              type === t
                ? t === 'expense'
                  ? 'border-danger bg-danger/10 text-danger'
                  : 'border-success bg-success/10 text-success'
                : 'border-border text-muted hover:bg-surface-hover'
            }`}
          >
            {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
          </button>
        ))}
      </div>

      <Input
        label="Nominal (Rp)"
        inputMode="numeric"
        required
        autoFocus
        placeholder="contoh: 50000"
        value={amount}
        onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
      />

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
                const created = await createCategory({ name: newCategoryName.trim(), icon: '📦', type })
                categories.push(created) // Mutasi lokal agar langsung muncul
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
          placeholder={matchingCategories.length === 0 ? 'Tidak ada kategori untuk jenis ini' : 'Pilih kategori…'}
          options={[
            { value: '__NEW__', label: '➕ Buat Kategori Baru...' },
            ...matchingCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))
          ]}
        />
      )}

      <Select
        label="Akun"
        required
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
      />

      <Input label="Tanggal" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />

      <Input label="Catatan (opsional)" placeholder="misal: makan siang di kantin" value={note} onChange={(e) => setNote(e.target.value)} />

      {!initial && (
        <div className="rounded-lg border border-border p-4 bg-surface-hover/50 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isRecurring} 
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium">🔁 Jadikan Transaksi Rutin</span>
          </label>
          
          {isRecurring && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border mt-2">
              <Select
                label="Frekuensi"
                required
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                options={[
                  { value: 'daily', label: 'Harian' },
                  { value: 'weekly', label: 'Mingguan' },
                  { value: 'monthly', label: 'Bulanan' },
                  { value: 'yearly', label: 'Tahunan' },
                ]}
              />
              <Input 
                label="Berhenti Pada (Opsional)" 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
          )}
        </div>
      )}

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
          {initial ? 'Simpan Perubahan' : 'Simpan Transaksi'}
        </Button>
      </div>
    </form>
  )
}