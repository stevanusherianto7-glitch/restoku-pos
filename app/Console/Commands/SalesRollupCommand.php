<?php

namespace App\Console\Commands;

use App\Services\SalesRollupService;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Fase 3.3 — Bangun rollup penjualan.
 *
 *   php artisan sales:rollup                 # harian kemarin + monthly bulan berjalan
 *   php artisan sales:rollup --date=2026-07-01
 *   php artisan sales:rollup --tenant=3
 *   php artisan sales:rollup --seed-months=3  # backfill 3 bulan terakhir (historis)
 */
class SalesRollupCommand extends Command
{
    protected $signature = 'sales:rollup
        {--date= : Tanggal daily (Y-m-d, default kemarin)}
        {--tenant= : ID tenant (default semua)}
        {--seed-months= : Backfill N bulan terakhir}
        {--month= : Bulan (1-12) untuk rollup monthly}
        {--year= : Tahun untuk rollup monthly}';

    protected $description = 'Bangun sales rollup harian/bulanan (Fase 3)';

    public function handle(SalesRollupService $service): int
    {
        if ($this->option('seed-months')) {
            $months = (int) $this->option('seed-months');
            $this->info("Backfill {$months} bulan terakhir...");
            for ($i = $months - 1; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $service->buildMonthly($date->year, $date->month, $this->tenant());
                // backfill daily per hari di bulan itu
                $days = $date->daysInMonth;
                for ($d = 1; $d <= $days; $d++) {
                    $day = Carbon::create($date->year, $date->month, $d);
                    if ($day->greaterThan(now())) {
                        break;
                    }
                    $service->buildDaily($day, $this->tenant());
                }
                $this->line("  ✓ {$date->format('Y-m')}");
            }
            $this->info('Selesai backfill.');

            return self::SUCCESS;
        }

        $date = $this->option('date')
            ? Carbon::parse($this->option('date'))
            : now()->subDay();

        $this->info("Build daily rollup untuk {$date->toDateString()}...");
        $service->buildDaily($date, $this->tenant());
        $this->info('  ✓ daily');

        // Monthly untuk bulan tanggal tersebut
        $service->buildMonthly($date->year, $date->month, $this->tenant());
        $this->info("  ✓ monthly {$date->format('Y-m')}");

        $this->info('Selesai.');

        return self::SUCCESS;
    }

    private function tenant(): ?int
    {
        $t = $this->option('tenant');

        return $t ? (int) $t : null;
    }
}
