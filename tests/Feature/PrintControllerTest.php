<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrintControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto Print',
            'brand_name' => 'Print',
            'email' => 'print@test.com',
            'phone' => '081111',
        ]);

        $this->outlet = Outlet::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Outlet Print',
            'address' => 'Jl. Print',
        ]);

        $this->cashier = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Kasir Print',
            'email' => 'kasir@print.com',
            'password' => bcrypt('password'),
            'role' => 'cashier',
        ]);
    }

    public function test_get_print_jobs_returns_empty_when_no_jobs(): void
    {
        $response = $this->actingAs($this->cashier)
            ->getJson('/api/print-jobs');

        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    public function test_print_receipt_creates_print_job(): void
    {
        $response = $this->actingAs($this->cashier)
            ->postJson('/api/print-receipt', [
                'table' => 'Meja 1',
                'total' => 50000,
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('print_jobs', [
            'tenant_id' => $this->tenant->id,
            'type' => 'Struk Kasir (BT)',
        ]);
    }

    public function test_get_receipt_config_returns_config(): void
    {
        $response = $this->actingAs($this->cashier)
            ->getJson('/api/receipt-config');

        $response->assertStatus(200);
    }

    public function test_update_receipt_config_success(): void
    {
        $response = $this->actingAs($this->cashier)
            ->postJson('/api/receipt-config', [
                'header' => 'Resto Baru',
                'footer' => 'Terima kasih',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}
