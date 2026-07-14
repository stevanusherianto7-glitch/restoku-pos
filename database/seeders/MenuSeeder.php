<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/**
 * Seed menu asli Restoku + foto dari Cloudinary (akun dwddaydzsh, publik).
 *
 * Foto diambil langsung dari URL publik Cloudinary (cloud name dwddaydzsh),
 * TANPA butuh API secret — cukup cloud name yang public. public_id disuplai
 * manual (lihat $ITEMS). Bila suatu public_id belum ada di akun, e-Menu
 * otomatis fallback ke ikon (ProductImage), tidak crash.
 *
 * Multi-tenant: di-seed ke SEMUA outlet aktif tenant pertama agar e-Menu
 * per-slug tidak kosong saat di-scan tamu.
 */
class MenuSeeder extends Seeder
{
    // Base URL Cloudinary (publik, aman di client).
    private const CLOUD = 'https://res.cloudinary.com/dwddaydzsh/image/upload';

    /**
     * Katalog asli Restoku.
     * [nama, deskripsi, harga, kategori, public_id]
     * Harga placeholder wajar per kategori (bisa diubah owner lewat UI nanti).
     */
    private const ITEMS = [
        // 1. Makanan (Food)
        ['Ayam Goreng Penyet Semarang', 'Ayam goreng penyet sambal pedas khas Semarang.', 32000, 'Makanan', 'Ayam_Goreng_Penyet_Semarang'],
        ['Bakmi Godog Jawa', 'Bakmi rebus kuah dengan telur dan sayuran.', 28000, 'Makanan', 'Bakmi_Godog_Jawa'],
        ['Bakmi Goreng Jawa', 'Bakmi goreng dengan ayam suwir dan sayuran.', 28000, 'Makanan', 'Bakmi_Goreng_Jawa'],
        ['Gulai Mangut Semarang', 'Gulai ikan mangut kuah santan pedas.', 35000, 'Makanan', 'Gulai_Mangut_Semarang'],
        ['Nasi Ayam Lengkuas Semarang', 'Nasi ayam goreng lengkuas dengan sambal.', 30000, 'Makanan', 'Nasi_Ayam_Lengkuas_Semarang'],
        ['Nasi Goreng Jawa', 'Nasi goreng tradisional Jawa dengan telur.', 28000, 'Makanan', 'Nasi_Goreng_Jawa'],
        ['Nasi Goreng Mawut Semarang', 'Nasi goreng mawut dengan mie dan ayam.', 30000, 'Makanan', 'Nasi_Goreng_Mawut_Semarang'],
        ['Rawon Semarang', 'Rawon daging dengan kuah kluwak khas Semarang.', 33000, 'Makanan', 'Rawon_Semarang'],
        ['Soto Ayam Semarang', 'Soto ayam kuning kuah bening koya.', 25000, 'Makanan', 'Soto_Ayam_Semarang'],
        ['Soto Pindang Kudus', 'Soto pindang daging kuah bening asam segar.', 27000, 'Makanan', 'Soto_Pindang_Kudus'],
        ['Tahu Gimbal Semarang', 'Tahu gimbal dengan lontong dan gimbal udang.', 22000, 'Makanan', 'Tahu_Gimbal_Semarang'],

        // 2. Minuman (Drinks)
        ['Es Teh', 'Es teh manis segar.', 8000, 'Minuman', 'Es_Teh'],
        ['Es Soda Gembira', 'Es soda susu merah putih.', 12000, 'Minuman', 'Es_Soda_Gembira'],
        ['Es Teler', 'Es teler campur buah dan kelapa.', 15000, 'Minuman', 'Es_Teler'],
        ['Jeruk Peras', 'Jeruk peras segar tanpa gula.', 12000, 'Minuman', 'Jeruk_Peras'],
        ['Jus Belimbing', 'Jus belimbing asam segar.', 13000, 'Minuman', 'Jus_Belimbing'],
        ['Jus Buah Naga', 'Jus buah naga merah.', 15000, 'Minuman', 'Jus_Buah_Naga'],
        ['Jus Semangka', 'Jus semangka manis segar.', 13000, 'Minuman', 'Jus_Semangka'],
        ['Jus Strawberry', 'Jus strawberry segar.', 16000, 'Minuman', 'Jus_Strawberry'],
        ['Lemon Tea', 'Teh lemon hangat/dingin.', 11000, 'Minuman', 'Lemon_Tea'],
        ['Green Tea', 'Teh hijau Jepang.', 12000, 'Minuman', 'Green_Tea'],
        ['Teh Poci', 'Teh poci khas Tegal.', 10000, 'Minuman', 'Teh_Poci'],
        ['Teh Pucuk', 'Teh pucuk hijau kemasan.', 7000, 'Minuman', 'Teh_Pucuk'],
        ['Nipis Madu', 'Lemon nipis madu segar.', 11000, 'Minuman', 'Nipis_Madu'],
        ['Pulpy Orange', 'Jus jeruk pulp orange.', 14000, 'Minuman', 'Pulpy_Orange'],
        ['Aqua', 'Air mineral Aqua.', 5000, 'Minuman', 'Aqua'],
        ['Cleo', 'Air mineral Cleo.', 5000, 'Minuman', 'Cleo'],
        ['Fanta / Sprite / Coca Cola', 'Soft drink pilihan.', 8000, 'Minuman', 'Fanta_Sprite_Coca_Cola'],

        // 3. Camilan (Snacks & Sides)
        ['Roti Bakar Keju Karamel', 'Roti bakar keju karamel lumer.', 18000, 'Camilan', 'Roti_Bakar_Keju_Karamel'],
        ['Pisang Goreng Keju Karamel', 'Pisang goreng keju karamel.', 17000, 'Camilan', 'Pisang_Goreng_Keju_Karamel'],
        ['Kerupuk Udang', 'Kerupuk udang renyah.', 8000, 'Camilan', 'shrimp-crackers'],
        ['Emping', 'Emping melinjo goreng.', 9000, 'Camilan', 'emping'],
    ];

    public function run(): void
    {
        $tenant = \App\Models\Tenant::first();
        if (! $tenant) {
            return;
        }

        $outlets = \App\Models\Outlet::where('tenant_id', $tenant->id)
            ->where('is_active', 1)
            ->get();

        // Kategori per-tenant.
        $cats = [];
        foreach (['Makanan' => 1, 'Minuman' => 2, 'Camilan' => 3] as $name => $order) {
            $cats[$name] = MenuCategory::firstOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $name],
                ['sort_order' => $order]
            )->id;
        }

        $this->command?->info('Seeding '.count(self::ITEMS).' menu asli ke '.count($outlets).' outlet aktif...');

        $seeded = 0;
        foreach ($outlets as $outlet) {
            foreach (self::ITEMS as [$name, $desc, $price, $catName, $publicId]) {
                $imagePath = self::CLOUD.'/'.$publicId;

                MenuItem::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'outlet_id' => $outlet->id, 'name' => $name, 'menu_category_id' => $cats[$catName]],
                    [
                        'description' => $desc,
                        'price' => $price,
                        'image_path' => $imagePath,
                        'image_public_id' => $publicId,
                        'is_available' => true,
                        'is_popular' => false,
                        'sort_order' => 0,
                    ]
                );
                $seeded++;
            }
        }

        Cache::flush();
        $this->command?->info('Menu asli selesai di-seed ('.$seeded.' item di '.count($outlets).' outlet).');
    }
}
