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
     * Ambil semua order aktif milik tenant, dikelompokkan untuk KDS.
     */
    public function getKdsOrders(Request $request)
    {
        $orders = Order::whereIn('status', array_keys(self::KDS_STATUS_LABELS))
            ->with('items')
            ->orderBy('created_at')
            ->get();

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

        return response()->json([
            'grouped' => $grouped,
        ]);
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
