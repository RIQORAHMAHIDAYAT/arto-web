import { useAsync } from '@/hooks/useAsync'
import { getFinancialHealth } from '@/data/api/financialHealthApi'
import { PageHeader } from '@/pages/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { DonutChart } from '@/components/charts/DonutChart'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { getErrorMessage } from '@/lib/errorMessage'

const SCORE_COLORS: Record<'baik' | 'cukup' | 'perlu-pemantauan', string> = {
  baik: '#22c55e',
  cukup: '#f59e0b',
  'perlu-pemantauan': '#ef4444',
}

const FACTOR_TONES: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  savingRate: 'success',
  budgetDiscipline: 'info',
  expenseStability: 'warning',
  goalProgress: 'neutral',
}

export function FinancialHealthPage() {
  const { data, loading, error, refetch } = useAsync(getFinancialHealth, [])

  if (loading) return <LoadingBlock label="Menghitung kesehatan finansial…" />
  if (error || !data) return <ErrorState title="Gagal memuat skor kesehatan" message={getErrorMessage(error)} onRetry={refetch} />

  const scoreTone = data.level
  const scoreColor = SCORE_COLORS[scoreTone]

  return (
    <div>
      <PageHeader
        title="Kesehatan Finansial"
        description="Ringkasan sederhana berdasarkan pola keuanganmu, bukan nasihat profesional."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center text-center">
          <DonutChart
            segments={[{ label: 'Skor', value: data.score, color: scoreColor }]}
            centerLabel={String(data.score)}
            centerSub="dari 100"
          />
          <div className="mt-4">
            <Badge tone={scoreTone === 'baik' ? 'success' : scoreTone === 'cukup' ? 'warning' : 'danger'}>
              {scoreTone === 'baik' ? 'Sehat' : scoreTone === 'cukup' ? 'Cukup Baik' : 'Perlu Pemantauan'}
            </Badge>
            <p className="mt-3 max-w-sm text-sm text-muted">{data.summary}</p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Faktor Penilaian"
            subtitle="Setiap faktor dihitung dari data yang sudah kamu catat. Bahasa disederhanakan agar mudah dipahami."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {data.factors.map((factor) => (
              <div key={factor.key} className="rounded-lg border border-border p-4">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{factor.label}</h3>
                    <p className="mt-0.5 text-xs text-muted">{factor.description}</p>
                  </div>
                  <Badge tone={FACTOR_TONES[factor.key] ?? 'neutral'}>{Math.round(factor.score)}/100</Badge>
                </div>
                <ProgressBar value={factor.score / 100} tone={factor.score >= 75 ? 'success' : factor.score >= 50 ? 'warning' : 'danger'} className="mt-3" />
                <p className="mt-2 text-xs text-muted">{factor.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="text-sm font-semibold text-muted">Catatan</h2>
        <p className="mt-1 text-sm text-muted">
          Skor ini dibuat dari aturan sederhana berdasarkan data yang kamu catat di ARTO dan bukan nasihat finansial
          profesional. Gunakan sebagai pantauan kebiasaan, bukan keputusan investasi atau pinjaman.
        </p>
      </Card>
    </div>
  )
}