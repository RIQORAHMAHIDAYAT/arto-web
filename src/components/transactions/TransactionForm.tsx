import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Account, Category, Transaction, TransactionInput, TransactionType } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getErrorMessage } from '@/lib/errorMessage'
import { parseAmountText, sanitizeAmountInput } from '@/lib/currency'

interface TransactionFormProps {
  categories: Category[]
  accounts: Account[]
  initial?: Transaction | null
  defaultType?: TransactionType
  loading?: boolean
  error?: string | null
  onCancel?: () => void
  onSubmit: (input: TransactionInput) => Promise<void>
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
  const [submitError, setSubmitError] = useState<string | null>(null)

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
      await onSubmit({ type, amount: value, categoryId, accountId, transactionDate: date, note })
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

      <Select
        label="Kategori"
        required
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        placeholder={matchingCategories.length === 0 ? 'Tidak ada kategori untuk jenis ini' : 'Pilih kategori…'}
        options={matchingCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
      />

      <Select
        label="Akun"
        required
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
      />

      <Input label="Tanggal" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />

      <Input label="Catatan (opsional)" placeholder="misal: makan siang di kantin" value={note} onChange={(e) => setNote(e.target.value)} />

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