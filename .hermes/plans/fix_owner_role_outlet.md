# Plan: Fix data owner/role/nama-outlet (PengaturanOutlet + sidebar)

## Isu & Root Cause
1a. **Nama Owner "LALU GUSTI" ≠ sidebar "Budi Santoso"**
    - `Shared.tsx:133` `staffOwner` hardcode `useState('LALU GUSTI')`; sidebar pakai `auth.user.name`.
    - Fix: `ownerInput` default ambil dari user login (`usePage().props.auth.user.name`) kalau belum ada `tenant_staff_owner` di localStorage.

1b. **Dropdown "WAITER" default + autofill "owner@example.com"**
    - `Index.tsx:67` `newEmpRole` default `'waiter'` (arbitrer).
    - Email autofill browser (value asli `''`).
    - Fix: default role jadi placeholder wajib-pilih `''` + `<option value="" disabled>Pilih Role</option>`; tambah `autoComplete="off"` pada input nama+email; validasi role di `handleAddEmployee`.

2. **Sidebar "Restoku" bukan "Kedai Nusantara"**
    - `Shared.tsx:128` `tenantName` default `'Restoku'`; hanya ke-update dari localStorage/save.
    - Fix: init `tenantName` dari DB tenant (`usePage().props.tenant?.name`) saat belum ada localStorage. Wordmark Restoku TETAP (co-branding, sesuai keputusan user).

## Langkah
1. `Shared.tsx` `useTenantSettings`: di `loadSettings`, kalau `!savedName` & ada `props.tenant?.name` → pakai itu; kalau `!savedOwner` & ada `auth.user.name` → pakai itu. (useTenantSettings tak punya akses usePage → pakai fallback via param atau baca dari window.__INITIAL? → lebih aman: pass initial via komponen konsumen.)
   - Alternatif KISS: di `Index.tsx`, set `ownerInput` default `staffOwner !== 'LALU GUSTI' ? staffOwner : (auth.user?.name ?? '')`; dan `nameInput` default `tenantName !== 'Restoku' ? tenantName : (tenant?.name ?? '')`.
   - Sidebar: `TenantBrandLockup` juga perlu tenantName benar → sumbernya localStorage. Jadi saat owner save, sudah benar. Untuk first-load sebelum save, init localStorage dari DB sekali.
2. `Index.tsx`: dropdown role placeholder + autoComplete off + validasi.
3. Verifikasi: build + vitest + browser (login owner tak tersedia → verifikasi via build/test + baca kode).

## Catatan
- Wordmark Restoku di sidebar SENGAJA dipertahankan (co-branding).
- Jangan hardcode nama; semua dari DB/auth.
