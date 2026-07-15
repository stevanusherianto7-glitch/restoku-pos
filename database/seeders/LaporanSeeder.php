<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\Outlet;
use App\Models\User;
use App\Models\MenuItem;
use App\Models\CashierSession;
use App\Models\Attendance;
use App\Models\ShiftSchedule;
use App\Models\Order;
use Carbon\Carbon;

/**
 * [L3] Seed contoh untuk laporan nyata: cashier_sessions, attendances,
 * shift_schedules, dan set beberapa menu track_stock + stok rendah.
 * Aman dijalankan ulang (idempoten via firstOrCreate).
 */
class LaporanSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::first();
        if (!$tenant) {
            return;
        }
        $outlet = Outlet::where('tenant_id', $tenant->id)->first();
        $staff = User::where('tenant_id', $tenant->id)
            ->whereIn('role', ['kasir', 'manager', 'waiter', 'kitchen'])
            ->get();

        if ($staff->isEmpty()) {
            return;
        }

        // 1. Cashier sessions (2 minggu terakhir)
        foreach ($staff->take(2) as $idx => $user) {
            for ($d = 0; $d < 5; $d++) {
                $date = Carbon::now()->subDays($d);
                $opened = $date->copy()->setTime(8 + $idx, 0);
                $closed = $date->copy()->setTime(16 + $idx, 0);
                CashierSession::firstOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'user_id' => $user->id,
                        'opened_at' => $opened,
                    ],
                    [
                        'outlet_id' => $outlet?->id,
                        'closed_at' => $closed,
                        'opening_balance' => 100000,
                        'closing_balance' => 100000,
                        'transaction_count' => rand(10, 60),
                        'total_sales' => rand(500000, 5000000),
                    ]
                );
            }
        }

        // 2. Attendances (bulan berjalan)
        $statuses = ['present', 'present', 'present', 'late', 'absent', 'leave'];
        foreach ($staff as $user) {
            for ($d = 0; $d < 22; $d++) {
                $date = Carbon::now()->startOfMonth()->addDays($d);
                if ($date->isFuture()) {
                    break;
                }
                Attendance::firstOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'user_id' => $user->id,
                        'attendance_date' => $date->toDateString(),
                    ],
                    [
                        'status' => $statuses[array_rand($statuses)],
                        'check_in' => $date->copy()->setTime(8, rand(0, 25)),
                        'check_out' => $date->copy()->setTime(16, rand(0, 30)),
                    ]
                );
            }
        }

        // 3. Shift schedules (mingguan per staff)
        $shifts = [
            ['start' => '08:00', 'end' => '16:00'],
            ['start' => '16:00', 'end' => '24:00'],
        ];
        foreach ($staff as $idx => $user) {
            $shift = $shifts[$idx % 2];
            for ($day = 0; $day <= 6; $day++) {
                $isOff = ($day === 2 && $idx % 2 === 0) || ($day === 4 && $idx % 2 === 1);
                if ($isOff) {
                    continue;
                }
                ShiftSchedule::firstOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'user_id' => $user->id,
                        'day_of_week' => $day,
                    ],
                    [
                        'shift_start' => Carbon::createFromTimeString($shift['start']),
                        'shift_end' => Carbon::createFromTimeString($shift['end']),
                    ]
                );
            }
        }

        // 5. Beberapa menu track_stock + stok rendah (untuk alert stok)
        $items = MenuItem::where('tenant_id', $tenant->id)->take(4)->get();
        $lowStocks = [0, 2, 5, 8];
        foreach ($items as $i => $item) {
            $item->update([
                'track_stock' => true,
                'stock' => $lowStocks[$i] ?? 10,
                'stock_threshold' => 10,
                'unit_type' => 'porsi',
            ]);
        }

        // 6. Beberapa order selesai (untuk Meja / Void / Tipe Transaksi)
        $types = ['dine_in', 'take_away', 'delivery'];
        $tables = ['A1', 'A2', 'B1', null, null];
        if ($items->isNotEmpty()) {
            for ($i = 0; $i < 12; $i++) {
                $item = $items->random();
                $order = Order::create([
                    'tenant_id' => $tenant->id,
                    'outlet_id' => $outlet?->id,
                    'user_id' => $staff->random()->id,
                    'order_code' => 'ORD-' . str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
                    'status' => Order::STATUS_SELESAI,
                    'order_type' => $types[$i % 3],
                    'table_number' => $tables[$i % count($tables)],
                    'total' => rand(15000, 120000),
                    'payment_status' => 'paid',
                ]);
                // 2 order jadi void
                if ($i < 2) {
                    $order->update([
                        'payment_status' => 'void',
                        'void_reason' => 'Salah input',
                    ]);
                }
            }
        }
    }
}
