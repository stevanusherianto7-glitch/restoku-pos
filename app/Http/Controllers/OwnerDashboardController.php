<?php

namespace App\Http\Controllers;

use App\Services\OwnerDashboardService;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OwnerDashboardController extends Controller
{
    public function __construct(
        private OwnerDashboardService $dashboardService,
        private TenantContext         $ctx,
    ) {}

    public function index(Request $request)
    {
        $tenantId  = $this->ctx->id();
        $dateRange = $request->input('date_range', 'today');

        return Inertia::render('Dashboard/OwnerDashboard', [
            'metrics'         => $this->dashboardService->getAggregateMetrics($tenantId, $dateRange),
            'leaderboard'     => $this->dashboardService->getOutletLeaderboard($tenantId, $dateRange),
            'menuPerformance' => $this->dashboardService->getMenuPerformance($tenantId, $dateRange),
            'filters'         => ['date_range' => $dateRange],
        ]);
    }

    public function reports(Request $request)
    {
        $tenantId  = $this->ctx->id();
        $dateRange = $request->input('date_range', 'month');

        return Inertia::render('Dashboard/Reports', [
            'financials' => $this->dashboardService->getFinancialReport($tenantId, $dateRange),
            'filters'    => ['date_range' => $dateRange],
        ]);
    }
}
