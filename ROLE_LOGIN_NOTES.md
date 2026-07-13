# Role & Login Reference

## Login endpoints
- **Owner**: `/owner/login` — email + password.
  - `owner@example.com` / `password`
- **Staff (Kasir/Kitchen/Waiter/Manager)**: `/login` — **PIN pad 6 digit** (bukan email).
  - Kasir: `123456`  (role `kasir`)
  - Kitchen: `111111` (role `kitchen`)
  - Waiter: `654321`  (role `waiter`)
  - Manager: `999999` (role `manager`)

## Role alias normalization
`RoleGuard` normalizes aliases so `cashier` (English, stored by PengaturanOutlet
dropdown) and `kasir` (Indonesian, used by DEFAULT_EMPLOYEES / allowedRoles) are
treated as the same role. Map:
- cashier ↔ kasir
- kitchen ↔ dapur
- waiter ↔ pelayan
- manager, owner, admin → unchanged

This prevents false "Akses Ditolak" when `tenant_employees` is persisted with the
English role value from the PengaturanOutlet UI.
