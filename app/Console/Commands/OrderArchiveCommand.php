<?php

namespace App\Console\Commands;

use App\Services\OrderArchiveService;
use Illuminate\Console\Command;

/**
 * Fase 4.4 — Arsip orders lama ke cold storage.
 *
 *   php artisan orders:archive                 # arsip >6 bulan, semua tenant
 *   php artisan orders:archive --dry           # estimasi tanpa hapus
 *   php artisan orders:archive --months=12     # threshold 12 bulan
 *   php artisan orders:archive --before=2026-01-01
 *   php artisan orders:archive --tenant=3
 */
class OrderArchiveCommand extends Command
{
    protected $signature = 'orders:archive
        {--months=6 : Threshold umur order (bulan)}
        {--before= : Batas created_at (Y-m-d), override --months}
        {--tenant= : ID tenant (default semua)}
        {--dry : Estimasi saja, tidak hapus}';

    protected $description = 'Arsip orders lama ke cold storage (Fase 4)';

    public function handle(OrderArchiveService $service): int
    {
        $months = (int) $this->option('months');
        $tenant = $this->option('tenant') ? (int) $this->option('tenant') : null;
        $before = $this->option('before');
        $dry = (bool) $this->option('dry');

        if ($dry) {
            $count = $service->pendingCount($months, $tenant);
            $this->info("Estimasi orders akan diarsip: {$count} (threshold {$months} bulan)");

            return self::SUCCESS;
        }

        $this->info('Memulai arsip orders...');
        $result = $service->archive($months, $tenant, $before, false);
        $this->info("Selesai. {$result['archived']} orders diarsip (sebelum {$result['before']}).");

        return self::SUCCESS;
    }
}
