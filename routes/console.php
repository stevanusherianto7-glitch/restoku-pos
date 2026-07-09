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
