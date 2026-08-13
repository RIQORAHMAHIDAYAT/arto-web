import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout, AuthLink } from './AuthLayout'
import { getErrorMessage } from '@/lib/errorMessage'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    setSubmitting(true)
    try {
      await register({ name, email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal mendaftar. Coba lagi.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Buat akun ARTO"
      subtitle="Beberapa langkah untuk mulai memahami keuanganmu."
      footer={
        <>
          Sudah punya akun? <AuthLink to="/auth/login">Masuk</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input label="Nama" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" />
        <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          hint="Minimal 8 karakter."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input label="Konfirmasi Password" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth loading={submitting}>
          Daftar
        </Button>
      </form>
    </AuthLayout>
  )
}