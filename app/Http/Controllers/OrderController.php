<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Models\PrintJob;
use App\Models\ReceiptConfig;
use App\Models\Scopes\TenantScope;
use App\Services\GuestOrderService;
use App\Services\ReservationService;
use App\Services\TenantContext;
use App\Services\TenantReadConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class OrderController extends Controller
{
    public function __construct(
        private TenantContext $ctx,
        private TenantReadConnection $readConn,
        private GuestOrderService $guestOrderService,
        private ReservationService $reservationService
    ) {}

    /**
     * Fase 1 — Buku menu publik untuk tamu (read-only, by outlet slug).
     * Cache per-outlet di Redis (F1.5); fallback ke DB bila cache miss.
     * Tidak butuh auth; tenant di-resolusi dari slug outlet.
     */
    public function getPublicMenu(Request $request, string $slug)
    {
        // Lookup global (route /m/{slug} bersifat publik, tanpa tenant context).
        // Tanpa withoutGlobalScope, TenantScope fail-closed abort(500) di production
        // karena tenant.id tidak terikat pada request guest. Slug sudah global-unique
        // (migrasi 2026_07_10) sehingga first() unambiguous & bebas collision lintas tenant.
        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->where('slug', $slug)
            ->first();
        if (! $outlet) {
            return response()->json(['error' => 'Outlet tidak ditemukan.'], 404);
        }

        // Inisialisasi TenantContext dari outlet (endpoint publik tamu, tanpa auth).
        // Perlu agar TenantReadConnection bisa arahkan ke schema/replica tenant ini.
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

        return response()->json([
            'outlet' => ['id' => $outlet->id, 'name' => $outlet->name, 'slug' => $outlet->slug],
            'menu' => $menu,
        ]);
    }

    // Label tampilan KDS <-> nilai status di DB. Disatukan di sini supaya
    // frontend & backend konsisten (sebelumnya string ini tersebar bebas).
    private const KDS_STATUS_LABELS = [
        Order::STATUS_ANTRIAN_MASUK => 'Antrian Masuk',
        Order::STATUS_SEDANG_DIMASAK => 'Sedang Dimasak',
        Order::STATUS_SIAP_SAJIKAN => 'Siap Sajikan',
    ];

    // Status valid untuk reservasi
    private const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

    /**
     * Ambil semua order aktif milik tenant yang sedang login, dikelompokkan untuk KDS.
     * TenantScope pada model Order otomatis menyaring berdasarkan Auth::user()->tenant_id
     * karena route ini ada di grup middleware ['auth', 'tenant'].
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
     * Endpoint publik (dipanggil dari halaman menu QR tamu, belum login).
     *
     * BUG-006 FIX: tenant_id TIDAK LAGI diterima langsung dari request body.
     * Tenant sekarang diidentifikasi melalui outlet_slug (path param dari URL QR:
     * /order/{outlet_slug}?table=5). Lookup outlet berdasarkan slug memastikan
     * bahwa hanya outlet yang terdaftar di sistem yang bisa menerima pesanan.
     *
     * Jika outlet_slug belum ada di DB (fitur belum diimplementasi penuh), endpoint
     * fallback menerima outlet_id tervalidasi dan mengambil tenant_id dari outlet.
     * Ini JAUH lebih aman dari sebelumnya karena client tidak pernah mengirim tenant_id.
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
        ]);

        // S-11: delegasikan ke GuestOrderService (logika bisnis dipusatkan).
        // Tangkap 422 dari service agar response tetap {success:false,message:...}.
        try {
            $order = $this->guestOrderService->create($validated);
        } catch (HttpResponseException $e) {
            throw $e;
        } catch (HttpException $e) {
            if ($e->getStatusCode() === 422) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }
            throw $e;
        }

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
     * BUG-006 FIX: tenant diambil dari outlet_id, bukan dari request param.
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
            ->first();

        if (! $order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
        }

        return response()->json([
            'success' => true,
            'status' => self::KDS_STATUS_LABELS[$order->status] ?? $order->status,
            'tone' => $this->toneForStatus($order->status),
        ]);
    }

    /**
     * Update status order dari KDS. Hanya bisa untuk order milik tenant yang login
     * (TenantScope + OrderPolicy keduanya menegakkan ini).
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
            // Selesai dimasak -> pindah ke antrean kasir (siap dibayar).
            $order->update(['status' => Order::STATUS_SIAP_BAYAR]);
        } else {
            $map = array_flip(self::KDS_STATUS_LABELS);
            $order->update(['status' => $map[$statusInput]]);
        }

        return response()->json(['success' => true]);
    }

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
     * Tandai order sudah dibayar & selesai (dipanggil setelah transaksi kasir settle).
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

    // =========================================================================
    // DEBT-001 FIX: Print Jobs → DB
    // =========================================================================

    /**
     * DEBT-001 FIX: Daftar print job dari DB, bukan Cache.
     */
    public function getPrintJobs(Request $request)
    {
        $jobs = PrintJob::orderByDesc('created_at')
            ->take(50)
            ->get()
            ->map(fn ($j) => [
                'id' => $j->job_code,
                'type' => $j->type,
                'orderId' => $j->order_ref ?? '-',
                'target' => $j->target,
                'status' => $j->status,
                'time' => $j->created_at->diffForHumans(),
                'error' => $j->error,
                'retryCount' => $j->retry_count,
            ]);

        return response()->json($jobs);
    }

    /**
     * DEBT-001 FIX: Cetak struk → simpan ke tabel print_jobs.
     */
    public function printReceipt(Request $request)
    {
        $request->validate([
            'orderId' => 'nullable|string|max:50',
            'table' => 'required|string|max:50',
            'total' => 'required|numeric|min:0',
        ]);

        $tenantId = $this->ctx->id();
        $orderId = $request->input('orderId') ?? 'TRX-'.date('ymd').'-'.rand(1000, 9999);

        PrintJob::create([
            'tenant_id' => $tenantId,
            'job_code' => PrintJob::generateCode($tenantId),
            'type' => 'Struk Kasir (BT)',
            'order_ref' => $orderId,
            'target' => 'Kasir Depan (Bluetooth)',
            'status' => 'printing',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cetak struk ke printer Bluetooth berhasil dimulai.',
        ]);
    }

    // =========================================================================
    // DEBT-001 FIX: Receipt Config → DB
    // =========================================================================

    /**
     * DEBT-001 FIX: Ambil receipt config dari DB (auto-create default jika belum ada).
     */
    public function getReceiptConfig(Request $request)
    {
        $config = ReceiptConfig::forTenant($this->ctx->id());

        return response()->json($config->toArray());
    }

    /**
     * DEBT-001 FIX: Simpan receipt config ke DB.
     */
    public function updateReceiptConfig(Request $request)
    {
        $validated = $request->validate([
            'header' => 'sometimes|string|max:255',
            'footer' => 'sometimes|string|max:1000',
            'show_npwp' => 'sometimes|boolean',
            'show_nib' => 'sometimes|boolean',
            'show_service_charge' => 'sometimes|boolean',
            'show_pbjt' => 'sometimes|boolean',
            'paper_width' => 'sometimes|in:58mm,80mm',
            'font_type' => 'sometimes|in:font-a,font-b',
            'print_density' => 'sometimes|in:light,normal,dark',
            'auto_write_cashier' => 'sometimes|boolean',
            'void_policy' => 'sometimes|in:audit_full,audit_minimal,no_audit',
        ]);

        $config = ReceiptConfig::forTenant($this->ctx->id());
        $config->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Format struk berhasil diperbarui.',
            'config' => $config->fresh()->toArray(),
        ]);
    }

    // =========================================================================
    // DEBT-001 + BUG-007 + BUG-008 FIX: Reservasi → DB + validasi + ownership
    // =========================================================================

    /**
     * DEBT-001 FIX: Daftar reservasi dari DB.
     */
    public function getReservations(Request $request)
    {
        $request->validate(['outlet_id' => 'required|integer|exists:outlets,id']);

        // S-13: delegasikan ke ReservationService.
        $reservations = $this->reservationService->listForOutlet((int) $request->input('outlet_id'));

        return response()->json(['reservations' => $reservations]);
    }

    /**
     * DEBT-001 FIX: Simpan reservasi ke DB.
     * Tamu masih perlu outlet_id supaya tenant bisa diidentifikasi tanpa login.
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

        // S-13: delegasikan ke ReservationService.
        $reservation = $this->reservationService->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil dibuat',
            'reservation' => $reservation,
        ]);
    }

    /**
     * BUG-007 FIX: Validasi status yang ketat.
     * BUG-008 FIX: Cek kepemilikan tenant sebelum update.
     * DEBT-001 FIX: Update dari DB, bukan Cache.
     */
    public function updateReservationStatus(Request $request, $id)
    {
        // BUG-007 FIX: Validasi nilai status yang diizinkan
        $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', self::RESERVATION_STATUSES)],
        ]);

        // S-13: delegasikan ke ReservationService (validasi + ownership di sana).
        $reservation = $this->reservationService->updateStatus(
            $id,
            $request->input('status'),
            $this->ctx->id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Status reservasi berhasil diperbarui',
        ]);
    }

    // =========================================================================
    // Public Guest — Jam Operasional Outlet
    // =========================================================================

    /**
     * GET /api/outlet-operating-hours?outlet={slug|id}
     *
     * Endpoint publik untuk CustomerView — tidak butuh auth.
     * Return: { is_open_now, operating_hours }
     */
    public function getOutletOperatingHours(Request $request): JsonResponse
    {
        $outletParam = $request->query('outlet', '');

        // Resolve outlet by slug (global-unique → unambiguous, bebas collision lintas tenant).
        // orWhere('id') DIHAPUS: membolehkan tamu passing id outlet orang lain untuk
        // mengambil jam operasional tenant lain (info-leak). Slug sudah cukup sebagai
        // identifier publik tunggal untuk endpoint guest.
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

    // =========================================================================
    // Helpers
    // =========================================================================

    private function toneForStatus(string $status): string
    {
        return match ($status) {
            Order::STATUS_SEDANG_DIMASAK => 'blue',
            Order::STATUS_SIAP_SAJIKAN, Order::STATUS_SIAP_BAYAR, Order::STATUS_SELESAI => 'emerald',
            default => 'amber',
        };
    }
}
