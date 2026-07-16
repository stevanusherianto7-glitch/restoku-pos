<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * KdsController — Kitchen Display System endpoints.
 * Hanya untuk user yang sudah login (auth + tenant middleware).
 */
class KdsController extends Controller
{
    private const KDS_STATUS_LABELS = [
        Order::STATUS_ANTRIAN_MASUK => 'Antrian Masuk',
        Order::STATUS_DITERIMA => 'Diterima',
        Order::STATUS_SEDANG_DIMASAK => 'Sedang Dimasak',
        Order::STATUS_SELESAI_MASAK => 'Selesai Masak',
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
     * Kirim no-cache headers agar browser selalu ambil data terbaru.
     * ?dest=bar untuk layar Bar (minuman).
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

    /**
     * Layar Bar (minuman): order destination=bar yang sedang diproses.
     */
    public function barOrders(Request $request)
    {
        $request->merge(['dest' => Order::DEST_BAR]);

        return response()->json([
            'grouped' => $this->buildKdsGroups($request),
            'server_time' => now()->timestamp,
        ])->withHeaders([
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
        ]);
    }

    /**
     * Antrean pembayaran kasir: order yang sudah disajikan waiter ke meja
     * (status siap_bayar), semua destination. Dipanggil MonitorPesanan.
     */
    public function paymentQueue(Request $request)
    {
        $outletKey = $request->filled('outlet_id') ? (int) $request->input('outlet_id') : 'all';

        // TIDAK pakai Cache::remember — antrean kasir realtime; cache 5s tanpa
        // invalidation saat status berubah menyebabkan flicker hilang-muncul di layar kasir.
        $query = Order::where('status', Order::STATUS_SIAP_BAYAR)->with('items.menuItem.category');

        if ($request->filled('outlet_id')) {
            $query->where('outlet_id', (int) $request->input('outlet_id'));
        }

        $orders = $query->orderBy('updated_at')->get();

        $list = $orders->map(fn ($order) => [
            'id' => $order->order_code,
            'table' => $order->table_number,
            'destination' => $order->destination,
            'status' => 'Siap Bayar',
            'tone' => 'emerald',
            'time' => max(1, (int) $order->updated_at->diffInMinutes(now())),
            'items' => $order->items->map(fn ($item) => "{$item->quantity}x {$item->item_name}")->all(),
            'total' => (float) $order->total,
            'food_served_at' => $order->food_served_at,
            'drink_served_at' => $order->drink_served_at,
            'has_food' => $order->hasFood(),
            'has_drink' => $order->hasDrink(),
        ])->all();

        return response()->json([
            'grouped' => ['Siap Bayar' => $list],
            'orders' => $list,
            'server_time' => now()->timestamp,
        ])->withHeaders([
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
        ]);
    }

    private function buildKdsGroups(Request $request): array
    {
        // S-31: cache 5s per tenant+outlet (polling realtime, hindari query berulang).
        $outletKey = $request->filled('outlet_id') ? (int) $request->input('outlet_id') : 'all';
        $dest = $request->input('dest', Order::DEST_KDS);
        $cacheKey = 'kds:'.auth()->user()->tenant_id.':'.$outletKey.':'.$dest;

        return Cache::remember($cacheKey, 5, function () use ($request, $dest) {
            $query = Order::whereIn('status', array_keys(self::KDS_STATUS_LABELS))
                ->where('destination', $dest)
                ->with('items.menuItem.category');

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
                    'destination' => $order->destination,
                    'status' => $label,
                    'tone' => $this->toneForStatus($order->status),
                    'time' => max(1, (int) $order->created_at->diffInMinutes(now())),
                    'items' => $order->items->map(function ($item) {
                        $step = method_exists($item, 'cookStep') ? $item->cookStep() : 1;

                        return [
                            'id' => $item->id,
                            'name' => $item->item_name,
                            'qty' => $item->quantity,
                            'notes' => $item->notes,
                            'cook_status' => $item->cook_status ?? OrderItem::COOK_DIKONFIRMASI,
                            'cook_label' => OrderItem::COOK_LABELS[$item->cook_status] ?? 'dikonfirmasi',
                            'cook_step' => $step,
                        ];
                    })->all(),
                    'food_served_at' => $order->food_served_at,
                    'drink_served_at' => $order->drink_served_at,
                    'has_food' => $order->hasFood(),
                    'has_drink' => $order->hasDrink(),
                ];
            }

            return $grouped;
        });
    }

    /**
     * Update status order dari KDS.
     */
    public function updateOrderStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:Antrian Masuk,Diterima,Sedang Dimasak,Selesai Masak,Siap Sajikan,Selesai',
        ]);

        $order = Order::byTenant(auth()->user()->tenant_id)
            ->where('order_code', $id)
            ->firstOrFail();
        $this->authorize('update', $order);

        $statusInput = $request->input('status');

        if ($statusInput === 'Selesai') {
            $target = Order::STATUS_SIAP_BAYAR;
        } else {
            $map = array_flip(self::KDS_STATUS_LABELS);
            $target = $map[$statusInput];
        }

        // S-07: tolak transisi ilegal (mis. siap_bayar → antrian_masuk).
        if (! $order->canTransitionTo($target)) {
            abort(422, "Transisi status ilegal: {$order->status} -> {$target}");
        }
        $order->update(['status' => $target]);

        return response()->json(['success' => true]);
    }

    /**
     * FNB-003: advance cook_status 1 tahap per-item.
     * Kru klik tombol (dikonfirmasi→sedang dimasak→...) → item maju 1 step.
     */
    public function updateItemCookStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
        ]);

        $input = strtolower(trim($request->input('status')));
        $target = null;
        foreach (OrderItem::COOK_LABELS as $key => $label) {
            if (strtolower($label) === $input || $key === $input) {
                $target = $key;
                break;
            }
        }
        if (! $target) {
            abort(422, "Status cook tidak valid: {$input}");
        }

        $item = OrderItem::withoutGlobalScopes()
            ->where('tenant_id', auth()->user()->tenant_id)
            ->with('order')
            ->findOrFail($id);
        $this->authorize('update', $item->order);

        if (! $item->canCookTransitionTo($target)) {
            abort(422, "Transisi cook ilegal: {$item->cook_status} -> {$target}");
        }

        $item->cook_status = $target;
        $item->save();

        // FNB-003: bila SELURUH item sudah siap_sajikan → order naik ke layar Waiter/Bar.
        if ($target === OrderItem::COOK_SIAP_SAJIKAN) {
            $order = $item->order;
            $allReady = $order
                && $order->items()
                    ->where('cook_status', '!=', OrderItem::COOK_SIAP_SAJIKAN)
                    ->where('cook_status', '!=', OrderItem::COOK_SELESAI)
                    ->count() === 0;
            if ($allReady && $order->status !== Order::STATUS_SIAP_SAJIKAN) {
                $order->update(['status' => Order::STATUS_SIAP_SAJIKAN]);
            }
        }

        return response()->json(['success' => true, 'cook_status' => $item->cook_status]);
    }

    /**
     * FNB-001: waiter menandai 1 bagian (food/drink) sudah disajikan.
     * Bila allServed() → order otomatis masuk kasir (siap_bayar).
     */
    public function servePart(Request $request, $id)
    {
        $request->validate([
            'part' => 'required|string|in:food,drink',
        ]);

        $order = Order::byTenant(auth()->user()->tenant_id)
            ->where('order_code', $id)
            ->with('items.menuItem.category')
            ->firstOrFail();
        $this->authorize('update', $order);

        // Hanya bisa tandai saji bila order sudah siap_sajikan (dari KDS/Bar).
        if ($order->status !== Order::STATUS_SIAP_SAJIKAN) {
            abort(422, "Pesanan belum siap saji: {$order->status}");
        }

        $part = $request->input('part');
        if ($part === 'food' && ! $order->hasFood()) {
            abort(422, 'Pesanan ini tidak punya item makanan.');
        }
        if ($part === 'drink' && ! $order->hasDrink()) {
            abort(422, 'Pesanan ini tidak punya item minuman.');
        }

        $column = $part === 'food' ? 'food_served_at' : 'drink_served_at';
        $order->{$column} = now();
        $order->save();

        // allServed wajib sebelum masuk kasir.
        if ($order->allServed() && $order->canTransitionTo(Order::STATUS_SIAP_BAYAR)) {
            $order->transitionTo(Order::STATUS_SIAP_BAYAR);
        }

        return response()->json([
            'success' => true,
            'food_served_at' => $order->food_served_at,
            'drink_served_at' => $order->drink_served_at,
            'status' => $order->status,
        ]);
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
