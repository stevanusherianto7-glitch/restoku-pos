# Plan: UI Refactor Phase 2 — Katalog Menu (Owner Edit Mode)

**Date**: 2026-07-11
**Status**: DRAFT (mockup approved visually — see design-reference/katalog-menu-mockup.html)
**Owner**: Restoku (architect = assistant, per delegation)

## Context
KatalogMenu/Index.tsx (mode owner CRUD) masih pakai:
- `lucide-react` icons (ChefHat, Plus, Upload, Pencil, Trash2, X) → AI-look tell, dilarang brand.
- `bg-blue-500` buttons → SaaS blue, harus `--color-primary` cabe.
- `text-emerald-400` price → harus emas `--color-accent`.
- Belum pakai design system Halo (.btn/.card/.rs-*) → inkonsisten dgn LandingPage/e-Menu.

Mockup statis SUDAH dibuat & diverifikasi via browser-vision (100% brand-compliant).

## Goal
Port mockup ke React (KatalogMenu/Index.tsx) tanpa ubah behavior (CRUD tetap work):
- Ganti semua lucide icon → inline SVG / shared Icon component.
- Ganti blue → primary cabe; emerald price → emerald TETAP (semantic success) atau accent emas? Keputusan: harga pakai `--color-accent` emas (mockup) utk konsistensi brand, bukan emerald.
- Pakai tokens system.css (sudah diimport app.css). Hindari hardcode hex; pakai class `text-[var(--color-primary)]` atau utility Tailwind `text-primary` (jika mapped) — cek tailwind config.
- Pertahankan: search, category pills (active state), grid 5-col responsive, edit/hapus actions, upload foto (convertToWebP).

## Steps
1. **Icon module**: buat `resources/js/Components/icons.tsx` (atau pakai existing) dengan inline SVG: BowlIcon, PlusIcon, SearchIcon, PencilIcon, TrashIcon, UploadIcon, XIcon, FlameIcon. Semua `currentColor`, 1.5-2 stroke.
2. **KatalogMenu/Index.tsx**:
   - Hapus `import { ... } from 'lucide-react'`.
   - Replace `<ChefHat>` → `<BowlIcon className="..." />`.
   - Replace `<Plus>` → `<PlusIcon>`.
   - Tombol "Tambah Menu": `bg-blue-500 ... hover:bg-blue-600` → `bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]` (atau `.btn .btn-primary` jika ada).
   - Search icon → `<SearchIcon>`.
   - Card: `bg-white/[0.02]` → `bg-[var(--color-surface)] border border-[var(--color-border)]`; thumb gradient → brand-gradient `from-[#2a2030] to-[#1a2230]`.
   - Price `text-emerald-400` → `text-[var(--color-accent)]`.
   - Edit/Hapus buttons: `hover:bg-blue-500/20 hover:text-blue-400` → `hover:text-[var(--color-primary)]` + danger `hover:text-[var(--color-danger)]`.
   - Edit icon `<Pencil>` → `<PencilIcon>`; Hapus `<Trash2>` → `<TrashIcon>`; modal close `<X>` → `<XIcon>`; upload `<Upload>` → `<UploadIcon>`.
3. **Verify**: `npm run build` (exit 0), `npm run lint` (no new warnings), `npm run test` (43 pass), browser visual check di `/katalog-menu` (tunnel).
4. **Commit**: `feat(ui): Katalog Menu Phase 2 — Halo design system + no-lucide`.

## Risks
- Inline SVG harus match ukuran (size-4/size-5) → set `width/height` prop.
- Jangan break CRUD logic (state, handleSubmit, upload).
- Tailwind `text-primary` mungkin tidak ada → pakai `text-[var(--color-primary)]` (aman).

## Out of scope
- e-Menu tamu (CustomerView) sudah Phase 1.
- Foto Cloudinary upload (Fase 1 belum; tetap demo base64).
- Lint sisa 31 warnings (terpisah, sudah 252→31).

## Verification gate
- [ ] Build exit 0
- [ ] Lint 0 new errors
- [ ] Vitest 43 pass
- [ ] Browser: /katalog-menu render, no blue/lucide, cabe/emas visible, CRUD tombol klikable
