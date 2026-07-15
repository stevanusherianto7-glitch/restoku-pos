<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\Scopes\TenantScope;

/**
 * S-11 — Extract guest QR-menu order creation dari OrderController::submitOrder.
 * Logika bisnis pembuatan pesanan tamu (validasi item, tenant dari outlet,
 * transaksi DB) dipusatkan di sini agar OrderController tipis & testable.
 *
 * Keamanan (BUG-006/012 tetap dijaga):
 *  - tenant_id DIAMBIL dari outlet (bukan dari request client).
 *  - item dicek is_available + terikat tenant outlet.
 */
class GuestOrderService
{
    /**
     * Buat pesanan dari tamu (halaman menu QR, belum login).
     *
     * @param  array{outlet_id:int,table:string,items:array<int,array{menu_item_id:int,quantity:int,notes?:string}>}  $validated
     */
    public function create(array $validated): Order
    {
        // Ambil tenant_id dari outlet, bukan dari request (BUG-006 FIX).
        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->select('id', 'tenant_id')
            ->findOrFail($validated['outlet_id']);

        $tenantId = $outlet->tenant_id;
        $menuItemIds = collect($validated['items'])->pluck('menu_item_id')->unique();

        // Query tanpa TenantScope (guest belum login) tapi dikunci ke tenant outlet.
        $menuItems = MenuItem::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('is_available', true) // BUG-012 FIX: cek is_available
            ->whereIn('id', $menuItemIds)
            ->get()
            ->keyBy('id');

        if ($menuItems->count() !== $menuItemIds->count()) {
            abort(422, 'Beberapa item menu tidak ditemukan atau tidak tersedia saat ini.');
        }

        return \DB::transaction(function () use ($validated, $tenantId, $menuItems, $outlet) {
            $order = Order::withoutGlobalScope(TenantScope::class)->create([
                'tenant_id' => $tenantId,
                'outlet_id' => $outlet->id,
                'order_code' => Order::generateOrderCode($tenantId),
                'table_number' => str_starts_with($validated['table'], 'Meja')
                    ? $validated['table']
                    : 'Meja '.$validated['table'],
                'source' => 'guest_qr',
                'status' => Order::STATUS_ANTRIAN_MASUK,
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
    }
}
