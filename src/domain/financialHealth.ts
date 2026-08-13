import type { FinancialHealthFactor, FinancialHealthReport } from '@/types'
import { startOfDay } from '@/lib/date'

export interface FinancialHealthRaw {
  income: number
  expense: number
  budgetUtilizations: number[]
  goalProgresses: number[]
  dailyExpenses: number[]
}

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value))

/**
 * Score saving rate. Ideal 20% atau lebih dari pemasukan disisihkan.
 * Tanpa pemasukan -> score netral 50 (data belum cukup).
 */
export function savingRateScore(income: number, expense: number): number {
  if (income <= 0) return 50
  const rate = (income - expense) / income
  if (rate >= 0.2) return 100
  if (rate >= 0) return clamp(50 + (rate / 0.2) * 50)
  return clamp(50 + rate * 50)
}

/**
 * Score kedisiplinan budget: rata-rata utilisasi budget. Semakin dekat
 * ke 100% dianggap kurang disiplin. Utilisasi <= 80% ideal.
 */
export function budgetDisciplineScore(utilizations: number[]): number {
  if (utilizations.length === 0) return 50
  if (utilizations.length <= 0) return 50
  const avg = utilizations.reduce((sum, u) => sum + clamp(u, 0, 1), 0) / utilizations.length
  if (avg <= 0.8) return 100
  if (avg <= 1) return clamp(100 - ((avg - 0.8) / 0.2) * 70)
  return clamp((1 / avg) * 40)
}

/**
 * Score stabilitas pengeluaran: coefficient of variation (CV) dari
 * pengeluaran harian. Kecil berarti stabil. Butuh minimal beberapa hari data.
 */
export function expenseStabilityScore(dailyExpenses: number[]): number {
  const values = dailyExpenses.filter((d) => d > 0)
  if (values.length < 3) return 50
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean <= 0) return 50
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  const cv = Math.sqrt(variance) / mean
  if (cv <= 0.4) return 100
  if (cv <= 1) return clamp(100 - ((cv - 0.4) / 0.6) * 50)
  return clamp(50 - (cv - 1) * 30)
}

/**
 * Score dari progres goals: rata-rata progres semua goals yang belum tercapai.
 */
export function goalProgressScore(progresses: number[]): number {
  const active = progresses.filter((p) => p < 1)
  if (active.length === 0) return 70
  const avg = active.reduce((a, b) => a + b, 0) / active.length
  return clamp(avg * 100)
}

export interface HealthWeights {
  savingRate: number
  budgetDiscipline: number
  expenseStability: number
  goalProgress: number
}

const DEFAULT_WEIGHTS: HealthWeights = {
  savingRate: 0.4,
  budgetDiscipline: 0.25,
  expenseStability: 0.2,
  goalProgress: 0.15,
}

export function scoreLabel(score: number): 'baik' | 'cukup' | 'perlu-pemantauan' {
  if (score >= 75) return 'baik'
  if (score >= 50) return 'cukup'
  return 'perlu-pemantauan'
}

export function buildHealthReport(
  raw: { income: number; expense: number; budgetUtilizations: number[]; goalProgresses: number[]; dailyExpenses: number[] },
  weights: HealthWeights = DEFAULT_WEIGHTS,
): FinancialHealthReport {
  const factors: FinancialHealthFactor[] = [
    {
      key: 'savingRate',
      label: 'Saving Rate',
      description: 'Porsi pemasukan yang tidak terpakai sebagai pengeluaran.',
      score: savingRateScore(raw.income, raw.expense),
      detail:
        raw.income <= 0
          ? 'Belum ada pemasukan bulan ini.'
          : `Memakai ${Math.round((raw.expense / raw.income) * 100)}% dari pemasukan.`,
    },
    {
      key: 'budgetDiscipline',
      label: 'Disiplin Budget',
      description: 'Seberapa dekat pengeluaran dengan batas budget.',
      score: budgetDisciplineScore(raw.budgetUtilizations),
      detail:
        raw.budgetUtilizations.length === 0
          ? 'Belum ada budget aktif.'
          : `${raw.budgetUtilizations.length} budget aktif tercatat.`,
    },
    {
      key: 'expenseStability',
      label: 'Stabilitas Pengeluaran',
      description: 'Seberapa stabil pengeluaran harianmu.',
      score: expenseStabilityScore(raw.dailyExpenses),
      detail: 'Dihitung dari variasi pengeluaran harian.',
    },
    {
      key: 'goalProgress',
      label: 'Progres Goals',
      description: 'Seberapa dekat kamu dengan tujuan finansial.',
      score: goalProgressScore(raw.goalProgresses),
      detail:
        raw.goalProgresses.length === 0
          ? 'Belum ada financial goal.'
          : `${raw.goalProgresses.filter((p) => p < 1).length} goal aktif sedang berjalan.`,
    },
  ]

  const score = Math.round(
    factors.reduce((sum, f) => sum + f.score * weights[f.key], 0),
  )
  const level = scoreLabel(score)

  const summary: Record<typeof level, string> = {
    baik: 'Kondisi keuanganmu terlihat sehat. Pertahankan kebiasaan menabung dan disiplin budget.',
    cukup: 'Kondisi keuanganmu cukup baik, tapi masih ada ruang untuk ditingkatkan.',
    'perlu-pemantauan': 'Kondisi keuanganmu butuh perhatian. Periksa faktor di bawah dan coba kecilkan pengeluaran.',
  }

  return { score, level, summary: summary[level], factors }
}

export function buildDailyExpenseSeries(
  records: Array<{ date: string; amount: number }>,
  days: number,
  endDate: Date,
): number[] {
  const map = new Map<string, number>()
  for (const r of records) map.set(r.date, (map.get(r.date) ?? 0) + r.amount)
  const series: number[] = []
  const cursor = startOfDay(endDate)
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(cursor)
    d.setDate(cursor.getDate() - i)
    const key = toISODateLocal(d)
    series.push(map.get(key) ?? 0)
  }
  return series
}

function toISODateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}