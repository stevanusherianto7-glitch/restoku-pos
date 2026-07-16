<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Models\Reservation;
use App\Models\Scopes\TenantScope;
use App\Services\TenantContext;
use App\Services\TenantReadConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * PublicOrderController — endpoint publik untuk tamu/guest (QR ordering).
 * Tidak butuh auth; tenant diidentifikasi via outlet slug/ID.
 */
class PublicOrderController extends Controller
{
    private const KDS_STATUS_LABELS = [
        Order::STATUS_ANTRIAN_MASUK => 'Antrian Masuk',
        Order::STATUS_DITERIMA => 'Diterima',
        Order::STATUS_SEDANG_DIMASAK => 'Sedang Dimasak',
        Order::STATUS_SELESAI_MASAK => 'Selesai Masak',
        Order::STATUS_SIAP_SAJIKAN => 'Siap Sajikan',
    ];

    public function __construct(
        private TenantContext $ctx,
        private TenantReadConnection $readConn
    ) {}

    /**
     * Buku menu publik untuk tamu (read-only, by outlet slug).
     */
    public function getPublicMenu(Request $request, string $slug)
    {
        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->where('slug', $slug)
            ->first();

        // Q29/Q84: bila slug lama diakses (QR tercetak), redirect 301 ke slug baru.
        if (! $outlet) {
            $outlet = Outlet::withoutGlobalScope(TenantScope::class)
                ->where('old_slug', $slug)
                ->first();
            if ($outlet) {
                return redirect()
                    ->to("/m/{$outlet->slug}", 301)
                    ->header('Cache-Control', 'public, max-age=86400');
            }

            return response()->json(['error' => 'Outlet tidak ditemukan.'], 404);
        }

        $this->ctx->setTenantId($outlet->tenant_id);

        $cacheKey = "menu:tenant:{$outlet->tenant_id}:outlet:".($outlet->id ?? 'global');
        $menu = Cache::remember(
            $cacheKey,
            now()->addMinutes(10),
            fn () => $this->readConn->read(fn () => MenuItem::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $outlet->tenant_id)
                ->forGuestMenu($outlet->id)
                ->with('category:id,name')
                ->get(['id', 'name', 'description', 'price', 'image_path', 'is_popular', 'menu_category_id'])
                ->append('photo_url')
                ->toArray())
        );

        // Tema e-Menu (Customer View) diambil dari outlet_settings — SERVER-DRIVEN,
        // bukan localStorage per-origin (biar tamu HP vs desktop lihat tema SAMA).
        // Fallback 'nano-banana' = standar brand (dark + amber/orange) per keputusan owner.
        $screenMode = $outlet->settings?->screen_mode ?? 'nano-banana';

        return response()->json([
            'outlet' => [
                'id' => $outlet->id,
                'name' => $outlet->name,
                'slug' => $outlet->slug,
                'latitude' => $outlet->latitude,
                'longitude' => $outlet->longitude,
                'geo_radius_meters' => $outlet->geo_radius_meters ?? 50,
            ],
            'screen_mode' => $screenMode,
            'tenant_layout' => 'nano-banana',
            'menu' => $menu,
        ]);
    }

    /**
     * Submit order dari tamu (guest QR ordering).
     */
    public function submitOrder(Request $request)
    {
        $validated = $request->validate([
            'outlet_id' => 'required|integer|exists:outlets,id',
            'table' => 'required|string|max:50',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1|max:99',
            'items.*.notes' => 'nullable|string|max:255',
            'verify_token' => 'required|string',
        ]);

        // Anti-fraud: tamu wajib bawa signed token dari /api/guest/verify
        try {
            $payload = json_decode(Crypt::decryptString($validated['verify_token']), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Verifikasi kehadiran diperlukan atau sudah kedaluwarsa. Silakan verifikasi ulang.',
            ], 422);
        }

        if (! isset($payload['outlet_id'], $payload['table'], $payload['exp'])
            || (int) $payload['outlet_id'] !== (int) $validated['outlet_id']
            || $payload['exp'] < now()->timestamp) {
            return response()->json([
                'success' => false,
                'message' => 'Token verifikasi tidak valid atau kedaluwarsa. Silakan verifikasi ulang.',
            ], 422);
        }

        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->select('id', 'tenant_id')
            ->findOrFail($validated['outlet_id']);

        $tenantId = $outlet->tenant_id;
        $menuItemIds = collect($validated['items'])->pluck('menu_item_id')->unique();

        $menuItems = MenuItem::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('is_available', true)
            ->whereIn('id', $menuItemIds)
            ->with('category:id,type')
            ->get()
            ->keyBy('id');

        if ($menuItems->count() !== $menuItemIds->count()) {
            return response()->json([
                'success' => false,
                'message' => 'Beberapa item menu tidak ditemukan atau tidak tersedia saat ini.',
            ], 422);
        }

        // Routing order-level: ada makanan (food) → KDS, murni minuman (beverage) → Bar.
        $hasFood = $menuItems->contains(fn ($m) => ($m->category?->type ?? MenuCategory::TYPE_FOOD) === MenuCategory::TYPE_FOOD);
        $destination = $hasFood ? Order::DEST_KDS : Order::DEST_BAR;

        $order = DB::transaction(function () use ($validated, $tenantId, $menuItems, $outlet, $destination) {
            $order = Order::withoutGlobalScope(TenantScope::class)->create([
                'tenant_id' => $tenantId,
                'outlet_id' => $outlet->id,
                'order_code' => Order::generateOrderCode($tenantId),
                'table_number' => str_starts_with($validated['table'], 'Meja') ? $validated['table'] : 'Meja '.$validated['table'],
                'source' => 'guest_qr',
                'status' => Order::STATUS_ANTRIAN_MASUK,
                'destination' => $destination,
            ]);

            $subtotal = 0;

            foreach ($validated['items'] as $row) {
                $menuItem = $menuItems[$row['menu_item_id']];
                $lineSubtotal = $menuItem->price * $row['quantity'];
                $subtotal += $lineSubtotal;

                OrderItem::withoutGlobalScope(TenantScope::class)->create([
                    'tenant_id' => $tenantId,
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'item_name' => $menuItem->name,
                    'quantity' => $row['quantity'],
                    'unit_price' => $menuItem->price,
                    'subtotal' => $lineSubtotal,
                    'notes' => $row['notes'] ?? null,
                ]);
            }

            $order->update(['subtotal' => $subtotal, 'total' => $subtotal]);

            return $order->load('items');
        });

        return response()->json([
            'success' => true,
            'order' => [
                'id' => $order->order_code,
                'table' => $order->table_number,
                'status' => self::KDS_STATUS_LABELS[$order->status],
                'items' => $order->items->pluck('item_name'),
                'total' => (float) $order->total,
            ],
        ]);
    }

    /**
     * Cek status order oleh tamu.
     */
    public function getOrderStatus(Request $request, $id)
    {
        $request->validate(['outlet_id' => 'required|integer|exists:outlets,id']);

        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->select('id', 'tenant_id')
            ->findOrFail($request->input('outlet_id'));

        $order = Order::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $outlet->tenant_id)
            ->where('order_code', $id)
            ->with('items.menuItem.category')
            ->first();

        if (! $order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
        }

        return response()->json([
            'success' => true,
            'status' => self::KDS_STATUS_LABELS[$order->status] ?? $order->status,
            'tone' => $this->toneForStatus($order->status),
            'destination' => $order->destination,
            'food_served_at' => $order->food_served_at,
            'drink_served_at' => $order->drink_served_at,
            'has_food' => $order->hasFood(),
            'has_drink' => $order->hasDrink(),
            'items' => $order->items->map(function ($item) {
                $step = method_exists($item, 'cookStep') ? $item->cookStep() : 1;

                return [
                    'name' => $item->item_name,
                    'qty' => $item->quantity,
                    'notes' => $item->notes,
                    'cook_status' => $item->cook_status ?? 'dikonfirmasi',
                    'cook_label' => OrderItem::COOK_LABELS[$item->cook_status] ?? 'dikonfirmasi',
                    'cook_step' => $step,
                ];
            })->all(),
            'step' => match ($order->status) {
                Order::STATUS_ANTRIAN_MASUK => 1,
                Order::STATUS_DITERIMA => 1,
                Order::STATUS_SEDANG_DIMASAK => 2,
                Order::STATUS_SELESAI_MASAK => 3,
                Order::STATUS_SIAP_SAJIKAN => 4,
                Order::STATUS_SIAP_BAYAR, Order::STATUS_SELESAI => 5,
                default => 1,
            },
        ]);
    }

    /**
     * Daftar reservasi (endpoint publik via outlet_id).
     */
    public function getReservations(Request $request)
    {
        $request->validate(['outlet_id' => 'required|integer|exists:outlets,id']);

        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->select('id', 'tenant_id')
            ->findOrFail($request->input('outlet_id'));

        $reservations = Reservation::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $outlet->tenant_id)
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        return response()->json(['reservations' => $reservations]);
    }

    /**
     * Submit reservasi dari tamu.
     */
    public function submitReservation(Request $request)
    {
        $validated = $request->validate([
            'outlet_id' => 'required|integer|exists:outlets,id',
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required|date_format:H:i',
            'guests' => 'required|integer|min:1|max:100',
            'type' => 'required|string|max:50',
            'notes' => 'nullable|string|max:500',
        ]);

        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->select('id', 'tenant_id')
            ->findOrFail($validated['outlet_id']);

        $tenantId = $outlet->tenant_id;

        $reservation = Reservation::withoutGlobalScope(TenantScope::class)->create([
            'tenant_id' => $tenantId,
            'outlet_id' => $outlet->id,
            'reservation_code' => Reservation::generateCode($tenantId),
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'date' => $validated['date'],
            'time' => $validated['time'],
            'guests' => $validated['guests'],
            'type' => $validated['type'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil dibuat',
            'reservation' => $reservation,
        ]);
    }

    private const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

    /**
     * Update status reservasi (auth required).
     */
    public function updateReservationStatus(Request $request, $id)
    {
        $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', self::RESERVATION_STATUSES)],
        ]);

        $reservation = Reservation::where('reservation_code', $id)->firstOrFail();

        if ($reservation->tenant_id !== $this->ctx->id()) {
            abort(403, 'Anda tidak berhak mengubah reservasi ini.');
        }

        $reservation->update(['status' => $request->input('status')]);

        return response()->json([
            'success' => true,
            'message' => 'Status reservasi berhasil diperbarui',
        ]);
    }

    /**
     * Jam operasional outlet (endpoint publik).
     */
    public function getOutletOperatingHours(Request $request): JsonResponse
    {
        $outletParam = $request->query('outlet', '');

        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->where('slug', $outletParam)
            ->first();

        if (! $outlet) {
            return response()->json([
                'is_open_now' => true,
                'operating_hours' => OutletSetting::defaultOperatingHours(),
                'note' => 'outlet_not_found_using_defaults',
            ]);
        }

        $setting = OutletSetting::withoutGlobalScope(TenantScope::class)
            ->where('outlet_id', $outlet->id)
            ->first();

        if (! $setting) {
            return response()->json([
                'is_open_now' => true,
                'operating_hours' => OutletSetting::defaultOperatingHours(),
            ]);
        }

        return response()->json($setting->toPublicScheduleArray());
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
