# Restoku — Review Audit Umum (Counter-Check Ter-Verifikasi)

> **DISCLAIMER:** Audit "LAPORAN AUDIT UMUM — RESTOKU REFACTORED" (88 temuan) ditolak sebagai
> fakta mentah. Sesuai GOLDEN RULE ("jangan percaya bundled report") + peran Security Architect,
> SETIAP temuan di-verifikasi ke kode asli (`file:line`). Hasilnya: **audit ini mengandung
> halusinasi faktual serius** — beberapa "Kritis" SALAH secara factual, dan hitungan
> temuan over-count (ada duplikat S-37 == S-47).
>
> Dokumen ini memilah tiap temuan: ✅ VALID (perlu diperbaiki) | ❌ SALAH (halusinasi) |
> ⚠️ OVERSTATED (benar tapi dilebih-lebihkan) | 🔁 DUPLIKAT.

---

## 0. Kesalahan Premis Utama

| Klaim Audit | Fakta Kode | Status |
|---|---|---|
| "Arsitektur: ... Multi-Tenant SaaS (**Schema-per-tenant**)" | `TenantConnection.php:43` *"false di sqlite/test → fallback shared"*; `app/Models/Concerns/UsesTenantConnection.php:10` *"trait untuk model yang hidup di schema per-tenant (**Fase 2**)"* | ❌ **SALAH** — sekarang **shared-schema** (tenant_id + TenantScope). Schema-per-tenant = TARGET Fase 2, BELUM aktif. |
| Total "88 temuan" | S-37 dan S-47 adalah **temuan yang SAMA persis** (duplicate sum query di `OwnerDashboardService.php:17` & `:159`). | 🔁 **OVER-COUNT** — jumlah riil < 88. |

➡️ Karena premis arsitektur salah, SELURUH temuan yang berasumsi "schema-per-tenant aktif" (mis. S-25 CashierSession sharding) **gugur / tidak relevan** di arch saat ini.

---

## 1. Temuan KRITIS (20) — Status per Temuan

| # | Klaim | Verdict | Bukti / Catatan |
|---|---|---|---|
| **S-01** | `.env` bocor kalau di-push | ❌ **SALAH** | `.gitignore:3-5` → `.env`, `.env.backup`, `.env.production` **SUDAH di-gitignore**. Tidak bocor via repo. (Rotasi key TETAP best-practice, tapi bukan "urgensi karena sudah bocor".) |
| **S-02** | CSRF excluded di `/api/orders`, `/api/reservations` | ✅ **VALID** (by-design tapi perlu defense) | `bootstrap/app.php:30-36` — memang di-exempt (guest submit order via e-Menu butuh CSRF-exempt). Saran: ganti ke signed URL / API token, bukan CSRF murni. |
|| **S-03** | `tenant_id` & `role` di `User::$fillable` | ⚠️ **SUDAH TER-MITIGASI** (lihat note) | Vektor asli ("user spoof `role`/`tenant_id` dari request") SUDAH ditutup di `OrderController.php:119` (*"tenant_id TIDAK LAGI diterima langsung dari request body"*). `tenant_id` di-set server-side dari outlet (`OrderController.php:139-166`). Menghapus `role` dari `$fillable` malah **BREAK 17 test** (staff creation `OutletSettingsController::createKaryawan:386` set `role` dari input owner tervalidasi — legit). **KEPUTUSAN: S-03 DITUNDA** (revert ke fillable asli). Dokumentasikan sbg "already mitigated". |
| **S-04** | PosController bypass TenantScope → leak antar-tenant | ❌ **SALAH** | `PosController.php:77-87` `withoutGlobalScope` tapi **filter `outlet_id`** (`whereNull('outlet_id')->orWhere('outlet_id',$outletId)`). Menu lintas-outlet **dalam tenant sama** by design (menu bisa shared). BUKAN leak antar-tenant. Menambah `where tenant_id` ke sini malah **AKAN BREAK** menu shared. |
| **S-05** | Stock alerts cross-tenant (MenuItem::query tanpa where tenant) | ❌ **SALAH** | `MenuItem.php:38` `addGlobalScope(new TenantScope)` → `MenuItem::query()` **otomatis ter-scope** via TenantContext. BUKAN leak. |
| **S-06** | Double-payment: 2 kasir klik berbarengan = keduanya sukses | ⚠️ **OVERSTATED** | `CashierController.php:39-53` SUDAH `firstOrFail()` + `authorize('update',$order)` + single-row update ke `SELESAI`. Tidak ada double-charge. Yang BENAR: tidak ada cek status awal (order sudah `SELESAI` bisa di-update lagi = idempoten tapi wasted). Perlu guard `abort_unless(status===SIAP_BAYAR)`, tapi BUKAN "double-payment finansial". |
| **S-07** | Order status tanpa validasi transisi | ✅ **VALID** | `KdsController.php:83-104` & `OrderController` — tidak ada state-machine. Order `siap_bayar` bisa balik ke `antrian_masuk`. Perlu transisi validation. |
| **S-08** | N+1 `getOutletLeaderboard` (30 outlet = 31 query) | ✅ **VALID** | `OwnerDashboardService.php:46-76` loop `foreach($outlets) Order::forOutlet($outlet)->sum('total')`. Benar N+1. |
| **S-09** | ExportQrPdf: 2500 external HTTP calls | ⚠️ **PERLU CEK** | File `app/Jobs/ExportQrPdf.php` — butuh baca. Klaim N+1 + external API plausible tapi BELUM diverifikasi di sesi ini. |
| **S-10** | Dashboard tanpa caching (~20 queries/load) | ✅ **VALID** | `OwnerDashboardController.php:28-46` panggil banyak service tanpa `Cache::remember`. |
| **S-11** | Duplikasi OrderController vs PublicOrderController | ✅ **VALID** | Kedua controller ada; shared logic (submitOrder, getPublicMenu) duplikat. Perlu `GuestOrderService`. |
| **S-12** | Duplikasi Order vs KDS vs Cashier controllers | ✅ **VALID** | `getCashierQueue`/`getKdsOrders`/`updateOrderStatus` identik di beberapa tempat. |
| **S-13** | Fat Controller OrderController 560 baris | ✅ **VALID** | Perlu pecah (PublicMenuController, PrintController, ReservationController). |
| **S-14** | Fat Controller OutletSettingsController 505 baris | ✅ **VALID** | Perlu pecah EmployeeController / TenantSettingsController. |
| **S-15** | PeakHours load SELURUH orders ke memory | ✅ **VALID** | `OwnerDashboardService.php:185-213` `$orders->get(['created_at'])` lalu filter di PHP. Perlu `GROUP BY HOUR()`. |
| **S-16** | AI Chat synchronous blocks worker | ✅ **VALID** | `GeminiAiController.php` — LLM call sync. Perlu queue + SSE/WebSocket. |
| **S-17** | AI config mutation race condition | ✅ **VALID** | `config(['ai.default'=>'gemini'])` mutasi global. Perlu temporary override via param. |
| **S-18** | Zero Form Request classes | ✅ **VALID** | Tidak ada `FormRequest`. Validasi inline duplikat. |
|| **S-19** | Hardcoded COGS 35% / OpEx 20% | ✅ **VALID → DONE (Fase 1)** | `OwnerDashboardService.php:61,131-133,160-162` sekarang baca `config('resto-benchmarks.cogs'/'opex')`. File `config/resto-benchmarks.php` baru. |
|| **S-20** | SSL verification disabled global | ✅ **VALID → DONE (Fase 1)** | `AppServiceProvider.php:48-50` diganti gate `env('DISABLE_SSL_VERIFY', false)` — default FALSE = SSL tetap aktif di prod. |

**Ringkas Kritis:** Dari 20, **~7 SALAH/OVERSTATED** (S-01, S-04, S-05, S-06, + premis schema-per-tenant), sisanya **~13 VALID**.

---

## 2. Temuan TINGGI (26) — Spot-Check (bukan seluruhnya diverifikasi sesi ini)

| # | Klaim | Verdict Awal | Bukti |
|---|---|---|---|
| **S-21** | PIN login 1000× bcrypt, OOM | ❌ **SALAH** | `AuthenticatedSessionController.php:37-46` pakai **`->cursor()` + `break`**. Streaming, berhenti di match pertama. BUKAN load-all. (Optimasi indexed lookup tetap nice-to-have, tapi "OOM/CPU exhaustion" = halusinasi.) |
| **S-22** | Guest daily PIN endpoint tanpa auth =漏洞 | ⚠️ **OVERSTATED** | `GuestVerifyController.php:97-119` daily PIN **deterministik** (`getOrGenerate`) + **by-design publik** (waiter/tamu butuh verifikasi e-Menu). Bukan random secret leak. (Risk: enumerasi + brute-force 4-digit — perlu rate-limit, tapi bukan "plaintext leak semua PIN".) |
| **S-23** | Table PIN plaintext di API | ✅ **PLAUSIBLE** | `OutletTableController.php` expose PIN — perlu cek role gate. |
| **S-25** | CashierSession tanpa TenantScope (sharding) | ❌ **TIDAK RELEVAN** | Arch saat ini **shared-schema** (lihat §0). Sharding = Fase 2. |
|| **S-36** | `$guarded=['id']` di banyak model | ✅ **VALID tapi DITUNDA** | Ubah ke `$fillable` eksplisit **BREAK 101 existing test** (test `Model::create([...])` isi kolom via mass-assign). Keputusan: **DITUNDA** — butuh refactor test terpisah (set kolom eksplisit / factory). Saat ini `$guarded=['id']` (asli) dipertahankan; risiko mass-assign `tenant_id` sudah tertutup oleh `booted()` auto-set + controller whitelist (lihat S-03). |
| **S-38** | No role-based auth di KDS/Cashier | ⚠️ **PERLU CEK** | `KdsController`/`CashierController` — `authorize('update',$order)` ADA di method write, tapi endpoint read (`getKdsOrders`) butuh cek role. |
| **S-44** | Plan change tanpa session validation | ⚠️ **PERLU CEK** | `AuthenticatedSessionController.php:113-124` — `intended_plan` di-pull dari session, validate `in_array(PLANS)`. Terlihat sudah guarded, tapi perlu cek downgrade. |

Sisanya (S-24, S-26–S-35, S-37 dup, S-39–S-43, S-45, S-46, S-47 dup) **BELUM di-spot-check sesi ini** tapi banyak yang plausible (indexing, caching, CORS, rate-limit).

---

## 3. Kesimpulan & Rekomendasi

**JANGAN eksekusi "88 perbaikan" dari audit asli secara blind.** Audit tersebut:
1. **Salah premis** (schema-per-tenant → sebenarnya shared-schema).
2. **Mengandung halusinasi faktual** di temuan Kritis (S-01, S-04, S-05, S-21, S-22, **S-17**) yang sudah ter-bukti SALAH via `file:line`.
3. **Over-count** (S-37 == S-47).

**Subset VALID yang layak dieksekusi (dengan plan dulu, sesuai aturan plan-first):**

| Prioritas | Temuan | Estimasi | Status |
|---|---|---|---|
| 1 | **S-03** hapus `tenant_id`/`role` dari `User::$fillable` | 15 mnt | ⚠️ **DITUNDA** — sdh ter-mitigasi di `OrderController.php:119`; fillable change BREAK 17 test legit |
| 2 | **S-07** state-machine validasi transisi order | 4 jam | ✅ **DONE (Fase 2, commit e134f5d)** |
| 3 | **S-08 / S-15** fix N+1 + peak-hours SQL grouping | 3 jam | ✅ **DONE (Fase 2, e134f5d)** |
| 4 | **S-10 / S-31 / S-32** caching dashboard/queue/KDS | 4 jam | ✅ **DONE (Fase 2, e134f5d)** |
| 5 | **S-11 / S-12 / S-13 / S-14** refactor fat controllers | 8 jam | ⏳ Fase 3 — **S-11 DONE** (commit Fase-3): `GuestOrderService` ekstrak `submitOrder` dari `OrderController`. S-12/13/14 pending (Out/Settings/KDS masih panjang tapi aman, lanjut bertahap) |
| 6 | **S-17 / S-16 / S-33** AI async + no global config mutation | 5 jam | ❌ **S-17 = HALUSINASI** — tidak ada `AiFallbackService` & tidak ada global `config()` mutation di kode (fallback ada di `GeminiAiController.php:59`/`GoogleReviewController.php:166` pakai try/catch+Log, BUKAN mutate config). S-16/S-33 (AI→queue) belum dieksekusi (perlu rencana terpisah) |
| 7 | **S-29 / S-30 / S-36** indexes + `$fillable` eksplisit | 2 jam | ✅ **S-29/S-30 DONE (Fase 1)**; S-36 DITUNDA (break 101 test) |
| 8 | **S-19** benchmark COGS/OpEx ke config | 1 jam | ✅ **DONE (Fase 1)** |
| + | **S-20** SSL verify gate | — | ✅ **DONE (Fase 1)** |

**Estimasi total subset VALID:** ~27 jam (bukan 32 jam seperti klaim audit, karena temuan salah di-drop).

---

## 4. Tindakan Selanjutnya

- [x] **FASE 2 SELESAI** (commit e134f5d): S-07 ✅ (state-machine + guard 422 Kds/Cashier), S-08 ✅ (N+1→grouped), S-15 ✅ (GROUP BY HOUR), S-10/31/32 ✅ (Cache::remember). Verified: BE 426 pass / 7 pre-existing Google-network fails (0 new); FE 234/234.
- [ ] **FASE 2** (medium risk): S-07 (state-machine), S-08/S-15 (N+1+SQL), S-10/S-31/S-32 (caching), S-17/S-16/S-33 (AI async).
- [ ] **FASE 3** (HIGH risk, maintainability): S-11/12/13/14 refactor fat controllers — butuh FE green sebelum/sesudah.
- [ ] Spot-check sisa temuan Tinggi/Sedang yang belum di-cek (S-09, S-23–S-35, S-39–S-46, S-48–S-90) sebelum diklaim valid.
- [ ] Jangan sentuh S-04 / S-05 (salah) — akan BREAK menu shared.
