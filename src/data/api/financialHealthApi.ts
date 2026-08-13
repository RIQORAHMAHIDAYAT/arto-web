import type { FinancialHealthReport } from '@/types'
import { delay, MockApiError } from './client'
import { getState } from '../mockDb'
import { getActiveUserId } from './authApi'
import { buildHealthReport, buildDailyExpenseSeries } from '@/domain/financialHealth'
import { addDays, endOfMonth, startOfDay, startOfMonth, toISODate } from '@/lib/date'

export async function getFinancialHealth(today = new Date()): Promise<FinancialHealthReport> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()

  const monthStart = toISODate(startOfMonth(today))
  const monthEnd = toISODate(endOfMonth(today))

  let income = 0
  let expense = 0
  for (const t of state.transactions) {
    if (t.userId !== userId || t.transactionDate < monthStart || t.transactionDate > monthEnd) continue
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }

  const budgetUtilizations: number[] = []
  for (const b of state.budgets) {
    if (b.userId !== userId) continue
    if (b.periodEnd < monthStart || b.periodStart > monthEnd) continue
    let spent = 0
    for (const t of state.transactions) {
      if (t.userId !== userId || t.type !== 'expense' || t.categoryId !== b.categoryId) continue
      if (t.transactionDate < b.periodStart || t.transactionDate > b.periodEnd) continue
      spent += t.amount
    }
    budgetUtilizations.push(b.amount > 0 ? spent / b.amount : 0)
  }

  const goalProgresses: number[] = state.goals
    .filter((g) => g.userId === userId)
    .map((g) => (g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0))

  const from = addDays(startOfDay(today), -28)
  const dailyRecords: Array<{ date: string; amount: number }> = []
  for (const t of state.transactions) {
    if (t.userId !== userId || t.type !== 'expense') continue
    if (t.transactionDate < toISODate(from) || t.transactionDate > toISODate(today)) continue
    dailyRecords.push({ date: t.transactionDate, amount: t.amount })
  }
  const dailyExpenses = buildDailyExpenseSeries(dailyRecords, 29, today)

  return buildHealthReport({ income, expense, budgetUtilizations, goalProgresses, dailyExpenses })
}