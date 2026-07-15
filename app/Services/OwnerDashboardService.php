<?php

namespace App\Services;

use App\Models\CashierSession;
use App\Models\MenuItem;
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
                'profit_estimate' => $profit,
                'food_cost_percentage' => 35,
                'is_estimate' => true,
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
            'cogs_estimate' => $cogs,
            'operational_expenses_estimate' => $operationalExpenses,
            'net_profit_estimate' => $netProfit,
            'cash_in' => $grossProfit,
            'cash_out' => $cogs + $operationalExpenses,
            'is_estimate' => true,
            'note' => 'COGS dan OpEx menggunakan benchmark standar industri (35%/20%).',
        ];
    }

    /**
     * [L1] Laba Kotor / Bersih / Margin % untuk KPI dashboard.
     * Laba Kotor = gross (total omset selesai); Laba Bersih = net (setelah COGS+OpEx benchmark).
     * Margin Kotor % = (gross - cogs) / gross.
     */
    public function getProfitMetrics(int $tenantId, string $dateRange = 'today'): array
    {
        $ordersQuery = Order::byTenant($tenantId)
            ->where('status', Order::STATUS_SELESAI);

        $this->applyDateRange($ordersQuery, $dateRange);

        $gross = (float) $ordersQuery->sum('total');
        $cogs = $gross * 0.35;          // 35% COGS benchmark
        $operational = $gross * 0.20;   // 20% OpEx benchmark
        $net = $gross - $cogs - $operational;
        $marginPct = $gross > 0 ? (($gross - $cogs) / $gross) * 100 : 0;

        return [
            'gross_profit' => $gross,
            'net_profit' => $net,
            'operational_expenses' => $operational,
            'gross_margin_pct' => round($marginPct, 1),
            'is_estimate' => true,
        ];
    }

    /**
     * [L1] Jam ramai (06:00–22:00, 17 bucket) + hari ramai (Sen–Ming, 7 bucket).
     * Dihitung dari Order::created_at yang status selesai dalam rentang.
     */
    public function getPeakHours(int $tenantId, string $dateRange = 'today'): array
    {
        $orders = Order::byTenant($tenantId)
            ->where('status', Order::STATUS_SELESAI);
        $this->applyDateRange($orders, $dateRange);

        // Filter jam 06–22 di PHP (bukan HOUR() SQL) agar kompatibel MySQL + SQLite.
        $rows = $orders->get(['created_at'])->filter(
            fn ($o) => (int) $o->created_at->format('H') >= 6 && (int) $o->created_at->format('H') <= 22
        );

        $buckets = collect(range(6, 22))->mapWithKeys(fn ($h) => [sprintf('%02d:00', $h) => 0]);
        foreach ($rows as $o) {
            $key = sprintf('%02d:00', (int) $o->created_at->format('H'));
            if (isset($buckets[$key])) {
                $buckets[$key]++;
            }
        }

        return $buckets->map(fn ($v, $k) => ['hour' => $k, 'orders' => $v])->values()->all();
    }

    public function getPeakDays(int $tenantId, string $dateRange = 'today'): array
    {
        $orders = Order::byTenant($tenantId)
            ->where('status', Order::STATUS_SELESAI);
        $this->applyDateRange($orders, $dateRange);

        $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $counts = array_fill(0, 7, 0);
        foreach ($orders->get(['created_at']) as $o) {
            $counts[(int) $o->created_at->format('w')]++;
        }

        return collect($days)->map(fn ($name, $i) => ['day' => $name, 'orders' => $counts[$i]])->all();
    }

    /**
     * [L1] Best seller — top 10 produk dari OrderItem + nama MenuItem.
     * Gabungkan dengan MenuItem untuk dapatkan nama stabil (item_name bisa berubah).
     */
    public function getTopProducts(int $tenantId, string $dateRange = 'today', int $limit = 10): array
    {
        $itemsQuery = OrderItem::where('tenant_id', $tenantId)
            ->whereHas('order', function ($q) use ($dateRange) {
                $q->where('status', Order::STATUS_SELESAI);
                $this->applyDateRange($q, $dateRange);
            });

        $aggregated = $itemsQuery
            ->select('item_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_revenue'))
            ->groupBy('item_name')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get();

        $max = $aggregated->max('total_qty') ?: 1;

        return $aggregated->map(function ($item) use ($max) {
            return [
                'name' => $item->item_name,
                'qty_sold' => (int) $item->total_qty,
                'revenue' => (float) $item->total_revenue,
                'progress' => round(((int) $item->total_qty / $max) * 100, 1),
            ];
        })->values()->all();
    }

    /**
     * [L3] Tipe transaksi Dine-In / Take Away / Delivery — query nyata dari orders.order_type.
     */
    public function getTransactionTypes(int $tenantId, string $dateRange = 'today'): array
    {
        $ordersQuery = Order::byTenant($tenantId)->where('status', Order::STATUS_SELESAI);
        $this->applyDateRange($ordersQuery, $dateRange);
        $total = $ordersQuery->count();

        $counts = $ordersQuery
            ->selectRaw('order_type, COUNT(*) as cnt')
            ->groupBy('order_type')
            ->pluck('cnt', 'order_type')
            ->all();

        $map = [
            'dine_in' => 'Dine-In',
            'take_away' => 'Take Away',
            'delivery' => 'Delivery',
        ];

        $result = [];
        foreach ($map as $key => $label) {
            $c = (int) ($counts[$key] ?? 0);
            $result[] = [
                'type' => $label,
                'count' => $c,
                'percentage' => $total > 0 ? round(($c / $total) * 100, 1) : 0,
            ];
        }

        return $result;
    }

    /**
     * [L1] Alert stok kritis — MenuItem dengan stok rendah / expired.
     * MenuItem saat ini belum punya kolom stok -> STUB deterministik
     * (ganti query nyata setelah migration stock di Lapisan 2).
     */
    /**
     * [L3] Alert stok kritis — query nyata dari menu_items (track_stock aktif & stock <= threshold).
     */
    public function getStockAlerts(int $tenantId): array
    {
        $items = MenuItem::query()
            ->where('track_stock', true)
            ->whereColumn('stock', '<=', 'stock_threshold')
            ->orderBy('stock')
            ->get(['id', 'name', 'stock', 'stock_threshold', 'unit_type']);

        return $items->map(function ($item) {
            $severity = $item->stock <= 0 ? 'high' : ($item->stock <= ($item->stock_threshold / 2) ? 'medium' : 'low');

            return [
                'name' => $item->name,
                'type' => $item->stock <= 0 ? 'out_of_stock' : 'low',
                'detail' => $item->stock <= 0
                    ? 'Habis'
                    : 'Sisa '.$item->stock.($item->unit_type ? ' '.$item->unit_type : ''),
                'severity' => $severity,
                'stock' => $item->stock,
                'threshold' => $item->stock_threshold,
            ];
        })->values()->all();
    }

    /**
     * [L3] Performa shift kasir — query nyata dari cashier_sessions.
     */
    public function getShiftPerformance(int $tenantId): array
    {
        $sessions = CashierSession::where('tenant_id', $tenantId)
            ->with('user')
            ->orderByDesc('opened_at')
            ->get();

        $open = $sessions->where('closed_at', null);
        $activeCashiers = $open->map(fn ($s) => $s->user?->name ?? 'Kasir #'.$s->user_id)->values()->all();

        return [
            'open_shifts' => $open->count(),
            'closed_shifts' => $sessions->whereNotNull('closed_at')->count(),
            'active_cashiers' => $activeCashiers,
            'total_transactions_today' => (int) $sessions->sum('transaction_count'),
            'is_stub' => false,
        ];
    }

    /**
     * Helper: terapkan filter tanggal secara konsisten.
     */
    private function applyDateRange($query, string $dateRange): void
    {
        if ($dateRange === 'today') {
            $query->whereDate('created_at', now()->toDateString());
        } elseif ($dateRange === 'week') {
            $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
        } elseif ($dateRange === 'month') {
            $query->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year);
        } elseif ($dateRange === 'year') {
            $query->whereYear('created_at', now()->year);
        }
    }
}
