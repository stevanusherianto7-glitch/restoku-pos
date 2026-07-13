<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;

/**
 * Fase Audit-Followup — Redis health & alerting.
 *
 * Mengecek koneksi + memory pressure agar VPS tidak silent-down
 * (audit Pilar 3 #6 & Pilar 5 #3: "Redis down → 500 lumpuh").
 *
 * Threshold (bisa di-override via env):
 *   REDIS_ALERT_MEM_PERCENT=80  → warning bila used_memory > 80% maxmemory
 *   REDIS_ALERT_CONN_PERCENT=80  → warning bila clients > 80% maxclients
 */
final class RedisHealthService
{
    public function check(): array
    {
        $driver = config('database.redis.default.host') ?? '127.0.0.1';

        try {
            $pong = Redis::ping(); // bool|string
            $info = Redis::command('INFO', ['memory']);
            $infoClients = Redis::command('INFO', ['clients']);
            // PhpRedis returns an associative array for a single section; Predis returns a string.
            if (is_array($info)) {
                $info = $this->infoArrayToString($info);
            }
            if (is_array($infoClients)) {
                $infoClients = $this->infoArrayToString($infoClients);
            }
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'driver' => $driver,
                'error' => class_basename($e).': '.$e->getMessage(),
                'mem_used_percent' => null,
                'clients_used_percent' => null,
                'alert' => 'REDIS_DOWN',
            ];
        }

        $memUsed = $this->parseInfo($info, 'used_memory') ?? 0;
        $memMax = $this->parseInfo($info, 'maxmemory') ?? 0;
        $memPct = $memMax > 0 ? round($memUsed / $memMax * 100, 1) : null;

        $clients = $this->parseInfo($infoClients, 'connected_clients') ?? 0;
        $maxClients = (int) (config('database.redis.options')['maxclients'] ?? 10000);
        $cliPct = $maxClients > 0 ? round($clients / $maxClients * 100, 1) : null;

        $alert = null;
        if ($memPct !== null && $memPct >= (float) config('app.redis_alert_mem_percent', 80)) {
            $alert = 'REDIS_MEM_HIGH';
        } elseif ($cliPct !== null && $cliPct >= (float) config('app.redis_alert_conn_percent', 80)) {
            $alert = 'REDIS_CONN_HIGH';
        }

        return [
            'ok' => true,
            'ping' => $pong,
            'driver' => $driver,
            'mem_used' => $memUsed,
            'mem_max' => $memMax,
            'mem_used_percent' => $memPct,
            'clients' => $clients,
            'clients_max' => $maxClients,
            'clients_used_percent' => $cliPct,
            'alert' => $alert,
        ];
    }

    private function parseInfo(string $raw, string $key): ?int
    {
        if (preg_match('/^'.preg_quote($key, '/').':(\\d+)/m', $raw, $m)) {
            return (int) $m[1];
        }

        return null;
    }

    /**
     * Convert a PhpRedis INFO associative array (single section) into the
     * "key:value" newline string format that parseInfo() expects.
     */
    private function infoArrayToString(array $info): string
    {
        $lines = [];
        foreach ($info as $k => $v) {
            $lines[] = $k.':'.($v ?? '');
        }

        return implode("\n", $lines);
    }
}
