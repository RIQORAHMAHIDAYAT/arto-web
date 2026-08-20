# ARTO Web

Aplikasi web **ARTO** — personal financial tracker untuk mencatat, memahami, dan mengatur keuangan sehari-hari.

> **Ngerti artone, ngerti uripe.**

Web app ini terhubung ke **REST API arto-backend** (NestJS + Prisma + PostgreSQL) sesuai kontrak di `docs/04-api/API-SPECIFICATION.md`.

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
├── data/api/          # HTTP client + modul API (auth, transactions, budgets, ...)
├── domain/            # Business logic murni + unit test
├── hooks/             # useAsync, dll.
├── lib/               # Utilitas (currency, date, error message, cn)
├── pages/             # Halaman & layout (auth, dashboard, goals, ...)
├── types/             # Tipe TypeScript (mirror API contract)
├── main.tsx           # Entry point + Provider
└── routes.tsx         # Definisi rute
```

Semua permintaan data memakai HTTP client di `src/data/api/client.ts` yang menangani:
- penambahan `Authorization: Bearer <token>` secara otomatis
- refresh token otomatis saat access token kedaluwarsa (401)
- pembuatan `ApiError` dari respons error backend

## Menjalankan

Syarat: backend `arto-backend` sudah berjalan (lihat README-nya) dengan database PostgreSQL.

```bash
npm install        # instal dependensi
npm run dev        # dev server (default http://localhost:5173)
npm run build      # type-check + build produksi ke dist/
npm run preview    # preview hasil build
npm run lint       # oxlint
npm test           # vitest run (unit test)
```

Konfigurasi URL API dapat diatur dengan env `VITE_API_URL` (lihat `.env.example`).
Default: `http://localhost:3000/api`.

## Akun Demo

Seed di `arto-backend` membuat akun demo:

| Field    | Nilai            |
| -------- | ---------------- |
| Email    | `demo@arto.id`   |
| Password | `demopass123`    |

Daftar baru juga bisa dibuat langsung dari halaman **Register**.

## Fitur

- Autentikasi (login/register/refresh) berbasis JWT
- Dashboard ringkasan saldo, pemasukan, pengeluaran
- Pencatatan transaksi (CRUD) dengan kategori
- Budget per kategori + **batas pengeluaran harian** otomatis
- **Financial Goals** dengan estimasi tabungan harian
- **Kesehatan Finansial** (skor berbasis aturan)
- Analitik sederhana (bar chart, donut, utilisasi budget)
- Kelola akun keuangan
- Tema terang/gelap