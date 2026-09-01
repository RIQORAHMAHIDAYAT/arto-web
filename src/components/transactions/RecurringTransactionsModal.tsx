import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { listRecurringTransactions, deleteRecurringTransaction } from '@/data/api/transactionsApi'
import { formatRupiah } from '@/lib/currency'
import { formatDateShort } from '@/lib/date'
import { getErrorMessage } from '@/lib/errorMessage'
import { LoadingBlock } from '@/components/ui/LoadingBlock'

export function RecurringTransactionsModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      load()
    }
  }, [open])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await listRecurringTransactions()
      setData(res)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Hentikan transaksi rutin ini?')) return
    try {
      await deleteRecurringTransaction(id)
      await load()
    } catch (err) {
      window.alert(getErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Transaksi Rutin" description="Daftar transaksi yang berjalan secara otomatis.">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {loading && <LoadingBlock label="Memuat..." />}
        {error && <div className="text-danger">{error}</div>}
        {!loading && !error && data.length === 0 && (
          <p className="text-muted text-sm text-center py-4">Belum ada transaksi rutin.</p>
        )}
        {!loading && data.map((rt) => (
          <div key={rt.id} className="p-3 border border-border rounded-lg bg-surface flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm truncate">{rt.note || (rt.category?.name ?? 'Transaksi Rutin')}</p>
              <p className="text-xs text-muted">
                {formatRupiah(rt.amount)} • {rt.frequency}
                {rt.endDate ? ` • Sampai ${formatDateShort(rt.endDate)}` : ''}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => handleDelete(rt.id)}>
              Hentikan
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={onClose}>Tutup</Button>
      </div>
    </Modal>
  )
}
