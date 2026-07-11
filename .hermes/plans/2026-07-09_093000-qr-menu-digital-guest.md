# QR Code Generator — Buku Menu Digital (Tamu) Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Tambahkan generator QR code *asli* (bukan placeholder) di halaman `BukuMenuDigital/Index` yang menunjuk ke URL publik buku menu digital tamu (`/m/{slug}`), lengkap dengan tombol Download PNG, Copy link, dan Print — agar staff/resto bisa cetak QR dan tamu scan langsung ke e-menu.

**Architecture:** Backend membagikan URL publik menu (`menu_public_url`) berdasarkan outlet agar tidak hardcoded. Frontend merender QR sungguhan via library `qrcode.react` (sudah terinstall v4.2.0) menggantikan fake-grid placeholder yang ada sekarang, plus aksi download/copy/print. Tanpa mengubah alur auth/route existing.

**Tech Stack:** Laravel 12 (Inertia share), React + Inertia (`qrcode.react` v4 `QRCodeSVG`/`QRCodeCanvas`), TypeScript, Vitest untuk unit test logika URL.

---

## Current Context / Assumptions

- Route publik tamu saat ini **hardcoded**: `Route::get('/m/senopati', fn () => Inertia::render('BukuMenuDigital/CustomerView'))` (`routes/web.php:26`).
- `BukuMenuDigital/Index.tsx` (line 1-48) punya section "Tautan Menu Digital" dengan URL statis `https://restoku.id/m/senopati` + tombol "Buka Preview" + card "QR Code Meja" yang **tidak merender QR sungguhan** (fake `Copy` icon saja).
- `QRCodeMeja/Index.tsx` (line 38-44) merender **fake QR grid** (`Math.random()`) — bukan QR asli. Ini bug terpisah; plan ini fokus ke menu digital tamu, TAPI kita gunakan helper yang sama sehingga konsisten. (Perbaikan QRCodeMeja menyusul, di luar scope plan ini.)
- `qrcode.react` v4.2.0 sudah di `package.json` dan `node_modules` → TIDAK perlu `npm install` baru.
- Outlet name tersedia di `usePage().props.outlet.name` (HandleInertiaRequests line 90-92).
- Base URL publik dianggap `https://restoku.id` (sama dengan yang sudah dipakai di UI existing). Akan di-share dari backend sebagai `menu_base_url` agar configurable.

## Decisions (asumsi — sesuaikan bila berbeda)
1. **URL menu tamu** = `{menu_base_url}/m/{outlet_slug}`.
2. **`outlet_slug`** diambil dari backend: kita slugify `outlet.name` (mis. "Kedai Nusantara - Sudirman" → `kedai-nusantara-sudirman`). Disimpan/digenerate di backend, di-share sebagai `outlet.menu_slug`.
3. **Penempatan UI:** QR generator ditambahkan sebagai card baru di section "Tautan Menu Digital" pada `BukuMenuDigital/Index.tsx` (ganti placeholder "QR Code Meja" yang tidak fungsional).
4. **Aksi:** Download PNG (dari `QRCodeCanvas` → `toDataURL`), Copy link (clipboard), Print (window.print dengan CSS print).

---

## Task 1: Backend — share `menu_public_url` & `menu_base_url`

**Objective:** Frontend mendapat URL menu publik tamu tanpa hardcode.

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php` (di dalam `share()`, array `return` ~line 65-110, tambah ke array `outlet`)
- Modify: `routes/web.php:26` (jadikan dynamic `/m/{slug}`)

**Step 1: Buka `HandleInertiaRequests.php` dan lihat blok `outlet` (line 90-92).** Saat ini:
```php
'outlet' => $user ? [
    'id'   => $user->outlet_id,
    'name' => $user->outlet?->name,
] : null,
```
Ubah menjadi (tambah `menu_slug` + `menu_public_url`):
```php
'outlet' => $user && $user->outlet ? [
    'id'          => $user->outlet_id,
    'name'        => $user->outlet->name,
    'menu_slug'   => \Illuminate\Support\Str::slug($user->outlet->name),
    'menu_base_url' => rtrim(config('app.menu_base_url', 'https://restoku.id'), '/'),
] : null,
```
Tambahkan config default di `config/app.php` (bawah array `app`):
```php
'menu_base_url' => env('MENU_BASE_URL', 'https://restoku.id'),
```

**Step 2: Update route `routes/web.php:26`** jadi dynamic:
```php
Route::get('/m/{slug}', fn (string $slug) => Inertia::render('BukuMenuDigital/CustomerView', ['slug' => $slug]))
    ->name('menu.public');
```
(Pastikan tidak konflik dengan route `/m/senopati` lama — hapus baris `/m/senopati` lama.)

**Step 3: Verifikasi PHP syntax**
Run: `/c/php/php.exe -l app/Http/Middleware/HandleInertiaRequests.php`
Expected: `No syntax errors detected`

**Step 4: Commit**
```bash
git add app/Http/Middleware/HandleInertiaRequests.php routes/web.php config/app.php
git commit -m "feat(menu): share menu_public_url + dynamic /m/{slug} route"
```

---

## Task 2: Frontend — helper `buildMenuUrl()` + unit test

**Objective:** Logika pembentukan URL menu tamu terisolasi & teruji.

**Files:**
- Create: `resources/js/lib/menuUrl.ts`
- Create (test): `resources/js/lib/menuUrl.test.ts`

**Step 1: Write failing test** `resources/js/lib/menuUrl.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildMenuUrl } from './menuUrl';

describe('buildMenuUrl', () => {
  it('builds url from base + slug', () => {
    expect(buildMenuUrl('https://restoku.id', 'senopati'))
      .toBe('https://restoku.id/m/senopati');
  });
  it('strips trailing slash on base', () => {
    expect(buildMenuUrl('https://restoku.id/', 'kedai-nusantara'))
      .toBe('https://restoku.id/m/kedai-nusantara');
  });
  it('returns empty when base missing', () => {
    expect(buildMenuUrl('', 'x')).toBe('');
  });
});
```

**Step 2: Run test → FAIL** (module belum ada)
Run: `npx vitest run resources/js/lib/menuUrl.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement** `resources/js/lib/menuUrl.ts`:
```ts
export function buildMenuUrl(base: string, slug: string): string {
  if (!base || !slug) return '';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanSlug = slug.replace(/^\/+/, '');
  return `${cleanBase}/m/${cleanSlug}`;
}
```

**Step 4: Run test → PASS**
Run: `npx vitest run resources/js/lib/menuUrl.test.ts`
Expected: 3 passed

**Step 5: Commit**
```bash
git add resources/js/lib/menuUrl.ts resources/js/lib/menuUrl.test.ts
git commit -m "test(menu): add buildMenuUrl helper + unit tests"
```

---

## Task 3: Frontend — komponen `MenuQRCode` (QR asli + aksi)

**Objective:** Render QR sungguhan ke URL menu tamu + download/copy/print.

**Files:**
- Create: `resources/js/Components/MenuQRCode.tsx`
- Modify: `resources/js/Pages/BukuMenuDigital/Index.tsx` (ganti placeholder QR card, line 28-37)

**Step 1: Buat komponen** `resources/js/Components/MenuQRCode.tsx`:
```tsx
import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, Printer, Check } from 'lucide-react';

interface Props {
  url: string;
  outletName: string;
}

export default function MenuQRCode({ url, outletName }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `menu-qr-${outletName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const handlePrint = () => window.print();

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col items-center text-center">
      <div ref={canvasRef} className="bg-white p-3 rounded-xl mb-3">
        <QRCodeCanvas value={url} size={160} level="M" includeMargin />
      </div>
      <p className="text-sm font-medium text-slate-200 mb-1">Scan untuk Buka e-Menu</p>
      <p className="text-xs text-slate-400 break-all mb-3 px-1">{url}</p>
      <div className="flex gap-2 w-full">
        <button onClick={handleDownload}
          className="flex-1 rounded-lg bg-slate-100 hover:bg-white text-slate-900 py-2 text-xs font-medium flex items-center justify-center gap-1.5">
          <Download className="size-3.5" />PNG
        </button>
        <button onClick={handleCopy}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 py-2 text-xs font-medium flex items-center justify-center gap-1.5">
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {copied ? 'Tersalin' : 'Salin'}
        </button>
        <button onClick={handlePrint}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 py-2 text-xs font-medium flex items-center justify-center gap-1.5">
          <Printer className="size-3.5" />Cetak
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Integrate ke `BukuMenuDigital/Index.tsx`**
- Tambah import di atas (line 1 area):
```tsx
import MenuQRCode from '../../Components/MenuQRCode';
import { usePage } from '@inertiajs/react';
import { buildMenuUrl } from '../../lib/menuUrl';
```
- Di dalam `BukuMenuDigitalInner`, ambil props:
```tsx
const { props } = usePage();
const outlet = props.outlet as { name?: string; menu_slug?: string; menu_base_url?: string } | null;
const menuUrl = outlet ? buildMenuUrl(outlet.menu_base_url ?? 'https://restoku.id', outlet.menu_slug ?? 'senopati') : '';
```
- **Ganti block card "QR Code Meja" (line 28-37)** yang tidak fungsional dengan grid 2 kolom: card "Tautan Menu Digital" (sudah ada, line 29-37 untuk copy) + card QR baru. Atau lebih simpel: tambahkan `<MenuQRCode url={menuUrl} outletName={outlet?.name ?? 'restoku'} />` sebagai card ke-3 di grid (`grid-cols-2` → jadi 3 item, atau pindah QR ke bawah link). 
  Disarankan: ubah `<div className="mt-5 grid grid-cols-2 gap-4">` menjadi berisi 3 card: (1) QR Code Meja (link ke /qrcode-meja), (2) Kategori Tampil, (3) **MenuQRCode** baru.

**Step 3: Verifikasi tipe & build**
Run: `npx tsc --noEmit` (di dalam project, gunakan `npx vite build` sebagai validasi penuh)
Run: `npm run build` → Expected: exit 0, "built in Xs"

**Step 4: Commit**
```bash
git add resources/js/Components/MenuQRCode.tsx resources/js/Pages/BukuMenuDigital/Index.tsx
git commit -m "feat(menu): real QR generator for guest digital menu + download/copy/print"
```

---

## Task 4: Verifikasi integrasi (manual browser)

**Objective:** Buktikan QR tamu jalan di browser (sesuai standar verifikasi user: bukti nyata, bukan asumsi).

**Files:** none (verification only)

**Step 1: Rebuild & restart server**
```bash
npm run build
# server sudah jalan di proc_d0cf13515cf5; restart jika perlu
```
**Step 2: Browser navigate** `http://localhost:8000/buku-menu-digital` (login manager dulu bila perlu, pin 999999).
**Step 3: Assert:**
- Card "Scan untuk Buka e-Menu" muncul dengan **QR asli** (bukan grid acak).
- URL di bawah QR = `https://restoku.id/m/{slug-outlet}` (slug = slugify nama outlet).
- Klik **PNG** → file terdownload `menu-qr-{outlet}.png`.
- Klik **Salin** → toast "Tersalin", clipboard berisi URL.
- Klik **Cetak** → dialog print muncul.
**Step 4: Verify public route** navigate `http://localhost:8000/m/{slug}` → render `CustomerView` (e-menu tamu) tanpa login.

---

## Tests / Validation Summary
- `npx vitest run resources/js/lib/menuUrl.test.ts` → 3 passed
- `php -l` pada HandleInertiaRequests → No syntax errors
- `npm run build` → exit 0
- Browser manual: QR asli render + 3 aksi + route publik `/m/{slug}` bisa diakses tanpa auth

## Asset Menu — Arah Cloudinary (info user 2026-07-09)
- User berencana hosting **foto menu di Cloudinary**. Saat implementasi nyata (CustomerView / BukuMenuDigital), arahkan fetching foto menu route ke **Cloudinary URL**, BUKAN local path (`/images/*.webp` yang dipakai di MOCK_ITEMS sekarang).
- `ProductImage` component kemungkinan perlu diupdate agar menerima URL Cloudinary (secure/`upload/` vs `res.cloudinary.com/...`).
- Belum ada kredensial/bucket — implementasi Cloudinary upload/serve menyusul di task terpisah.

## Risks / Tradeoffs / Open Questions
- **QRCodeMeja masih fake** — plan ini tidak memperbaikinya (scope tamu menu). Bisa direfactor pakai `MenuQRCode` nanti.
- **`menu_base_url` hardcode `https://restoku.id`** — asumsi domain produksi. Ganti via `.env` `MENU_BASE_URL` bila beda.
- **Slug dari nama outlet** — bila 2 outlet punya nama mirip bisa bentrok; acceptable untuk sekarang (bisa pakai `outlet.id` sebagai fallback nanti).
- **Clipboard API** butuh context aman (https/localhost) — di localhost OK.
- Apakah user mau QR generator juga di halaman **terpisah** (route baru) selain di `BukuMenuDigital/Index`? Plan menaruhnya di Index (paling masuk akal). Bisa dipisah bila diminta.
