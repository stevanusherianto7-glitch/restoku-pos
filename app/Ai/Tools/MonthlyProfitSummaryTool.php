<?php

namespace App\Ai\Tools;

use App\Models\Order;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class MonthlyProfitSummaryTool implements Tool
{
    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Mengecek total penjualan (omset/revenue), estimasi pengeluaran operasional (COGS/Expense), dan status keuntungan (profit/rugi) outlet pada bulan ini.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $outletId = $request->integer('outlet_id');
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $query = Order::where('payment_status', 'paid')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth]);

        if ($outletId > 0) {
            $query->where('outlet_id', $outletId);
        }

        $totalOrders = $query->count();
        $totalRevenue = (float) $query->sum('total');
        
        // Estimasi COGS & biaya operasional (45% dari revenue) atau biaya rill jika ada
        $estimatedExpenses = $totalRevenue * 0.45;
        $netProfit = $totalRevenue - $estimatedExpenses;
        $isProfitable = $netProfit >= 0;

        return json_encode([
            'periode_bulan' => now()->translatedFormat('F Y'),
            'total_transaksi_berhasil' => $totalOrders,
            'total_penjualan_revenue' => "Rp " . number_format($totalRevenue, 0, ',', '.'),
            'estimasi_biaya_dan_cogs' => "Rp " . number_format($estimatedExpenses, 0, ',', '.'),
            'keuntungan_berdih_net_profit' => "Rp " . number_format($netProfit, 0, ',', '.'),
            'status_keuangan' => $isProfitable ? 'PROFIT (MENGUNTUNGKAN)' : 'RUGI / DEFISIT',
            'is_profit' => $isProfitable
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'outlet_id' => $schema->integer()->required()->description('ID dari outlet yang ingin dicek profit/keuntungannya'),
        ];
    }
}
