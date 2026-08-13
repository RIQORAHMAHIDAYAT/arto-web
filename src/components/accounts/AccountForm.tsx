import { useState, type FormEvent } from 'react'
import type { Account, AccountInput } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AccountTypePill } from '@/components/accounts/AccountTypePill'
import { getErrorMessage } from '@/lib/errorMessage'

const TYPES = [
  { value: 'cash', label: 'Uang Tunai' },
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-Wallet' },
] as const

export function AccountForm({
  initial,
  accountsCount = 0,
  loading,
  onCancel,
  onSubmit,
}: {
  initial?: Account | null
  accountsCount?: number
  loading?: boolean
  onCancel?: () => void
  onSubmit: (input: AccountInput) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<(typeof TYPES)[number]['value']>(initial?.type ?? 'cash')
  const [initialBalance, setInitialBalance] = useState(initial ? String(initial.initialBalance) : '0')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Nama akun wajib diisi.')
      return
    }
    const value = Number(initialBalance.replace(/[^\d]/g, '')) || 0
    try {
      await onSubmit({ name: name.trim(), type, initialBalance: value })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div role="radiogroup" aria-label="Jenis akun" className="grid grid-cols-3 gap-2">
        {TYPES.map((t) => (
          <AccountTypePill key={t.value} name={t.label} value={t.value} selected={type === t.value} onClick={() => setType(t.value)} />
        ))}
      </div>
      <Input label="Nama Akun" required placeholder="misal: Uang Tunai, Bank BCA, OVO" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        label="Saldo Awal (Rp)"
        inputMode="numeric"
        hint={initial ? 'Saldo awal tidak mengubah transaksi yang sudah ada.' : accountsCount === 0 ? 'Saldo saat kamu membuat akun.' : undefined}
        value={initialBalance}
        onChange={(e) => setInitialBalance(e.target.value.replace(/[^\d]/g, ''))}
      />
      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {initial ? 'Simpan Perubahan' : 'Tambah Akun'}
        </Button>
      </div>
    </form>
  )
}