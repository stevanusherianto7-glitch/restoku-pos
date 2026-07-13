<?php

namespace Database\Seeders;

use App\Models\Outlet;
use App\Models\OutletTable;
use App\Models\Order;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class OutletTableSeeder extends Seeder
{
    /**
     * Backfill outlet_tables dari meja yg pernah dipakai di orders,
     * + beberapa default (A1..A5) kalau outlet belum punya meja sama sekali.
     * PIN meja di-derive stabil (OutletTable::derivePin) lalu di-hash.
     */
    public function run(): void
    {
        $outlets = Outlet::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->get();

        foreach ($outlets as $outlet) {
            // kumpulkan label meja unik dari orders
            $used = Order::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
                ->where('outlet_id', $outlet->id)
                ->whereNotNull('table_number')
                ->pluck('table_number')
                ->map(fn ($t) => trim((string) $t))
                ->filter(fn ($t) => $t !== '' && $t !== 'Meja 1')
                ->unique()
                ->values()
                ->all();

            if (empty($used)) {
                $used = ['A1', 'A2', 'A3', 'A4', 'A5'];
            }

            foreach ($used as $label) {
                OutletTable::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
                    ->updateOrCreate(
                        ['outlet_id' => $outlet->id, 'label' => $label],
                        [
                            'tenant_id' => $outlet->tenant_id,
                            'pin_hash' => Hash::make(OutletTable::derivePin($outlet->id, $label)),
                            'latitude' => $outlet->latitude,
                            'longitude' => $outlet->longitude,
                        ],
                    );
            }
        }
    }
}
