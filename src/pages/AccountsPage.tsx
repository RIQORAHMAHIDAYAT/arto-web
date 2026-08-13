import { useState } from 'react'
import type { Account, AccountInput } from '@/types'
import { useAsync } from '@/hooks/useAsync'
import { createAccount, deleteAccount, listAccounts, updateAccount } from '@/data/api/accountsApi'
import { PageHeader } from '@/pages/PageHeader'
import { AccountForm } from '@/components/accounts/AccountForm'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/icons'
import { formatRupiah } from '@/lib/currency'
import { getErrorMessage } from '@/lib/errorMessage'

const typeLabel: Record<Account['type'], string> = { cash: 'Uang Tunai', bank: 'Bank', ewallet: 'E-Wallet' }
const typeTone: Record<Account['type'], 'neutral' | 'info' | 'warning'> = { cash: 'neutral', bank: 'info', ewallet: 'warning' }

export function AccountsPage() {
  const [modal, setModal] = useState<{ open: boolean; editing: Account | null }>({ open: false, editing: null })
  const { data, loading, error, refetch } = useAsync(listAccounts, [])

  const runMutation = async (operation: () => Promise<unknown>) => {
    try {
      await operation()
      await refetch()
      return null
    } catch (err) {
      return getErrorMessage(err)
    }
  }

  const handleDelete = async (account: Account) => {
    if (!window.confirm(`Hapus akun "${account.name}"?`)) return
    const err = await runMutation(() => deleteAccount(account.id))
    if (err) window.alert(err)
  }

  if (loading && !data) return <LoadingBlock label="Memuat akun…" />
  if (error && !data) return <ErrorState title="Gagal memuat akun" message={getErrorMessage(error)} onRetry={refetch} />

  const totalBalance = (data ?? []).reduce((sum, a) => sum + (a.balance ?? 0), 0)

  return (
    <div>
      <PageHeader
        title="Akun"
        description="Kelola dompet: uang tunai, rekening bank, dan e-wallet."
        action={
          <Button onClick={() => setModal({ open: true, editing: null })}>
            <PlusIcon className="h-4 w-4" />
            Tambah Akun
          </Button>
        }
      />

      <Card className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">Total saldo semua akun</p>
          <p className="text-2xl font-extrabold tabular-nums text-foreground">{formatRupiah(totalBalance)}</p>
        </div>
        <span className="text-3xl" aria-hidden="true">
          💳
        </span>
      </Card>

      {data && data.length === 0 ? (
        <EmptyState
          icon="👛"
          title="Belum ada akun"
          description="Buat akun pertama (misal uang tunai) untuk mulai mencatat transaksi."
          action={<Button size="sm" onClick={() => setModal({ open: true, editing: null })}>Tambah Akun</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((account) => (
            <Card key={account.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-foreground">{account.name}</h2>
                  <p className="mt-0.5 text-sm text-muted">Saldo awal {formatRupiah(account.initialBalance)}</p>
                </div>
                <Badge tone={typeTone[account.type]}>{typeLabel[account.type]}</Badge>
              </div>
              <p className="mt-4 text-2xl font-extrabold tabular-nums text-foreground">{formatRupiah(account.balance ?? account.initialBalance)}</p>
              <div className="mt-4 flex justify-end gap-1 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setModal({ open: true, editing: account })}
                  className="rounded-md p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                  aria-label={`Ubah akun ${account.name}`}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(account)}
                  className="rounded-md p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label="Hapus akun"
                >
                  🗑
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Ubah Akun' : 'Tambah Akun'}
        description={modal.editing ? 'Perbarui detail akun kamu.' : 'Tambah uang tunai, bank, atau e-wallet.'}
      >
        <AccountForm
          initial={modal.editing}
          accountsCount={data?.length ?? 0}
          onCancel={() => setModal({ open: false, editing: null })}
          onSubmit={async (input: AccountInput) => {
            const err = await runMutation(() => (modal.editing ? updateAccount(modal.editing.id, input) : createAccount(input)))
            if (err) throw new Error(err)
          }}
        />
      </Modal>
    </div>
  )
}