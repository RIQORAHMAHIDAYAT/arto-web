import type { AnalyticsSummary, CategoryStat, TrendPoint } from '@/types'
import { delay, MockApiError } from './client'
import { getState } from '../mockDb'
import { getActiveUserId } from './authApi'
import { daysBetween, endOfMonth, formatMonthShort, startOfDay, startOfMonth, toISODate } from '@/lib/date'

export interface AnalyticsRange {
  from?: string
  to?: string
}

function resolveRange(range: AnalyticsRange): { from: string; to: string; labels: { from: string; to: string } } {
  const today = new Date()
  const from = range.from ?? toISODate(startOfMonth(today))
  const to = range.to ?? toISODate(endOfMonth(today))
  return { from, to, labels: { from, to } }
}

export async function getAnalyticsSummary(range: AnalyticsRange = {}): Promise<AnalyticsSummary> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const { from, to } = resolveRange(range)
  const state = getState()
  let income = 0
  let expense = 0
  let expenseCount = 0
  let totalCount = 0
  for (const t of state.transactions) {
    if (t.userId !== userId || t.transactionDate < from || t.transactionDate > to) continue
    totalCount += 1
    if (t.type === 'income') income += t.amount
    else {
      expense += t.amount
      expenseCount += 1
    }
  }
  const dayCount = daysBetween(new Date(`${from}T00:00:00`), new Date(`${to}T23:59:59`))
  return {
    income,
    expense,
    net: income - expense,
    averageSpending: dayCount > 0 ? Math.round(expense / dayCount) : 0,
    transactionCount: totalCount,
  }
}

export async function getExpenseByCategory(range: AnalyticsRange = {}): Promise<CategoryStat[]> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const { from, to } = resolveRange(range)
  const state = getState()
  const byCategory = new Map<string, { amount: number; name: string; icon: string }>()
  let total = 0
  for (const t of state.transactions) {
    if (t.userId !== userId || t.type !== 'expense' || t.transactionDate < from || t.transactionDate > to) continue
    total += t.amount
    const cat = state.categories.find((c) => c.id === t.categoryId)
    const current = byCategory.get(t.categoryId) ?? { amount: 0, name: cat?.name ?? 'Tanpa Kategori', icon: cat?.icon ?? '📦' }
    current.amount += t.amount
    byCategory.set(t.categoryId, current)
  }
  const stats: CategoryStat[] = Array.from(byCategory.entries()).map(([categoryId, v]) => ({
    categoryId,
    categoryName: v.name,
    categoryIcon: v.icon,
    amount: v.amount,
    percentage: total > 0 ? v.amount / total : 0,
  }))
  return stats.sort((a, b) => b.amount - a.amount)
}

export async function getTrends(range: AnalyticsRange = {}, bucket: 'day' | 'week' = 'day'): Promise<TrendPoint[]> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const { from, to } = resolveRange(range)
  const state = getState()

  const map = new Map<string, { income: number; expense: number }>()
  const keyOf = (date: string): string => {
    if (bucket === 'week') {
      const d = new Date(`${date}T00:00:00`)
      const monday = startOfDay(d)
      const dow = (d.getDay() + 6) % 7
      monday.setDate(d.getDate() - dow)
      return toISODate(monday)
    }
    return date
  }

  for (const t of state.transactions) {
    if (t.userId !== userId || t.transactionDate < from || t.transactionDate > to) continue
    const key = keyOf(t.transactionDate)
    const current = map.get(key) ?? { income: 0, expense: 0 }
    if (t.type === 'income') current.income += t.amount
    else current.expense += t.amount
    map.set(key, current)
  }

  // Isi semua hari/bulan yang kosong agar grafik seragam.
  const keys: string[] = []
  const fromDate = new Date(`${from}T00:00:00`)
  const toDate = new Date(`${to}T23:59:59`)
  const stepDays = bucket === 'week' ? 7 : 1
  for (let d = startOfDay(fromDate); d <= toDate; d.setDate(d.getDate() + stepDays)) {
    keys.push(toISODate(d))
  }

  return keys.map((key) => {
    const value = map.get(key) ?? { income: 0, expense: 0 }
    const label = bucket === 'week' || stepDays > 1 ? formatMonthShort(new Date(`${key}T00:00:00`)) : key.slice(8)
    return { label, income: value.income, expense: value.expense }
  })
}