<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\OutletTable;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tests\Traits\HasTenantSetup;

class OutletTableControllerTest extends TestCase
{
    use HasTenantSetup;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupTenantEnvironment();
    }

    public function test_requires_authentication(): void
    {
        $this->getJson("/api/outlet-tables/{$this->testOutlet->id}")
            ->assertUnauthorized();
    }

    public function test_returns_tables_with_pins_for_own_outlet(): void
    {
        OutletTable::withoutGlobalScopes()->create([
            'tenant_id' => $this->testTenant->id,
            'outlet_id' => $this->testOutlet->id,
            'label' => 'A1',
            'pin_hash' => Hash::make(OutletTable::derivePin($this->testOutlet->id, 'A1')),
        ]);

        $resp = $this->actingAs($this->testOwner)
            ->getJson("/api/outlet-tables/{$this->testOutlet->id}");

        $resp->assertOk();
        $resp->assertJsonCount(1, 'tables');
        $resp->assertJsonPath('tables.0.label', 'A1');
        // PIN deterministik sama dengan derivePin
        $this->assertSame(
            OutletTable::derivePin($this->testOutlet->id, 'A1'),
            $resp->json('tables.0.pin')
        );
    }

    public function test_rejects_other_tenant_outlet(): void
    {
        $other = Tenant::create([
            'name' => 'Other', 'brand_name' => 'Other', 'email' => 'o@o.com', 'phone' => '1',
        ]);
        $otherOutlet = Outlet::withoutGlobalScopes()->create([
            'tenant_id' => $other->id, 'name' => 'X', 'address' => 'Y',
        ]);

        $this->actingAs($this->testOwner)
            ->getJson("/api/outlet-tables/{$otherOutlet->id}")
            ->assertForbidden();
    }
}
