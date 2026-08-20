import type { Credentials, Session, User } from '@/types'
import { ApiError, clearTokens, getAccessToken, getRefreshToken, request, setTokens } from './client'

export const DEMO_EMAIL = 'demo@arto.id'
export const DEMO_PASSWORD = 'demopass123'

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

function toSession(data: AuthResponse): Session {
  setTokens(data.accessToken, data.refreshToken)
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }
}

export async function register(credentials: Credentials): Promise<Session> {
  const data = await request<AuthResponse>('/auth/register', { method: 'POST', body: credentials, auth: false })
  return toSession(data)
}

export async function login(credentials: Credentials): Promise<Session> {
  const data = await request<AuthResponse>('/auth/login', { method: 'POST', body: credentials, auth: false })
  return toSession(data)
}

export async function getSession(): Promise<Session | null> {
  if (!getAccessToken()) return null
  try {
    const user = await request<User>('/users/me')
    return { accessToken: getAccessToken() ?? '', refreshToken: getRefreshToken() ?? '', user }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearTokens()
    }
    return null
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (refreshToken) {
    try {
      await request<void>('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false })
    } catch {
      // tetap bersihkan token lokal meskipun server logout gagal
    }
  }
  clearTokens()
}

export async function updateProfile(input: Partial<Pick<User, 'name' | 'theme'>>): Promise<User> {
  return request<User>('/users/me', { method: 'PATCH', body: input })
}