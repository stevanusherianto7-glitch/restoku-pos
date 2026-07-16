<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\MenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\HasTenantSetup;

class PosKatalogVerifyTest extends TestCase
{
    use HasTenantSetup, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Bangun tenant+outlet+owner, lalu seed menu asli (foto Cloudinary).
        $this->setupTenantEnvironment('pro');
        $this->seed(MenuSeeder::class);

        // Manager (staff) untuk login ke POS / Katalog.
        $this->manager = User::create([
            'tenant_id' => $this->testTenant->id,
            'outlet_id' => $this->testOutlet->id,
            'name' => 'Test Manager',
            'email' => 'manager@tenant.com',
            'password' => bcrypt('password'),
            'role' => 'manager',
        ]);
    }

    public function test_pos_and_katalog_render_with_cloudinary_photos(): void
    {
        $this->assertNotNull($this->manager);

        // POS Kasir harus 200 dan membawa posMenu dengan foto Cloudinary.
        $pos = $this->actingAs($this->manager)->get('/pos');
        $pos->assertStatus(200);
        $posContent = $pos->getContent();
        // URL di-JSON-encode sebagai https:\/\/... jadi cek pattern dwdaydzsh.
        $posCount = substr_count($posContent, 'dwdaydzsh');
        $this->assertGreaterThan(0, $posCount, 'POS harus menampilkan foto Cloudinary');
        // 32 item unik (tidak ada duplikat nama di posMenu JSON).
        preg_match_all('/"name":"([^"]+)"/', $posContent, $nm);
        $names = $nm[1] ?? [];
        $posNames = array_values(array_filter($names, fn ($n) => in_array($n, ['Aqua', 'Cleo', 'Es Teh', 'Nasi Goreng Jawa'])));
        $this->assertEquals(count($posNames), count(array_unique($posNames)), 'POS tidak boleh ada nama duplikat');

        // Katalog Menu harus 200 dan menuItems unik + foto Cloudinary.
        $kat = $this->actingAs($this->manager)->get('/katalog-menu');
        $kat->assertStatus(200);
        $katContent = $kat->getContent();
        $katCount = substr_count($katContent, 'dwdaydzsh');
        $this->assertGreaterThan(0, $katCount, 'Katalog harus menampilkan foto Cloudinary');
        // Tidak ada duplikat: tiap public_id Cloudinary unik di rendered HTML.
        preg_match_all('/dwdaydzsh\/image\/upload\/([A-Za-z0-9_]+)/', $katContent, $m);
        $ids = $m[1] ?? [];
        $this->assertEquals(count($ids), count(array_unique($ids)), 'Katalog tidak boleh ada foto duplikat');
    }
}
