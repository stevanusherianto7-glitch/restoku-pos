<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OutletSettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $staff;

    private Tenant $tenant;

    private Outlet $outlet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto Test',
            'brand_name' => 'Resto Test',
            'email' => 'test@resto.com',
            'phone' => '0812345',
            'tax_type' => 'pbjt',
            'pbjt_rate' => 10.00,
            'service_charge_rate' => 0.00,
        ]);

        $this->outlet = Outlet::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Outlet Utama',
            'slug' => 'outlet-test-1',
            'address' => 'Jl. Test No. 1',
            'latitude' => -6.20,
            'longitude' => 106.82,
            'geo_radius_meters' => 50,
        ]);

        $this->owner = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'password' => bcrypt('password'),
            'role' => 'owner',
        ]);

        $this->staff = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Kasir',
            'email' => 'kasir@test.com',
            'password' => bcrypt('password'),
            'role' => 'cashier',
        ]);
    }

    // ─── GET /pengaturan-outlet ────────────────────────────────────────────────

    public function test_index_requires_authentication(): void
    {
        $this->get('/pengaturan-outlet')->assertRedirect('/login');
    }

    public function test_index_returns_real_tenant_data_in_props(): void
    {
        $response = $this->actingAs($this->owner)->get('/pengaturan-outlet');
        $response->assertStatus(200);

        // Inertia component name
        $response->assertInertia(fn ($page) => $page->component('PengaturanOutlet/Index')
            ->has('tenant')
            ->has('outlet')
            ->has('employees')
            ->where('tenant.name', 'Resto Test')
            ->where('tenant.tax_type', 'pbjt')
        );
    }

    // ─── PUT /api/outlet-settings/profil ──────────────────────────────────────

    public function test_update_profil_saves_to_database(): void
    {
        $response = $this->actingAs($this->owner)->put('/api/outlet-settings/profil', [
            'name' => 'Resto Baru',
            'brand_name' => 'RB',
            'email' => 'baru@resto.com',
            'phone' => '08100',
            'npwp' => '01.234.567.0',
            'nib' => '987654321',
            'address' => 'Jl. Baru No. 99',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('tenants', [
            'id' => $this->tenant->id,
            'name' => 'Resto Baru',
            'npwp' => '01.234.567.0',
        ]);
    }

    public function test_update_profil_requires_auth(): void
    {
        // /api/ routes mengembalikan 401 (bukan redirect) untuk unauthenticated requests
        $this->put('/api/outlet-settings/profil', [])->assertStatus(401);
    }

    public function test_update_profil_validates_required_fields(): void
    {
        // /api/ route menggunakan JSON response — pakai assertJsonValidationErrors
        $response = $this->actingAs($this->owner)
            ->putJson('/api/outlet-settings/profil', ['name' => '']);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'brand_name', 'email']);
    }

    // ─── PUT /api/outlet-settings/lokasi ──────────────────────────────────────

    public function test_update_lokasi_saves_to_outlet(): void
    {
        $response = $this->actingAs($this->owner)->put('/api/outlet-settings/lokasi', [
            'outlet_id' => $this->outlet->id,
            'latitude' => -6.250,
            'longitude' => 106.825,
            'geo_radius_meters' => 100,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('outlets', [
            'id' => $this->outlet->id,
            'geo_radius_meters' => 100,
        ]);
    }

    public function test_update_lokasi_rejects_other_tenant_outlet(): void
    {
        $otherTenant = Tenant::create(['name' => 'Other', 'brand_name' => 'O', 'email' => 'o@t.com', 'phone' => '082']);
        $otherOutlet = Outlet::withoutGlobalScopes()->create([
            'tenant_id' => $otherTenant->id, 'name' => 'Other Outlet', 'address' => 'x',
        ]);

        // Owner dari tenant kita coba update outlet milik tenant lain
        $response = $this->actingAs($this->owner)->put('/api/outlet-settings/lokasi', [
            'outlet_id' => $otherOutlet->id,
            'geo_radius_meters' => 50,
        ]);

        $response->assertStatus(404);
    }

    // ─── PUT /api/outlet-settings/pajak ───────────────────────────────────────

    public function test_update_pajak_saves_to_tenant(): void
    {
        $response = $this->actingAs($this->owner)->put('/api/outlet-settings/pajak', [
            'tax_type' => 'ppn',
            'pbjt_rate' => 10.00,
            'ppn_rate' => 11.00,
            'service_charge_rate' => 5.00,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tenants', [
            'id' => $this->tenant->id,
            'tax_type' => 'ppn',
        ]);
    }

    public function test_update_pajak_rejects_invalid_tax_type(): void
    {
        $response = $this->actingAs($this->owner)
            ->putJson('/api/outlet-settings/pajak', [
                'tax_type' => 'vat',
                'pbjt_rate' => 10,
                'ppn_rate' => 11,
                'service_charge_rate' => 0,
            ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tax_type']);
    }

    // ─── PUT /api/outlet-settings/jam ─────────────────────────────────────────

    public function test_update_jam_saves_operating_hours(): void
    {
        $hours = array_fill_keys(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            ['open' => '09:00', 'close' => '21:00', 'closed' => false]);
        $hours['sun']['closed'] = true;

        $response = $this->actingAs($this->owner)->put('/api/outlet-settings/jam', [
            'outlet_id' => $this->outlet->id,
            'operating_hours' => $hours,
        ]);

        $response->assertRedirect();
        $outlet = Outlet::withoutGlobalScopes()->find($this->outlet->id);
        $this->assertNotNull($outlet->operating_hours);
        $this->assertTrue($outlet->operating_hours['sun']['closed']);
    }

    // ─── Karyawan CRUD ────────────────────────────────────────────────────────

    public function test_create_karyawan_saves_to_users(): void
    {
        $response = $this->actingAs($this->owner)->post('/api/outlet-settings/karyawan', [
            'name' => 'Staf Baru',
            'email' => 'stafbaru@test.com',
            'password' => 'password',
            'role' => 'kitchen',
            'outlet_id' => $this->outlet->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'stafbaru@test.com',
            'role' => 'kitchen',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_create_karyawan_rejects_owner_role(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/outlet-settings/karyawan', [
                'name' => 'Hacker',
                'email' => 'hacker@test.com',
                'password' => 'password',
                'role' => 'owner',
            ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    public function test_delete_karyawan_removes_from_db(): void
    {
        $response = $this->actingAs($this->owner)->delete("/api/outlet-settings/karyawan/{$this->staff->id}");
        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $this->staff->id]);
    }

    public function test_delete_karyawan_from_other_tenant_returns_404(): void
    {
        $otherTenant = Tenant::create(['name' => 'O', 'brand_name' => 'O', 'email' => 'oo@t.com', 'phone' => '083']);
        $otherStaff = User::withoutGlobalScopes()->create([
            'tenant_id' => $otherTenant->id, 'name' => 'OS', 'email' => 'os@t.com',
            'password' => bcrypt('pw'), 'role' => 'cashier',
        ]);

        $response = $this->actingAs($this->owner)->delete("/api/outlet-settings/karyawan/{$otherStaff->id}");
        $response->assertStatus(404);
    }

    public function test_owner_cannot_delete_themselves(): void
    {
        $response = $this->actingAs($this->owner)->delete("/api/outlet-settings/karyawan/{$this->owner->id}");
        // owner tidak ada di daftar (role owner dikecualikan) → 404
        $response->assertStatus(404);
    }

    public function test_update_karyawan_role_cannot_be_set_to_owner(): void
    {
        $response = $this->actingAs($this->owner)
            ->putJson("/api/outlet-settings/karyawan/{$this->staff->id}", [
                'name' => $this->staff->name,
                'email' => $this->staff->email,
                'role' => 'owner',
            ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    // ─── PUT /api/outlet-settings/all (Atomic Update) ─────────────────────────

    public function test_update_all_saves_profil_lokasi_pajak_and_jam(): void
    {
        $hours = array_fill_keys(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            ['open' => '08:30', 'close' => '22:30', 'closed' => false]);
        $hours['sun']['closed'] = true;

        $response = $this->actingAs($this->owner)->put('/api/outlet-settings/all', [
            'profil' => [
                'name' => 'Resto All Updated',
                'brand_name' => 'RAU',
                'email' => 'all@resto.com',
                'phone' => '08199999',
                'npwp' => '02.345.678.0',
                'nib' => '1122334455',
                'address' => 'Jl. All Updated No. 1',
            ],
            'lokasi' => [
                'outlet_id' => $this->outlet->id,
                'name' => 'Outlet Cabang Baru',
                'address' => 'Jl. All Updated No. 1',
                'phone' => '08199999',
                'latitude' => -6.30,
                'longitude' => 106.90,
                'geo_radius_meters' => 150,
            ],
            'pajak' => [
                'tax_type' => 'ppn',
                'pbjt_rate' => 10.0,
                'ppn_rate' => 11.0,
                'service_charge_rate' => 5.0,
            ],
            'jam' => [
                'operating_hours' => $hours,
            ],
        ]);

        $response->assertRedirect();

        // Assert tenant updated
        $this->assertDatabaseHas('tenants', [
            'id' => $this->tenant->id,
            'name' => 'Resto All Updated',
            'tax_type' => 'ppn',
        ]);

        // Assert outlet updated
        $this->assertDatabaseHas('outlets', [
            'id' => $this->outlet->id,
            'geo_radius_meters' => 150,
        ]);

        $outlet = Outlet::withoutGlobalScopes()->find($this->outlet->id);
        $this->assertTrue($outlet->operating_hours['sun']['closed']);
    }

    public function test_update_all_rejects_other_tenant_outlet(): void
    {
        $otherTenant = Tenant::create(['name' => 'Other', 'brand_name' => 'O', 'email' => 'o@t.com', 'phone' => '082']);
        $otherOutlet = Outlet::withoutGlobalScopes()->create([
            'tenant_id' => $otherTenant->id, 'name' => 'Other Outlet', 'address' => 'x',
        ]);

        $response = $this->actingAs($this->owner)->put('/api/outlet-settings/all', [
            'lokasi' => [
                'outlet_id' => $otherOutlet->id,
                'geo_radius_meters' => 50,
            ],
        ]);

        $response->assertStatus(404);
    }
}
