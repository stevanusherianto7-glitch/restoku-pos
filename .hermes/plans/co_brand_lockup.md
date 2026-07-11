# Plan: Co-Brand Lockup (Restoku + Tenant) di Sidebar Dashboard

## Tujuan
Saat tenant punya logo brand sendiri (upload), tampilkan lockup co-brand di sidebar:
`[LOGO TENANT]  nama OUTLET TENANT`
`                Restoku`  (wordmark gradient cabe→emas, sejajar dgn logo tenant, di bawah nama outlet)
Bila tenant belum upload → placeholder "LOGO TENANT" + whitespace "nama Outlet Tenant".
Wordmark Restoku auto-fit: saat sidebar collapse, menyusut agar tak terlipat.

## Scope
- Sidebar dashboard SAJA: `MainLayout.tsx` + `OwnerLayout.tsx`.
- Tambah UI upload logo tenant di `PengaturanOutlet/Index.tsx` (mekanisme `tenantImage` sudah ada).
- Gradient Restoku dibiarkan asli (`brightness-110` di dark).

## Langkah
1. **Shared.tsx** — buat `TenantBrandLockup({ collapsed })`:
   - Kiri: box 44px. Jika `tenantImage` → `<img>` cover; else jika `tenantLogo!=='ChefHat'` → icon Lucide; else placeholder "LOGO TENANT" (abu, uppercase).
   - Kanan: `tenantName || "nama Outlet Tenant"` (placeholder kelabu bila kosong, `truncate`).
   - Bawah: `<RestokuWordmark className={collapsed ? "h-3.5" : "h-[18px]"} />` (auto-shrink saat collapsed) + `brightness-110`.
   - `collapsed=true` → sembunyikan meta (hanya logo tenant + wordmark kecil, center).
2. **PengaturanOutlet/Index.tsx** — tambah `<input type=file accept="image/*">` di samping `logoInput`:
   - onChange → `FileReader.readAsDataURL` → `saveSettings(nameInput, logoInput, base64, staffOwner)`.
   - Tombol "Hapus logo" → `saveSettings(nameInput, logoInput, null, staffOwner)`.
3. **MainLayout.tsx** (line ~177-185) — ganti blok logo lama → `<TenantBrandLockup collapsed={isCollapsed} />`.
4. **OwnerLayout.tsx** (line ~41-49) — ganti blok logo lama → `<TenantBrandLockup collapsed={false} />` (owner layout tdk punya collapse; default expanded).

## Verifikasi
- `npm run build` hijau, `npx vitest run` 43 pass.
- Mockup: update `public/mockup_co_brand.html` jadi 3 state (upload / placeholder / collapsed) — screenshot `browser_vision` cocok sketsa.
- Sidebar: navigasi dashboard, cek lockup + collapse (MainLayout) auto-shrink.

## Catatan
- Tidak ubah dashboard lain (receipt/Auth) — sesuai arahan "sidebar saja".
- `renderLogo()` tetap dipakai internal lockup; `RestokuLogo` (SVG icon) tidak dihapus (masih dipakai sbg fallback tenant).
- File statis `mockup_co_brand.html` dihapus sebelum commit (bukan bagian app).
