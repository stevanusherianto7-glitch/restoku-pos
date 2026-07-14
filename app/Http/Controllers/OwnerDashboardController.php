<?php

namespace App\Http\Controllers;

use App\Models\OrderArchive;
use App\Services\OrderArchiveService;
use App\Services\OwnerDashboardService;
use App\Services\RedisHealthService;
use App\Services\SalesRollupService;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OwnerDashboardController extends Controller
{
    public function __construct(
        private OwnerDashboardService $dashboardService,
        private TenantContext $ctx,
        private SalesRollupService $rollupService,
        private OrderArchiveService $archiveService,
        private RedisHealthService $redisHealth,
    ) {}

    public function index(Request $request)
    {
        $tenantId = $this->ctx->id();
        $dateRange = $request->input('date_range', 'today');

        return Inertia::render('Dashboard/OwnerDashboard', [
            'metrics' => $this->dashboardService->getAggregateMetrics($tenantId, $dateRange),
            'leaderboard' => $this->dashboardService->getOutletLeaderboard($tenantId, $dateRange),
            'menuPerformance' => $this->dashboardService->getMenuPerformance($tenantId, $dateRange),
            'profitMetrics' => $this->dashboardService->getProfitMetrics($tenantId, $dateRange),
            'peakHours' => $this->dashboardService->getPeakHours($tenantId, $dateRange),
            'peakDays' => $this->dashboardService->getPeakDays($tenantId, $dateRange),
            'topProducts' => $this->dashboardService->getTopProducts($tenantId, $dateRange, 10),
            'transactionTypes' => $this->dashboardService->getTransactionTypes($tenantId, $dateRange),
            'stockAlerts' => $this->dashboardService->getStockAlerts($tenantId),
            'shiftPerformance' => $this->dashboardService->getShiftPerformance($tenantId),
            'filters' => ['date_range' => $dateRange],
        ]);
    }

    public function reports(Request $request)
    {
        $tenantId = $this->ctx->id();
        $dateRange = $request->input('date_range', 'month');

        return Inertia::render('Dashboard/Reports', [
            'financials' => $this->dashboardService->getFinancialReport($tenantId, $dateRange),
            'filters' => ['date_range' => $dateRange],
        ]);
    }

    /**
     * Fase 3 — Ringkasan penjualan dari tabel rollup (O(1) per hari).
     * Bukan scan orders. Query: ?days=30&outlet_id=5
     */
    public function salesSummary(Request $request)
    {
        $tenantId = $this->ctx->id();
        $days = min((int) $request->input('days', 30), 365);
        $outletId = $request->filled('outlet_id') ? (int) $request->input('outlet_id') : null;

        return response()->json(
            $this->rollupService->dashboardSummary($tenantId, $outletId, $days)
        );
    }

    /**
     * Fase 4 — Daftar orders yang sudah diarsip (cold storage, read-only).
     * Query: ?per_page=50&outlet_id=5
     */
    public function archivedOrders(Request $request)
    {
        $tenantId = $this->ctx->id();
        $perPage = min((int) $request->input('per_page', 50), 200);

        $query = OrderArchive::where('tenant_id', $tenantId);
        if ($request->filled('outlet_id')) {
            $query->where('outlet_id', (int) $request->input('outlet_id'));
        }

        return response()->json(
            $query->orderByDesc('created_at')->paginate($perPage)
        );
    }

    /**
     * Fase Audit-Followup — Health Redis (Pilar 5 #3).
     * Return status koneksi + memory/clients pressure untuk monitoring owner.
     */
    public function redisHealth(Request $request)
    {
        return response()->json($this->redisHealth->check());
    }

    // ── [L2] Lapisan 2 — 6 halaman laporan (placeholder + data stub/nyata) ──────

    /**
     * L2A: Laba & Rugi — P&L per periode.
     */
    public function labaRugi(Request $request)
    {
        $tenantId = $this->ctx->id();
        $dateRange = $request->input('date_range', 'month');

        $fin = $this->dashboardService->getFinancialReport($tenantId, $dateRange);

        return Inertia::render('LaporanLabaRugi/Index', [
            'financials' => $fin,
            'filters' => ['date_range' => $dateRange],
        ]);
    }

    /**
     * L2B: Laporan Produk & Kategori — ranking terlaris + qty + revenue.
     */
    public function laporanProduk(Request $request)
    {
        $tenantId = $this->ctx->id();
        $dateRange = $request->input('date_range', 'month');

        $top = $this->dashboardService->getTopProducts($tenantId, $dateRange, 10);

        return Inertia::render('LaporanProduk/Index', [
            'topProducts' => $top,
            'filters' => ['date_range' => $dateRange],
        ]);
    }

    /**
     * L2C: Laporan Shift & Kasir — sesi kasir (STUB, tabel cashier_sessions belum ada).
     */
    public function laporanShift(Request $request)
    {
        $shifts = [
            ['cashier' => 'Budi', 'opened_at' => now()->subHours(6)->format('H:i'), 'closed_at' => null, 'transactions' => 42, 'status' => 'open'],
            ['cashier' => 'Siti', 'opened_at' => now()->subHours(5)->format('H:i'), 'closed_at' => now()->subHour()->format('H:i'), 'transactions' => 38, 'status' => 'closed'],
        ];

        return Inertia::render('LaporanShift/Index', [
            'shifts' => $shifts,
            'is_stub' => true,
        ]);
    }

    /**
     * L2E: Laporan Meja — revenue per meja (STUB, agregasi dari orders belum ada per-meja).
     */
    public function laporanMeja(Request $request)
    {
        $tables = [
            ['table' => 'A1', 'orders' => 24, 'revenue' => 1850000],
            ['table' => 'A2', 'orders' => 19, 'revenue' => 1420000],
            ['table' => 'B1', 'orders' => 12, 'revenue' => 980000],
        ];

        return Inertia::render('LaporanMeja/Index', [
            'tables' => $tables,
            'is_stub' => true,
        ]);
    }

    /**
     * L2E: Transaksi Void — daftar void dengan alasan (STUB).
     */
    public function laporanVoid(Request $request)
    {
        $voids = [
            ['id' => 1, 'item' => 'Es Teh Manis', 'reason' => 'Salah input', 'cashier' => 'Budi', 'amount' => 8000],
            ['id' => 2, 'item' => 'Nasi Goreng', 'reason' => 'Customer batal', 'cashier' => 'Siti', 'amount' => 25000],
        ];

        return Inertia::render('LaporanVoid/Index', [
            'voids' => $voids,
            'is_stub' => true,
        ]);
    }

    /**
     * L2F: Kehadiran — rekap absensi per karyawan (STUB).
     */
    public function kehadiran(Request $request)
    {
        $attendance = [
            ['name' => 'Budi', 'present' => 21, 'late' => 2, 'absent' => 1],
            ['name' => 'Siti', 'present' => 22, 'late' => 0, 'absent' => 0],
            ['name' => 'Anisa', 'present' => 19, 'late' => 3, 'absent' => 3],
        ];

        return Inertia::render('Owner/Kehadiran', [
            'attendance' => $attendance,
            'is_stub' => true,
        ]);
    }

    /**
     * L2F: Jadwal Shift — jadwal mingguan (STUB).
     */
    public function jadwalShift(Request $request)
    {
        $schedule = [
            ['name' => 'Budi', 'mon' => '08-16', 'tue' => '08-16', 'wed' => 'Libur', 'thu' => '08-16', 'fri' => 'Libur', 'sat' => '10-18', 'sun' => 'Libur'],
            ['name' => 'Siti', 'mon' => 'Libur', 'tue' => '16-24', 'wed' => '16-24', 'thu' => 'Libur', 'fri' => '16-24', 'sat' => 'Libur', 'sun' => '16-24'],
        ];

        return Inertia::render('Owner/JadwalShift', [
            'schedule' => $schedule,
            'is_stub' => true,
        ]);
    }
}
