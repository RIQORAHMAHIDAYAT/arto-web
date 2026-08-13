import type { Category, CategoryInput, TransactionType } from '@/types'
import { delay, MockApiError } from './client'
import { getState, mutate, persist, uid } from '../mockDb'
import { getActiveUserId } from './authApi'

export async function listCategories(type?: TransactionType): Promise<Category[]> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  const categories = state.categories.filter((c) => c.userId === null || c.userId === userId)
  const filtered = type ? categories.filter((c) => c.type === type) : categories
  return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const name = input.name.trim()
  if (!name) throw new MockApiError('Nama kategori wajib diisi.', 422, 'VALIDATION')
  const category: Category = {
    id: uid(),
    userId,
    name,
    type: input.type,
    icon: input.icon?.trim() || '📦',
    createdAt: new Date().toISOString(),
  }
  mutate((s) => {
    s.categories.push(category)
  })
  return category
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
  await delay()
  const state = getState()
  const category = state.categories.find((c) => c.id === id)
  if (!category) throw new MockApiError('Kategori tidak ditemukan.', 404, 'NOT_FOUND')
  if (input.name !== undefined && input.name.trim()) category.name = input.name.trim()
  if (input.type !== undefined) category.type = input.type
  if (input.icon !== undefined) category.icon = input.icon.trim() || category.icon
  persist()
  return category
}

export async function deleteCategory(id: string): Promise<void> {
  await delay()
  const state = getState()
  const category = state.categories.find((c) => c.id === id)
  if (!category) throw new MockApiError('Kategori tidak ditemukan.', 404, 'NOT_FOUND')
  if (category.userId === null) {
    throw new MockApiError('Kategori bawaan tidak dapat dihapus.', 403, 'FORBIDDEN')
  }
  const hasTransactions = state.transactions.some((t) => t.categoryId === id)
  if (hasTransactions) {
    throw new MockApiError('Kategori masih dipakai transaksi dan tidak dapat dihapus.', 409, 'CATEGORY_IN_USE')
  }
  const usedByBudget = state.budgets.some((b) => b.categoryId === id)
  if (usedByBudget) {
    throw new MockApiError('Kategori masih dipakai budget dan tidak dapat dihapus.', 409, 'CATEGORY_IN_USE')
  }
  const idx = state.categories.findIndex((c) => c.id === id)
  state.categories.splice(idx, 1)
  persist()
}