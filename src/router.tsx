import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { useAuth } from '@/context/AuthContext'

export function RequireAuth() {
  const { initializing, user } = useAuth()
  const location = useLocation()
  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingBlock label="Memuat sesi…" />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }
  return <Outlet />
}

export function PublicOnly() {
  const { initializing, user } = useAuth()
  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingBlock label="Memuat…" />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-6xl" aria-hidden="true">
        404
      </p>
      <h1 className="text-xl font-extrabold text-foreground">Halaman tidak ditemukan</h1>
      <p className="text-sm text-muted">Halaman yang kamu cari tidak ada atau sudah dipindah.</p>
      <Link to="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}