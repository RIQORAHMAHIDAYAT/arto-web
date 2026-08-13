import type { Account, Category, Transaction, TransactionInput } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm } from './TransactionForm'

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  categories: Category[]
  accounts: Account[]
  initial?: Transaction | null
  defaultType?: 'income' | 'expense'
  loading?: boolean
  error?: string | null
  onSubmit: (input: TransactionInput) => Promise<void>
}

export function TransactionModal({ open, onClose, categories, accounts, initial, defaultType = 'expense', loading, error, onSubmit }: TransactionModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Ubah Transaksi' : 'Catat Transaksi'}
      description={initial ? 'Perbarui detail transaksi kamu.' : 'Isi beberapa langkah untuk mencatat.'}
    >
      <TransactionForm
        categories={categories}
        accounts={accounts}
        initial={initial}
        defaultType={defaultType}
        loading={loading}
        error={error}
        onCancel={onClose}
        onSubmit={async (input) => {
          await onSubmit(input)
          onClose()
        }}
      />
    </Modal>
  )
}