import { describe, expect, it } from 'vitest'
import {
  goalProgress,
  goalRemaining,
  goalRemainingDays,
  requiredDailySaving,
  amountToCurrentGoal,
  goalStatus,
} from '@/domain/goals'

const DAY = 86_400_000

describe('goalProgress', () => {
  it('menghitung progres 0..1', () => {
    expect(goalProgress(2_500_000, 10_000_000)).toBe(0.25)
  })

  it('mengunci maksimal di 1 meskipun melebihi target', () => {
    expect(goalProgress(12_000_000, 10_000_000)).toBe(1)
  })

  it('mengembalikan 0 jika target <= 0', () => {
    expect(goalProgress(1_000_000, 0)).toBe(0)
  })
})

describe('goalRemaining', () => {
  it('menghitung sisa nominal', () => {
    expect(goalRemaining(3_000_000, 5_000_000)).toBe(2_000_000)
  })

  it('tidak negatif jika sudah melebihi target', () => {
    expect(goalRemaining(6_000_000, 5_000_000)).toBe(0)
  })
})

describe('goalRemainingDays', () => {
  it('menghitung hari tersisa termasuk hari ini', () => {
    const today = new Date('2026-08-13T10:00:00')
    const deadline = new Date('2026-08-15T23:59:59')
    expect(goalRemainingDays(deadline.toISOString().slice(0, 10), today)).toBe(3)
  })

  it('mengembalikan 0 jika deadline sudah lewat', () => {
    const today = new Date('2026-08-16T10:00:00')
    const deadline = new Date('2026-08-15T23:59:59')
    expect(goalRemainingDays(deadline.toISOString().slice(0, 10), today)).toBe(0)
  })
})

describe('requiredDailySaving', () => {
  it('mengembalikan estimasi tabungan per hari', () => {
    const today = new Date('2026-08-13T10:00:00')
    const deadline = today.getTime() + DAY * 9
    const result = requiredDailySaving(0, 1_000_000, new Date(deadline).toISOString().slice(0, 10), today)
    expect(result).toBe(100_000)
  })

  it('mengembalikan null jika tanpa deadline', () => {
    expect(requiredDailySaving(0, 1_000_000, null)).toBeNull()
  })

  it('mengembalikan null jika goal sudah tercapai', () => {
    expect(requiredDailySaving(1_000_000, 1_000_000, '2026-08-15')).toBeNull()
  })
})

describe('amountToCurrentGoal', () => {
  it('tidak melebihi target saat mengupdate nominal terkumpul', () => {
    expect(amountToCurrentGoal(15_000_000, 10_000_000)).toBe(10_000_000)
  })

  it('tidak negatif', () => {
    expect(amountToCurrentGoal(-5, 10_000_000)).toBe(0)
  })
})

describe('goalStatus', () => {
  it('ok jika progres di bawah 70%', () => {
    expect(goalStatus(500_000, 1_000_000)).toBe('ok')
  })

  it('warn jika progres 70% atau lebih', () => {
    expect(goalStatus(700_000, 1_000_000)).toBe('warn')
  })

  it('done jika target tercapai', () => {
    expect(goalStatus(1_000_000, 1_000_000)).toBe('done')
  })
})