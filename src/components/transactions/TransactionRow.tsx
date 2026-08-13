import type { Category, Transaction } from '@/types'
import { formatRupiah, formatRupiahSigned } from '@/lib/currency'
import { formatDateShort } from '@/lib/date'
import { cn } from '@/lib/cn'

export interface TransactionMeta {
  category?: Category
  accountName?: string
}

export interface TransactionRowProps extends TransactionMeta {
  transaction: Transaction
}

export function TransactionRow({ transaction, category, accountName }: TransactionRowProps) {
  const isExpense = transaction.type === 'expense'
  const signed = isExpense ? -transaction.amount : transaction.amount
  return (
    <li className="flex items-center gap-3 px-1 py-3">
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg',
          isExpense ? 'bg-danger/10' : 'bg-success/10',
        )}
        aria-hidden="true"
      >
        {category?.icon ?? '📦'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{category?.name ?? 'Tanpa Kategori'}</p>
        <p className="truncate text-xs text-muted">
          {formatDateShort(transaction.transactionDate)}
          {accountName && ` · ${accountName}`}
        </p>
        {transaction.note && <p className="truncate text-xs text-muted-foreground">{transaction.note}</p>}
      </div>
      <span
        className={cn(
          'shrink-0 text-sm font-bold tabular-nums',
          isExpense ? 'text-danger' : 'text-success',
        )}
      >
        {isExpense ? formatRupiah(-signed) : formatRupiahSigned(signed)}
      </span>
      <span className="sr-only">{isExpense ? 'Pengeluaran' : 'Pemasukan'}</span>
    </li>
  )
}