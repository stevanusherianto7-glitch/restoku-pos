<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FNB-002: alur 5-stage (diterima, selesai_masak).
 * Kolom status order diubah enum -> string agar menambah status baru
 * (diterima, selesai_masak) tidak butuh ALTER enum (SQLite tidak support
 * MODIFY enum dengan mudah, dan enum DB redundant karena validasi sudah
 * di-enforce di Order::TRANSITIONS). String + const model = single source
 * of truth, hindari CHECK constraint violation tiap tambah status.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status', 32)->default('antrian_masuk')->change();
        });

        Schema::table('orders_archive', function (Blueprint $table) {
            $table->string('status', 32)->default('antrian_masuk')->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', [
                'antrian_masuk', 'diterima', 'sedang_dimasak', 'selesai_masak',
                'siap_sajikan', 'siap_bayar', 'selesai', 'dibatalkan',
            ])->default('antrian_masuk')->change();
        });

        Schema::table('orders_archive', function (Blueprint $table) {
            $table->enum('status', [
                'antrian_masuk', 'diterima', 'sedang_dimasak', 'selesai_masak',
                'siap_sajikan', 'siap_bayar', 'selesai', 'dibatalkan',
            ])->default('antrian_masuk')->change();
        });
    }
};
