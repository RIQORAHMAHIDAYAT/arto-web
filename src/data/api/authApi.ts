import type { Credentials, Session, User } from '@/types'
import { delay, MockApiError } from './client'
import {
  getState,
  makePasswordHash,
  persist,
  uid,
  verifyPassword,
  type StoredUser,
  type MockState,
} from '../mockDb'

const ACTIVE_KEY = 'arto.activeUserId'

function loadActiveUserId(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ACTIVE_KEY)
}

let activeUserId: string | null = loadActiveUserId()

export function getActiveUserId(): string | null {
  return activeUserId
}

function setActiveUserId(id: string | null): void {
  activeUserId = id
  if (typeof localStorage !== 'undefined') {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  }
}

function toUser(stored: StoredUser): User {
  const { passwordHash: _passwordHash, ...user } = stored
  return user
}

export async function register(credentials: Credentials): Promise<Session> {
  await delay()
  const state = getState()
  const email = credentials.email.trim().toLowerCase()
  if (!credentials.password || credentials.password.length < 8) {
    throw new MockApiError('Password minimal 8 karakter.', 422, 'VALIDATION')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new MockApiError('Format email tidak valid.', 422, 'VALIDATION')
  }
  if (state.users.some((u) => u.email === email)) {
    throw new MockApiError('Email sudah terdaftar. Silakan login.', 409, 'EMAIL_EXISTS')
  }
  const name = (credentials.name ?? '').trim() || email.split('@')[0]
  const stored: StoredUser = {
    id: uid(),
    email,
    name,
    theme: 'system',
    passwordHash: makePasswordHash(credentials.password),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  state.users.push(stored)
  persist()
  setActiveUserId(stored.id)
  return { accessToken: `mock_${stored.id}`, user: toUser(stored) }
}

export async function login(credentials: Credentials): Promise<Session> {
  await delay()
  const state = getState()
  const email = credentials.email.trim().toLowerCase()
  const stored = state.users.find((u) => u.email === email)
  if (!stored || !verifyPassword(credentials.password, stored.passwordHash)) {
    throw new MockApiError('Email atau password salah.', 401, 'INVALID_CREDENTIALS')
  }
  setActiveUserId(stored.id)
  return { accessToken: `mock_${stored.id}`, user: toUser(stored) }
}

export async function getSession(): Promise<Session | null> {
  if (!activeUserId) return null
  const state = getState()
  const stored = state.users.find((u) => u.id === activeUserId)
  if (!stored) return null
  return { accessToken: `mock_${stored.id}`, user: toUser(stored) }
}

export async function logout(): Promise<void> {
  await delay(150)
  setActiveUserId(null)
}

export async function updateProfile(input: Partial<Pick<User, 'name' | 'theme'>>): Promise<User> {
  await delay()
  const userId = getActiveUserId()
  if (!userId) throw new MockApiError('Belum login.', 401, 'UNAUTHORIZED')
  const state: MockState = getState()
  const stored = state.users.find((u) => u.id === userId)
  if (!stored) throw new MockApiError('User tidak ditemukan.', 404, 'NOT_FOUND')
  if (input.name !== undefined && input.name.trim()) stored.name = input.name.trim()
  if (input.theme !== undefined) stored.theme = input.theme
  stored.updatedAt = new Date().toISOString()
  persist()
  return toUser(stored)
}