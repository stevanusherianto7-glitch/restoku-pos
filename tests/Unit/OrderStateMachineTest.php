<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * S-07 — Unit test state-machine order.
 * Guard transisi ilegal (mundur) supaya status tidak bisa diputar balik.
 */
class OrderStateMachineTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrder(string $status): Order
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => uniqid().'@test.com', 'phone' => '081']);

        return Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-SM-'.uniqid(),
            'table_number' => '1',
            'status' => $status,
            'total' => 0,
        ]);
    }

    /** Forward transitions yang diizinkan per TRANSITIONS (5-tahap ketat). */
    public function test_forward_transitions_allowed(): void
    {
        $order = $this->makeOrder(Order::STATUS_ANTRIAN_MASUK);
        // antrian_masuk hanya boleh -> diterima (atau dibatalkan).
        $this->assertTrue($order->canTransitionTo(Order::STATUS_DITERIMA));
        $this->assertTrue($order->canTransitionTo(Order::STATUS_DIBATALKAN));
        // TIDAK boleh loncat tahap (guard S-07).
        $this->assertFalse($order->canTransitionTo(Order::STATUS_SEDANG_DIMASAK));
        $this->assertFalse($order->canTransitionTo(Order::STATUS_SIAP_SAJIKAN));
        $this->assertFalse($order->canTransitionTo(Order::STATUS_SIAP_BAYAR));
        $this->assertFalse($order->canTransitionTo(Order::STATUS_SELESAI));
    }

    /** Transisi mundur (siap_bayar -> antrian_masuk) HARUS ditolak. */
    public function test_reverse_transition_rejected(): void
    {
        $order = $this->makeOrder(Order::STATUS_SIAP_BAYAR);
        $this->assertFalse($order->canTransitionTo(Order::STATUS_ANTRIAN_MASUK));
        $this->assertFalse($order->canTransitionTo(Order::STATUS_SEDANG_DIMASAK));
        $this->assertFalse($order->canTransitionTo(Order::STATUS_SIAP_SAJIKAN));
    }

    /** Status terminal tidak bisa transisi ke mana pun (selesai/dibatalkan). */
    public function test_terminal_states_locked(): void
    {
        $done = $this->makeOrder(Order::STATUS_SELESAI);
        $this->assertFalse($done->canTransitionTo(Order::STATUS_SIAP_BAYAR));
        $this->assertFalse($done->canTransitionTo(Order::STATUS_ANTRIAN_MASUK));

        $cancelled = $this->makeOrder(Order::STATUS_DIBATALKAN);
        $this->assertFalse($cancelled->canTransitionTo(Order::STATUS_SELESAI));
    }

    /** Set status sama = idempoten (no-op, diizinkan). */
    public function test_same_status_is_idempotent(): void
    {
        $order = $this->makeOrder(Order::STATUS_SEDANG_DIMASAK);
        $this->assertTrue($order->canTransitionTo(Order::STATUS_SEDANG_DIMASAK));
    }

    /** transitionTo() throw pada transisi ilegal. */
    public function test_transition_to_throws_on_illegal(): void
    {
        $order = $this->makeOrder(Order::STATUS_SIAP_BAYAR);

        $this->expectException(\InvalidArgumentException::class);
        $order->transitionTo(Order::STATUS_ANTRIAN_MASUK);
    }

    /** transitionTo() apply + persist transisi legal (per-tahap). */
    public function test_transition_to_applies_legal(): void
    {
        $order = $this->makeOrder(Order::STATUS_ANTRIAN_MASUK);
        $order->transitionTo(Order::STATUS_DITERIMA);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => Order::STATUS_DITERIMA,
        ]);
    }
}
