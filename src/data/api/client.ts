const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '')

const ACCESS_KEY = 'arto.accessToken'
const REFRESH_KEY = 'arto.refreshToken'

export function getApiUrl(): string {
  return API_URL
}

export function getAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status = 400, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Default true. Set false untuk endpoint publik (auth/refresh/login/register). */
  auth?: boolean
}

interface ErrorBody {
  message?: string | string[]
  code?: string
}

let refreshPromise: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!response.ok) {
        clearTokens()
        return false
      }
      const data = (await response.json()) as { accessToken: string; refreshToken: string }
      if (!data.accessToken || !data.refreshToken) {
        clearTokens()
        return false
      }
      setTokens(data.accessToken, data.refreshToken)
      return true
    } catch {
      return false
    } finally {
      setTimeout(() => {
        refreshPromise = null
      }, 0)
    }
  })()
  return refreshPromise
}

async function rawRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getAccessToken()
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  const body = text ? (JSON.parse(text) as unknown) : null

  if (!response.ok) {
    const errBody = body as ErrorBody | null
    const message = Array.isArray(errBody?.message)
      ? errBody!.message[0]
      : (errBody?.message as string | undefined) ?? 'Terjadi kesalahan. Coba lagi.'
    throw new ApiError(message, response.status, errBody?.code)
  }
  return body as T
}

/** Request dengan refresh-on-401 otomatis (satu kali percobaan). */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options)
  } catch (err) {
    const needsRefresh =
      options.auth !== false &&
      err instanceof ApiError &&
      err.status === 401 &&
      getRefreshToken() !== null
    if (!needsRefresh) throw err

    const refreshed = await refreshSession()
    if (!refreshed) throw err
    return rawRequest<T>(path, options)
  }
}

export function queryString(params: object): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const raw = search.toString()
  return raw ? `?${raw}` : ''
}