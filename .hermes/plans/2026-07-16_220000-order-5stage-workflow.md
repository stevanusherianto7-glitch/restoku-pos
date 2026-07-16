# Plan: Alur Tahapan Order 5-Stage (KDS / Bar / CustomerView)

## Konteks
User: "saat order tamu masuk ke KDS/waiter bar, kru klik diterima→mulai masak→selesai
masak→siap saji→sudah disajikan, maka status di CustomerView ikut berubah ke
dikonfirmasi→sedang dimasak→selesai masak→siap saji→sudah disajikan."
Gambar referensi (Kedai Elvera) punya 4 node; user mau TAMBAH 1 (selesai masak) → 5.

## State Machine Baru (Order.php)
Tambah const: STATUS_DITERIMA='diterima', STATUS_SELESAI_MASAK='selesai_masak'.
TRANSITIONS:
- antrian_masuk → [diterima, dibatalkan]
- diterima → [sedang_dimasak, dibatalkan]
- sedang_dimasak → [selesai_masak, dibatalkan]
- selesai_masak → [siap_sajikan, dibatalkan]
- siap_sajikan → [siap_bayar, dibatalkan]
- siap_bayar → [selesai, dibatalkan]
- selesai/dibatalkan → []
(pertahankan siap_bayar = SUDAH DISAJIKAN, allServed wajib sebelum ini)

## Task
1. Order.php: +2 const + update TRANSITIONS.
2. KdsController::buildKdsGroups: map status label + group diterima & selesai_masak.
3. KDS/Index.tsx: 5 kolom/step + tombol next per step (Diterima, Mulai Masak,
   Selesai Masak, Siap Saji, Sudah Disajikan=siap_bayar).
4. WaiterBar/Index.tsx: bar orders 5 step identik (minuman).
5. PublicOrderController::getOrderStatus: status→step index (1-5) + label tamu.
6. CustomerView.tsx: steps=['Dikonfirmasi','Sedang Dimasak','Selesai Masak','Siap
   Saji','Sudah Disajikan']; map o.step dari status BE.
7. Tests: update KdsControllerTest (status labels), CustomerView test, jalankan
   OrderServedPartsTest/ServePartTest (pastikan allServed masih valid dengan
   transisi baru).

## Verifikasi
- php artisan test (subset KDS/ServePart/FeatureRegistry) GREEN
- npx vitest run GREEN
- build hijau
- (opsional) Playwright CustomerView 5-node visual
