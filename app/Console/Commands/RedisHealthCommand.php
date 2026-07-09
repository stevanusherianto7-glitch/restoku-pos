<?php

namespace App\Console\Commands;

use App\Services\RedisHealthService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Fase Audit-Followup — Health-check Redis + alert.
 *
 *   php artisan redis:health              # cek + log bila alert
 *   php artisan redis:health --notify    # (hook) panggil webhook/Slack bila alert
 *
 * Exit code: 0 = sehat, 1 = Redis down, 2 = alert threshold.
 * Cocok untuk cron external (UptimeRobot / HetrixTools / Prometheus).
 */
class RedisHealthCommand extends Command
{
    protected $signature = 'redis:health {--notify : Kirim notifikasi bila alert}';

    protected $description = 'Health-check Redis + alert threshold (audit Pilar 5 #3)';

    public function handle(RedisHealthService $svc): int
    {
        $r = $svc->check();

        if (! $r['ok']) {
            $this->error('[REDIS] DOWN: '.($r['error'] ?? 'unknown'));
            Log::critical('[RedisHealth] REDIS DOWN', $r);

            return 1;
        }

        if ($r['alert']) {
            $this->warn("[REDIS] ALERT: {$r['alert']} "
                ."mem={$r['mem_used_percent']}% conn={$r['clients_used_percent']}%");
            Log::warning('[RedisHealth] '.$r['alert'], $r);
            if ($this->option('notify')) {
                // Hook: di sini bisa dispatch event / call Slack/Telegram webhook.
                // Contoh: event(new RedisAlert($r['alert']));
            }

            return 2;
        }

        $this->info('[REDIS] OK ping='.var_export($r['ping'], true)
            ." mem={$r['mem_used_percent']}% conn={$r['clients_used_percent']}%");

        return 0;
    }
}
