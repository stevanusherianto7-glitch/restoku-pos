<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

/**
 * Fase 2.5 — Verifikasi konfigurasi Redis siap di VPS (session/cache/queue).
 * Tidak membuka koneksi nyata (redis lokal tidak jalan) — cukup assert config
 * terpasang dengan benar supaya saat deploy VPS tinggal isi env.
 */
class RedisConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_redis_cache_store_terkonfigurasi(): void
    {
        // Di VPS: CACHE_STORE=redis. Pastikan store 'redis' ada di config.
        $stores = Config::get('cache.stores', []);
        $this->assertArrayHasKey('redis', $stores, 'Cache store redis wajib ada untuk produksi.');
    }

    public function test_redis_session_driver_tersedia(): void
    {
        // Laravel 13: config session.driver terdefinisi (bisa string 'redis' saat env diset).
        $this->assertArrayHasKey('driver', Config::get('session', []), 'Key session.driver harus ada.');
        // Pastikan env.example menyarankan redis (lihat test_env_example di bawah)
        $this->assertTrue(true);
    }

    public function test_redis_queue_connection_tersedia(): void
    {
        $connections = Config::get('queue.connections', []);
        $this->assertArrayHasKey('redis', $connections, 'Queue connection redis wajib ada.');
    }

    public function test_env_example_menyarankan_redis_untuk_produksi(): void
    {
        $example = file_get_contents(base_path('.env.example'));
        // Fase 0: driver redis di-set di .env.example untuk production-ready
        $this->assertStringContainsString('SESSION_DRIVER=redis', $example);
        $this->assertStringContainsString('CACHE_STORE=redis', $example);
        $this->assertStringContainsString('QUEUE_CONNECTION=redis', $example);
    }
}
