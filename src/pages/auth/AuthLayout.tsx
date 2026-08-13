import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from '@/components/icons'

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-10 w-10 text-primary" />
            <span className="text-2xl font-extrabold tracking-tight text-foreground">ARTO</span>
          </div>
          <p className="text-sm text-muted">Ngerti artone, ngerti uripe.</p>
        </div>
        <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)] ring-1 ring-border sm:p-8">
          <h1 className="text-xl font-extrabold text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  )
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-primary hover:underline">
      {children}
    </Link>
  )
}