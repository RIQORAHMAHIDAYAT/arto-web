import type { Paginated } from '@/types'

export const MOCK_LATENCY = 300

export function delay(ms = MOCK_LATENCY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockApiError extends Error {
  status: number
  code: string

  constructor(message: string, status = 400, code = 'MOCK_ERROR') {
    super(message)
    this.name = 'MockApiError'
    this.status = status
    this.code = code
  }
}

export function paginate<T>(items: T[], page: number, limit: number): Paginated<T> {
  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const start = (safePage - 1) * safeLimit
  return {
    items: items.slice(start, start + safeLimit),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
  }
}