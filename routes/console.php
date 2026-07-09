<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Fase 3 — Rollup harian jalan tiap jam 01:00 (setelah tutup kasir).
// Di VPS: scheduler dijalankan via `php artisan schedule:work` atau cron `artisan schedule:run`.
Schedule::command('sales:rollup')->dailyAt('01:00');

// Fase 4 — Arsip orders >6 bulan ke cold storage, tiap tanggal 1 pukul 02:00.
Schedule::command('orders:archive')->monthlyOn(1, '02:00');

// Fase Audit-Followup — Redis alerting tiap 5 menit (Pilar 5 #3).
Schedule::command('redis:health --notify')->everyFiveMinutes();
