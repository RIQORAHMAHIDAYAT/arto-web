import type { Budget, BudgetInput, BudgetSummaryItem, DailyLimitInfo } from '@/types'
import { delay, MockApiError } from './client'
import { getState, mutate, persist, uid } from '../mockDb'
import { getActiveUserId } from './authApi'
import { calculateDailyLimit, remainingToday } from '@/domain/dailyLimit'
import { budgetUtilization } from '@/domain/budget'
import { startOfDay, toISODate } from '@/lib/date'

function spentForBudget(
  state: ReturnType<typeof getState>,
  userId: string,
  categoryId: string,
  periodStart: string,
  periodEnd: string,
): number {
  let spent = 0
  for (const t of state.transactions) {
    if (t.userId !== userId || t.type !== 'expense' || t.categoryId !== categoryId) continue
    if (t.transactionDate < periodStart || t.transactionDate > periodEnd) continue
    spent += t.amount
  }
  return spent
}

export interface BudgetWithMeta extends Budget {
  spent: number
  utilization: number
  categoryName: string
  categoryIcon: string
}

export async function listBudgets(): Promise<BudgetWithMeta[]> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  return state.budgets
    .filter((b) => b.userId === userId)
    .map((b) => {
      const category = state.categories.find((c) => c.id === b.categoryId)
      const spent = spentForBudget(state, userId, b.categoryId, b.periodStart, b.periodEnd)
      return {
        ...b,
        spent,
        utilization: budgetUtilization(spent, b.amount),
        categoryName: category?.name ?? 'Tanpa Kategori',
        categoryIcon: category?.icon ?? '📦',
      }
    })
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))
}

export async function getBudget(id: string): Promise<BudgetWithMeta> {
  await delay(120)
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  const budget = state.budgets.find((b) => b.id === id && b.userId === userId)
  if (!budget) throw new MockApiError('Budget tidak ditemukan.', 404, 'NOT_FOUND')
  const category = state.categories.find((c) => c.id === budget.categoryId)
  const spent = spentForBudget(state, userId, budget.categoryId, budget.periodStart, budget.periodEnd)
  return {
    ...budget,
    spent,
    utilization: budgetUtilization(spent, budget.amount),
    categoryName: category?.name ?? 'Tanpa Kategori',
    categoryIcon: category?.icon ?? '📦',
  }
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  const amount = Math.floor(Number(input.amount))
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new MockApiError('Nominal budget harus lebih dari 0.', 422, 'VALIDATION')
  }
  if (!state.categories.some((c) => c.id === input.categoryId)) {
    throw new MockApiError('Kategori tidak ditemukan.', 404, 'NOT_FOUND')
  }
  if (!input.periodStart || !input.periodEnd || input.periodEnd < input.periodStart) {
    throw new MockApiError('Periode budget tidak valid.', 422, 'VALIDATION')
  }
  const overlapping = state.budgets.some(
    (b) =>
      b.userId === userId &&
      b.categoryId === input.categoryId &&
      b.periodStart <= input.periodEnd &&
      b.periodEnd >= input.periodStart,
  )
  if (overlapping) {
    throw new MockApiError('Sudah ada budget untuk kategori pada periode ini.', 409, 'DUPLICATE_BUDGET')
  }
  const timestamp = new Date().toISOString()
  const budget: Budget = {
    id: uid(),
    userId,
    categoryId: input.categoryId,
    amount,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  mutate((s) => {
    s.budgets.push(budget)
  })
  return budget
}

export async function updateBudget(id: string, input: Partial<BudgetInput>): Promise<Budget> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  const budget = state.budgets.find((b) => b.id === id && b.userId === userId)
  if (!budget) throw new MockApiError('Budget tidak ditemukan.', 404, 'NOT_FOUND')
  if (input.amount !== undefined) {
    const amount = Math.floor(Number(input.amount))
    if (!Number.isFinite(amount) || amount <= 0) throw new MockApiError('Nominal budget harus lebih dari 0.', 422, 'VALIDATION')
    budget.amount = amount
  }
  if (input.categoryId !== undefined) budget.categoryId = input.categoryId
  if (input.periodStart !== undefined) budget.periodStart = input.periodStart
  if (input.periodEnd !== undefined) budget.periodEnd = input.periodEnd
  if (budget.periodEnd < budget.periodStart) {
    throw new MockApiError('Periode budget tidak valid.', 422, 'VALIDATION')
  }
  budget.updatedAt = new Date().toISOString()
  persist()
  return budget
}

export async function deleteBudget(id: string): Promise<void> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  const idx = state.budgets.findIndex((b) => b.id === id && b.userId === userId)
  if (idx === -1) throw new MockApiError('Budget tidak ditemukan.', 404, 'NOT_FOUND')
  state.budgets.splice(idx, 1)
  persist()
}

export async function getDailyLimit(budgetId: string, today = new Date()): Promise<DailyLimitInfo> {
  await delay(180)
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  const budget = state.budgets.find((b) => b.id === budgetId && b.userId === userId)
  if (!budget) throw new MockApiError('Budget tidak ditemukan.', 404, 'NOT_FOUND')
  const category = state.categories.find((c) => c.id === budget.categoryId)
  const spent = spentForBudget(state, userId, budget.categoryId, budget.periodStart, budget.periodEnd)
  const result = calculateDailyLimit({
    budgetAmount: budget.amount,
    spent,
    today,
    periodEnd: new Date(`${budget.periodEnd}T23:59:59`),
  })

  const todayStr = toISODate(today)
  let spentToday = 0
  for (const t of state.transactions) {
    if (t.userId !== userId || t.type !== 'expense' || t.categoryId !== budget.categoryId) continue
    if (t.transactionDate === todayStr) spentToday += t.amount
  }

  const todayStart = startOfDay(today)
  const periodEndDate = new Date(`${budget.periodEnd}T23:59:59`)
  const active = todayStart <= periodEndDate

  return {
    budgetId: budget.id,
    categoryName: category?.name ?? 'Kategori',
    periodEnd: budget.periodEnd,
    remainingBudget: result.remainingBudget,
    remainingDays: result.remainingDays,
    dailyLimit: active ? result.dailyLimit : 0,
    spentToday,
    remainingToday: remainingToday(spentToday, active ? result.dailyLimit : 0),
  }
}

export async function listBudgetSummary(): Promise<BudgetSummaryItem[]> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  return state.budgets
    .filter((b) => b.userId === userId)
    .map((b) => {
      const category = state.categories.find((c) => c.id === b.categoryId)
      const spent = spentForBudget(state, userId, b.categoryId, b.periodStart, b.periodEnd)
      return {
        budgetId: b.id,
        categoryId: b.categoryId,
        categoryName: category?.name ?? 'Tanpa Kategori',
        categoryIcon: category?.icon ?? '📦',
        spent,
        amount: b.amount,
        utilization: budgetUtilization(spent, b.amount),
      }
    })
}