# Fase 1 — Real Menu Data + Cloudinary (plan)

## Konteks / Status Saat Ini (hasil audit repo)
Backend Fase 1 **SUDAH MATANG** (tidak perlu dibangun dari nol):
- `app/Services/CloudinaryService.php` — signed upload (secret server-side) + delete, fallback null bila tanpa `CLOUDINARY_URL`.
- `app/Http/Controllers/MenuController.php` — CRUD + upload `photo` (base64) + cache invalidation + hapus foto lama (anti-orphan).
- `routes/web.php` — `GET /api/menu/{slug}` (getPublicMenu, public), `POST/PUT/DELETE /api/menu` (owner, throttle).
- Migration `image_public_id` sudah ada; `MenuItem.image_path` simpan secure_url Cloudinary.
- `MenuSeeder` upload foto demo ke Cloudinary bila `CLOUDINARY_URL` ter-set.
- Tests: `CloudinaryUploadTest`, `MenuIsolationTest` (ada & lulus).
- Frontend `KatalogMenu/Index.tsx` SUDAH kirim `photo` (convertToWebP → base64 → router.post). `ProductImage.tsx` SUDAH render URL + fallback.

## Yang MASIH MOCK / BELUM SelesAI (scope Fase 1 ini)
1. **CustomerView (Buku Menu Digital publik)** masih hardcode `FALLBACK_ITEMS` dengan `/images/*.webp` — **TIDAK fetch** `/api/menu/{slug}`. Ini celah kritis: tamu scan QR → lihat menu mock, bukan foto Cloudinary sungguhan.
2. **POS/Index.tsx** masih hardcode `image: '/images/*.webp'` (minor, tidak blocking publik, tapi inkonsisten).
3. **Verifikasi end-to-end** foto Cloudinary sungguhan via phone-scan belum pernah dilakukan (butuh `CLOUDINARY_URL` di `.env` — Anda yang isi).

## Tujuan
Buku Menu Digital publik menampilkan menu + foto asli dari Cloudinary (CDN), graceful fallback ke placeholder bila kosong, dan terverifikasi lewat phone-scan (ngrok) se-realistis mungkin sebelum VPS.

## Langkah
1. **CustomerView fetch API** — ganti `FALLBACK_ITEMS` statis dengan `fetch('/api/menu/{slug}')` di `useEffect` (slug dari `window.location.pathname`). Simpan ke state; bila kosong/gagal → array kosong + `ProductImage` fallback. Pertahankan filter kategori + modal detail.
2. **CustomerView render foto** — gunakan `<ProductImage src={item.image_path} ... />` (sudah ada) bukan `<img src="/images/...">`. Pastikan `image_path` dari API (Cloudinary URL) ter-render.
3. **POS konsistensi** — ganti hardcode `/images/*.webp` di `POS/Index.tsx` ke data props (order items dari backend) atau setidaknya `ProductImage` + placeholder. (Low priority, bisa di-skip bila Anda setuju.)
4. **Seeder verify** — pastikan `MenuSeeder` jalan (`php artisan db:seed --class=MenuSeeder`) dan upload ke Cloudinary bila `CLOUDINARY_URL` ada; cek DB `menu_items.image_path` berisi `https://res.cloudinary.com/...`.
5. **Backend test jalan** — `php artisan test` (CloudinaryUploadTest + MenuIsolationTest) tetap hijau (tanpa CLOUDINARY_URL → fallback null path).
6. **Frontend verify** — `npm run build` + `npm run lint` + `npm run test` hijau.
7. **E2E phone-scan** — Anda isi `CLOUDINARY_URL` di `.env`, jalankan seeder, lalu `scripts/dev-cloudflared.sh`; saya decode/inspect buku menu di browser: foto tampil dari `res.cloudinary.com`, bukan `/images`.

## Keputusan / Catatan Arsitek
- **Secret**: `CLOUDINARY_URL` TIDAK pernah di-commit; Anda yang ketik ke `.env` (skill rule: jangan ingest secret dari chat). Tanpa itu, aplikasi tetap jalan (fallback placeholder) — aman untuk dev.
- **Multi-tenant**: `CloudinaryService` namespacing `restoku/{tenant_id}/menu` → isolasi by path. `getPublicMenu` pakai `withoutGlobalScope(TenantScope)` + lookup by slug (sudah benar per invariant global-unique slug).
- **Tidak ubah backend** (sudah production-shape) kecuali ada bug saat verify. Fokus = frontend CustomerView + verify.
- **Bulk-create N outlet** (PRD Fase 1) — SUDAH ada di PengaturanOutlet (per memory: bulk-create N outlets). Tidak masuk scope plan ini kecuali Anda minta.

## Verifikasi (definition of done)
- [ ] CustomerView fetch `/api/menu/{slug}`, tidak ada lagi `FALLBACK_ITEMS` hardcode `/images`.
- [ ] Foto menu di buku menu publik = URL `https://res.cloudinary.com/...` (bukan local path).
- [ ] Tanpa CLOUDINARY_URL: placeholder `ProductImage` muncul, tidak error.
- [ ] `npm run build` + `lint` (0/0) + `test` (43/43) hijau.
- [ ] `php artisan test` hijau (Cloudinary fallback path).
- [ ] Phone-scan (ngrok) buku menu → foto Cloudinary tampil (verify visual oleh Anda).

## Risiko
- Bila `CLOUDINARY_URL` belum Anda isi, E2E foto sungguhan tidak bisa diverifikasi — tapi kode path sudah benar & fallback aman.
- `getPublicMenu` harus return `image_path` (sudah): cek saat verify.
