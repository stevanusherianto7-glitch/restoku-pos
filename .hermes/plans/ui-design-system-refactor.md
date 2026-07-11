# UI Design System Refactor — Restoku

## Tujuan
Konsolidasikan seluruh UI Restoku ke satu design system terdokumentasi (`DESIGN.md` + `css/system.css`)
yang **grounded ke token Restoku yang sudah ada** — bukan gaya baru. Refactor "(f) semua secara bertahap",
mockup-first per halaman.

## Framework
- Laravel 13 + Inertia + React 19 + TypeScript + **Vite** (Tailwind v4, `@theme` di CSS, bukan config JS).
- Global CSS entry: `resources/css/app.css` → sudah `@import './theme.css'`.
- `css/system.css` diimpor **tepat sekali**, SETELAH `theme.css` di `app.css`.

## Sumber Token (grounded, bukan invent)
- `resources/css/theme.css` — :root / .dark / .nano-banana / .light + @theme inline (warna, radius, chart)
- `resources/css/tailwind.css` — @font-sans Inter, @font-display Poppins, @font-mono, text-receipt scale
- `resources/js/Components/shared/*` — Button, Input, Badge, Glass, Screen, ErrorBoundary
- `resources/js/Components/Shared.tsx` — PlanBadge, FeatureLock, TenantBrandLockup, RestokuLogo

## Konflik & Keputusan (instruksi #4)
| Konflik | Pilihan | Alasan |
|---------|---------|--------|
| `--primary:#3B82F6` (blue shadcn) vs brand cabe | **Ganti ke `#FF5B35`** di system.css layer | Anti-AI-look, palet foodie |
| `RestokuLogo` gradient hijau-cyan | **Ubah ke cabe→emas** | Konsistensi brand |
| `lucide-react` di legacy shim | **Komponen BARU hindari lucide**; legacy biarkan (ada TODO migrate) | Aturan UI user |
| Hardcode `p-4 gap-3 text-slate-*` tersebar | **Pakai token system.css + utilitas** | Konsistensi spacing |

## Deliverable Fondasi (Phase 0)
1. `DESIGN.md` — dokumentasi system: color tokens, spacing scale (4/8/12/16/24/32), radii, typography,
   component anatomy (Button/Input/Card/Badge/Screen), states (default/hover/active/disabled/error/success/loading).
2. `resources/css/system.css` — token layer Restoku (brand colors, spacing vars, component utility classes),
   override `--primary`→cabe, extend `@theme inline`.
3. Wire: `app.css` tambah `@import './system.css';` setelah theme.css.
4. Verifikasi: `npm run build` + `npx eslint` + vitest hijau.

## Phased Refactor (mockup-first tiap halaman)
- **Phase 1 (POC):** Katalog Menu — mockup HTML → refactor `KatalogMenu/Index.tsx` ke system tokens.
- **Phase 2:** Dashboard Owner (MainLayout + sidebar + cards).
- **Phase 3:** QR Meja + Buku Menu Digital.
- **Phase 4:** Login / OwnerLogin.
- **Phase 5:** e-Menu tamu (CustomerView).
- **Phase 6:** Kasir/POS + sisa 27 menu.
Tiap phase: mockup → user approve → refactor → build+lint+test → commit kecil.

## Verifikasi per step
- `npm run build` exit 0
- `npx eslint resources/js/Pages/...` 0 error
- `npm run test` (vitest) hijau
- `php artisan test` hijau (tidak berubah backend)
- Screenshot visual (browser_vision) untuk konfirmasi alignment

## Catatan
- `.env`, `PRD.md` tidak diubah oleh task ini (PRD sudah di-commit 3c5ff34).
- Tidak hapus legacy `Shared.tsx` shim (ada TODO migrate di file).
