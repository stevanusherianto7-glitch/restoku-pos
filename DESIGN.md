# Restoku Design System (adapted from "Halo")

Design system ResToku — terpusat, konsisten, bebas "AI-generated look".
Di-adaptasi dari template **Halo** (uiverse.io) dengan override brand Restoku.

**Sumber:** `halo.zip` (user-supplied) → `DESIGN.md` + `css/system.css` + `html/preview.html`.
**Adaptasi (bukan copy mentah):**
- Arsitektur Halo diambil: 3-tier surface, 4px spacing, component anatomy, stat-tile signature, hairline borders, depth-from-tier (no blur).
- **Primary indigo `#5B6BFF` → brand cabe `#FF5B35`** (anti-AI-look, palet foodie).
- **Icons:** Halo wajib Lucide, tapi Restoku melarang lucide → pakai **inline SVG / Heroicons / Phosphor** di JSX. CSS tidak hardcode icon.
- Font: **Inter** (Halo) + **Poppins** (display Restoku) + JetBrains/DejaVu Mono.
- Radius: harmonisasi Halo (6/10/16/24) dengan Restoku (14 default).

## 1. Color Tokens

| Token | Nilai | Role |
|-------|-------|------|
| `--color-background` | `#0A0B0F` | Page canvas (Halo tier-0) |
| `--color-surface` | `#14151C` | Cards, panels, inputs (tier-1) |
| `--color-elevated` | `#1E2029` | Modals, popovers, active tabs (tier-2) |
| `--color-border` | `#2A2D38` | Hairline dividers |
| `--color-border-strong` | `#3A3D4A` | Inputs, secondary buttons |
| `--color-text-primary` | `#F2F4F8` | Headlines, body primary |
| `--color-text-secondary` | `#9AA0AE` | Secondary text, labels |
| `--color-text-muted` | `#5C6170` | Helper, placeholder |
| `--color-primary` | `#FF5B35` | **BRAND cabe** — aksi & focus |
| `--color-primary-hover` | `#E04E2B` | Hover cabe |
| `--color-primary-pressed` | `#C9431F` | Active cabe |
| `--color-primary-soft` | `rgba(255,91,53,.14)` | Focus ring / chip bg |
| `--color-accent` | `#F59E0B` | **BRAND emas** — premium |
| `--color-success` | `#2BE08C` | Semantik sukses (bukan brand) |
| `--color-warning` | `#F5D547` | Semantik warning |
| `--color-info` | `#3DD7E5` | Semantik info |
| `--color-danger` | `#FF3A5C` | Semantik error/danger |

> Hijau/cyan/kuning **hanya semantik status**, bukan branding (anti-AI-look).

## 2. Spacing Scale (4px base, Halo + Restoku aligned)

`--space-1`(4) `--space-2`(8) `--space-3`(12) `--space-4`(16) `--space-5`(20)
`--space-6`(24) `--space-8`(32) `--space-10`(40) `--space-12`(48) `--space-16`(64) `--space-20`(80)

## 3. Radius

`none`(0) `sm`(6) `md`(10) `lg`(16) `xl`(24) `full`(999).
Kartu pakai `lg`(16px); panel `xl`(24px); button `md`(10px).

## 4. Typography

- Display: **Poppins** (judul hero) — `clamp(2.75rem,6vw,4.5rem)`, tracking -0.03em
- UI/Body: **Inter** — body-md 0.9375rem, title-md 1.125rem
- Mono: **JetBrains/DejaVu Mono** — metric & numerik (tabular-nums)
- Utilities: `.t-display` `.t-headline-lg/md` `.t-title-md` `.t-body-md/sm` `.t-label-sm` `.t-mono-sm` `.t-metric`

## 5. Component Anatomy (class-based, framework-agnostic)

Gunakan class di `system.css` — **jangan hardcode** di JSX.

### Button `.btn` + variant
- `.btn-primary` (cabe solid) `.btn-secondary` (surface+border) `.btn-tertiary` (text) `.btn-danger`
- Size: `.btn-sm`(32) `.btn`(40) `.btn-lg`(48) `.btn-icon` (square)
- States: `:hover` (tier lift), `:active` (translateY 1px), `:focus-visible` (focus ring), `:disabled` (opacity .4)
- Icon: `<svg>` / inline SVG, `stroke-width:1.75`, `currentColor`

### Input `.input` / `.textarea` / `.select` + `.field`
- `.field` > `.field-label` (uppercase) + `.input` + `.field-help`
- Focus: border → primary + focus ring. Error: `.is-invalid`
- Select: custom arrow via CSS (no native)

### Card `.card` + variant
- `.card` (surface, 16px radius, 24px pad) `.card-elevated` (shadow-md) `.card-accent[data-accent]` (2px top hairline)
- Sub: `.card-eyebrow` `.card-title` `.card-body` `.card-footer`

### Stat Tile `.stat-tile` (signature)
- Surface + 2px top hairline (primary/success/warning/info/danger via `data-accent`)
- Isi: `.t-label-sm` eyebrow + `.t-metric` angka + trend chip + sparkline

### Tabs / Switch / Check / Chip
- `.tabs` + `.tab` (pill segmented) — lihat system.css untuk full
- `.switch` (pill toggle), `.check` (checkbox/radio), `.chip` (signal pill)

### Layout primitives
- `.container` (max 1200px, responsive pad) `.stack*` `.row*` `.grid-2/3/4` `.divider` `.eyebrow`

## 6. States (global)

| State | Penanganan |
|-------|-----------|
| Default | token normal |
| Hover | lift 1 tier (surface→elevated) atau shade cabe-600 |
| Active | `translateY(1px)` / scale |
| Disabled | `opacity:0.4; pointer-events:none` |
| Error | `border-danger` + `danger-soft` ring |
| Focus | `0 0 0 3px primary-soft` ring (only state allowed to glow) |

## 7. Anti-AI-Look Rules (WAJIB)

- **JANGAN** pakai `lucide-react` di komponen baru. Pakai inline SVG / Heroicons / Phosphor (duotone).
- **JANGAN** pakai warna blue/emerald sebagai branding (hanya semantik success/info).
- Gradient hanya untuk brand lockup (cabe→emas), bukan background halaman.
- Tema selectable (`krem`, `warm-cozy`, `nano-banana`, `gelap`, `terang`) — jangan hardcode mode.
- Depth dari tier+border, **bukan blur/shadow** (kecuali floating: modal/popover).

## 8. Import Order (`resources/css/app.css`)

```
@import './fonts.css';
@import './tailwind.css';
@import './theme.css';
@import './system.css';   /* Restoku+Halo tokens — tepat sekali, setelah theme.css */
```

## 9. Preview & Reference

- `html/preview.html` (dari halo.zip) = visual reference struktur/componen.
- `screenshots/preview-desktop.png` = tampilan contoh.
- Buka `preview.html` di browser untuk lihat sistem sebelum refactor per halaman.
