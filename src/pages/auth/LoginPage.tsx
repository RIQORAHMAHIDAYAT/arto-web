import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout, AuthLink } from './AuthLayout'
import { getErrorMessage } from '@/lib/errorMessage'
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/data/api/authApi'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal masuk. Periksa email dan password.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Masuk ke akunmu"
      subtitle="Catat dan pahami keuanganmu dengan mudah."
      footer={
        <>
          Belum punya akun? <AuthLink to="/auth/register">Daftar sekarang</AuthLink>
        </>
      }
    >
      {import.meta.env.DEV && DEMO_EMAIL && DEMO_PASSWORD && (
        <button
          type="button"
          onClick={() => {
            if (DEMO_EMAIL && DEMO_PASSWORD) {
              setEmail(DEMO_EMAIL)
              setPassword(DEMO_PASSWORD)
            }
          }}
          className="mb-4 w-full rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
        >
          Isi otomatis akun demo
        </button>
      )}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth loading={submitting}>
          Masuk
        </Button>
      </form>
    </AuthLayout>
  )
}