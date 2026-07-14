<?php

namespace Tests\Feature;

use App\Http\Middleware\VerifyCsrfToken;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class Lapisan2RoutesTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $tenant = Tenant::create([
            'name' => 'Resto Test',
            'brand_name' => 'Test',
            'email' => 't@test.com',
            'phone' => '081',
        ]);

        $outlet = Outlet::create([
            'tenant_id' => $tenant->id,
            'name' => 'Outlet Test',
            'address' => 'Jl. Test',
        ]);

        $this->owner = User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        app(TenantContext::class)->setFromUser($this->owner);
    }

    public function test_laporan_routes_return_200(): void
    {
        $routes = [
            '/laporan/laba-rugi',
            '/laporan/produk',
            '/laporan/shift',
            '/laporan/meja',
            '/laporan/void',
            '/owner/kehadiran',
            '/owner/jadwal-shift',
            '/biaya-operasional',
        ];

        foreach ($routes as $route) {
            $this->actingAs($this->owner)
                ->get($route)
                ->assertStatus(200, "Route {$route} should return 200");
        }

        $this->assertTrue(true);
    }

    public function test_biaya_operasional_store_persists_expense(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);

        $payload = [
            'category' => 'listrik',
            'description' => 'Token PLN',
            'amount' => 150000,
            'expense_date' => '2026-07-14',
            'is_recurring' => false,
        ];

        $this->actingAs($this->owner)
            ->post('/biaya-operasional', $payload)
            ->assertRedirect();

        $this->assertDatabaseHas('expenses', [
            'category' => 'listrik',
            'amount' => 150000,
        ]);
    }
}
