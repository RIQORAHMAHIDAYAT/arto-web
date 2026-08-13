import { describe, expect, it } from 'vitest'
import {
  budgetDisciplineScore,
  buildHealthReport,
  expenseStabilityScore,
  goalProgressScore,
  savingRateScore,
  scoreLabel,
} from '@/domain/financialHealth'

describe('savingRateScore', () => {
  it('memberi skor 100 jika menabung 20% atau lebih', () => {
    expect(savingRateScore(1_000_000, 700_000)).toBe(100)
  })

  it('memberi skor 50 jika pengeluaran menyamai pemasukan', () => {
    expect(savingRateScore(1_000_000, 1_000_000)).toBe(50)
  })

  it('memberi skor rendah jika pengeluaran lebih besar dari pemasukan', () => {
    expect(savingRateScore(1_000_000, 1_500_000)).toBeLessThan(50)
  })

  it('memberi skor netral 50 jika belum ada pemasukan', () => {
    expect(savingRateScore(0, 100_000)).toBe(50)
  })
})

describe('budgetDisciplineScore', () => {
  it('memberi skor 100 jika utilisasi di bawah 80%', () => {
    expect(budgetDisciplineScore([0.5])).toBe(100)
  })

  it('menurun seiring utilisasi mendekati 100%', () => {
    const score = budgetDisciplineScore([1])
    expect(score).toBeLessThan(100)
  })

  it('memberi skor sangat rendah jika over budget', () => {
    expect(budgetDisciplineScore([1.5])).toBeLessThan(40)
  })

  it('netral 50 jika belum ada budget', () => {
    expect(budgetDisciplineScore([])).toBe(50)
  })
})

describe('expenseStabilityScore', () => {
  it('memberi skor 100 untuk pengeluaran sangat stabil', () => {
    expect(expenseStabilityScore([50, 50, 50, 55])).toBe(100)
  })

  it('netral 50 jika data kurang dari 3 hari', () => {
    expect(expenseStabilityScore([50, 80])).toBe(50)
  })

  it('menurun untuk pengeluaran yang tidak stabil', () => {
    const stable = expenseStabilityScore([50, 50, 50, 55])
    const unstable = expenseStabilityScore([50, 500, 0, 30, 800])
    expect(unstable).toBeLessThan(stable)
  })
})

describe('goalProgressScore', () => {
  it('mengikuti rata-rata progres goal aktif', () => {
    expect(goalProgressScore([0.5, 0.7])).toBe(60)
  })

  it('memberi skor 70 jika sebagian besar goal tercapai', () => {
    expect(goalProgressScore([1, 1])).toBe(70)
  })
})

describe('scoreLabel', () => {
  it('baik jika skor >= 75', () => {
    expect(scoreLabel(80)).toBe('baik')
  })

  it('cukup jika skor 50-74', () => {
    expect(scoreLabel(60)).toBe('cukup')
  })

  it('perlu-pemantauan jika skor < 50', () => {
    expect(scoreLabel(30)).toBe('perlu-pemantauan')
  })
})

describe('buildHealthReport', () => {
  it('membangun laporan dengan 4 faktor dan skor 0..100', () => {
    const report = buildHealthReport({
      income: 1_000_000,
      expense: 500_000,
      budgetUtilizations: [0.6],
      goalProgresses: [0.5],
      dailyExpenses: [50, 60, 40, 55],
    })
    expect(report.factors).toHaveLength(4)
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(100)
    expect(['baik', 'cukup', 'perlu-pemantauan']).toContain(report.level)
    expect(report.summary.length).toBeGreaterThan(0)
  })

  it('level mengikuti skor secara konsisten', () => {
    const sehat = buildHealthReport({
      income: 10_000_000,
      expense: 3_000_000,
      budgetUtilizations: [0.4],
      goalProgresses: [0.9],
      dailyExpenses: [100, 100, 100, 100],
    })
    const buruk = buildHealthReport({
      income: 1_000_000,
      expense: 2_500_000,
      budgetUtilizations: [1.6],
      goalProgresses: [0.05],
      dailyExpenses: [100, 800, 50, 1200],
    })
    expect(sehat.score).toBeGreaterThan(buruk.score)
  })
})