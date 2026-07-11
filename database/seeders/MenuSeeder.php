<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Services\CloudinaryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/**
 * Seed contoh menu + kategori agar e-Menu (CustomerView) tidak kosong.
 *
 * Foto menu:
 * - Bila CLOUDINARY_URL terkonfigurasi -> upload foto demo ke akun tenant (sungguhan).
 * - Bila TIDAK (dev/test tanpa akun) -> pakai asset publik akun Cloudinary "demo"
 *   (res.cloudinary.com/demo/...) supaya e-Menu tetap punya foto nyata tanpa credential.
 *
 * Ini menggantikan mock FALLBACK_ITEMS di frontend: seeded menu tampil pertama kali.
 */
class MenuSeeder extends Seeder
{
    // Public sample images dari akun Cloudinary "demo" (terbuka, tidak butuh auth).
    // HANYA key yang terverifikasi live (HTTP 200) — key lain (food/burger/breakfast/
    // cake/salad/dll) 404 di demo cloud dan memicu fallback ikon di e-Menu.
    private const DEMO_IMAGES = [
        'sample' => 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500,f_auto,q_auto/sample.jpg',
        'coffee' => 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500,f_auto,q_auto/coffee.jpg',
        'pizza' => 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500,f_auto,q_auto/pizza.jpg',
        'fruit' => 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500,f_auto,q_auto/fruit.jpg',
    ];

    public function run(): void
    {
        $tenant = \App\Models\Tenant::first();
        if (! $tenant) {
            return;
        }

        // Seed ke SEMUA outlet aktif (multi-tenant benar): tiap outlet punya
        // menu sendiri agar e-Menu per-slug tidak kosong saat di-scan tamu.
        $outlets = \App\Models\Outlet::where('tenant_id', $tenant->id)
            ->where('is_active', 1)
            ->get();

        $cloudinary = new CloudinaryService;
        $hasConfig = config('services.cloudinary.url');

        // Kategori per-tenant (dipakai bersama semua outlet tenant ini).
        $catMakanan = MenuCategory::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Makanan'],
            ['sort_order' => 1]
        );
        $catMinuman = MenuCategory::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Minuman'],
            ['sort_order' => 2]
        );
        $catDessert = MenuCategory::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Dessert'],
            ['sort_order' => 3]
        );

        $this->command?->info('Seeding contoh menu ke '.count($outlets).' outlet aktif...');

        $items = [
            ['Nasi Goreng Spesial', 'Nasi goreng dengan telur, ayam, dan sayuran segar.', 28000, $catMakanan->id, 'pizza', true, true],
            ['Ayam Penyet', 'Ayam goreng penyet dengan sambal pedas khas.', 32000, $catMakanan->id, 'pizza', true, false],
            ['Soto Ayam Lamongan', 'Soto ayam kuning dengan kuah bening dan koya.', 25000, $catMakanan->id, 'sample', true, false],
            ['Es Teh Manis', 'Teh manis dingin segar.', 8000, $catMinuman->id, 'coffee', true, true],
            ['Kopi Susu Gula Aren', 'Kopi susu dengan gula aren cair.', 18000, $catMinuman->id, 'coffee', true, false],
            ['Jus Alpukat', 'Jus alpukat segar dengan sedikit susu.', 15000, $catMinuman->id, 'fruit', true, false],
            ['Brownies Lava', 'Brownies hangat dengan lelehan cokelat.', 22000, $catDessert->id, 'fruit', true, false],
            ['Pudding Cappuccino', 'Pudding lembut rasa cappuccino.', 16000, $catDessert->id, 'fruit', true, false],
        ];

        $seeded = 0;
        foreach ($outlets as $outlet) {
            foreach ($items as [$name, $desc, $price, $catId, $demoKey, $available, $popular]) {
                $imagePath = $hasConfig
                    ? ($this->uploadDemo($cloudinary, $tenant->id, $demoKey, $name) ?? self::DEMO_IMAGES[$demoKey])
                    : self::DEMO_IMAGES[$demoKey];

                // Idempoten per outlet: firstOrCreate key outlet_id + name + kategori.
                MenuItem::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'outlet_id' => $outlet->id, 'name' => $name, 'menu_category_id' => $catId],
                    [
                        'description' => $desc,
                        'price' => $price,
                        'image_path' => $imagePath,
                        'is_available' => $available,
                        'is_popular' => $popular,
                        'sort_order' => 0,
                    ]
                );
                $seeded++;
            }
        }

        // Invalidate menu cache agar seeded menu langsung tampil
        Cache::flush();
        $this->command?->info('Menu contoh selesai di-seed ('.$seeded.' item di '.count($outlets).' outlet).');
    }

    /**
     * Upload foto demo ke Cloudinary milik tenant (hanya bila config ada).
     * Mengambil asset publik akun "demo" via fetch URL Cloudinary.
     */
    private function uploadDemo(CloudinaryService $svc, int $tenantId, string $demoKey, string $name): ?string
    {
        $fetchUrl = self::DEMO_IMAGES[$demoKey];
        try {
            $result = $svc->uploadMenuPhoto($fetchUrl, $tenantId);
            return $result['url'] ?? null;
        } catch (\Throwable $e) {
            $this->command?->warn("Gagal upload foto menu '{$name}': ".$e->getMessage());

            return null;
        }
    }
}
