<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

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
        // S-32: cache 5s antrean kasir (polling).
        $cacheKey = 'cashier:'.auth()->user()->tenant_id;
        $queue = Cache::remember($cacheKey, 5, function () {
            return Order::where('status', Order::STATUS_SIAP_BAYAR)
                ->with('items')
                ->get()
                ->map(fn ($order) => [
                    'id' => $order->order_code,
                    'table' => $order->table_number,
                    'status' => 'Siap Bayar',
                    'tone' => 'emerald',
                    'time' => max(1, (int) $order->created_at->diffInMinutes(now())),
                    'items' => $order->items->map(fn ($item) => "{$item->quantity}x {$item->item_name}")->all(),
                ])->values();
        });

        // Pastikan queue SELALU sequential array (bukan object) di JSON.
        // Cache::remember bisa mengembalikan collection ter-deserialize sebagai
        // object -> frontend Array.isArray gagal -> kartu flicker isi<->kosong.
        $queue = array_values($queue instanceof Collection ? $queue->toArray() : (array) $queue);

        return response()->json([
            'success' => true,
            'queue' => $queue,
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

        // S-07: hanya order "siap_bayar" yang boleh diselesaikan.
        // Transisi balik (mis. selesai → siap_bayar) ditolak.
        if (! $order->canTransitionTo(Order::STATUS_SELESAI)) {
            abort(422, "Order tidak dalam status siap bayar: {$order->status}");
        }

        $order->update([
            'status' => Order::STATUS_SELESAI,
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        // S-32: invalidate cache antrean kasir setelah mutasi.
        Cache::forget('cashier:'.auth()->user()->tenant_id);

        return response()->json(['success' => true]);
    }
}
