<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\Reservation;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Collection;

/**
 * S-13 — Extract reservasi flow dari OrderController.
 * Logika pembuatan/update reservasi (tenant dari outlet, BUG-007 status
 * validation, BUG-008 ownership) dipusatkan di sini agar controller tipis.
 */
class ReservationService
{
    /**
     * Daftar reservasi milik tenant (by outlet_id publik → resolve tenant).
     *
     * @return Collection
     */
    public function listForOutlet(int $outletId)
    {
        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->select('id', 'tenant_id')
            ->findOrFail($outletId);

        return Reservation::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $outlet->tenant_id)
            ->orderBy('date')
            ->orderBy('time')
            ->get();
    }

    /**
     * Buat reservasi dari tamu (butuh outlet_id untuk identifikasi tenant).
     *
     * @param  array{outlet_id:int,name:string,phone:string,date:string,time:string,guests:int,type:string,notes?:string}  $validated
     */
    public function create(array $validated): Reservation
    {
        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->select('id', 'tenant_id')
            ->findOrFail($validated['outlet_id']);

        $tenantId = $outlet->tenant_id;

        return Reservation::withoutGlobalScope(TenantScope::class)->create([
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
    }

    /**
     * Update status reservasi dengan validasi + ownership (BUG-007/008).
     * Validasi nilai status ditangani controller (in:RESERVATION_STATUSES);
     * di sini cukup cek kepemilikan tenant (defense-in-depth).
     */
    public function updateStatus(string $code, string $status, int $currentTenantId): Reservation
    {
        $reservation = Reservation::where('reservation_code', $code)->firstOrFail();

        // BUG-008 FIX: defense-in-depth kepemilikan tenant.
        if ($reservation->tenant_id !== $currentTenantId) {
            abort(403, 'Anda tidak berhak mengubah reservasi ini.');
        }

        $reservation->update(['status' => $status]);

        return $reservation;
    }
}
