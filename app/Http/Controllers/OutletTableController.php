<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\OutletTable;
use App\Models\Scopes\TenantScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * OutletTableController — manajemen meja outlet (PIN untuk display ke owner/waiter).
 * Semua method butuh auth+tenant (didefinisikan di routes).
 */
class OutletTableController extends Controller
{
    /**
     * List meja per outlet dengan PIN plaintext (untuk ditampilkan ke owner/waiter,
     * bukan untuk tamu). PIN di-derive ulang dari seed deterministik.
     */
    public function index(Request $request, int $outletId): JsonResponse
    {
        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->where('id', $outletId)
            ->first();

        if (! $outlet || $outlet->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tables = OutletTable::withoutGlobalScope(TenantScope::class)
            ->where('outlet_id', $outlet->id)
            ->orderBy('label')
            ->get(['id', 'outlet_id', 'label', 'latitude', 'longitude']);

        return response()->json([
            'outlet' => ['id' => $outlet->id, 'name' => $outlet->name],
            'tables' => $tables->map(fn ($t) => [
                'id' => $t->id,
                'label' => $t->label,
                'pin' => $t->pin,
                'latitude' => $t->latitude,
                'longitude' => $t->longitude,
            ]),
        ]);
    }
}
