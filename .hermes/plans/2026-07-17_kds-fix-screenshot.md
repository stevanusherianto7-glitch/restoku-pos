# FIX: KDS per-item tracker + penamaan meja (hasil screenshot user)

## Bukti masalah (screenshot user, localhost:8000/kds)
- Item `ORD-0716-06` (Meja A1), API `cook_status=sedang_dimasak` (step 2),
  tapi KDS tracker menyala di **step 1 (DIKONFIRMASI)** dan tombol "SEDANG DIMASAK"
  — klik tidak mengubah state.
- Penamaan meja tidak konsisten: `Meja A1` (kartu atas), `A1` (kartu bawah), `A2` (Selesai Masak).

## ROOT CAUSE BUG 1
KDS/Index.tsx line 269: `const cookSteps = ['dikonfirmasi','sedang dimasak',...]`
pakai SPASI, tapi `it.cook_status` dari API pakai UNDERSCORE (`sedang_dimasak`).
`cur = cookSteps.indexOf(it.cook_status)` = -1 → fallback 0.
Akibat: tracker & tombol selalu di step 1; klik kirim `sedang dimasak` lagi (no-op).

## FIX 1 — pakai integer `cook_step` (sudah dikirim API) sebagai sumber kebenaran
KDS/Index.tsx:
- `const cur = it.cook_step ?? (cookSteps.indexOf(it.cook_status)+1) || 1;`  // integer, reliable
- `const cookSteps = ['dikonfirmasi','sedang_dimasak','selesai_masak','siap_sajikan','selesai'];` // underscore
- `nextLabel` = `cookSteps[cur]` (underscore) → cocok dengan validasi backend
  `strtolower(trim($input))` + `canCookTransitionTo`.
- Tombol `nextLabel.toUpperCase()` jadi: step1→"SEDANG DIMASAK", step2→"SELESAI MASAK",
  step3→"SIAP SAJIKAN", step4→"SELESAI". (step5 tidak ada tombol.)
- Label node tracker tetap TAMPIL spasi (UX) via `OrderItem::COOK_LABELS` / map lokal,
  tapi `cook_status` internal underscore.

## FIX 2 — normalisasi display meja (tanpa ubah DB)
KDS/Index.tsx: `const tableLabel = (o.table||'').replace(/^meja\s+/i, '').toUpperCase();`
→ "Meja A1"→"A1", "A1"→"A1", "A2"→"A2". Header kartu + (jika ada) pakai `tableLabel`.

## Verifikasi flow (instruksi user)
Klik tombol = `updateItemCook(itemId, nextLabel)` → PUT /api/order-items/{id}/cook-status
→ backend `advanceCook()` / validasi transisi → simpan → `fetchOrders()` refresh.
Saat item sampai `siap_sajikan` (step4), Waiter/Bar harus notif — CEK: apakah ada
broadcast/redis ke /waiter-bar. Jika belum, catat sebagai TODO (bukan blocker UI ini).

## TEST
- kds.test.tsx: item `cook_status:'dikonfirmasi', cook_step:1` → tombol "SEDANG DIMASAK";
  klik → putMock called dgn status 'sedang_dimasak'. Item `cook_step:2` → tombol "SELESAI MASAK".
- vitest run → 240+ pass, build exit0.
- curl /api/kds/stream?dest=kds → assert item punya cook_step integer & cook_status underscore.

## COMMIT + PUSH
Commit `fix(kds): tracker per-item advance benar + normalisasi label meja`, push origin main.
