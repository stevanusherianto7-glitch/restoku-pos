<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/**
 * Seed menu asli Restoku + foto dari Cloudinary (akun dwdaydzsh, publik).

 * Foto diambil langsung dari URL publik Cloudinary (cloud name dwdaydzsh),
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
    private const CLOUD = 'https://res.cloudinary.com/dwdaydzsh/image/upload';

    /**
     * Katalog asli Restoku.
     * [nama, deskripsi, harga, kategori, public_id]
     * Harga placeholder wajar per kategori (bisa diubah owner lewat UI nanti).
     */
    private const ITEMS = [
        // 1. Makanan (Food) — public_id sudah include suffix Cloudinary otomatis.
        ['Ayam Goreng Penyet Semarang', 'Ayam goreng penyet sambal pedas khas Semarang.', 32000, 'Makanan', 'Ayam_Goreng_Penyet_Semarang_qsbpul'],
        ['Bakmi Godog Jawa', 'Bakmi rebus kuah dengan telur dan sayuran.', 28000, 'Makanan', 'Bakmi_Godog_Jawa_pq3ktp'],
        ['Bakmi Goreng Jawa', 'Bakmi goreng dengan ayam suwir dan sayuran.', 28000, 'Makanan', 'Bakmi_Goreng_Jawa_twbo9h'],
        ['Gulai Mangut Semarang', 'Gulai ikan mangut kuah santan pedas.', 35000, 'Makanan', 'Gulai_Mangut_Semarang_ks56tv'],
        ['Nasi Ayam Lengkuas Semarang', 'Nasi ayam goreng lengkuas dengan sambal.', 30000, 'Makanan', 'Nasi_Ayam_Lengkuas_Semarang_t5tngf'],
        ['Nasi Goreng Jawa', 'Nasi goreng tradisional Jawa dengan telur.', 28000, 'Makanan', 'Nasi_Goreng_Jawa_mqtalj'],
        ['Nasi Goreng Mawut Semarang', 'Nasi goreng mawut dengan mie dan ayam.', 30000, 'Makanan', 'Nasi_Goreng_Mawut_Semarang_zijcjv'],
        ['Rawon Semarang', 'Rawon daging dengan kuah kluwak khas Semarang.', 33000, 'Makanan', 'Rawon_Semarang_vaxfch'],
        ['Soto Ayam Semarang', 'Soto ayam kuning kuah bening koya.', 25000, 'Makanan', 'Soto_Ayam_Semarang_m4xtel'],
        ['Soto Pindang Kudus', 'Soto pindang daging kuah bening asam segar.', 27000, 'Makanan', 'Soto_Pindang_Kudus_orwjnb'],
        ['Tahu Gimbal Semarang', 'Tahu gimbal dengan lontong dan gimbal udang.', 22000, 'Makanan', 'Tahu_Gimbal_Semarang_tjtpa0'],

        // 2. Minuman (Drinks)
        ['Es Teh', 'Es teh manis segar.', 8000, 'Minuman', 'Es_Teh_yxd52v'],
        ['Es Soda Gembira', 'Es soda susu merah putih.', 12000, 'Minuman', 'Es_Soda_Gembira_vurlli'],
        ['Es Teler', 'Es teler campur buah dan kelapa.', 15000, 'Minuman', 'Es_Teler_vyc2aq'],
        ['Jeruk Peras', 'Jeruk peras segar tanpa gula.', 12000, 'Minuman', 'Jeruk_Peras_brx7it'],
        ['Jus Belimbing', 'Jus belimbing asam segar.', 13000, 'Minuman', 'Jus_Belimbing_i7fyph'],
        ['Jus Buah Naga', 'Jus buah naga merah.', 15000, 'Minuman', 'Jus_Buah_Naga_fcginv'],
        ['Jus Semangka', 'Jus semangka manis segar.', 13000, 'Minuman', 'Jus_Semangka_if4iit'],
        ['Jus Strawberry', 'Jus strawberry segar.', 16000, 'Minuman', 'Jus_Strawberry_yqxwqr'],
        ['Lemon Tea', 'Teh lemon hangat/dingin.', 11000, 'Minuman', 'Lemon_Tea_f0eewa'],
        ['Green Tea', 'Teh hijau Jepang.', 12000, 'Minuman', 'Green_Tea_lpxl27'],
        ['Teh Poci', 'Teh poci khas Tegal.', 10000, 'Minuman', 'Teh_Poci_dinezn'],
        ['Teh Pucuk', 'Teh pucuk hijau kemasan.', 7000, 'Minuman', 'Teh_Pucuk_cyylsu'],
        ['Nipis Madu', 'Lemon nipis madu segar.', 11000, 'Minuman', 'Nipis_Madu_saf8bz'],
        ['Pulpy Orange', 'Jus jeruk pulp orange.', 14000, 'Minuman', 'Pulpy_Orange_wckhxi'],
        ['Aqua', 'Air mineral Aqua.', 5000, 'Minuman', 'Aqua_ggoxcp'],
        ['Cleo', 'Air mineral Cleo.', 5000, 'Minuman', 'Cleo_ozckuq'],
        ['Fanta / Sprite / Coca Cola', 'Soft drink pilihan.', 8000, 'Minuman', 'Fanta_Sprite_Coca_Cola_avshue'],

        // 3. Camilan (Snacks & Sides)
        ['Roti Bakar Keju Karamel', 'Roti bakar keju karamel lumer.', 18000, 'Camilan', 'Roti_Bakar_Keju_Karamel_ivy0yr'],
        ['Pisang Goreng Keju Karamel', 'Pisang goreng keju karamel.', 17000, 'Camilan', 'Pisang_Goreng_Keju_Karamel_lqjxrw'],
        ['Kerupuk Udang', 'Kerupuk udang renyah.', 8000, 'Camilan', 'shrimp-crackers_bjwpba'],
        ['Emping', 'Emping melinjo goreng.', 9000, 'Camilan', 'emping_e3vnp5'],
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

        // Kategori per-tenant. type: Makanan/Camilan = food, Minuman = beverage.
        $catDefs = [
            'Makanan' => ['order' => 1, 'type' => MenuCategory::TYPE_FOOD],
            'Minuman' => ['order' => 2, 'type' => MenuCategory::TYPE_BEVERAGE],
            'Camilan' => ['order' => 3, 'type' => MenuCategory::TYPE_FOOD],
        ];
        $cats = [];
        foreach ($catDefs as $name => $def) {
            $cats[$name] = MenuCategory::firstOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $name],
                ['sort_order' => $def['order'], 'type' => $def['type']]
            )->id;
        }

        $this->command?->info('Seeding '.count(self::ITEMS).' menu asli (global tenant, tanpa duplikat per-outlet)...');

        $seeded = 0;
        foreach (self::ITEMS as [$name, $desc, $price, $catName, $publicId]) {
            $imagePath = self::CLOUD.'/'.$publicId;

            MenuItem::firstOrCreate(
                ['tenant_id' => $tenant->id, 'outlet_id' => null, 'name' => $name, 'menu_category_id' => $cats[$catName]],
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

        Cache::flush();
        $this->command?->info('Menu asli selesai di-seed ('.$seeded.' item, unik per tenant).');
    }
}
