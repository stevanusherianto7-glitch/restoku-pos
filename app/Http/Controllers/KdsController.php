<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

/**
 * KdsController — Kitchen Display System endpoints.
 * Hanya untuk user yang sudah login (auth + tenant middleware).
 */
class KdsController extends Controller
{
    private const KDS_STATUS_LABELS = [
        Order::STATUS_ANTRIAN_MASUK => 'Antrian Masuk',
        Order::STATUS_SEDANG_DIMASAK => 'Sedang Dimasak',
        Order::STATUS_SIAP_SAJIKAN => 'Siap Sajikan',
    ];

    /**
     * Ambil order aktif milik tenant, dikelompokkan untuk KDS.
     * Optional ?outlet_id=N untuk filter 1 outlet (scale: 300 outlet jangan dibebankan
     * ke 1 layar KDS tunggal). Tanpa param = semua outlet tenant (default, kompatibel).
     */
    public function getKdsOrders(Request $request)
    {
        return response()->json(['grouped' => $this->buildKdsGroups($request)]);
    }

    /**
     * Q11: endpoint polling ringan untuk KDS realtime (FE fetch tiap N detik).
     * Send no-cache headers agar browser selalu ambil data terbaru.
     */
    public function stream(Request $request)
    {
        $grouped = $this->buildKdsGroups($request);

        return response()->json([
            'grouped' => $grouped,
            'server_time' => now()->timestamp,
        ])->withHeaders([
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
        ]);
    }

    private function buildKdsGroups(Request $request): array
    {
        $query = Order::whereIn('status', array_keys(self::KDS_STATUS_LABELS))
            ->with('items');

        // Q7/Q10: filter per-outlet (scope tenant sudah aktif via TenantScope).
        if ($request->filled('outlet_id')) {
            $query->where('outlet_id', (int) $request->input('outlet_id'));
        }

        $orders = $query->orderBy('created_at')->get();

        $grouped = array_fill_keys(self::KDS_STATUS_LABELS, []);

        foreach ($orders as $order) {
            $label = self::KDS_STATUS_LABELS[$order->status] ?? null;
            if (! $label) {
                continue;
            }

            $grouped[$label][] = [
                'id' => $order->order_code,
                'table' => $order->table_number,
                'status' => $label,
                'tone' => $this->toneForStatus($order->status),
                'time' => max(1, (int) $order->created_at->diffInMinutes(now())),
                'items' => $order->items->map(fn ($item) => "{$item->quantity}x {$item->item_name}".($item->notes ? " ({$item->notes})" : ''))->all(),
            ];
        }

        return $grouped;
    }

    /**
     * Update status order dari KDS.
     */
    public function updateOrderStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:Antrian Masuk,Sedang Dimasak,Siap Sajikan,Selesai',
        ]);

        $order = Order::byTenant(auth()->user()->tenant_id)
            ->where('order_code', $id)
            ->firstOrFail();
        $this->authorize('update', $order);

        $statusInput = $request->input('status');

        if ($statusInput === 'Selesai') {
            $order->update(['status' => Order::STATUS_SIAP_BAYAR]);
        } else {
            $map = array_flip(self::KDS_STATUS_LABELS);
            $order->update(['status' => $map[$statusInput]]);
        }

        return response()->json(['success' => true]);
    }

    private function toneForStatus(string $status): string
    {
        return match ($status) {
            Order::STATUS_SEDANG_DIMASAK => 'blue',
            Order::STATUS_SIAP_SAJIKAN, Order::STATUS_SIAP_BAYAR, Order::STATUS_SELESAI => 'emerald',
            default => 'amber',
        };
    }
}
