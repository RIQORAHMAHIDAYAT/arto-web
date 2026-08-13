import { describe, expect, it } from 'vitest'
import { formatDateShort, parseISODate } from '@/lib/date'

describe('parseISODate', () => {
  it('memparsing tanggal YYYY-MM-DD', () => {
    const date = parseISODate('2026-08-13')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(7)
    expect(date.getDate()).toBe(13)
  })

  it('menoleransi full ISO timestamp', () => {
    const date = parseISODate('2026-08-13T06:47:32.123Z')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(7)
    expect(date.getDate()).toBe(13)
  })
})

describe('formatDateShort', () => {
  it('memformat string tanggal murni', () => {
    expect(formatDateShort('2026-08-13')).toMatch(/13/)
  })

  it('memformat full ISO timestamp tanpa melempar error', () => {
    expect(() => formatDateShort('2026-08-13T06:47:32.123Z')).not.toThrow()
    expect(formatDateShort('2026-08-13T06:47:32.123Z')).toMatch(/13/)
  })
})