<?php
// Seed KDS demo orders (status antrian/dimasak) for localhost dev.
// Run: php artisan tinker scripts/seed_kds_orders.php
$t = App\Models\Tenant::first();
if (! $t) { echo "no tenant\n"; return; }
$o = App\Models\Outlet::where('tenant_id', $t->id)->first();
if (! $o) { echo "no outlet\n"; return; }

$existing = App\Models\Order::whereIn('status', ['antrian','dimasak','siap'])->count();
if ($existing > 0) { echo "already {$existing} KDS orders\n"; return; }

App\Models\Order::create([
    'tenant_id' => $t->id,
    'outlet_id' => $o->id,
    'order_code' => 'KDS-' . time() . '-A1',
    'table_number' => 'A1',
    'status' => 'antrian_masuk',
    'total' => 45000,
    'items' => json_encode([['name'=>'Ayam Penyet','qty'=>1],['name'=>'Es Teh Manis','qty'=>1]]),
]);
$oa = App\Models\Order::where('order_code', 'KDS-' . time() . '-A1')->first();
$oa->items()->createMany([
    ['tenant_id'=>$t->id,'item_name'=>'Ayam Penyet','quantity'=>1,'unit_price'=>32000,'subtotal'=>32000,'line_total'=>32000],
    ['tenant_id'=>$t->id,'item_name'=>'Es Teh Manis','quantity'=>1,'unit_price'=>13000,'subtotal'=>13000,'line_total'=>13000],
]);
App\Models\Order::create([
    'tenant_id' => $t->id,
    'outlet_id' => $o->id,
    'order_code' => 'KDS-' . time() . '-B2',
    'table_number' => 'B2',
    'status' => 'sedang_dimasak',
    'total' => 32000,
    'items' => json_encode([['name'=>'Nasi Goreng Spesial','qty'=>1]]),
]);
$ob = App\Models\Order::where('order_code', 'KDS-' . time() . '-B2')->first();
$ob->items()->createMany([
    ['tenant_id'=>$t->id,'item_name'=>'Nasi Goreng Spesial','quantity'=>1,'unit_price'=>32000,'subtotal'=>32000,'line_total'=>32000],
]);
echo "seeded 2 KDS orders\n";
