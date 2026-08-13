import type { Account, AccountInput } from '@/types'
import { delay, MockApiError } from './client'
import { getState, mutate, persist, uid } from '../mockDb'
import { getActiveUserId } from './authApi'

export function computeAccountBalance(account: Account, state: ReturnType<typeof getState>): number {
  let balance = account.initialBalance
  for (const t of state.transactions) {
    if (t.accountId !== account.id) continue
    balance += t.type === 'income' ? t.amount : -t.amount
  }
  return balance
}

export async function listAccounts(): Promise<Account[]> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state = getState()
  const accounts = state.accounts
    .filter((a) => a.userId === userId)
    .map((a) => ({ ...a, balance: computeAccountBalance(a, state) }))
  return accounts.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function getAccount(id: string): Promise<Account> {
  await delay(120)
  const state = getState()
  const account = state.accounts.find((a) => a.id === id)
  if (!account) throw new MockApiError('Akun tidak ditemukan.', 404, 'NOT_FOUND')
  return { ...account, balance: computeAccountBalance(account, state) }
}

export async function createAccount(input: AccountInput): Promise<Account> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const name = input.name.trim()
  if (!name) throw new MockApiError('Nama akun wajib diisi.', 422, 'VALIDATION')
  const timestamp = new Date().toISOString()
  const account: Account = {
    id: uid(),
    userId,
    name,
    type: input.type,
    initialBalance: Math.max(0, Math.floor(input.initialBalance ?? 0)),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  mutate((s) => {
    s.accounts.push(account)
  })
  return { ...account, balance: account.initialBalance }
}

export async function updateAccount(id: string, input: Partial<AccountInput>): Promise<Account> {
  await delay()
  const state = getState()
  const account = state.accounts.find((a) => a.id === id)
  if (!account) throw new MockApiError('Akun tidak ditemukan.', 404, 'NOT_FOUND')
  if (input.name !== undefined && input.name.trim()) account.name = input.name.trim()
  if (input.type !== undefined) account.type = input.type
  if (input.initialBalance !== undefined) account.initialBalance = Math.max(0, Math.floor(input.initialBalance))
  account.updatedAt = new Date().toISOString()
  persist()
  return { ...account, balance: computeAccountBalance(account, getState()) }
}

export async function deleteAccount(id: string): Promise<void> {
  await delay()
  const state = getState()
  const hasTransactions = state.transactions.some((t) => t.accountId === id)
  if (hasTransactions) {
    throw new MockApiError('Akun memiliki transaksi dan tidak dapat dihapus.', 409, 'ACCOUNT_HAS_TRANSACTIONS')
  }
  const idx = state.accounts.findIndex((a) => a.id === id)
  if (idx === -1) throw new MockApiError('Akun tidak ditemukan.', 404, 'NOT_FOUND')
  state.accounts.splice(idx, 1)
  persist()
}