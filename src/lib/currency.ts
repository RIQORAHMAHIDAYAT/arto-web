export function formatRupiah(amount: number, options: { decimals?: boolean; compact?: boolean } = {}): string {
  const { decimals = false, compact = false } = options
  if (compact) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(amount)
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount)
}

export function formatRupiahSigned(amount: number): string {
  const formatted = formatRupiah(Math.abs(amount))
  if (amount < 0) return `-${formatted}`
  if (amount > 0) return `+${formatted}`
  return formatted
}

export function parseAmountText(value: string): number | null {
  const cleaned = value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
  if (!cleaned) return null
  const num = Number(cleaned)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num)
}

export function sanitizeAmountInput(value: string): string {
  return value.replace(/[^\d.,]/g, '').replace(/,/g, '')
}