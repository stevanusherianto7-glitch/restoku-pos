<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\CashierSession;
use App\Models\Order;
use App\Models\OrderArchive;
use App\Models\ShiftSchedule;
use App\Services\OrderArchiveService;
use App\Services\OwnerDashboardService;
use App\Services\RedisHealthService;
use App\Services\SalesRollupService;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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

        // S-10: cache agregasi dashboard 60s per tenant+range (hindari ~20 query/load).
        $cacheKey = "dashboard:{$tenantId}:{$dateRange}";
        $data = Cache::remember($cacheKey, 60, function () use ($tenantId, $dateRange) {
            return [
                'metrics' => $this->dashboardService->getAggregateMetrics($tenantId, $dateRange),
                'leaderboard' => $this->dashboardService->getOutletLeaderboard($tenantId, $dateRange),
                'menuPerformance' => $this->dashboardService->getMenuPerformance($tenantId, $dateRange),
                'profitMetrics' => $this->dashboardService->getProfitMetrics($tenantId, $dateRange),
                'peakHours' => $this->dashboardService->getPeakHours($tenantId, $dateRange),
                'peakDays' => $this->dashboardService->getPeakDays($tenantId, $dateRange),
                'topProducts' => $this->dashboardService->getTopProducts($tenantId, $dateRange, 10),
                'transactionTypes' => $this->dashboardService->getTransactionTypes($tenantId, $dateRange),
            ];
        });

        return Inertia::render('Dashboard/OwnerDashboard', array_merge($data, [
            'stockAlerts' => $this->dashboardService->getStockAlerts($tenantId),
            'shiftPerformance' => $this->dashboardService->getShiftPerformance($tenantId),
            'filters' => ['date_range' => $dateRange],
        ]));
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
     * L3: Laporan Shift & Kasir — sesi kasir dari cashier_sessions (data nyata).
     */
    public function laporanShift(Request $request)
    {
        $tenantId = $this->ctx->id();

        $shifts = CashierSession::where('tenant_id', $tenantId)
            ->with('user')
            ->orderByDesc('opened_at')
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'cashier' => $s->user?->name ?? 'Kasir #'.$s->user_id,
                    'opened_at' => $s->opened_at?->format('H:i'),
                    'closed_at' => $s->closed_at?->format('H:i'),
                    'transactions' => $s->transaction_count,
                    'total_sales' => (float) $s->total_sales,
                    'status' => $s->closed_at ? 'closed' : 'open',
                ];
            })
            ->all();

        return Inertia::render('LaporanShift/Index', [
            'shifts' => $shifts,
            'is_stub' => false,
        ]);
    }

    /**
     * L3: Laporan Meja — revenue per meja dari orders (data nyata, aggregate table_number).
     */
    public function laporanMeja(Request $request)
    {
        $tenantId = $this->ctx->id();

        $tables = Order::byTenant($tenantId)
            ->where('status', Order::STATUS_SELESAI)
            ->whereNotNull('table_number')
            ->selectRaw('table_number, COUNT(*) as orders, SUM(total) as revenue')
            ->groupBy('table_number')
            ->orderByDesc('revenue')
            ->get()
            ->map(function ($t) {
                return [
                    'table' => $t->table_number,
                    'orders' => (int) $t->orders,
                    'revenue' => (float) $t->revenue,
                ];
            })
            ->all();

        return Inertia::render('LaporanMeja/Index', [
            'tables' => $tables,
            'is_stub' => false,
        ]);
    }

    /**
     * L3: Transaksi Void — orders dengan payment_status='void' + item + alasan (data nyata).
     */
    public function laporanVoid(Request $request)
    {
        $tenantId = $this->ctx->id();

        $voids = Order::byTenant($tenantId)
            ->where('payment_status', 'void')
            ->with(['items' => function ($q) {
                $q->select('id', 'order_id', 'item_name', 'quantity', 'subtotal');
            }, 'createdBy'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($o) {
                $first = $o->items->first();

                return [
                    'id' => $o->id,
                    'item' => $first?->item_name ?? '—',
                    'qty' => $first?->quantity ?? 0,
                    'reason' => $o->void_reason ?? 'Tanpa alasan',
                    'cashier' => $o->createdBy?->name ?? 'Kasir',
                    'amount' => (float) ($first?->subtotal ?? $o->total),
                    'voided_at' => $o->created_at?->format('Y-m-d H:i'),
                ];
            })
            ->all();

        return Inertia::render('LaporanVoid/Index', [
            'voids' => $voids,
            'is_stub' => false,
        ]);
    }

    /**
     * L3: Kehadiran — rekap absensi per karyawan dari attendances (data nyata).
     */
    public function kehadiran(Request $request)
    {
        $tenantId = $this->ctx->id();

        $attendance = Attendance::where('tenant_id', $tenantId)
            ->with('user')
            ->get()
            ->groupBy('user_id')
            ->map(function ($rows) {
                $user = $rows->first()->user;

                return [
                    'name' => $user?->name ?? 'Karyawan #'.$rows->first()->user_id,
                    'present' => $rows->where('status', 'present')->count(),
                    'late' => $rows->where('status', 'late')->count(),
                    'absent' => $rows->where('status', 'absent')->count(),
                    'leave' => $rows->where('status', 'leave')->count(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Owner/Kehadiran', [
            'attendance' => $attendance,
            'is_stub' => false,
        ]);
    }

    /**
     * L3: Jadwal Shift — jadwal mingguan dari shift_schedules (data nyata).
     */
    public function jadwalShift(Request $request)
    {
        $tenantId = $this->ctx->id();

        $schedule = ShiftSchedule::where('tenant_id', $tenantId)
            ->with('user')
            ->get()
            ->groupBy('user_id')
            ->map(function ($rows) {
                $user = $rows->first()->user;
                $byDay = $rows->keyBy('day_of_week');
                $days = [];
                foreach (range(0, 6) as $d) {
                    $s = $byDay->get($d);
                    $days[] = $s ? $s->shift_start->format('H:i').'-'.$s->shift_end->format('H:i') : 'Libur';
                }

                return [
                    'name' => $user?->name ?? 'Karyawan #'.$rows->first()->user_id,
                    'mon' => $days[0], 'tue' => $days[1], 'wed' => $days[2],
                    'thu' => $days[3], 'fri' => $days[4], 'sat' => $days[5], 'sun' => $days[6],
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Owner/JadwalShift', [
            'schedule' => $schedule,
            'is_stub' => false,
        ]);
    }
}
