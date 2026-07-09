<?php

namespace App\Http\Controllers;

use App\Services\OwnerDashboardService;
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
    ) {}

    public function index(Request $request)
    {
        $tenantId = $this->ctx->id();
        $dateRange = $request->input('date_range', 'today');

        return Inertia::render('Dashboard/OwnerDashboard', [
            'metrics' => $this->dashboardService->getAggregateMetrics($tenantId, $dateRange),
            'leaderboard' => $this->dashboardService->getOutletLeaderboard($tenantId, $dateRange),
            'menuPerformance' => $this->dashboardService->getMenuPerformance($tenantId, $dateRange),
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
}
