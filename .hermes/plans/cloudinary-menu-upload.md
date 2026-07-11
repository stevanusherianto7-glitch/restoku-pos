# Plan: Modul Upload Foto Menu → Cloudinary (Restoku Fase 1)

**Tujuan:** Wiring end-to-end upload foto menu owner ke Cloudinary (CDN offload) +
tampil di e-Menu tamu, mengganti mock `/images/*.webp`. Berdasarkan invarian:
"foto menu route ke Cloudinary, bukan local path".

---

## STATUS SAAT INI (hasil audit kode, 2026-07-11)
Sudah ada (tidak perlu dibuat dari nol):
- Migration `menu_items` (image_path nullable) + `menu_categories`
- Model `MenuItem` (TenantScope, relasi category/outlet, `photo_url` accessor) + `MenuCategory`
- `App\Services\CloudinaryService` — signed upload via `Http` facade, folder
  `restoku/{tenant_id}/menu`, parse `config('services.cloudinary.url')`,
  fallback `null` bila tanpa config
- `App\Http\Controllers\MenuController` — index/store/update/destroy + cache invalidation
- Routes auth group: `/katalog-menu` (GET), `/api/menu` (POST), `/api/menu/{id}` (PUT/DELETE, throttle:30,1)
- Frontend `KatalogMenu/Index.tsx` — **MASIH HARDCODED** (props `menuItems`/`outlets`
  dari controller tidak dipakai; Tambah/Edit/Hapus tidak manggil API)

## GAP (yang akan dikerjakan)
1. Frontend KatalogMenu belum terhubung backend (data lokal, tidak persist).
2. `config/services.php` belum punya key `cloudinary`.
3. `.env` / `.env.example` belum punya `CLOUDINARY_URL`.
4. Ganti foto = photo lama orphan di Cloudinary (tidak di-destroy).
5. Belum pakai transform best-practice: `f_auto,q_auto` + `eager` thumbnail grid.
6. Belum ada test (`CloudinaryService`, `MenuController`).
7. CustomerView/e-Menu masih mock (belum fetch `getPublicMenu` → `photo_url` Cloudinary).

---

## LANGKAH EKSEKUSI

### Langkah 1 — Config & Env (prerequisite)
- `config/services.php`: tambah
  ```php
  'cloudinary' => [
      'url' => env('CLOUDINARY_URL'),
  ],
  ```
- `.env.example`: tambah `CLOUDINARY_URL=cloudinary://KEY:SECRET@CLOUD` (placeholder,
  komentar "isi di VPS / local dev"). `.env` user isi sendiri (RAHASIA, tidak di-commit).
- Verifikasi: `php artisan tinker --execute="dd(config('services.cloudinary.url'))"`.

### Langkah 2 — Tingkatkan `CloudinaryService` (best-practice dari skill)
- Tambah param `eager` thumbnail: `[['width'=>500,'height'=>500,'crop'=>'fill','quality'=>'auto','fetch_format'=>'auto']]`
  (pre-generate grid thumb, hindari lazy 1st-render lag di e-Menu).
- Tambah `transformation` incoming: `f_auto,q_auto` (optimasi otomatis).
- Simpan `public_id` (bukan hanya secure_url) supaya bisa destroy nanti → kembalikan array
  `['url' => secure_url, 'public_id' => ...]` ATAU tetap string url tapi simpan public_id
  terpisah. **Keputusan:** kembalikan `secure_url` (sesuai controller saat ini) + simpan
  public_id di kolom baru `image_public_id` (nullable) di `menu_items` untuk delete nanti.
- Method `deleteMenuPhoto(string $publicId)` → `POST /image/destroy` signed (Basic Auth
  atau signature). Dipakai saat ganti/hapus foto.
- Tetap fallback `null` bila tanpa config (testing/local tanpa Cloudinary).

### Langkah 3 — Migration: kolom `image_public_id`
- Buat migration `add_image_public_id_to_menu_items_table`:
  `$table->string('image_public_id')->nullable();`
- `MenuItem`: tambah ke `$casts`/fillable guard, accessor `photo_url` tetap return `image_path`.

### Langkah 4 — `MenuController` wiring foto
- `store`: photo base64 → `cloudinary->uploadMenuPhoto()` → simpan `image_path` (url) +
  `image_public_id`. (Sudah ada, tinggal pastikan public_id tersimpan.)
- `update`: bila photo baru ≠ lama → upload baru, **destroy foto lama** via
  `deleteMenuPhoto($oldPublicId)` sebelum overwrite. (Tambah logic delete.)
- `destroy`: bila `image_public_id` ada → `deleteMenuPhoto()` sebelum `item->delete()`.
- Validasi `photo`: izinkan base64 data URL (sudah `nullable|string`). Tambah
  `image/*` sanity di service (cek prefix `data:image`).

### Langkah 5 — Frontend `KatalogMenu/Index.tsx` (real data + upload)
- Ganti `useState` hardcoded → props `menuItems`, `outlets` dari controller (`usePage().props`).
- Fetch kategori: tambah prop `categories` (dari `MenuCategory::where tenant`) — atau
  hardcode 3 kategori (Makanan/Minuman/Pelengkap) sebagai default seeder.
- `handleAdd`/`handleEdit` → `router.post('/api/menu', ...)` / `router.put('/api/menu/{id}')`
  dengan field `photo` = data URL hasil `convertToWebP` (sudah ada helper di file).
- `handleDelete` → `router.delete('/api/menu/{id}')`.
- Tampilan foto: pakai `item.photo_url` (sudah ada). Bila null → `ProductImage` fallback.
- **Hapus** tile "Tambah Menu Baru" full-width (sudah dipatch sebelumnya) tetap dipertahankan.
- State management: optimistic update via `router.reload()` atau `useForm` Inertia.

### Langkah 6 — CustomerView / e-Menu (tamu) → Cloudinary URL
- `OrderController::getPublicMenu` sudah return `MenuItem::scopeForGuestMenu` → pastikan
  `photo_url` (`image_path`) ikut ter-serialize (sudah `image_path` di select? cek & tambah).
- Frontend `BukuMenuDigital/CustomerView`: ganti mock `MOCK_ITEMS` → fetch `/api/menu/{slug}`
  (sudah ada route), render `photo_url` via `<img>` / `ProductImage`. Tambah transform
  `f_auto,q_auto` di URL bila perlu (URL sudah secure_url Cloudinary → tinggal append
  `/f_auto,q_auto/` sebelum `/v1_/`). **Catatan:** secure_url sudah berisi version; lebih
  aman pakai `c_fill,w_500,h_500/f_auto,q_auto` sebagai transform on-the-fly.
- Invalidasi cache Redis (`menu:tenant:{id}:outlet:{id}`) sudah di-controller → e-Menu
  otomatis fresh setelah owner update.

### Langkah 7 — Tests (PHPUnit)
- `CloudinaryServiceTest`: mock `Http::fake()` → assert signature sha1 benar, folder
  `restoku/{tenant}/menu`, return `secure_url`; assert fallback `null` bila config kosong.
- `MenuControllerTest`: authed owner → POST `/api/menu` dengan photo base64 → assert
  `menu_items` ter-create + `image_path` berisi `res.cloudinary.com`; PUT ganti photo →
  assert public_id baru; DELETE → assert row hilang (destroy foto di-skip bila fake).
- Jalankan: `php artisan test`.

### Langkah 8 — Frontend verify (vitest + build)
- `npm run build` (exit 0) + `npm run test` (vitest 43+ passed, tidak regresi).
- Manual (bila user login PIN staff): buka `/katalog-menu` → Tambah Menu + Upload Foto →
  cek foto muncul (URL `res.cloudinary.com`). (Saya tidak bisa login PIN — verifikasi
  visual jadi tanggung jawab user, atau user kasih PIN test.)

### Langkah 9 — Commit & Push
- 1 commit: `feat(menu): wire Cloudinary photo upload end-to-end + e-Menu fetch`
- Push `origin/main`, lalu trigger CI (`gh workflow run ci.yml --ref main` atau andalkan
  push trigger) → pastikan 8 jobs green.

---

## KEPUTUSAN ARSITEKTUR (saya ambil alih)
- **Upload backend** (Laravel signed), secret di `.env` — TIDAK client-side preset.
  (Sesuai skill golden rule: never expose secret.)
- **Multi-tenant isolation**: folder `restoku/{tenant_id}/menu` (sudah di service) +
  tag opsional `menu,{tenant_id}` (belum, bisa ditambah di eager/context).
- **Delivery**: simpan `secure_url` di `image_path`; `public_id` di `image_public_id`
  untuk delete. e-Menu append transform `f_auto,q_auto`.
- **Fallback**: tanpa `CLOUDINARY_URL` → `null` → `ProductImage` placeholder (jalan di
  lokal tanpa akun Cloudinary, tidak break dev).

## RISIKO
- Akun Cloudinary user belum ada → upload nyata butuh `CLOUDINARY_URL` valid. Saya bisa
  verifikasi signature + HTTP call via `Http::fake()` (test), tapi upload sungguhan
  butuh user isi credential di `.env` (RAHASIA, tidak saya minta lewat chat).
- CustomerView mock removal = breaking buat demo tanpa data → solusi: seeder menu contoh
  (dengan photo null → placeholder) supaya e-Menu tidak kosong.

## CHECKLIST VERIFIKASI (bukti nyata, bukan asumsi)
- [ ] `config:clear` + tinker: `config('services.cloudinary.url')` terbaca
- [ ] `php artisan test` → CloudinaryService + MenuController passed
- [ ] `npm run build` exit 0, `npm run test` (vitest) hijau
- [ ] `gh` CI: 8 jobs success (atau push trigger green)
- [ ] (User) login staff → upload foto menu → URL `res.cloudinary.com` muncul
