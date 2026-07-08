<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\Subscription;
use App\Models\TenantSetting;
use App\Models\OutletSetting;
use App\Models\Outlet;

class SubscriptionSeeder extends Seeder
{
    /**
     * Seed default subscriptions and settings for all existing tenants and outlets.
     */
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            if (!$tenant->subscription) {
                Subscription::create([
                    'tenant_id' => $tenant->id,
                    'plan' => 'pro',
                    'status' => 'active',
                    'trial_ends_at' => now()->addDays(14),
                    'current_period_start' => now(),
                    'current_period_end' => now()->addYear(),
                ]);
            }

            // 2. Seed TenantSetting if not exists
            if (!$tenant->settings) {
                TenantSetting::create([
                    'tenant_id' => $tenant->id,
                    'tax_type' => 'pbjt',
                    'pbjt_rate' => 10.00,
                    'ppn_rate' => 11.00,
                    'service_charge_rate' => 5.00,
                    'wa_notif_enabled' => false,
                    'email_notif_enabled' => true,
                ]);
            }
        }

        // 3. Seed OutletSetting if not exists
        $outlets = Outlet::all();
        foreach ($outlets as $outlet) {
            if (!$outlet->settings) {
                OutletSetting::create([
                    'outlet_id' => $outlet->id,
                    'operating_hours' => [
                        'mon' => ['open' => '08:00', 'close' => '22:00', 'closed' => false],
                        'tue' => ['open' => '08:00', 'close' => '22:00', 'closed' => false],
                        'wed' => ['open' => '08:00', 'close' => '22:00', 'closed' => false],
                        'thu' => ['open' => '08:00', 'close' => '22:00', 'closed' => false],
                        'fri' => ['open' => '08:00', 'close' => '22:00', 'closed' => false],
                        'sat' => ['open' => '08:00', 'close' => '23:00', 'closed' => false],
                        'sun' => ['open' => '08:00', 'close' => '23:00', 'closed' => false],
                    ],
                    'receipt_header' => 'Selamat Datang di Restoku',
                    'receipt_footer' => 'Terima kasih atas kunjungan Anda!',
                    'paper_width' => '80mm',
                ]);
            }
        }
    }
}
