<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Test modul upload foto menu -> Cloudinary.
 * Pakai Http::fake() supaya TIDAK memanggil API sungguhan (butuh credential rahasia).
 */
class CloudinaryUploadTest extends TestCase
{
    use RefreshDatabase;

    private function fakeConfig(): void
    {
        config(['services.cloudinary.url' => 'cloudinary://key123:secret456@testcloud']);
    }

    public function test_upload_returns_url_and_public_id_on_success(): void
    {
        $this->fakeConfig();
        Http::fake([
            'api.cloudinary.com/*' => Http::response([
                'secure_url' => 'https://res.cloudinary.com/testcloud/image/upload/v1/restoku/1/menu/abc.jpg',
                'public_id' => 'restoku/1/menu/abc',
            ], 200),
        ]);

        $svc = new CloudinaryService;
        $result = $svc->uploadMenuPhoto('data:image/png;base64,iVBORw0KGgo=', 1);

        $this->assertIsArray($result);
        $this->assertStringContainsString('res.cloudinary.com', $result['url']);
        $this->assertEquals('restoku/1/menu/abc', $result['public_id']);
    }

    public function test_upload_falls_back_null_without_config(): void
    {
        config(['services.cloudinary.url' => null]);
        $svc = new CloudinaryService;
        $this->assertNull($svc->uploadMenuPhoto('data:image/png;base64,xxx', 1));
    }

    public function test_upload_rejects_non_image_data_url(): void
    {
        $this->fakeConfig();
        $svc = new CloudinaryService;
        $this->expectException(\RuntimeException::class);
        $svc->uploadMenuPhoto('data:application/pdf;base64,JVBERi0=', 1);
    }

    public function test_signature_is_sha1_sorted_key_value(): void
    {
        // Verifikasi signature sesuai dokumentasi Cloudinary:
        // sha1(sorted "k=v&..." + secret)
        $this->fakeConfig();
        Http::fake([
            'api.cloudinary.com/*' => Http::response([
                'secure_url' => 'https://res.cloudinary.com/testcloud/image/upload/v1/x.jpg',
                'public_id' => 'x',
            ], 200),
        ]);

        $svc = new CloudinaryService;
        $svc->uploadMenuPhoto('data:image/png;base64,xxx', 7);

        Http::assertSent(function ($request) {
            // asMultipart -> data() berupa array multipart [{name, contents}, ...]
            $parts = $request->data();
            $params = [];
            foreach ($parts as $p) {
                $params[$p['name']] = $p['contents'] ?? null;
            }

            $this->assertArrayHasKey('signature', $params);
            $this->assertArrayHasKey('api_key', $params);
            $this->assertArrayHasKey('folder', $params);
            $this->assertStringContainsString('restoku/7/menu', $params['folder']);
            $this->assertEquals('key123', $params['api_key']);

            // Recompute signature manually to confirm correctness
            $sorted = $params;
            unset($sorted['file'], $sorted['signature'], $sorted['api_key']);
            ksort($sorted);
            $raw = '';
            foreach ($sorted as $k => $v) {
                if (is_bool($v)) {
                    if (! $v) {
                        continue;
                    }
                    $v = '1';
                }
                $raw .= "$k=".($v ?? '').'&';
            }
            $raw = rtrim($raw, '&');
            $expected = sha1($raw.'secret456');

            $this->assertEquals($expected, $params['signature']);

            return true;
        });
    }

    public function test_delete_menu_photo_calls_destroy(): void
    {
        $this->fakeConfig();
        Http::fake([
            'api.cloudinary.com/*' => Http::response(['result' => 'ok'], 200),
        ]);

        $svc = new CloudinaryService;
        $this->assertTrue($svc->deleteMenuPhoto('restoku/1/menu/abc'));
    }

    public function test_delete_menu_photo_noop_without_config(): void
    {
        config(['services.cloudinary.url' => null]);
        $svc = new CloudinaryService;
        $this->assertTrue($svc->deleteMenuPhoto('whatever')); // no-op, aman
    }

    public function test_controller_store_saves_image_public_id(): void
    {
        $this->fakeConfig();
        Http::fake([
            'api.cloudinary.com/*' => Http::response([
                'secure_url' => 'https://res.cloudinary.com/testcloud/image/upload/v1/restoku/1/menu/abc.jpg',
                'public_id' => 'restoku/1/menu/abc',
            ], 200),
        ]);

        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@t.com', 'phone' => '1']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'O', 'address' => 'a']);
        $owner = User::create([
            'tenant_id' => $tenant->id, 'outlet_id' => $outlet->id,
            'name' => 'O', 'email' => 'o@t.com', 'password' => bcrypt('pw'), 'role' => 'owner',
        ]);
        $cat = MenuCategory::create(['tenant_id' => $tenant->id, 'name' => 'Makanan']);

        $this->actingAs($owner)
            ->post('/api/menu', [
                'name' => 'Nasi Goreng',
                'price' => 25000,
                'menu_category_id' => $cat->id,
                'outlet_id' => $outlet->id,
                'photo' => 'data:image/png;base64,iVBORw0KGgo=',
            ])
            ->assertRedirect();

        $item = MenuItem::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->first();
        $this->assertNotNull($item);
        $this->assertStringContainsString('res.cloudinary.com', $item->image_path);
        $this->assertEquals('restoku/1/menu/abc', $item->image_public_id);
    }

    public function test_controller_update_deletes_old_photo(): void
    {
        $this->fakeConfig();
        Http::fake([
            'api.cloudinary.com/*' => Http::response([
                'secure_url' => 'https://res.cloudinary.com/testcloud/image/upload/v1/restoku/1/menu/new.jpg',
                'public_id' => 'restoku/1/menu/new',
            ], 200),
        ]);

        $tenant = Tenant::create(['name' => 'T2', 'brand_name' => 'B2', 'email' => 't2@t.com', 'phone' => '2']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'O2', 'address' => 'a']);
        $owner = User::create([
            'tenant_id' => $tenant->id, 'outlet_id' => $outlet->id,
            'name' => 'O2', 'email' => 'o2@t.com', 'password' => bcrypt('pw'), 'role' => 'owner',
        ]);
        $cat = MenuCategory::create(['tenant_id' => $tenant->id, 'name' => 'Makanan']);
        $item = MenuItem::create([
            'tenant_id' => $tenant->id, 'outlet_id' => $outlet->id,
            'menu_category_id' => $cat->id, 'name' => 'Old', 'price' => 1000,
            'image_path' => 'https://res.cloudinary.com/testcloud/image/upload/v1/restoku/1/menu/old.jpg',
            'image_public_id' => 'restoku/1/menu/old',
        ]);

        $this->actingAs($owner)
            ->put("/api/menu/{$item->id}", [
                'name' => 'Old',
                'price' => 1000,
                'menu_category_id' => $cat->id,
                'photo' => 'data:image/png;base64,NEW',
            ])
            ->assertRedirect();

        // Pastikan destroy foto lama dipanggil (Cloudinary /image/destroy)
        Http::assertSent(fn ($request) => str_contains($request->url(), '/image/destroy'));

        $item->refresh();
        $this->assertEquals('restoku/1/menu/new', $item->image_public_id);
    }
}
