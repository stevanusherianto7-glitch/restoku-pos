<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use Illuminate\Support\Facades\DB;

class OwnerDashboardService
{
    /**
     * Get aggregate metrics across all outlets for the current tenant.
     */
    public function getAggregateMetrics(int $tenantId, string $dateRange = 'today')
    {
        $ordersQuery = Order::byTenant($tenantId)
            ->where('status', Order::STATUS_SELESAI);

        if ($dateRange === 'today') {
            $ordersQuery->whereDate('created_at', now()->toDateString());
        } elseif ($dateRange === 'month') {
            $ordersQuery->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year);
        }

        $totalRevenue = (float) $ordersQuery->sum('total');
        $totalTransactions = $ordersQuery->count();
        $averageOrderValue = $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0;

        return [
            'total_revenue' => $totalRevenue,
            'total_transactions' => $totalTransactions,
            'average_order_value' => $averageOrderValue,
            'revenue_growth' => '+0.0%',
        ];
    }

    /**
     * Get leaderboard of outlets comparing revenue and profit.
     */
    public function getOutletLeaderboard(int $tenantId, string $dateRange = 'today')
    {
        $outlets = Outlet::where('tenant_id', $tenantId)->get();

        $leaderboard = [];
        foreach ($outlets as $outlet) {
            $outletOrders = Order::forOutlet($outlet)
                ->where('status', Order::STATUS_SELESAI);

            if ($dateRange === 'today') {
                $outletOrders->whereDate('created_at', now()->toDateString());
            } elseif ($dateRange === 'month') {
                $outletOrders->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year);
            }

            $revenue = (float) $outletOrders->sum('total');
            $profit = $revenue * 0.35; // Standard 35% net margin benchmark

            $leaderboard[] = [
                'id' => $outlet->id,
                'name' => $outlet->name,
                'revenue' => $revenue,
                'profit' => $profit,
                'food_cost_percentage' => 35,
            ];
        }

        usort($leaderboard, fn ($a, $b) => $b['revenue'] <=> $a['revenue']);

        return $leaderboard;
    }

    /**
     * Get top performing and slow moving menu items.
     */
    public function getMenuPerformance(int $tenantId, string $dateRange = 'today')
    {
        $itemsQuery = OrderItem::where('tenant_id', $tenantId)
            ->whereHas('order', function ($q) use ($dateRange) {
                $q->where('status', Order::STATUS_SELESAI);
                if ($dateRange === 'today') {
                    $q->whereDate('created_at', now()->toDateString());
                } elseif ($dateRange === 'month') {
                    $q->whereMonth('created_at', now()->month)
                        ->whereYear('created_at', now()->year);
                }
            });

        $aggregated = $itemsQuery->select('item_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_revenue'))
            ->groupBy('item_name')
            ->orderByDesc('total_revenue')
            ->get();

        $topPerformers = $aggregated->take(5)->map(fn ($item) => [
            'name' => $item->item_name,
            'qty_sold' => (int) $item->total_qty,
            'revenue' => (float) $item->total_revenue,
        ])->values()->all();

        $slowMovers = $aggregated->sortBy('total_qty')->take(5)->map(fn ($item) => [
            'name' => $item->item_name,
            'qty_sold' => (int) $item->total_qty,
            'revenue' => (float) $item->total_revenue,
        ])->values()->all();

        return [
            'top_performers' => $topPerformers,
            'slow_movers' => $slowMovers,
        ];
    }

    /**
     * Get financial reports (Cash Flow, P&L)
     */
    public function getFinancialReport(int $tenantId, string $dateRange = 'month')
    {
        $ordersQuery = Order::byTenant($tenantId)
            ->where('status', Order::STATUS_SELESAI);

        if ($dateRange === 'month') {
            $ordersQuery->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year);
        }

        $grossProfit = (float) $ordersQuery->sum('total');
        $cogs = $grossProfit * 0.35; // Standard 35% COGS benchmark
        $operationalExpenses = $grossProfit * 0.20; // 20% OpEx benchmark
        $netProfit = $grossProfit - $cogs - $operationalExpenses;

        return [
            'gross_profit' => $grossProfit,
            'cogs' => $cogs,
            'operational_expenses' => $operationalExpenses,
            'net_profit' => $netProfit,
            'cash_in' => $grossProfit,
            'cash_out' => $cogs + $operationalExpenses,
        ];
    }
}
