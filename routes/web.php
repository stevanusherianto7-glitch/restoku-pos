<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\GeminiAiController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OutletSettingsController;
use App\Http\Controllers\OwnerDashboardController;
use App\Http\Controllers\GoogleReviewController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public routes — tidak butuh login
|--------------------------------------------------------------------------
*/
Route::get('/', fn () => Inertia::render('LandingPage/Index'));

Route::get('/login',       fn () => Inertia::render('Auth/StaffLogin'))->name('login');
Route::get('/owner/login', fn () => Inertia::render('Auth/OwnerLogin'))->name('owner.login');
Route::post('/login',       [AuthenticatedSessionController::class, 'storeStaff']);
Route::post('/owner/login', [AuthenticatedSessionController::class, 'storeOwner']);

// Guest-facing digital menu & order (QR code meja)
Route::get('/order',         fn () => Inertia::render('BukuMenuDigital/CustomerView'));
Route::get('/m/senopati',    fn () => Inertia::render('BukuMenuDigital/CustomerView'));

// Guest order endpoints (BUG-006 FIX: tenant diidentifikasi via outlet_id, bukan req body)
Route::post('/api/orders',        [OrderController::class, 'submitOrder']);
Route::get('/api/orders/{id}',    [OrderController::class, 'getOrderStatus']);
Route::get('/api/reservations',   [OrderController::class, 'getReservations']);
Route::post('/api/reservations',  [OrderController::class, 'submitReservation']);
// Jam operasional outlet — publik untuk CustomerView (tidak butuh auth)
Route::get('/api/outlet-operating-hours', [OrderController::class, 'getOutletOperatingHours']);


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
    Route::get('/dashboard',          fn () => Inertia::render('Dashboard/Index'))->name('dashboard');
    Route::get('/laporan-keuangan',   fn () => Inertia::render('Dashboard/Reports'))->name('reports');
    Route::get('/owner/dashboard',    [OwnerDashboardController::class, 'index'])->name('owner.dashboard');
    Route::get('/owner/settings',     fn () => Inertia::render('Owner/Settings'))->name('owner.settings');
    Route::get('/owner/employees',    fn () => Inertia::render('Owner/Employees'))->name('owner.employees');
    Route::get('/owner/inventory/alerts', fn () => Inertia::render('Owner/InventoryAlerts'))->name('owner.inventory.alerts');
    Route::get('/admin/employees',    fn () => Inertia::render('Admin/Employees'))->name('admin.employees');

    // ── POS & Operasional (semua plan) ──────────────────────────────────────
    Route::get('/pos',               fn () => Inertia::render('POS/Index'));
    Route::get('/produk',            fn () => Inertia::render('ProdukMenu/Index'));
    Route::get('/katalog-menu',      fn () => Inertia::render('KatalogMenu/Index'));
    Route::get('/manajemen-meja',    fn () => Inertia::render('ManajemenMeja/Index'));
    Route::get('/buku-menu-digital', fn () => Inertia::render('BukuMenuDigital/Index'));
    Route::get('/monitor-pesanan',   fn () => Inertia::render('MonitorPesanan/Index'));
    Route::get('/waiter-bar',        fn () => Inertia::render('WaiterBar/Index'));
    Route::get('/monitor-reservasi', fn () => Inertia::render('MonitorReservasi/Index'));
    Route::get('/diskon-pajak',      fn () => Inertia::render('DiskonPajak/Index'));
    Route::get('/qrcode-meja',       fn () => Inertia::render('QRCodeMeja/Index'));
    Route::get('/printer-config',    fn () => Inertia::render('PrinterConfig/Index'));
    Route::get('/print-job-monitor', fn () => Inertia::render('PrintJobMonitor/Index'));
    Route::get('/tts-settings',      fn () => Inertia::render('TTSSettings/Index'));

    // ── Fitur Pro ───────────────────────────────────────────────────────────
    Route::get('/laporan-penjualan',   fn () => Inertia::render('LaporanPenjualan/Index'));
    Route::get('/perbandingan-outlet', fn () => Inertia::render('PerbandinganOutlet/Index'))
        ->middleware('plan:perbandingan_outlet');
    Route::get('/arus-kas',            fn () => Inertia::render('ArusKas/Index'))
        ->middleware('plan:arus_kas');
    Route::get('/staf-shift',          fn () => Inertia::render('StafShift/Index'))
        ->middleware('plan:staf_shift');
    Route::get('/cashier-session',     fn () => Inertia::render('CashierSession/Index'))
        ->middleware('plan:cashier_session');
    Route::get('/refund-void',         fn () => Inertia::render('RefundVoidManager/Index'))
        ->middleware('plan:refund_void');
    Route::get('/inventory',           fn () => Inertia::render('Inventory/Index'))
        ->middleware('plan:inventory');
    Route::get('/pembelian-vendor',    fn () => Inertia::render('PembelianVendor/Index'))
        ->middleware('plan:pembelian_vendor');
    Route::get('/stok-opname',         fn () => Inertia::render('StokOpname/Index'))
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

    Route::prefix('api/outlet-settings')->group(function () {
        Route::put('/all',    [OutletSettingsController::class, 'updateAll']);
        Route::put('/profil', [OutletSettingsController::class, 'updateProfil']);
        Route::put('/lokasi', [OutletSettingsController::class, 'updateLokasi']);
        Route::put('/pajak',  [OutletSettingsController::class, 'updatePajak']);
        Route::put('/jam',    [OutletSettingsController::class, 'updateJam']);
        Route::get('/',                 [OutletSettingsController::class, 'listKaryawan'])->name('karyawan.index');
        Route::post('/karyawan',        [OutletSettingsController::class, 'createKaryawan']);
        Route::put('/karyawan/{id}',    [OutletSettingsController::class, 'updateKaryawan']);
        Route::delete('/karyawan/{id}', [OutletSettingsController::class, 'deleteKaryawan']);
    });

    // ── Order / KDS API ─────────────────────────────────────────────────────
    Route::get('/api/orders',                        [OrderController::class, 'getKdsOrders']);
    Route::put('/api/orders/{id}/status',            [OrderController::class, 'updateOrderStatus']);
    Route::get('/api/print-jobs',                    [OrderController::class, 'getPrintJobs']);
    Route::get('/api/cashier-queue',                 [OrderController::class, 'getCashierQueue']);
    Route::delete('/api/cashier-queue/{id}',         [OrderController::class, 'clearCashierQueueItem']);
    Route::post('/api/print-receipt',                [OrderController::class, 'printReceipt']);
    Route::get('/api/receipt-config',                [OrderController::class, 'getReceiptConfig']);
    Route::post('/api/receipt-config',               [OrderController::class, 'updateReceiptConfig']);
    Route::put('/api/reservations/{id}/status',      [OrderController::class, 'updateReservationStatus']);
    Route::post('/api/ai/chat',                      [GeminiAiController::class, 'chat']);

    // ── Google Review / Complaint Management ────────────────────────────────
    Route::get('/owner/google-reviews',              [GoogleReviewController::class, 'viewPanel'])
        ->name('owner.reviews');
    Route::get('/api/google-reviews',                [GoogleReviewController::class, 'index']);
    Route::post('/api/google-reviews/sync',          [GoogleReviewController::class, 'syncReviews']);
    Route::post('/api/google-reviews/{id}/reply',    [GoogleReviewController::class, 'reply']);
    Route::post('/api/google-reviews/{id}/generate-ai-reply', [GoogleReviewController::class, 'generateAiReply']);
    Route::post('/api/google-reviews/settings',      [GoogleReviewController::class, 'saveSettings']);
});
