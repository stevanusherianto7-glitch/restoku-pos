<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah last_scan_token di outlet_tables untuk session-based guest verification.
 *
 * Logika bisnis: verifikasi kehadiran tamu mengikat tamu <-> meja untuk SATU
 * kedatangan. Saat tamu BARU memindai QR meja yang SAMA, backend generate
 * token baru -> meninvalidasi sesi tamu sebelumnya (bukan wall-clock timer).
 * Kolom ini menyimpan token aktif terakhir per meja.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlet_tables', function (Blueprint $table) {
            $table->string('last_scan_token', 64)->nullable()->after('pin_hash');
        });
    }

    public function down(): void
    {
        Schema::table('outlet_tables', function (Blueprint $table) {
            $table->dropColumn('last_scan_token');
        });
    }
};
