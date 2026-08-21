import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-xl">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-3xl text-danger">
              ⚠️
            </span>
            <h1 className="mt-6 text-2xl font-black tracking-tight">Terjadi kendala pada aplikasi</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Maaf, ARTO mengalami kendala tak terduga saat memproses halaman ini. Data finansialmu tetap aman.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 max-h-32 overflow-auto rounded-xl border border-danger/30 bg-danger/5 p-3 text-left font-mono text-xs text-danger">
                {this.state.error.toString()}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/25 hover:bg-primary/90"
              >
                Muat Ulang Halaman
              </button>
              <a
                href="/app"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-foreground hover:bg-surface-hover"
              >
                Ke Dashboard
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
