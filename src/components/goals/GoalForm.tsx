import { useEffect, useState, type FormEvent } from 'react'
import type { FinancialGoal, FinancialGoalInput } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getErrorMessage } from '@/lib/errorMessage'

export function GoalForm({
  initial,
  loading,
  onCancel,
  onSubmit,
}: {
  initial?: FinancialGoal | null
  loading?: boolean
  onCancel?: () => void
  onSubmit: (input: FinancialGoalInput) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [target, setTarget] = useState(initial ? String(initial.targetAmount) : '')
  const [current, setCurrent] = useState(initial ? String(initial.currentAmount) : '')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initial && !current) setCurrent('0')
  }, [initial, current])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Nama goal wajib diisi.')
      return
    }
    const targetValue = Number(target.replace(/[^\d]/g, ''))
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      setError('Target nominal harus berupa angka lebih dari 0.')
      return
    }
    const currentValue = Number(current.replace(/[^\d]/g, '')) || 0
    try {
      await onSubmit({
        name: name.trim(),
        targetAmount: targetValue,
        currentAmount: Math.min(currentValue, targetValue),
        deadline: deadline ? deadline : null,
      })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input label="Nama Goal" required placeholder="misal: Tabungan Laptop" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Target Nominal (Rp)"
          inputMode="numeric"
          required
          placeholder="misal: 10000000"
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ''))}
        />
        <Input
          label="Sudah Terkumpul (Rp)"
          inputMode="numeric"
          placeholder="misal: 500000"
          value={current}
          onChange={(e) => setCurrent(e.target.value.replace(/[^\d]/g, ''))}
        />
      </div>
      <Input label="Deadline (Opsional)" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} hint="Biarkan kosong jika tanpa target waktu." />
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
          {initial ? 'Simpan Perubahan' : 'Buat Goal'}
        </Button>
      </div>
    </form>
  )
}