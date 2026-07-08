<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom yang dibutuhkan untuk PengaturanOutlet:
 *
 * outlets:
 *   - is_active     : untuk menonaktifkan outlet tanpa hapus data
 *   - operating_hours: jam buka/tutup per hari dalam JSON
 *   - logo_path     : path ke file logo outlet
 *
 * tenants:
 *   - ppn_rate      : tarif PPN (sebelumnya hanya ada pbjt_rate)
 *
 * Semua kolom nullable / have default agar tidak merusak data existing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('phone');
            $table->string('logo_path')->nullable()->after('is_active');
            // operating_hours: { mon: {open:"08:00", close:"22:00", closed:false}, ... }
            $table->json('operating_hours')->nullable()->after('logo_path');
        });

        Schema::table('tenants', function (Blueprint $table) {
            // Tarif PPN terpisah dari pbjt_rate — keduanya bisa beda
            $table->decimal('ppn_rate', 4, 2)->default(11.00)->after('pbjt_rate');
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'logo_path', 'operating_hours']);
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('ppn_rate');
        });
    }
};
