import type { Account, Budget, Category, FinancialGoal, Transaction, User } from '@/types'
import { addDays, toISODate } from '@/lib/date'

export interface StoredUser extends User {
  passwordHash: string
}

export interface MockState {
  users: StoredUser[]
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  goals: FinancialGoal[]
}

const STORAGE_KEY = 'arto.mocks.v1'

export const MOCK_EMAIL = 'demo@arto.id'
export const MOCK_PASSWORD = 'demopass123'

function now(): string {
  return new Date().toISOString()
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function hashPassword(password: string): string {
  let hash = 5381
  for (let i = 0; i < password.length; i += 1) {
    hash = ((hash << 5) + hash + password.charCodeAt(i)) | 0
  }
  return `mock$${hash >>> 0}`.padEnd(12, 'x')
}

/**
 * Simulasi hash untuk mock data. BUKAN untuk dipakai produksi —
 * backend asli wajib menggunakan Argon2/bcrypt di sisi server.
 */
export function makePasswordHash(password: string): string {
  return hashPassword(password)
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

function buildSeed(): MockState {
  const userId = uid()
  return seedState(userId, new Date())
}

export function seedState(userId: string, today: Date): MockState {
  const iso = (d: Date) => toISODate(d)
  const categories: Category[] = [
    { id: 'cat_food', userId: null, name: 'Makanan', type: 'expense', icon: '🍜', createdAt: now() },
    { id: 'cat_transport', userId: null, name: 'Transportasi', type: 'expense', icon: '🚌', createdAt: now() },
    { id: 'cat_shopping', userId: null, name: 'Belanja', type: 'expense', icon: '🛍️', createdAt: now() },
    { id: 'cat_bills', userId: null, name: 'Tagihan', type: 'expense', icon: '🧾', createdAt: now() },
    { id: 'cat_education', userId: null, name: 'Pendidikan', type: 'expense', icon: '📚', createdAt: now() },
    { id: 'cat_health', userId: null, name: 'Kesehatan', type: 'expense', icon: '💊', createdAt: now() },
    { id: 'cat_entertainment', userId: null, name: 'Hiburan', type: 'expense', icon: '🎬', createdAt: now() },
    { id: 'cat_salary', userId: null, name: 'Gaji', type: 'income', icon: '💰', createdAt: now() },
    { id: 'cat_other', userId: null, name: 'Lainnya', type: 'expense', icon: '📦', createdAt: now() },
  ]

  const accounts: Account[] = [
    { id: 'acc_cash', userId, name: 'Uang Tunai', type: 'cash', initialBalance: 250_000, createdAt: now(), updatedAt: now() },
    { id: 'acc_bank', userId, name: 'Bank BCA', type: 'bank', initialBalance: 3_000_000, createdAt: now(), updatedAt: now() },
    { id: 'acc_ovo', userId, name: 'OVO', type: 'ewallet', initialBalance: 150_000, createdAt: now(), updatedAt: now() },
  ]

  const transactions: Transaction[] = []
  const push = (
    categoryId: string,
    type: Transaction['type'],
    amount: number,
    dayOffset: number,
    note: string | null,
    accountId = 'acc_bank',
  ) => {
    transactions.push({
      id: uid(),
      userId,
      accountId,
      categoryId,
      type,
      amount,
      transactionDate: iso(addDays(today, dayOffset)),
      note,
      createdAt: now(),
      updatedAt: now(),
    })
  }

  push('cat_salary', 'income', 4_500_000, -25, 'Gaji bulan ini', 'acc_bank')
  push('cat_food', 'expense', 45_000, -24, 'Makan siang', 'acc_ovo')
  push('cat_transport', 'expense', 20_000, -23, 'Gojek kantor', 'acc_ovo')
  push('cat_bills', 'expense', 350_000, -21, 'Listrik', 'acc_bank')
  push('cat_shopping', 'expense', 180_000, -19, 'Kaos', 'acc_bank')
  push('cat_food', 'expense', 35_000, -17, 'Sarapan', 'acc_cash')
  push('cat_entertainment', 'expense', 60_000, -15, 'Nonton bioskop', 'acc_ovo')
  push('cat_health', 'expense', 120_000, -12, 'Vitamin', 'acc_bank')
  push('cat_food', 'expense', 55_000, -10, 'Makan malam', 'acc_cash')
  push('cat_transport', 'expense', 15_000, -9, 'Angkot', 'acc_cash')
  push('cat_food', 'expense', 40_000, -7, 'Makan siang', 'acc_ovo')
  push('cat_bills', 'expense', 150_000, -6, 'Pulsa & kuota', 'acc_bank')
  push('cat_food', 'expense', 50_000, -4, 'Kopi & kue', 'acc_ovo')
  push('cat_shopping', 'expense', 95_000, -3, 'Alat tulis', 'acc_bank')
  push('cat_food', 'expense', 25_000, -1, 'Sarapan', 'acc_cash')
  push('cat_entertainment', 'expense', 30_000, -2, 'Langganan streaming', 'acc_bank')
  push('cat_transport', 'expense', 22_000, -1, 'Grab', 'acc_ovo')
  push('cat_education', 'expense', 250_000, -5, 'Buku', 'acc_bank')

  const periodStart = iso(new Date(today.getFullYear(), today.getMonth(), 1))
  const periodEnd = iso(new Date(today.getFullYear(), today.getMonth() + 1, 0))
  const budgets: Budget[] = [
    {
      id: 'bgt_makan',
      userId,
      categoryId: 'cat_food',
      amount: 1_000_000,
      periodStart,
      periodEnd,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'bgt_transport',
      userId,
      categoryId: 'cat_transport',
      amount: 400_000,
      periodStart,
      periodEnd,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'bgt_tagihan',
      userId,
      categoryId: 'cat_bills',
      amount: 800_000,
      periodStart,
      periodEnd,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'bgt_hiburan',
      userId,
      categoryId: 'cat_entertainment',
      amount: 300_000,
      periodStart,
      periodEnd,
      createdAt: now(),
      updatedAt: now(),
    },
  ]

  const goals: FinancialGoal[] = [
    {
      id: 'goal_laptop',
      userId,
      name: 'Tabungan Laptop',
      targetAmount: 10_000_000,
      currentAmount: 6_500_000,
      deadline: iso(new Date(today.getFullYear(), today.getMonth() + 10, 15)),
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'goal_darurat',
      userId,
      name: 'Dana Darurat',
      targetAmount: 15_000_000,
      currentAmount: 3_000_000,
      deadline: null,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'goal_liburan',
      userId,
      name: 'Liburan',
      targetAmount: 5_000_000,
      currentAmount: 5_000_000,
      deadline: iso(new Date(today.getFullYear(), today.getMonth(), 20)),
      createdAt: now(),
      updatedAt: now(),
    },
  ]

  return {
    users: [
      {
        id: userId,
        email: MOCK_EMAIL,
        name: 'Demo User',
        theme: 'system',
        passwordHash: makePasswordHash(MOCK_PASSWORD),
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    accounts,
    categories,
    transactions,
    budgets,
    goals,
  }
}

function loadFromStorage(): MockState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MockState
    if (!parsed.users || !parsed.accounts || !parsed.categories) return null
    if (!Array.isArray(parsed.goals)) parsed.goals = []
    return parsed
  } catch {
    return null
  }
}

let state: MockState | null = null

export function getState(): MockState {
  if (!state) {
    state = loadFromStorage() ?? buildSeed()
  }
  return state
}

export function resetState(forceSeed = true): void {
  state = forceSeed
    ? buildSeed()
    : { users: [], accounts: [], categories: [], transactions: [], budgets: [], goals: [] }
  persist()
}

export function persist(): void {
  if (typeof localStorage === 'undefined' || !state) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage mungkin penuh/private mode; abaikan untuk mock
  }
}

export function mutate<T>(fn: (draft: MockState) => T): T {
  const snap = getState()
  const result = fn(snap)
  persist()
  return result
}

export { uid }