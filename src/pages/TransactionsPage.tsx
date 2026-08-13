import { useMemo, useState, type FormEvent } from 'react'
import type { Transaction, TransactionFilters } from '@/types'
import { useAsync } from '@/hooks/useAsync'
import { listAccounts } from '@/data/api/accountsApi'
import { listCategories } from '@/data/api/categoriesApi'
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from '@/data/api/transactionsApi'
import { PageHeader } from '@/pages/PageHeader'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/icons'
import { getErrorMessage } from '@/lib/errorMessage'

const PAGE_SIZE = 10

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ open: boolean; editing: Transaction | null }>({ open: false, editing: null })

  const { data, loading, error, refetch } = useAsync(async () => {
    const [result, cats, accs] = await Promise.all([
      listTransactions(filters, page, PAGE_SIZE),
      listCategories(),
      listAccounts(),
    ])
    return { result, cats, accs }
  }, [filters, page])

  const catMap = useMemo(() => new Map(data?.cats.map((c) => [c.id, c]) ?? []), [data])
  const accMap = useMemo(() => new Map(data?.accs.map((a) => [a.id, a.name]) ?? []), [data])

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
    if (!window.confirm('Hapus transaksi ini?')) return
    const err = await runMutation(() => deleteTransaction(id))
    if (err) window.alert(err)
  }

  const applyFilters = (patch: TransactionFilters) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  const search = (event: FormEvent) => event.preventDefault()

  if (loading && !data) return <LoadingBlock label="Memuat transaksi…" />
  if (error && !data) return <ErrorState title="Gagal memuat transaksi" message={getErrorMessage(error)} onRetry={refetch} />

  return (
    <div>
      <PageHeader
        title="Transaksi"
        description="Catat, cari, dan kelola semua pemasukan serta pengeluaran."
        action={
          <Button onClick={() => setModal({ open: true, editing: null })}>
            <PlusIcon className="h-4 w-4" />
            Catat Transaksi
          </Button>
        }
      />

      <Card className="mb-4">
        <form onSubmit={search} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Cari catatan"
            placeholder="misal: makan"
            value={filters.query ?? ''}
            onChange={(e) => applyFilters({ query: e.target.value || undefined })}
            className="lg:col-span-2"
          />
          <Select
            label="Jenis"
            options={[
              { value: 'expense', label: 'Pengeluaran' },
              { value: 'income', label: 'Pemasukan' },
            ]}
            placeholder="Semua"
            value={filters.type ?? ''}
            onChange={(e) => applyFilters({ type: (e.target.value || undefined) as 'income' | 'expense' | undefined })}
          />
          <Select
            label="Kategori"
            options={(data?.cats ?? []).map((c) => ({ value: c.id, label: `${c.name}` }))}
            placeholder="Semua"
            value={filters.categoryId ?? ''}
            onChange={(e) => applyFilters({ categoryId: e.target.value || undefined })}
          />
          <Select
            label="Akun"
            options={(data?.accs ?? []).map((a) => ({ value: a.id, label: a.name }))}
            placeholder="Semua"
            value={filters.accountId ?? ''}
            onChange={(e) => applyFilters({ accountId: e.target.value || undefined })}
          />
        </form>
      </Card>

      {data && data.result.items.length === 0 ? (
        <EmptyState
          icon="🧾"
          title={filters.query || filters.type ? 'Tidak ada hasil' : 'Belum ada transaksi'}
          description={filters.query || filters.type ? 'Coba ubah kata kunci atau filter kamu.' : 'Mulai catat transaksi pertamamu.'}
          action={
            !filters.query && !filters.type ? (
              <Button size="sm" onClick={() => setModal({ open: true, editing: null })}>
                <PlusIcon className="h-4 w-4" />
                Catat Transaksi
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="px-2">
          <ul className="divide-y divide-border" aria-live="polite">
            {(data?.result.items ?? []).map((t) => (
              <li key={t.id} className="group flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <TransactionRow transaction={t} category={catMap.get(t.categoryId)} accountName={accMap.get(t.accountId)} />
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setModal({ open: true, editing: t })}
                    className="rounded-md p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    aria-label={`Ubah transaksi ${t.id}`}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="rounded-md p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Hapus transaksi"
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {data && data.result.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Sebelumnya
              </Button>
              <span className="text-sm text-muted">
                Halaman {page} dari {data.result.totalPages} · {data.result.total} transaksi
              </span>
              <Button variant="ghost" size="sm" disabled={page >= data.result.totalPages} onClick={() => setPage((p) => p + 1)}>
                Berikutnya →
              </Button>
            </div>
          )}
        </Card>
      )}

      {data && (
        <TransactionModal
          open={modal.open}
          onClose={() => setModal({ open: false, editing: null })}
          categories={data.cats}
          accounts={data.accs}
          initial={modal.editing}
          onSubmit={async (input) => {
            const err = await runMutation(() => (modal.editing ? updateTransaction(modal.editing.id, input) : createTransaction(input)))
            if (err) throw new Error(err)
          }}
        />
      )}
    </div>
  )
}