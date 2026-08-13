# ARTO Web

Aplikasi web **ARTO** — personal financial tracker untuk mencatat, memahami, dan mengatur keuangan sehari-hari.

> **Ngerti artone, ngerti uripe.**

Saat ini aplikasi berjalan dengan **mock API** (data di `localStorage` browser) yang mengikuti kontrak REST di `docs/04-api/API-SPECIFICATION.md`. Backend asli (NestJS + Prisma + PostgreSQL) menyusul.

## Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 8](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [React Router 7](https://reactrouter.com) (`createBrowserRouter` + `RouterProvider`)
- Testing: [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)
- Linting: [Oxlint](https://oxc.rs/docs/guide/usage/linter)

## Struktur Proyek

```
src/
├── components/        # Komponen UI & fitur (button, chart, form, dll.)
├── context/           # AuthContext & ThemeContext
├── data/              # Mock API layer
│   ├── mockDb.ts      # Seed data + persistence ke localStorage
│   └── api/           # Modul API (auth, transactions, budgets, goals, ...)
├── domain/            # Business logic murni + unit test
├── hooks/             # useAsync, dll.
├── lib/               # Utilitas (currency, date, error message, cn)
├── pages/             # Halaman & layout (auth, dashboard, goals, ...)
├── types/             # Tipe TypeScript (mirror API contract)
├── main.tsx           # Entry point + Provider
└── routes.tsx         # Definisi rute
```

Business logic yang bisa diuji (mis. `domain/goals.ts`, `domain/financialHealth.ts`) dipisah dari layer API agar dapat diverifikasi dengan unit test.

## Menjalankan

```bash
npm install        # instal dependensi
npm run dev        # dev server (default http://localhost:5173)
npm run build      # type-check + build produksi ke dist/
npm run preview    # preview hasil build
npm run lint       # oxlint
npm test           # vitest run (unit test)
```

## Akun Demo

Mock auth memiliki akun demo dengan data terisi:

| Field    | Nilai            |
| -------- | ---------------- |
| Email    | `demo@arto.id`   |
| Password | `demopass123`    |

Daftar baru juga bisa dibuat langsung dari halaman **Register**.

## Fitur

- Autentikasi (login/register) berbasis mock
- Dashboard ringkasan saldo, pemasukan, pengeluaran
- Pencatatan transaksi (CRUD) dengan kategori
- Budget per kategori + **batas pengeluaran harian** otomatis
- **Financial Goals** dengan estimasi tabungan harian
- **Kesehatan Finansial** (skor berbasis aturan)
- Analitik sederhana (bar chart, donut, utilisasi budget)
- Kelola akun keuangan
- Tema terang/gelap

> Catatan: data hanya tersimpan di `localStorage` browser pada versi ini. Hapus data dengan `localStorage.removeItem('arto.mocks.v1')` dari console untuk mengembalikan seed awal.