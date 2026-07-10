<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Tenant
        $tenant = Tenant::create([
            'name' => 'Kedai Nusantara Group',
            'brand_name' => 'Kedai Nusantara',
            'email' => 'admin@kedainusantara.com',
            'phone' => '081234567890',
        ]);

        // 2. Create Outlets
        $outlets = [
            Outlet::create([
                'tenant_id' => $tenant->id,
                'name' => 'Kedai Nusantara - Sudirman',
                'address' => 'Jl. Jend. Sudirman No. 1, Jakarta',
            ]),
            Outlet::create([
                'tenant_id' => $tenant->id,
                'name' => 'Kedai Nusantara - Kemang',
                'address' => 'Jl. Kemang Raya No. 2, Jakarta',
            ]),
            Outlet::create([
                'tenant_id' => $tenant->id,
                'name' => 'Kedai Nusantara - PIK',
                'address' => 'Pantai Indah Kapuk, Jakarta',
            ])
        ];

        // 3. Create Owner
        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Budi Santoso',
            'email' => 'owner@example.com',
            'password' => Hash::make('password'),
            'role' => 'owner',
        ]);

        // 4. Create Staff Members (assigned to first outlet, matching DEFAULT_EMPLOYEES PINs)
        User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlets[0]->id,
            'name' => 'BUDI HARTONO',
            'email' => 'kasir@example.com',
            'password' => Hash::make('123456'),
            'role' => 'cashier',
        ]);

        User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlets[0]->id,
            'name' => 'DEDI CAHYONO',
            'email' => 'kitchen@example.com',
            'password' => Hash::make('111111'),
            'role' => 'kitchen',
        ]);

        User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlets[0]->id,
            'name' => 'SARI PERTIWI',
            'email' => 'waiter@example.com',
            'password' => Hash::make('654321'),
            'role' => 'waiter',
        ]);

        User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlets[0]->id,
            'name' => 'AGUS SETIAWAN',
            'email' => 'manager@example.com',
            'password' => Hash::make('999999'),
            'role' => 'manager',
        ]);

        // 5. Seed Subscriptions & Settings
        $this->call(SubscriptionSeeder::class);

        // 6. Seed contoh menu + kategori (e-Menu tidak kosong)
        $this->call(MenuSeeder::class);
    }
}
