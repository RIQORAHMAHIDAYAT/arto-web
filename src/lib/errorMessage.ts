import { MockApiError } from '@/data/api/client'

export function getErrorMessage(err: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  if (err instanceof MockApiError || (err instanceof Error && err.message)) {
    return err.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}