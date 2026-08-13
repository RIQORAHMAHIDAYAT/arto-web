import type { FinancialGoal, FinancialGoalInput } from '@/types'
import { delay, MockApiError } from './client'
import { getState, mutate, persist, uid } from '../mockDb'
import { getActiveUserId } from './authApi'

type GoalWithMeta = FinancialGoal & {
  progress: number
  remaining: number
  remainingDays: number | null
  requiredDaily: number | null
}

function decorate(goal: FinancialGoal): GoalWithMeta {
  const progress = goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const remainingDays = goal.deadline ? goalRemainingDays(goal.deadline) : null
  const requiredDaily =
    goal.deadline && goal.currentAmount < goal.targetAmount && remainingDays && remainingDays > 0
      ? Math.ceil(remaining / remainingDays)
      : null
  return { ...goal, progress, remaining, remainingDays, requiredDaily }
}

function goalRemainingDays(deadline: string): number {
  const end = new Date(`${deadline}T23:59:59`)
  const diff = Math.round((end.getTime() - Date.now()) / 86_400_000)
  return Math.max(0, diff + 1)
}

export async function listGoals(): Promise<GoalWithMeta[]> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  return state.goals
    .filter((g) => g.userId === userId)
    .map(decorate)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getGoal(id: string): Promise<GoalWithMeta> {
  await delay(120)
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  const goal = state.goals.find((g) => g.id === id && g.userId === userId)
  if (!goal) throw new MockApiError('Goal tidak ditemukan.', 404, 'NOT_FOUND')
  return decorate(goal)
}

export async function createGoal(input: FinancialGoalInput): Promise<GoalWithMeta> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const name = input.name.trim()
  if (!name) throw new MockApiError('Nama goal wajib diisi.', 422, 'VALIDATION')
  const target = Math.floor(Number(input.targetAmount))
  if (!Number.isFinite(target) || target <= 0) {
    throw new MockApiError('Target nominal harus lebih dari 0.', 422, 'VALIDATION')
  }
  const current = Math.max(0, Math.floor(Number(input.currentAmount ?? 0)))
  const timestamp = new Date().toISOString()
  const goal: FinancialGoal = {
    id: uid(),
    userId,
    name,
    targetAmount: target,
    currentAmount: Math.min(current, target),
    deadline: input.deadline?.trim() ? input.deadline.trim() : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  mutate((s) => {
    s.goals.push(goal)
  })
  return decorate(goal)
}

export async function updateGoal(id: string, input: Partial<FinancialGoalInput>): Promise<GoalWithMeta> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  const goal = state.goals.find((g) => g.id === id && g.userId === userId)
  if (!goal) throw new MockApiError('Goal tidak ditemukan.', 404, 'NOT_FOUND')
  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) throw new MockApiError('Nama goal wajib diisi.', 422, 'VALIDATION')
    goal.name = name
  }
  if (input.targetAmount !== undefined) {
    const target = Math.floor(Number(input.targetAmount))
    if (!Number.isFinite(target) || target <= 0) {
      throw new MockApiError('Target nominal harus lebih dari 0.', 422, 'VALIDATION')
    }
    goal.targetAmount = target
    goal.currentAmount = Math.min(goal.currentAmount, target)
  }
  if (input.currentAmount !== undefined) {
    const current = Math.max(0, Math.floor(Number(input.currentAmount)))
    goal.currentAmount = Math.min(current, goal.targetAmount)
  }
  if (input.deadline !== undefined) {
    goal.deadline = input.deadline?.trim() ? input.deadline.trim() : null
  }
  goal.updatedAt = new Date().toISOString()
  persist()
  return decorate(goal)
}

export async function deleteGoal(id: string): Promise<void> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  const idx = state.goals.findIndex((g) => g.id === id && g.userId === userId)
  if (idx === -1) throw new MockApiError('Goal tidak ditemukan.', 404, 'NOT_FOUND')
  state.goals.splice(idx, 1)
  persist()
}