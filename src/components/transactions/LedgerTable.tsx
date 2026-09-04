import { useState } from 'react'
import type { Category, Transaction, Account } from '@/types'
import { formatRupiah } from '@/lib/currency'

interface LedgerTableProps {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  onSubmit: (input: any) => Promise<void>
}

export function LedgerTable({ transactions, categories, accounts, onSubmit }: LedgerTableProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [income, setIncome] = useState('')
  const [expense, setExpense] = useState('')
  const [loading, setLoading] = useState(false)

  const defaultAccountId = accounts[0]?.id || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!defaultAccountId) {
      alert('Tidak ada akun yang tersedia.')
      return
    }

    const incNum = Number(income.replace(/\D/g, '')) || 0
    const expNum = Number(expense.replace(/\D/g, '')) || 0

    if (incNum === 0 && expNum === 0) return

    const type = incNum > 0 ? 'income' : 'expense'
    const amount = incNum > 0 ? incNum : expNum

    setLoading(true)
    try {
      await onSubmit({
        accountId: defaultAccountId,
        categoryId: categoryId || categories[0]?.id || '',
        type,
        amount,
        transactionDate: new Date(date).toISOString(),
        note: note || undefined,
      })
      setNote('')
      setIncome('')
      setExpense('')
      setCategoryId('')
    } catch (err) {
      alert('Gagal mencatat transaksi')
    } finally {
      setLoading(false)
    }
  }

  // Calculate running balance from bottom (oldest) to top (newest)
  // Assuming transactions are sorted newest first.
  let currentBalance = 0;
  const reversed = [...transactions].reverse();
  const balanceMap = new Map<string, number>();
  
  reversed.forEach(t => {
    if (t.type === 'income') {
      currentBalance += t.amount;
    } else {
      currentBalance -= t.amount;
    }
    balanceMap.set(t.id, currentBalance);
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-hover text-muted border-b border-border">
          <tr>
            <th className="p-3 font-semibold">Tanggal</th>
            <th className="p-3 font-semibold">Keterangan</th>
            <th className="p-3 font-semibold">Kategori</th>
            <th className="p-3 font-semibold text-right">Pemasukan</th>
            <th className="p-3 font-semibold text-right">Pengeluaran</th>
            <th className="p-3 font-semibold text-right">Saldo Berjalan</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {/* Baris Input */}
          <tr className="bg-primary/5">
            <td className="p-2">
              <input 
                type="date" 
                className="w-full rounded border border-border bg-surface p-1.5 focus:border-primary focus:outline-none"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </td>
            <td className="p-2">
              <input 
                type="text" 
                placeholder="Keterangan..." 
                className="w-full rounded border border-border bg-surface p-1.5 focus:border-primary focus:outline-none"
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => {
                   if (e.key === 'Enter') handleSubmit(e as any)
                }}
              />
            </td>
            <td className="p-2">
              <select 
                className="w-full rounded border border-border bg-surface p-1.5 focus:border-primary focus:outline-none"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">Pilih...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </td>
            <td className="p-2">
              <input 
                type="text" 
                placeholder="Rp" 
                className="w-full rounded border border-border bg-surface p-1.5 text-right font-medium text-success focus:border-primary focus:outline-none"
                value={income}
                onChange={e => { setIncome(e.target.value); setExpense('') }}
                onKeyDown={e => {
                   if (e.key === 'Enter') handleSubmit(e as any)
                }}
              />
            </td>
            <td className="p-2">
              <input 
                type="text" 
                placeholder="Rp" 
                className="w-full rounded border border-border bg-surface p-1.5 text-right font-medium text-danger focus:border-primary focus:outline-none"
                value={expense}
                onChange={e => { setExpense(e.target.value); setIncome('') }}
                onKeyDown={e => {
                   if (e.key === 'Enter') handleSubmit(e as any)
                }}
              />
            </td>
            <td className="p-2 text-right text-muted">-</td>
            <td className="p-2 text-center">
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="rounded bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                Simpan
              </button>
            </td>
          </tr>

          {/* Baris Transaksi */}
          {transactions.map(t => {
            const cat = categories.find(c => c.id === t.categoryId)
            const balance = balanceMap.get(t.id) || 0
            return (
              <tr key={t.id} className="transition-colors hover:bg-surface-hover/50">
                <td className="p-3 text-muted">{new Date(t.transactionDate).toLocaleDateString('id-ID')}</td>
                <td className="p-3 font-medium text-foreground">{t.note || '-'}</td>
                <td className="p-3 text-muted">{cat?.name || '-'}</td>
                <td className="p-3 text-right font-medium text-success">
                  {t.type === 'income' ? formatRupiah(t.amount) : '-'}
                </td>
                <td className="p-3 text-right font-medium text-danger">
                  {t.type === 'expense' ? formatRupiah(t.amount) : '-'}
                </td>
                <td className="p-3 text-right font-bold text-foreground">
                  {formatRupiah(balance)}
                </td>
                <td className="p-3"></td>
              </tr>
            )
          })}
          
          {transactions.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-muted">
                Belum ada transaksi.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
