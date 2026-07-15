# Restoku — Golden Rules (DO'S & DONT'S)

> Aturan besi tim Restoku. Digunakan sebagai gate SEBELUM bilang "done"/"selesai"/"verified".
> Setiap pelanggaran = bug yang lolos ke production (terbukti di sesi 2026-07-15).

---

## 🔴 THE #1 RULE — JANGAN KLAIM KOSONG, BUKTIKAN

> "jangan pernah klaim kosong tapi BUKTIKAN itu sudah golden rules kita!"
> — Owner, 2026-07-15

Klaim `"done"`, `"100%"`, `"works"`, `"no error"`, `"sudah konsisten"` **TANPA artifacts verifikasi nyata**
adalah pelanggaran fatal. Bukti = output tool sungguhan (curl/Playwright/test), bukan narasi.

| DONT'T ❌ | DO ✅ |
|---|---|
| Bilang "build hijau, jadi beres" | Jalankan verifikasi, tempel output asli |
| Bilang "tema sudah sama di HP & desktop" tanpa render | Render BENAR-BENAR di kedua origin, screenshot + console capture |
| Bilang "0 error" tanpa jalanin browser | Capture `pageerror` + `console.error` via Playwright |
| Percaya stale flag / cache lama | Re-run command di turn ini, buat artifact segar |

---

## 🟠 DO — RENDER DI BROWSER SUNGGUHAN (BUKAN CUMA BUILD)

`npm run build` GREEN **TIDAK** berarti aplikasi jalan. Build cuma bundling — tidak mengeksekusi.

**Bukti nyata sesi ini:** `usePage is not defined` — `npm run build` PASS (Vite tidak cek undefined
global), tapi runtime **crash di kedua origin**. Ketahuan HANYA setelah Playwright render.

| DONT'T ❌ | DO ✅ |
|---|---|
| Anggap `BUILD=0` = fitur jalan | Render headless Chromium, capture console + screenshot |
| Cek cuma API JSON (`curl /api/menu`) | Cek HALAMAN (`/m/{slug}`) render + interaktif |
| Pakai context fresh Playwright (no cache) | **Pre-seed localStorage terbalik** untuk ngetes override server beneran |
| Stop di `npm run lint` | Lint + Build + **Render** = 3 gate wajib |

### Script verifikasi standar (dual-origin)
```bash
# 1. Lint + Build
npx eslint resources/js/Pages/BukuMenuDigital/CustomerView.tsx
npm run build

# 2. Render sungguhan di LOCALHOST + CLOUDFLARE, capture console error
node scripts/verify_render.mjs
#   - localStorage di-pre-seed 'terang' (light) -> buktikan override ke 'nano-banana'
#   - assert: hasTitle>0, hasTambah>0, lsMode==='nano-banana', 0 pageerror
#   - screenshot fullPage -> vision_analyze konfirmasi dark/light
```

---

## 🟠 DO — VERIFIKASI LINTAS ORIGIN UNTUK PUBLIC UI

e-Menu (`/m/{slug}`) diakses dari **HP via cloudflare tunnel** DAN **desktop via localhost**.
Satu origin hijau ≠ dua-duanya hijau.

| DONT'T ❌ | DO ✅ |
|---|---|
| Cek cuma localhost | Cek BOTH: `http://localhost:8000/m/{slug}` + `https://<tunnel>.trycloudflare.com/m/{slug}` |
| Asumsi tema sama karena kode sama | Render dua-duanya, bandingkan screenshot visual |
| Lupa `trustProxies` di cloudflare | Tunnel butuh `trustProxies('*')` supaya asset `https://` (no mixed-content) |

**Root cause nyata (2026-07-15):** `localStorage` itu **per-origin**. HP cache `nano-banana`,
localhost cache `terang` → tampilan BEDA padahal kode sama. Fix: state publik HARUS server-driven.

---

## 🟡 DO — SERVER-DRIVEN STATE UNTUK PUBLIC UI

Public UI (e-Menu tamu) tidak boleh bergantung `localStorage` per-origin.

| DONT'T ❌ | DO ✅ |
|---|---|
| Simpan tema/brand di `localStorage` tamu | Kirim dari controller (`outlet_settings.screen_mode`) |
| Baca tema dari `usePage().props` padahal route cuma kirim `slug` | Ambil dari **API response** (`/api/menu` → `screen_mode`) |
| Cache-nya jadi source-of-truth | API response = source-of-truth, localStorage cuma fallback offline |

```php
// PublicOrderController::getPublicMenu — kirim tema dari DB
'screen_mode' => $outlet->settings?->screen_mode ?? 'nano-banana', // fallback standar brand
```

```ts
// CustomerView — override localStorage DENGAN nilai server
if (data?.screen_mode) {
  localStorage.setItem('outlet_screen_mode', data.screen_mode);
  localStorage.setItem('tenant_layout', data.tenant_layout ?? data.screen_mode);
}
```

---

## 🟡 DO — IMPORT HELPER SEBELUM PAKAI

`ReferenceError: X is not defined` (usePage, icon, dsb) = class error nomor 1 di Restoku FE.

| DONT'T ❌ | DO ✅ |
|---|---|
| Pakai `usePage()` tanpa `import { usePage } from '@inertiajs/react'` | Import DULU, lalu pakai |
| Pakai `<Pencil>` padahal nama `PencilIcon` | Cek `Components/icons.tsx`, import nama persis |
| Percaya build hijau | Render browser = ketahuan ReferenceError |

---

## 🟢 DO — TEST COVERAGE = BUKAN ANGKA KOSONG

| DONT'T ❌ | DO ✅ |
|---|---|
| Klaim "100% pass" tanpa `--coverage` | Jalanin `vitest run --coverage`, laporkan ANGKA riil |
| Exclude file dari threshold lalu hitung ke % | Sebut eksplisit file yang di-exclude |
| Round-up / sembunyi branch gagal | Sebut line/branch yang belum ter-cover |

---

## 🟢 DO — HANDLE SECRETS DENGAN BENAR

| DONT'T ❌ | DO ✅ |
|---|---|
| Tulis API key/secret ke `.env` lewat chat | User yang ketik langsung ke `.env` |
|Cloudinary `cloudinary://key:secret@name` di disk | Public-only: `cloudinary://@dwdaydzsh` (secret TIDAK di disk) |
| Commit `.env` | `.env` gitignored — jangan `git add` |

---

## 📋 CHECKLIST SEBELUM "DONE" (FE / Public UI)

- [ ] `npx eslint <file>` → 0 errors
- [ ] `php -l <controller>` → No syntax errors
- [ ] `npm run build` → GREEN
- [ ] **Playwright render localhost** → `0 pageerror`, elemen muncul
- [ ] **Playwright render cloudflare** → `0 pageerror`, elemen muncul, TAMPILAN SAMA
- [ ] localStorage pre-seed terbalik → override server terbukti
- [ ] Screenshot visual di-`vision_analyze` → konfirmasi tema/bukan error
- [ ] `php artisan test` relevant filter → PASS
- [ ] Commit dengan pesan berisi BUKTI (bukan klaim)
- [ ] Public tunnel = **cloudflared** (bukan ngrok) — pastikan `MENU_BASE_URL` + `APP_URL` = URL tunnel tsb

---

*Dokumen ini hidup. Setiap pelanggaran yang lolos = tambah 1 baris di sini.*
