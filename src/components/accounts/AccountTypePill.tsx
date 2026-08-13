import type { AccountType } from '@/types'
import { cn } from '@/lib/cn'

export interface AccountFormValues {
  name: string
  type: AccountType
  initialBalance: string
}

export function AccountTypePill({ name, value, selected, onClick }: { name: string; value: AccountType; selected: boolean; onClick: () => void }) {
  const icons: Record<AccountType, string> = { cash: '💵', bank: '🏦', ewallet: '📱' }
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors',
        selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-hover',
      )}
    >
      <span className="text-xl" aria-hidden="true">
        {icons[value] ?? '💵'}
      </span>
      {name}
    </button>
  )
}