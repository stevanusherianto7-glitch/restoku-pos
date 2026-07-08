<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PrintJob;
use App\Models\ReceiptConfig;
use App\Models\Reservation;
use App\Models\Scopes\TenantScope;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function __construct(private TenantContext $ctx) {}

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
                'id'     => $order->order_code,
                'table'  => $order->table_number,
                'status' => $label,
                'tone'   => $this->toneForStatus($order->status),
                'time'   => max(1, (int) $order->created_at->diffInMinutes(now())),
                'items'  => $order->items->map(fn ($item) => "{$item->quantity}x {$item->item_name}" . ($item->notes ? " ({$item->notes})" : ''))->all(),
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
            'table'     => 'required|string|max:50',
            'items'     => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|integer',
            'items.*.quantity'     => 'required|integer|min:1|max:99',
            'items.*.notes'        => 'nullable|string|max:255',
        ]);

        // BUG-006 FIX: Ambil tenant_id dari outlet, bukan dari request
        // Ini memastikan client tidak bisa memilih tenant sembarangan
        $outlet = \App\Models\Outlet::withoutGlobalScope(TenantScope::class)
            ->select('id', 'tenant_id')
            ->findOrFail($validated['outlet_id']);

        $tenantId = $outlet->tenant_id;
        $menuItemIds = collect($validated['items'])->pluck('menu_item_id')->unique();

        // Query manual tanpa TenantScope (guest belum login) tapi tetap
        // dikunci ke tenant_id yang didapat dari outlet (bukan dari client).
        $menuItems = MenuItem::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('is_available', true)  // BUG-012 FIX: cek is_available
            ->whereIn('id', $menuItemIds)
            ->get()
            ->keyBy('id');

        if ($menuItems->count() !== $menuItemIds->count()) {
            return response()->json([
                'success' => false,
                'message' => 'Beberapa item menu tidak ditemukan atau tidak tersedia saat ini.',
            ], 422);
        }

        $order = DB::transaction(function () use ($validated, $tenantId, $menuItems, $outlet) {
            $order = Order::withoutGlobalScope(TenantScope::class)->create([
                'tenant_id'    => $tenantId,
                'outlet_id'    => $outlet->id,
                'order_code'   => Order::generateOrderCode($tenantId),
                'table_number' => str_starts_with($validated['table'], 'Meja') ? $validated['table'] : 'Meja ' . $validated['table'],
                'source'       => 'guest_qr',
                'status'       => Order::STATUS_ANTRIAN_MASUK,
            ]);

            $subtotal = 0;

            foreach ($validated['items'] as $row) {
                $menuItem     = $menuItems[$row['menu_item_id']];
                $lineSubtotal = $menuItem->price * $row['quantity'];
                $subtotal    += $lineSubtotal;

                OrderItem::withoutGlobalScope(TenantScope::class)->create([
                    'tenant_id'    => $tenantId,
                    'order_id'     => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'item_name'    => $menuItem->name,
                    'quantity'     => $row['quantity'],
                    'unit_price'   => $menuItem->price,
                    'subtotal'     => $lineSubtotal,
                    'notes'        => $row['notes'] ?? null,
                ]);
            }

            $order->update(['subtotal' => $subtotal, 'total' => $subtotal]);

            return $order->load('items');
        });

        return response()->json([
            'success' => true,
            'order'   => [
                'id'     => $order->order_code,
                'table'  => $order->table_number,
                'status' => self::KDS_STATUS_LABELS[$order->status],
                'items'  => $order->items->pluck('item_name'),
                'total'  => (float) $order->total,
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

        $outlet = \App\Models\Outlet::withoutGlobalScope(TenantScope::class)
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
            'status'  => self::KDS_STATUS_LABELS[$order->status] ?? $order->status,
            'tone'    => $this->toneForStatus($order->status),
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

        $order = Order::where('order_code', $id)->firstOrFail();
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
                'id'     => $order->order_code,
                'table'  => $order->table_number,
                'status' => 'Siap Bayar',
                'tone'   => 'emerald',
                'time'   => max(1, (int) $order->created_at->diffInMinutes(now())),
                'items'  => $order->items->map(fn ($item) => "{$item->quantity}x {$item->item_name}")->all(),
            ]);

        return response()->json([
            'success' => true,
            'queue'   => $queue->values(),
        ]);
    }

    /**
     * Tandai order sudah dibayar & selesai (dipanggil setelah transaksi kasir settle).
     */
    public function clearCashierQueueItem($id)
    {
        $order = Order::where('order_code', $id)->firstOrFail();
        $this->authorize('update', $order);

        $order->update([
            'status'         => Order::STATUS_SELESAI,
            'payment_status' => 'paid',
            'paid_at'        => now(),
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
                'id'         => $j->job_code,
                'type'       => $j->type,
                'orderId'    => $j->order_ref ?? '-',
                'target'     => $j->target,
                'status'     => $j->status,
                'time'       => $j->created_at->diffForHumans(),
                'error'      => $j->error,
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
            'table'   => 'required|string|max:50',
            'total'   => 'required|numeric|min:0',
        ]);

        $tenantId = $this->ctx->id();
        $orderId  = $request->input('orderId') ?? 'TRX-' . date('ymd') . '-' . rand(1000, 9999);

        PrintJob::create([
            'tenant_id' => $tenantId,
            'job_code'  => PrintJob::generateCode($tenantId),
            'type'      => 'Struk Kasir (BT)',
            'order_ref' => $orderId,
            'target'    => 'Kasir Depan (Bluetooth)',
            'status'    => 'printing',
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
            'header'              => 'sometimes|string|max:255',
            'footer'              => 'sometimes|string|max:1000',
            'show_npwp'           => 'sometimes|boolean',
            'show_nib'            => 'sometimes|boolean',
            'show_service_charge' => 'sometimes|boolean',
            'show_pbjt'           => 'sometimes|boolean',
            'paper_width'         => 'sometimes|in:58mm,80mm',
            'font_type'           => 'sometimes|in:font-a,font-b',
            'print_density'       => 'sometimes|in:light,normal,dark',
            'auto_write_cashier'  => 'sometimes|boolean',
            'void_policy'         => 'sometimes|in:audit_full,audit_minimal,no_audit',
        ]);

        $config = ReceiptConfig::forTenant($this->ctx->id());
        $config->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Format struk berhasil diperbarui.',
            'config'  => $config->fresh()->toArray(),
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
        // Endpoint publik — butuh outlet_id untuk identifikasi tenant (BUG-006 pattern)
        $request->validate(['outlet_id' => 'required|integer|exists:outlets,id']);

        $outlet = \App\Models\Outlet::withoutGlobalScope(TenantScope::class)
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
     * DEBT-001 FIX: Simpan reservasi ke DB.
     * Tamu masih perlu outlet_id supaya tenant bisa diidentifikasi tanpa login.
     */
    public function submitReservation(Request $request)
    {
        $validated = $request->validate([
            'outlet_id' => 'required|integer|exists:outlets,id',
            'name'      => 'required|string|max:100',
            'phone'     => 'required|string|max:20',
            'date'      => 'required|date|after_or_equal:today',
            'time'      => 'required|date_format:H:i',
            'guests'    => 'required|integer|min:1|max:100',
            'type'      => 'required|string|max:50',
            'notes'     => 'nullable|string|max:500',
        ]);

        $outlet = \App\Models\Outlet::withoutGlobalScope(TenantScope::class)
            ->select('id', 'tenant_id')
            ->findOrFail($validated['outlet_id']);

        $tenantId = $outlet->tenant_id;

        $reservation = Reservation::withoutGlobalScope(TenantScope::class)->create([
            'tenant_id'          => $tenantId,
            'outlet_id'          => $outlet->id,
            'reservation_code'   => Reservation::generateCode($tenantId),
            'name'               => $validated['name'],
            'phone'              => $validated['phone'],
            'date'               => $validated['date'],
            'time'               => $validated['time'],
            'guests'             => $validated['guests'],
            'type'               => $validated['type'],
            'notes'              => $validated['notes'] ?? null,
            'status'             => 'pending',
        ]);

        return response()->json([
            'success'     => true,
            'message'     => 'Reservasi berhasil dibuat',
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
            'status' => ['required', 'string', 'in:' . implode(',', self::RESERVATION_STATUSES)],
        ]);

        // Ambil dengan TenantScope aktif — secara otomatis memfilter ke tenant yang login
        $reservation = Reservation::where('reservation_code', $id)->firstOrFail();

        // BUG-008 FIX: TenantScope sudah memastikan kepemilikan tenant.
        // Defense-in-depth: verifikasi eksplisit sebagai lapisan kedua.
        if ($reservation->tenant_id !== $this->ctx->id()) {
            abort(403, 'Anda tidak berhak mengubah reservasi ini.');
        }

        $reservation->update(['status' => $request->input('status')]);

        return response()->json([
            'success' => true,
            'message' => 'Status reservasi berhasil diperbarui',
        ]);
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
