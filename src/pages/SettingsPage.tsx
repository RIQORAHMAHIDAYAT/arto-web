import { useState, type FormEvent } from 'react'
import type { Category, CategoryInput, ThemePreference, TransactionType } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useAsync } from '@/hooks/useAsync'
import { createCategory, deleteCategory, listCategories } from '@/data/api/categoriesApi'
import { PageHeader } from '@/pages/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingBlock } from '@/components/ui/LoadingBlock'
import { ErrorState } from '@/components/ui/ErrorState'
import { Badge } from '@/components/ui/Badge'
import { formatDateShort } from '@/lib/date'
import { getErrorMessage } from '@/lib/errorMessage'
import { cn } from '@/lib/cn'

const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'Ikuti sistem' },
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
]

export function SettingsPage() {
  const { user, updateTheme } = useAuth()
  const { theme, setTheme } = useTheme()
  const [catModal, setCatModal] = useState(false)
  const [catName, setCatName] = useState('')
  const [catType, setCatType] = useState<TransactionType>('expense')
  const [catError, setCatError] = useState<string | null>(null)
  const [savingCat, setSavingCat] = useState(false)

  const { data: categories, loading, error, refetch } = useAsync(listCategories, [])

  const changeTheme = async (next: ThemePreference) => {
    setTheme(next)
    await updateTheme(next).catch(() => undefined)
  }

  const handleAddCategory = async (event: FormEvent) => {
    event.preventDefault()
    setCatError(null)
    if (!catName.trim()) {
      setCatError('Nama kategori wajib diisi.')
      return
    }
    setSavingCat(true)
    try {
      const input: CategoryInput = { name: catName.trim(), type: catType }
      await createCategory(input)
      setCatName('')
      setCatModal(false)
      await refetch()
    } catch (err) {
      setCatError(getErrorMessage(err))
    } finally {
      setSavingCat(false)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Hapus kategori "${category.name}"?`)) return
    const err = await (async () => {
      try {
        await deleteCategory(category.id)
        await refetch()
        return null
      } catch (e) {
        return getErrorMessage(e)
      }
    })()
    if (err) window.alert(err)
  }

  if (loading && !categories) return <LoadingBlock label="Memuat pengaturan…" />
  if (error && !categories) return <ErrorState title="Gagal memuat pengaturan" message={getErrorMessage(error)} onRetry={refetch} />

  const userCategories = (categories ?? []).filter((c) => c.userId !== null)
  const systemCategories = (categories ?? []).filter((c) => c.userId === null)

  return (
    <div>
      <PageHeader title="Pengaturan" description="Kelola profil, tema, dan kategori." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profil" subtitle="Informasi akun kamu." />
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Nama</dt>
              <dd className="font-semibold text-foreground">{user?.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Email</dt>
              <dd className="font-semibold text-foreground">{user?.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Terdaftar</dt>
              <dd className="font-semibold text-foreground">{user ? formatDateShort(user.createdAt) : '-'}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Tampilan" subtitle="Mode terang atau gelap." />
          <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={theme === option.value}
                onClick={() => changeTheme(option.value)}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                  theme === option.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted hover:bg-surface-hover',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Kategori"
          subtitle="Kategori bawaan tidak dapat diubah. Kamu bisa menambah kategori sendiri."
          action={
            <Button size="sm" onClick={() => setCatModal(true)}>
              + Kategori Baru
            </Button>
          }
        />
        <div className="grid gap-6 md:grid-cols-2">
          <section aria-label="Kategori pengguna">
            <h3 className="mb-2 text-sm font-semibold text-muted">Kategori milikmu</h3>
            {userCategories.length === 0 ? (
              <p className="text-sm text-muted">Belum ada kategori tambahan.</p>
            ) : (
              <ul className="space-y-2">
                {userCategories.map((category) => (
                  <li key={category.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <span className="text-lg" aria-hidden="true">
                      {category.icon}
                    </span>
                    <span className="flex-1 truncate text-sm font-semibold text-foreground">{category.name}</span>
                    <Badge tone={category.type === 'expense' ? 'danger' : 'success'}>
                      {category.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category)}
                      className="rounded-md p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label={`Hapus kategori ${category.name}`}
                    >
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-label="Kategori bawaan">
            <h3 className="mb-2 text-sm font-semibold text-muted">Kategori bawaan</h3>
            <ul className="space-y-2">
              {systemCategories.map((category) => (
                <li key={category.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <span className="text-lg" aria-hidden="true">
                    {category.icon}
                  </span>
                  <span className="flex-1 truncate text-sm font-semibold text-foreground">{category.name}</span>
                  <Badge tone="neutral">Bawaan</Badge>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Card>

      <Modal
        open={catModal}
        onClose={() => setCatModal(false)}
        title="Kategori Baru"
        description="Tambahkan kategori untuk memisahkan catatanmu."
      >
        <form onSubmit={handleAddCategory} className="space-y-4" noValidate>
          <div role="radiogroup" aria-label="Jenis kategori" className="grid grid-cols-2 gap-2">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={catType === t}
                onClick={() => setCatType(t)}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                  catType === t
                    ? t === 'expense'
                      ? 'border-danger bg-danger/10 text-danger'
                      : 'border-success bg-success/10 text-success'
                    : 'border-border text-muted hover:bg-surface-hover',
                )}
              >
                {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </button>
            ))}
          </div>
          <Input label="Nama Kategori" required placeholder="misal: Kopi" value={catName} onChange={(e) => setCatName(e.target.value)} />
          {catError && (
            <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {catError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCatModal(false)}>
              Batal
            </Button>
            <Button type="submit" loading={savingCat}>
              Tambahkan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}