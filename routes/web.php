<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\OAuthController;
use App\Http\Controllers\CashierController;
use App\Http\Controllers\CashierGeoVerifyController;
use App\Http\Controllers\GeminiAiController;
use App\Http\Controllers\GoogleReviewController;
use App\Http\Controllers\GuestVerifyController;
use App\Http\Controllers\KdsController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\OutletSettingsController;
use App\Http\Controllers\OutletTableController;
use App\Http\Controllers\OwnerDashboardController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\PrintController;
use App\Http\Controllers\PublicOrderController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public routes — tidak butuh login
|--------------------------------------------------------------------------
*/
Route::get('/', fn () => Inertia::render('LandingPage/Index'));

// ── Subscription checkout (publik, tanpa login) ─────────────────────────────
// Simulasi trial 14 hari (PRD non-goal: no payment gateway bawaan).
use App\Http\Controllers\SubscriptionController;

Route::get('/subscribe/{plan}', [SubscriptionController::class, 'show'])
    ->name('subscribe.show');
Route::post('/subscribe/{plan}', [SubscriptionController::class, 'store'])
    ->name('subscribe.store')
    ->middleware('throttle:10,1');

Route::get('/login', fn () => Inertia::render('Auth/StaffLogin'))->name('login');
Route::get('/owner/login', fn () => Inertia::render('Auth/OwnerLogin'))->name('owner.login');
Route::post('/login', [AuthenticatedSessionController::class, 'storeStaff'])->middleware('throttle:10,1');
Route::post('/owner/login', [AuthenticatedSessionController::class, 'storeOwner'])->middleware('throttle:10,1');

// ── OAuth "Masuk dengan Google" (khusus owner) ─────────────────────────
// Redirect ke Google lalu callback otomatis login/register owner.
Route::get('/oauth/google', [OAuthController::class, 'redirect'])->name('oauth.google');
Route::get('/oauth/google/callback', [OAuthController::class, 'callback'])->middleware('throttle:10,1')->name('oauth.google.callback');

// Guest-facing digital menu & order (QR code meja)
Route::get('/order', fn () => Inertia::render('BukuMenuDigital/CustomerView'));
// Fase 1: URL buku menu tamu pakai slug outlet dinamis (bukan hardcode 'senopati')
Route::get('/m/{slug}', fn (string $slug) => Inertia::render('BukuMenuDigital/CustomerView', ['slug' => $slug]));
// API buku menu publik (read-only, by slug outlet) — untuk CustomerView
Route::get('/api/menu/{slug}', [PublicOrderController::class, 'getPublicMenu']);

// Antrean pembayaran kasir: order sudah disajikan (siap_bayar).
// HARUS didefinisikan SEBELUM '/api/orders/{id}' (getOrderStatus) agar route static
// menang — kalau didefinisikan setelahnya, Laravel match '{id}=payment-queue'
// ke getOrderStatus (butuh outlet_id) -> 422, antrean kasir rusak.
Route::get('/api/orders/payment-queue', [KdsController::class, 'paymentQueue'])
    ->middleware(['auth', 'tenant']);

// Guest order endpoints (BUG-006 FIX: tenant diidentifikasi via outlet_id, bukan req body)
// C2 (Security Audit): throttle wajib — endpoint publik CSRF-exempt rentan spam/DoS.
Route::post('/api/orders', [PublicOrderController::class, 'submitOrder'])->middleware('throttle:30,1');
Route::get('/api/orders/{id}', [PublicOrderController::class, 'getOrderStatus']);
Route::get('/api/reservations', [PublicOrderController::class, 'getReservations']);
Route::post('/api/reservations', [PublicOrderController::class, 'submitReservation'])->middleware('throttle:30,1');
// Jam operasional outlet — publik untuk CustomerView (tidak butuh auth)
Route::get('/api/outlet-operating-hours', [PublicOrderController::class, 'getOutletOperatingHours']);

// Verifikasi kehadiran tamu (anti-fraud): GPS + PIN meja + PIN harian -> signed token
Route::post('/api/guest/verify', [GuestVerifyController::class, 'verify'])->middleware('throttle:30,1');
// Publik: PIN harian restoran untuk tamu (verifikasi kehadiran di kedai, by slug)
Route::get('/api/guest/daily-pin', [GuestVerifyController::class, 'dailyPin']);
Route::get('/api/guest/table-session', [GuestVerifyController::class, 'tableSession']);

/*
|--------------------------------------------------------------------------
| Protected routes — butuh login DAN tenant context
|--------------------------------------------------------------------------
| Middleware stack untuk semua route di sini:
|   'auth'   → tolak yang belum login, redirect ke /login
|   'tenant' → bootstrap TenantContext + bind 'tenant.id' ke container
|              (EnsureTenantContext middleware)
|
| Middleware 'plan:feature_key' → backend enforcement feature gate
|   Route yang tidak punya 'plan:...' = tersedia untuk SEMUA plan.
*/
Route::middleware(['auth', 'tenant'])->group(function () {

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // ── Dashboard ───────────────────────────────────────────────────────────
    // Route /dashboard role-aware: owner -> konsolidasi multi-outlet,
    // manager -> laporan penjualan, kasir -> POS, waiter -> Waiter & Bar,
    // kitchen -> KDS. Mencegah staff lihat Owner Dashboard (100 cabang).
    Route::get('/dashboard', function () {
        $role = optional(auth()->user())->role;

        return match ($role) {
            'owner' => Inertia::render('Dashboard/Index'),
            'manager' => redirect('/laporan-penjualan'),
            'kasir' => redirect('/pos'),
            'cashier' => redirect('/pos'), // seeder DB memakai 'cashier'
            'waiter' => redirect('/waiter-bar'),
            'kitchen' => redirect('/kds'),
            default => redirect('/login'),
        };
    })->name('dashboard');
    Route::get('/laporan-keuangan', fn () => Inertia::render('Dashboard/Reports'))->name('reports');
    Route::get('/owner/dashboard', [OwnerDashboardController::class, 'index'])->name('owner.dashboard');
    // Fase 3 — API dashboard pakai rollup (bukan scan orders). Query param ?days=30&outlet_id=
    Route::get('/api/owner/sales-summary', [OwnerDashboardController::class, 'salesSummary'])->name('owner.sales-summary');
    // Fase 4 — Baca orders yang sudah diarsip (cold storage, read-only compliance)
    Route::get('/api/owner/archived-orders', [OwnerDashboardController::class, 'archivedOrders'])->name('owner.archived-orders');
    // Fase Audit-Followup — Health Redis untuk owner/monitoring
    Route::get('/api/owner/redis-health', [OwnerDashboardController::class, 'redisHealth'])->name('owner.redis-health');
    Route::get('/owner/settings', fn () => Inertia::render('Owner/Settings'))->name('owner.settings');
    Route::get('/owner/employees', fn () => Inertia::render('Owner/Employees'))->name('owner.employees');
    Route::get('/owner/inventory/alerts', fn () => Inertia::render('Owner/InventoryAlerts'))->name('owner.inventory.alerts');
    Route::get('/admin/employees', fn () => Inertia::render('Admin/Employees'))->name('admin.employees');

    // ── [L2] Lapisan 2 — 6 halaman laporan sidebar baru ──────────────────────
    // Laporan grup: Laba & Rugi, Produk, Shift, Meja, Void
    Route::get('/laporan/laba-rugi', [OwnerDashboardController::class, 'labaRugi'])->name('laporan.laba-rugi');
    Route::get('/laporan/produk', [OwnerDashboardController::class, 'laporanProduk'])->name('laporan.produk');
    Route::get('/laporan/shift', [OwnerDashboardController::class, 'laporanShift'])->name('laporan.shift');
    Route::get('/laporan/meja', [OwnerDashboardController::class, 'laporanMeja'])->name('laporan.meja');
    Route::get('/laporan/void', [OwnerDashboardController::class, 'laporanVoid'])->name('laporan.void');
    // Owner View grup: Kehadiran, Jadwal Shift
    Route::get('/owner/kehadiran', [OwnerDashboardController::class, 'kehadiran'])->name('owner.kehadiran');
    Route::get('/owner/jadwal-shift', [OwnerDashboardController::class, 'jadwalShift'])->name('owner.jadwal-shift');
    // Keuangan grup: Biaya Operasional (controller + migration expenses sendiri)
    Route::get('/biaya-operasional', [App\Http\Controllers\BiayaOperasionalController::class, 'index'])->name('biaya-operasional.index');
    Route::post('/biaya-operasional', [App\Http\Controllers\BiayaOperasionalController::class, 'store'])->name('biaya-operasional.store');

    // ── Meja outlet (PIN untuk display owner/waiter + CRUD nyata) ──────────
    Route::get('/api/outlet-tables/{outlet}', [OutletTableController::class, 'index'])->middleware('throttle:60,1');
    Route::post('/api/outlet-tables', [OutletTableController::class, 'store'])->middleware('throttle:30,1');
    Route::post('/api/outlet-tables/bulk', [OutletTableController::class, 'bulkStore'])->middleware('throttle:30,1');
    Route::put('/api/outlet-tables/{id}', [OutletTableController::class, 'update'])->middleware('throttle:30,1');
    Route::delete('/api/outlet-tables/{id}', [OutletTableController::class, 'destroy'])->middleware('throttle:30,1');

    // ── POS & Operasional (semua plan) ──────────────────────────────────────
    Route::get('/pos', [PosController::class, 'menuView']);
    Route::get('/katalog-menu', [MenuController::class, 'index']);
    Route::get('/manajemen-meja', fn () => Inertia::render('ManajemenMeja/Index'));
    Route::get('/buku-menu-digital', fn () => Inertia::render('BukuMenuDigital/Index'));
    Route::get('/monitor-pesanan', fn () => Inertia::render('MonitorPesanan/Index'));
    Route::get('/waiter-bar', fn () => Inertia::render('WaiterBar/Index'));
    Route::get('/monitor-reservasi', fn () => Inertia::render('MonitorReservasi/Index'));
    Route::get('/diskon-pajak', fn () => Inertia::render('DiskonPajak/Index'));
    // Q11: daftar orders KDS (filter outlet_id) — FE panggil tiap N detik.
    // (Pengganti SSE/WebSocket: tanpa upgrade infra, scale-safe via outlet_id.)
    Route::get('/api/kds/stream', [KdsController::class, 'stream']);
    // Layar Bar (minuman): order destination=bar sedang diproses.
    Route::get('/api/bar/orders', [KdsController::class, 'barOrders']);

    Route::get('/qrcode-meja', fn () => Inertia::render('QRCodeMeja/Index'));

    // Q87: daftar outlet terpaginasikan untuk cetak QR skala besar (300×50=15000).
    // FE render per-batch (mis. 50/print-page) alih-alih 15000 node sekaligus.
    Route::get('/api/outlets/paginated', function (\Illuminate\Http\Request $request) {
        $perPage = min((int) $request->input('per_page', 50), 200);
        return \App\Models\Outlet::select('id', 'name', 'slug')
            ->orderBy('id')
            ->paginate($perPage, ['*'], 'page', (int) $request->input('page', 1));
    });
    // Q97: persist tema layar per-outlet ke DB (bukan hanya localStorage).
    Route::put('/api/outlet-settings/screen-mode', [OutletSettingsController::class, 'updateScreenMode']);

    // Q87: trigger export QR per-batch (queue) untuk skala 15000 QR.
    Route::post('/api/qr-codes/export', function (\Illuminate\Http\Request $request) {
        $page = (int) $request->input('page', 1);
        $perPage = min((int) $request->input('per_page', 50), 200);
        \App\Jobs\ExportQrPdf::dispatch(auth()->id() ?? 1, $page, $perPage);
        return response()->json(['success' => true, 'queued' => true]);
    });

    Route::get('/printer-config', fn () => Inertia::render('PrinterConfig/Index'));
    Route::get('/print-job-monitor', fn () => Inertia::render('PrintJobMonitor/Index'));
    Route::get('/tts-settings', fn () => Inertia::render('TTSSettings/Index'));

    // ── Fitur Pro ───────────────────────────────────────────────────────────
    Route::get('/laporan-penjualan', fn () => Inertia::render('LaporanPenjualan/Index'));
    Route::get('/perbandingan-outlet', fn () => Inertia::render('PerbandinganOutlet/Index'))
        ->middleware('plan:perbandingan_outlet');
    Route::get('/arus-kas', fn () => Inertia::render('ArusKas/Index'))
        ->middleware('plan:arus_kas');
    Route::get('/staf-shift', fn () => Inertia::render('StafShift/Index'))
        ->middleware('plan:staf_shift');
    Route::get('/cashier-session', fn () => Inertia::render('CashierSession/Index'))
        ->middleware('plan:cashier_session');
    Route::get('/refund-void', fn () => Inertia::render('RefundVoidManager/Index'))
        ->middleware('plan:refund_void');
    Route::get('/inventory', fn () => Inertia::render('Inventory/Index'))
        ->middleware('plan:inventory');
    Route::get('/pembelian-vendor', fn () => Inertia::render('PembelianVendor/Index'))
        ->middleware('plan:pembelian_vendor');
    Route::get('/stok-opname', fn () => Inertia::render('StokOpname/Index'))
        ->middleware('plan:stok_opname');
    Route::get('/dashboard-inventory', fn () => Inertia::render('DashboardInventory/Index'))
        ->middleware('plan:dashboard_inventory');
    Route::get('/whatsapp-integration', fn () => Inertia::render('WhatsAppIntegration/Index'))
        ->middleware('plan:wa_notif');

    // ── Fitur Enterprise ────────────────────────────────────────────────────
    Route::get('/kds', fn () => Inertia::render('KDS/Index'))
        ->middleware('plan:kds');

    // ── Pengaturan Outlet (DB-backed) ───────────────────────────────────────
    Route::get('/pengaturan-outlet', [OutletSettingsController::class, 'index']);

    Route::prefix('api/outlet-settings')->middleware('throttle:60,1')->group(function () {
        Route::put('/all', [OutletSettingsController::class, 'updateAll']);
        Route::put('/profil', [OutletSettingsController::class, 'updateProfil']);
        Route::put('/lokasi', [OutletSettingsController::class, 'updateLokasi']);
        Route::put('/pajak', [OutletSettingsController::class, 'updatePajak']);
        Route::put('/jam', [OutletSettingsController::class, 'updateJam']);
        Route::get('/', [OutletSettingsController::class, 'listKaryawan'])->name('karyawan.index');
        Route::post('/karyawan', [OutletSettingsController::class, 'createKaryawan']);
        Route::put('/karyawan/{id}', [OutletSettingsController::class, 'updateKaryawan']);
        Route::delete('/karyawan/{id}', [OutletSettingsController::class, 'deleteKaryawan']);
        Route::post('/bulk-outlets', [OutletSettingsController::class, 'bulkCreateOutlets'])->middleware('throttle:30,1');
    });

    // ── KDS API ─────────────────────────────────────────────────────────────
    Route::get('/api/orders', [KdsController::class, 'getKdsOrders']);
    Route::put('/api/orders/{id}/status', [KdsController::class, 'updateOrderStatus']);
    // FNB-001: waiter tandai 1 bagian (food/drink) sudah disajikan.
    Route::put('/api/orders/{id}/serve-part', [KdsController::class, 'servePart']);

    // ── Cashier API ────────────────────────────────────────────────────────
    Route::get('/api/cashier-queue', [CashierController::class, 'getCashierQueue']);
    Route::delete('/api/cashier-queue/{id}', [CashierController::class, 'clearCashierQueueItem']);

    // ── Print & Receipt API ────────────────────────────────────────────────
    Route::get('/api/print-jobs', [PrintController::class, 'getPrintJobs']);
    Route::post('/api/print-receipt', [PrintController::class, 'printReceipt']);
    Route::get('/api/receipt-config', [PrintController::class, 'getReceiptConfig']);
    Route::post('/api/receipt-config', [PrintController::class, 'updateReceiptConfig']);

    // ── Reservation Status Update ──────────────────────────────────────────
    Route::put('/api/reservations/{id}/status', [PublicOrderController::class, 'updateReservationStatus']);

    // ── AI Chat ────────────────────────────────────────────────────────────
    Route::post('/api/ai/chat', [GeminiAiController::class, 'chat'])->middleware('throttle:20,1');

    // ── Menu Management (Fase 1) ──────────────────────────────────────────────
    Route::get('/api/pos/menu', [PosController::class, 'menu']);
    Route::post('/api/menu', [MenuController::class, 'store'])->middleware('throttle:30,1');
    Route::put('/api/menu/{id}', [MenuController::class, 'update'])->middleware('throttle:30,1');
    Route::delete('/api/menu/{id}', [MenuController::class, 'destroy'])->middleware('throttle:30,1');

    Route::get('/owner/google-reviews', [GoogleReviewController::class, 'viewPanel'])
        ->name('owner.reviews');
    Route::get('/api/google-reviews', [GoogleReviewController::class, 'index']);
    Route::post('/api/google-reviews/{id}/reply', [GoogleReviewController::class, 'reply']);
    Route::post('/api/google-reviews/{id}/generate-ai-reply', [GoogleReviewController::class, 'generateAiReply']);
    Route::post('/api/google-reviews/settings', [GoogleReviewController::class, 'saveSettings']);

    // ── Kasir: Verifikasi Geolokasi (PIN harian + GPS) ───────────────────────
    // SECURITY FIX: Pindahkan ke dalam auth+tenant group agar tidak bisa diakses anonim.
    Route::get('/owner/outlet/daily-pin', [CashierGeoVerifyController::class, 'dailyPin']);
    Route::post('/api/cashier/verify-location', [CashierGeoVerifyController::class, 'verify'])
        ->middleware('throttle:10,1');
});
