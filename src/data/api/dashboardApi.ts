import type { DashboardSummary, SpendingChartPoint } from '@/types'
import { delay, MockApiError } from './client'
import { getState } from '../mockDb'
import { getActiveUserId } from './authApi'
import { computeAccountBalance } from './accountsApi'
import { listBudgetSummary, getDailyLimit } from './budgetsApi'
import { addDays, endOfMonth, startOfDay, startOfMonth, toISODate } from '@/lib/date'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()

  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const periodStart = toISODate(monthStart)
  const periodEnd = toISODate(monthEnd)

  const accounts = state.accounts.filter((a) => a.userId === userId)
  let totalBalance = 0
  for (const account of accounts) totalBalance += computeAccountBalance(account, state)

  let totalIncome = 0
  let totalExpense = 0
  for (const t of state.transactions) {
    if (t.userId !== userId) continue
    if (t.transactionDate < periodStart || t.transactionDate > periodEnd) continue
    if (t.type === 'income') totalIncome += t.amount
    else totalExpense += t.amount
  }

  const recentTransactions = state.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  const [budgetSummary, activeBudget] = await Promise.all([listBudgetSummary(), pickActiveBudget(userId)])
  const dailyLimit = activeBudget ? await getDailyLimit(activeBudget.id, today) : null

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    periodLabel: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(today),
    recentTransactions,
    budgetSummary,
    dailyLimit,
    spendingChart: buildSpendingChart(userId, today),
  }
}

async function pickActiveBudget(userId: string) {
  const budgets = getState().budgets.filter((b) => b.userId === userId)
  const today = toISODate(new Date())
  // Ambil budget pertama yang masih berjalan (hari ini berada dalam periode).
  return budgets.find((b) => b.periodStart <= today && b.periodEnd >= today) ?? budgets[0] ?? null
}

function buildSpendingChart(userId: string, today: Date): SpendingChartPoint[] {
  const state = getState()
  const points: SpendingChartPoint[] = []
  for (let i = 6; i >= 0; i -= 1) {
    const day = startOfDay(addDays(today, -i))
    const key = toISODate(day)
    let income = 0
    let expense = 0
    for (const t of state.transactions) {
      if (t.userId !== userId || t.transactionDate !== key) continue
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    }
    points.push({ date: key, income, expense })
  }
  return points
}