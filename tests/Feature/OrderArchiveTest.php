<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderArchive;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\OrderArchiveService;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Fase 4.6 — Verifikasi arsip orders (akurat, idempoten, isolasi tenant).
 */
class OrderArchiveTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrder(Tenant $t, Outlet $o, string $date, string $status): Order
    {
        return Order::create([
            'tenant_id' => $t->id,
            'outlet_id' => $o->id,
            'order_code' => 'ORD-'.$t->id.'-'.$date.'-'.$status.'-'.uniqid(),
            'status' => $status,
            'subtotal' => 10000,
            'total' => 10000,
            'payment_status' => 'paid',
            'created_at' => $date.' 10:00:00',
            'updated_at' => $date.' 10:00:00',
        ]);
    }

    public function test_archive_memindahkan_order_lama_dan_menghapus_dari_hot(): void
    {
        $t = Tenant::create(['name' => 'T', 'brand_name' => 'T', 'email' => 't@x.com', 'phone' => '1']);
        $o = Outlet::create(['tenant_id' => $t->id, 'name' => 'O', 'address' => 'a']);
        app(TenantContext::class)->setTenantId($t->id);

        // Order lama (2 tahun) selesai → layak arsip
        $old = $this->makeOrder($t, $o, now()->subYears(2)->toDateString(), Order::STATUS_SELESAI);
        // Order baru → tidak diarsip
        $new = $this->makeOrder($t, $o, now()->toDateString(), Order::STATUS_SELESAI);
        // Order lama tapi masih antrian → tidak diarsip
        $pending = $this->makeOrder($t, $o, now()->subYears(2)->toDateString(), Order::STATUS_ANTRIAN_MASUK);

        $service = app(OrderArchiveService::class);
        $result = $service->archive(6, $t->id, null, false);

        $this->assertEquals(1, $result['archived']);
        $this->assertDatabaseHas('orders_archive', ['id' => $old->id]);
        $this->assertDatabaseMissing('orders', ['id' => $old->id]);
        // Yang baru & pending tetap di hot
        $this->assertDatabaseHas('orders', ['id' => $new->id]);
        $this->assertDatabaseHas('orders', ['id' => $pending->id]);
    }

    public function test_archive_idempoten(): void
    {
        $t = Tenant::create(['name' => 'T2', 'brand_name' => 'T2', 'email' => 't2@x.com', 'phone' => '2']);
        $o = Outlet::create(['tenant_id' => $t->id, 'name' => 'O2', 'address' => 'a']);
        app(TenantContext::class)->setTenantId($t->id);

        $old = $this->makeOrder($t, $o, now()->subYears(1)->toDateString(), Order::STATUS_SELESAI);

        $service = app(OrderArchiveService::class);
        $r1 = $service->archive(6, $t->id);
        $r2 = $service->archive(6, $t->id); // jalan 2x

        $this->assertEquals(1, $r1['archived']);
        $this->assertEquals(0, $r2['archived'], 'Run ke-2 harus 0 (sudah diarsip)');
        $this->assertEquals(1, OrderArchive::count());
    }

    public function test_isolasi_arsip_antar_tenant(): void
    {
        $tA = Tenant::create(['name' => 'A', 'brand_name' => 'A', 'email' => 'a@x.com', 'phone' => '3']);
        $tB = Tenant::create(['name' => 'B', 'brand_name' => 'B', 'email' => 'b@x.com', 'phone' => '4']);
        $oA = Outlet::create(['tenant_id' => $tA->id, 'name' => 'OA', 'address' => 'a']);

        $oldA = $this->makeOrder($tA, $oA, now()->subYears(3)->toDateString(), Order::STATUS_SELESAI);
        $service = app(OrderArchiveService::class);
        $service->archive(6, $tA->id);

        // Tenant B tidak melihat archive A
        $this->assertEquals(0, OrderArchive::where('tenant_id', $tB->id)->count());
        $this->assertEquals(1, OrderArchive::where('tenant_id', $tA->id)->count());
    }

    public function test_pending_count_sesuai(): void
    {
        $t = Tenant::create(['name' => 'T3', 'brand_name' => 'T3', 'email' => 't3@x.com', 'phone' => '5']);
        $o = Outlet::create(['tenant_id' => $t->id, 'name' => 'O3', 'address' => 'a']);
        app(TenantContext::class)->setTenantId($t->id);

        $this->makeOrder($t, $o, now()->subYears(2)->toDateString(), Order::STATUS_SELESAI);
        $this->makeOrder($t, $o, now()->subYears(2)->toDateString(), Order::STATUS_DIBATALKAN);
        $this->makeOrder($t, $o, now()->toDateString(), Order::STATUS_SELESAI);

        $service = app(OrderArchiveService::class);
        $this->assertEquals(2, $service->pendingCount(6, $t->id));
    }
}
