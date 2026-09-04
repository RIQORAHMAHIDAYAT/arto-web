
import { useAsync } from '@/hooks/useAsync'
import { getDashboardSummary } from '@/data/api/dashboardApi'
import { listAccounts } from '@/data/api/accountsApi'
import { listCategories } from '@/data/api/categoriesApi'
import { createTransaction, listTransactions } from '@/data/api/transactionsApi'
import { PageHeader } from '@/pages/PageHeader'
import { LedgerTable } from '@/components/transactions/LedgerTable'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatRupiah } from '@/lib/currency'
import { getErrorMessage } from '@/lib/errorMessage'

export function DashboardPage() {
  const { data, loading, error, refetch } = useAsync(async () => {
    const [summary, accounts, categories, txList] = await Promise.all([
      getDashboardSummary(), 
      listAccounts(), 
      listCategories(),
      listTransactions({}, 1, 50)
    ])
    return { summary, accounts, categories, transactions: txList.items }
  }, [])

  if (loading) return <LoadingBlock label="Memuat dashboard…" />
  if (error || !data) return <ErrorState title="Gagal memuat dashboard" message={getErrorMessage(error)} onRetry={refetch} />

  const { summary, accounts, categories, transactions } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buku Kas"
        description={`Pencatatan sederhana gaya Excel`}
      />

      {/* Ringkasan Keuangan (Gaya Excel) */}
      <div className="rounded-lg border border-border bg-surface p-4 shadow-sm w-full md:w-96">
        <h2 className="text-lg font-bold text-foreground mb-4">RINGKASAN KEUANGAN</h2>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="font-medium">Total Pemasukan</span>
          <span className="font-semibold text-success">{formatRupiah(summary.totalIncome)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="font-medium">Total Pengeluaran</span>
          <span className="font-semibold text-danger">{formatRupiah(summary.totalExpense)}</span>
        </div>
        <div className="flex justify-between items-center py-2 bg-success/10 -mx-4 px-4 mt-2">
          <span className="font-bold text-foreground">SALDO SAAT INI</span>
          <span className="font-bold text-foreground">{formatRupiah(summary.totalBalance)}</span>
        </div>
      </div>

      {/* Tabel Pencatatan */}
      <LedgerTable 
        transactions={transactions} 
        categories={categories} 
        accounts={accounts} 
        onSubmit={async (input) => {
          await createTransaction(input)
          await refetch()
        }}
      />
    </div>
  )
}