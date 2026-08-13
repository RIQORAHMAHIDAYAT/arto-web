import type { Paginated, Transaction, TransactionFilters, TransactionInput } from '@/types'
import { delay, MockApiError, paginate } from './client'
import { getState, mutate, persist, uid } from '../mockDb'
import { getActiveUserId } from './authApi'

function assertOwnedResource<T extends { id: string; userId?: string | null }>(
  collection: T[],
  id: string,
  label: string,
): T {
  const found = collection.find((item) => item.id === id)
  if (!found) throw new MockApiError(`${label} tidak ditemukan.`, 404, 'NOT_FOUND')
  return found
}

export async function listTransactions(filters: TransactionFilters = {}, page = 1, limit = 20): Promise<Paginated<Transaction>> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  let items = state.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.createdAt.localeCompare(a.createdAt))

  if (filters.type) items = items.filter((t) => t.type === filters.type)
  if (filters.categoryId) items = items.filter((t) => t.categoryId === filters.categoryId)
  if (filters.accountId) items = items.filter((t) => t.accountId === filters.accountId)
  if (filters.from) items = items.filter((t) => t.transactionDate >= (filters.from ?? ''))
  if (filters.to) items = items.filter((t) => t.transactionDate <= (filters.to ?? ''))
  if (filters.query) {
    const q = filters.query.toLowerCase()
    items = items.filter((t) => t.note?.toLowerCase().includes(q))
  }

  return paginate(items, page, limit)
}

export async function getTransaction(id: string): Promise<Transaction> {
  await delay(120)
  const state = getState()
  const t = state.transactions.find((t) => t.id === id)
  if (!t) throw new MockApiError('Transaksi tidak ditemukan.', 404, 'NOT_FOUND')
  return t
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()

  const amount = Math.floor(Number(input.amount))
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new MockApiError('Nominal harus lebih dari 0.', 422, 'VALIDATION')
  }
  if (!input.transactionDate) {
    throw new MockApiError('Tanggal wajib diisi.', 422, 'VALIDATION')
  }
  assertOwnedResource(getState().accounts, input.accountId, 'Akun')
  const category = assertOwnedResource(state.categories, input.categoryId, 'Kategori')
  if (category.type !== input.type) {
    throw new MockApiError('Kategori tidak cocok dengan jenis transaksi.', 422, 'TYPE_MISMATCH')
  }

  const timestamp = new Date().toISOString()
  const transaction: Transaction = {
    id: uid(),
    userId,
    accountId: input.accountId,
    categoryId: input.categoryId,
    type: input.type,
    amount,
    transactionDate: input.transactionDate,
    note: input.note?.trim() || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  mutate((s) => {
    s.transactions.push(transaction)
  })
  return transaction
}

export async function updateTransaction(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
  await delay()
  const state = getState()
  const transaction = state.transactions.find((t) => t.id === id)
  if (!transaction) throw new MockApiError('Transaksi tidak ditemukan.', 404, 'NOT_FOUND')

  if (input.amount !== undefined) {
    const amount = Math.floor(Number(input.amount))
    if (!Number.isFinite(amount) || amount <= 0) throw new MockApiError('Nominal harus lebih dari 0.', 422, 'VALIDATION')
    transaction.amount = amount
  }
  if (input.accountId !== undefined) {
    assertOwnedResource(state.accounts, input.accountId, 'Akun')
    transaction.accountId = input.accountId
  }
  if (input.categoryId !== undefined || input.type !== undefined) {
    const nextType = input.type ?? transaction.type
    const nextCategoryId = input.categoryId ?? transaction.categoryId
    const category = assertOwnedResource(state.categories, nextCategoryId, 'Kategori')
    if (category.type !== nextType) {
      throw new MockApiError('Kategori tidak cocok dengan jenis transaksi.', 422, 'TYPE_MISMATCH')
    }
    transaction.categoryId = nextCategoryId
    transaction.type = nextType
  }
  if (input.transactionDate !== undefined) transaction.transactionDate = input.transactionDate
  if (input.note !== undefined) transaction.note = input.note?.trim() || null
  transaction.updatedAt = new Date().toISOString()
  persist()
  return transaction
}

export async function deleteTransaction(id: string): Promise<void> {
  await delay()
  const state = getState()
  const idx = state.transactions.findIndex((t) => t.id === id)
  if (idx === -1) throw new MockApiError('Transaksi tidak ditemukan.', 404, 'NOT_FOUND')
  state.transactions.splice(idx, 1)
  persist()
}