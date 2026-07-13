<?php

namespace App\Http\Controllers;

use App\Models\Order;

/**
 * CashierController — Antrean kasir dan pembayaran.
 * Hanya untuk user yang sudah login (auth + tenant middleware).
 */
class CashierController extends Controller
{
    /**
     * Antrean kasir = semua order tenant yang berstatus "siap bayar".
     */
    public function getCashierQueue()
    {
        $queue = Order::where('status', Order::STATUS_SIAP_BAYAR)
            ->with('items')
            ->get()
            ->map(fn ($order) => [
                'id' => $order->order_code,
                'table' => $order->table_number,
                'status' => 'Siap Bayar',
                'tone' => 'emerald',
                'time' => max(1, (int) $order->created_at->diffInMinutes(now())),
                'items' => $order->items->map(fn ($item) => "{$item->quantity}x {$item->item_name}")->all(),
            ]);

        return response()->json([
            'success' => true,
            'queue' => $queue->values(),
        ]);
    }

    /**
     * Tandai order sudah dibayar & selesai.
     */
    public function clearCashierQueueItem($id)
    {
        $order = Order::byTenant(auth()->user()->tenant_id)
            ->where('order_code', $id)
            ->firstOrFail();
        $this->authorize('update', $order);

        $order->update([
            'status' => Order::STATUS_SELESAI,
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }
}
