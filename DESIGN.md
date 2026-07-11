# Restoku Design System

Design system ResToku — terpusat, konsisten, dan bebas dari "AI-generated look".
Semua UI harus mengonsumsi token di bawah ini. Jangan hardcode warna/spasi/radius di JSX.

## 1. Brand & Color Tokens

| Token | Nilai | Keperluan |
|-------|-------|-----------|
| `--brand-cabe` | `#FF5B35` | Primary aksen (bau makanan, bold) |
| `--brand-cabe-600` | `#E04E2B` | Hover/active cabe |
| `--brand-emas` | `#F59E0B` | Sekunder aksen (premium) |
| `--brand-emas-600` | `#D97706` | Hover emas |
| `--brand-cream` | `#FAF5EE` | Surface terang (krem) |
| `--brand-cream-200` | `#FCE3D6` | Surface krem lembut |
| `--ink` | `#0B0F19` | Background gelap utama |
| `--ink-soft` | `rgba(15,23,42,0.74)` | Card glass |
| `--destructive` | `#EF4444` | Error/danger |
| `--success` | `#10B981` | Sukses (hanya semantik, BUKAN brand) |

> Catatan: `--primary` di `theme.css` (blue `#3B82F6`) **di-override** ke `--brand-cabe` di `system.css`.
> Hijau hanya untuk status sukses, bukan branding (anti-AI-look).

## 2. Spacing Scale (kelipatan 4px)

Gunakan utilitas Tailwind (`p-4`=16px, `gap-3`=12px). Jangan pakai angka acak.
Referensi px: `4 / 8 / 12 / 16 / 24 / 32 / 48`.
Variabel: `--space-1`(4) `--space-2`(8) `--space-3`(12) `--space-4`(16) `--space-6`(24) `--space-8`(32).

## 3. Radius

`--radius: 0.875rem` (14px). Variant: `sm`(10) `md`(12) `lg`(14) `xl`(18).
Kartu & panel pakai `rounded-2xl` (16px) untuk kesan hangat/foodie.

## 4. Typography

- Sans: **Inter** (body, UI)
- Display: **Poppins** (judul, brand)
- Mono: **DejaVu/JetBrains Mono** (receipt, angka)
- Skala: `text-sm`(14) `text-base`(16) `text-lg`(18) `text-xl`(20) `text-2xl`(24)
- Heading pakai `font-display font-semibold tracking-tight`.

## 5. Component Anatomy

### Button
- Variant: `primary` (cabe solid), `secondary` (glass), `ghost`, `danger`
- `px-4 py-2 rounded-xl font-medium transition-colors`
- States: hover (cabe-600), active (scale-95), disabled (opacity-40 cursor-not-allowed), loading (spinner)

### Input
- `rounded-xl border border-border bg-input px-4 py-2.5 text-base`
- Focus: `ring-2 ring-brand-cabe/50 border-brand-cabe`
- Error: `border-destructive ring-destructive/40`

### Card / Glass
- `rounded-2xl border border-white/10 bg-ink-soft backdrop-blur-xl`
- Padding: `p-6` (24px)

### Badge
- `inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold`
- Tone: `toneMap` (success/warning/destructive/info/neutral) — lihat `shared/Badge.tsx`

### Screen (layout)
- `min-h-screen bg-ink text-foreground` + max-width container `mx-auto max-w-7xl px-4 sm:px-6`

## 6. States (global)

| State | Penanganan |
|-------|-----------|
| Default | token normal |
| Hover | shade lebih gelap 1 step |
| Active | `scale-95` + ring |
| Disabled | `opacity-40 cursor-not-allowed` |
| Error | `border-destructive text-destructive` + pesan `text-xs text-destructive` |
| Success | `border-success text-success` |
| Loading | spinner + `pointer-events-none` |

## 7. Anti-AI-Look Rules

- **JANGAN** pakai `lucide-react` di komponen baru. Pakai inline SVG / Heroicons / Phosphor (duotone).
- **JANGAN** pakai warna blue/emerald sebagai branding (hanya semantik).
- Gradient hanya untuk brand lockup (cabe→emas), bukan sebagai background halaman.
- Tema selectable (`krem`, `warm-cozy`, `nano-banana`, `gelap`, `terang`) — jangan hardcode mode.

## 8. Import Order

`app.css`:
```
@import './fonts.css';
@import './tailwind.css';
@import './theme.css';
@import './system.css';   /* Restoku design tokens — tepat sekali, setelah theme.css */
```
