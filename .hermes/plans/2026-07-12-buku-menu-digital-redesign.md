# Plan: Redesign Buku Menu Digital (format screenshot) — FE-first (Opsi B)

**Tanggal:** 2026-07-12
**Sumber:** 10 screenshot (1 owner QR-panel + 9 customer: Landing, Welcome/Meja, Cara Memesan, Menu+Offline, Galeri, Reservasi, Verifikasi Dine-In, Status Pesanan)
**Mockup terverifikasi:** `design-reference/buku-menu-digital-redesign-mockup.html` (browser_vision OK)

## Keputusan Arsitek (delegasi penuh user)
- **Opsi B (FE-first, BE stub):** Port 10 layar ke React sekarang. Verifikasi Dine-In & Status Pesanan pakai STUB (dev PIN `0000`, mock orders). BE nyata (daily_pin + GPS radius + order-state-machine + reservasi-table) = plan terpisah (Batch 2).
- **JANGAN pecah `CustomerView.tsx`** (1414 baris, 4 test bergantung). Tambah 5 layar baru sebagai section kondisional di file sama + retheme default ke warm brand.
- **Anti-AI-look SUDAH terpenuhi**: ikon inline-SVG (`Components/icons`), 0 `lucide-react`. Tidak bikin ikon-modul baru.
- Palet brand: cabe `#FF5B35` / emas `#F59E0B` / cream `#FAF5EE`. Bukan emerald/slate.

## File Target
1. `resources/js/Pages/BukuMenuDigital/CustomerView.tsx` — TAMBAH + RETHEME (edit in-place)
2. `resources/js/Pages/BukuMenuDigital/Index.tsx` — RETHEME owner panel ke warm (konsisten)
3. `resources/js/__tests__/customerView.test.tsx` — TAMBAH test 5 layar baru (stub)
4. (tidak diubah) `lib/menuUrl.ts`, `Components/icons.tsx`, `routes/web.php`, `OrderController.php` (API sdh ada)

## Perubahan CustomerView.tsx

### A. Retheme default → warm brand
- Ganti tema `premium` (default, emerald) → palet cabe/emas/cream. Atau tambah tema `elvera` sbg default untuk `screenMode==='default' || tenantLayout==='default'`.
- Mapping warna: `emerald-*`→`[#FF5B35]` / `text-emerald-400`→`text-[#FF5B35]`; `amber-*` tetap (sudah warm); bg gelap `from-[#031510]`→`from-[#2A1E16]` (cokelat), `text-slate-*` tetap.
- Header logo: gradient emerald→cabe.
- CTA buttons: `bg-emerald-500`→`bg-[#FF5B35]`.

### B. State flow baru (top-level, sebelum render)
Tambah:
```
const [appStage, setAppStage] = useState<'landing'|'welcome'|'howto'|'app'>('landing');
const [dineVerified, setDineVerified] = useState(false);
const [pin, setPin] = useState('');
const [gpsError, setGpsError] = useState<string|null>('Anda berada di luar area restoran (120635m).'); // stub
const [orders, setOrders] = useState<OrderStub[]>([...2 stub...]); // Status Pesanan
```
- `useEffect` awal: `setAppStage('landing')`.
- Tombol Landing "Masuk ke Menu" → `setAppStage('welcome')`.
- Welcome "Lanjut" → `setAppStage('howto')`.
- HowTo "Mulai Pesan" → `setAppStage('app')` (render tab menu spt skrg).
- Tab baru "Status" di header (selain menu/reservasi/galeri/cart) → `setActiveTab('status')` render Status Pesanan.

### C. 5 layar baru (section kondisional, SEBELUM block `activeTab==='menu'` yang ada)
Render berurutan:
1. `{appStage==='landing' && <LandingModal .../>}`
2. `{appStage==='welcome' && <WelcomeScreen .../>}`
3. `{appStage==='howto' && <HowToScreen .../>}`
4. Verifikasi Dine-In: render sbg modal overlay KETIKA `orderType==='dine_in' && !dineVerified` (setelah masuk app, sebelum tab menu). Tombol "Verifikasi PIN" cek `pin==='0000'` (stub dev) → `setDineVerified(true)`. "Deteksi Ulang Lokasi" → stub clear/reset gpsError.
5. Status Pesanan: `{activeTab==='status' && <StatusPesanan orders={orders} .../>}`.

### D. Stub data
```
type OrderStub = { id:string; status:'offline'|'ready'; label:string; duration:string; items:string; total:number; step:number };
const STUB_ORDERS: OrderStub[] = [
  { id:'OFFLINE-MRHAW5LW-E3X8', status:'offline', label:'Menunggu Jaringan (Offline)', duration:'0 MNT', items:'Soto Ayam Semarang x1', total:30800, step:1 },
  { id:'ORD-MQZOAZPI-EBDG', status:'ready', label:'Siap Diantar', duration:'17764 MNT', items:'Soto Ayam Semarang x1', total:28000, step:3 },
];
```
Progress 4-step: Konfirmasi(1)/Dimasak(2)/Siap(3)/Disajikan(4). Warna: step<=current → hijau(`#0f8a4d`), current → cabe, pending → abu.

## Perubahan Index.tsx (owner panel)
Restyle agar konsisten brand (bukan breaking):
- Header buttons `Cetak Semua` / `Generator QR` → `bg-[#FF5B35]`.
- Grid card meja → white card + QR + 2 btn (Unduh/Buka) — sdh ada, ganti aksen emerald→cabe.
- Info box "Cara kerja" → bg cream/lavender, text.
- TIDAK ubah logika (tableInput, buildMenuUrl, print).

## Test (customerView.test.tsx) — tambah, jangan hapus 4 lama
- `renders landing modal first` → expect "Cita rasa" / "Masuk ke Menu".
- `landing → welcome → howto → app flow` → klik beruntun, expect "Meja A3"/"Cara Memesan"/menu.
- `dine-in verification stub` → pilih Dine In, modal muncul ("VERIFIKASI DINE-IN"), isi PIN 0000, klik, expect verified (modal hilang).
- `status pesanan shows stub orders` → klik tab Status, expect 2 order ID.
- `reservasi submit (existing API)` → tetap lulus (jangan rusak).

## Verifikasi (REAL, sesudah edit)
1. `npx vitest run customerView.test.tsx` → 9 test GREEN (4 lama + 5 baru).
2. `npx vitest run` → full suite tetap 210+ (no regression).
3. `npm run build` → exit 0.
4. `browser_vision` pada `php artisan serve` (atau vite preview) → screenshot 10 layar, cek palet cabe/emas/cream + 5 layar baru muncul & proporsional.
5. Decode QR (cv2) utk pastikan `restoku.app/m/{slug}?t={meja}` → 200 (sesuai konvensi user: RENDERED/DECODED proof).

## Di LUAR scope (Batch 2 — BE nyata, plan terpisah)
- `outlet_settings.daily_pin` (4-digit harian, rotate).
- GPS radius validation (`outlets.lat/lng` + toleransi meter, haversine).
- Order state-machine (`orders.status` konfirmasi→dimasak→siap→disajikan) + polling publik nyata.
- Reservasi table + POST `/api/reservations` persist (skrg fallback local).
- Foto menu Cloudinary (Phase 1 belum; grid pakai gradient placeholder).

## Catatan
- User: "kamu adalah arsiteknya" → eksekusi penuh tanpa klarifikasi lanjut.
- Mockup placeholder nama "Kedai Nusantara" → otomatis `outletName` dari API saat wiring (sudah ada `setOutletName`).
- TIDAK commit/push tanpa instruksi user (consisten sesi).
