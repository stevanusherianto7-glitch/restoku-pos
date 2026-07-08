<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Membuat tabel tenant_settings yang berstruktur (mengganti JSON blob tenants.settings).
 *
 * Strategi migrasi data (Keputusan 1 — Senior Architect):
 *   - Data disalin otomatis dari kolom tenants (tax_type, pbjt_rate, dll.)
 *   - Kolom lama di tenants TIDAK langsung di-drop (migration terpisah setelah verifikasi)
 *   - SettingsService memakai COALESCE: baca dari tenant_settings, fallback ke tenants
 *   - Plan B: rollback() menghapus tabel ini saja, kolom lama di tenants tetap utuh
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->onDelete('cascade');

            // ── Pajak & Tarif ──────────────────────────────────────────────
            $table->string('tax_type', 10)->default('pbjt'); // 'pbjt' | 'ppn'
            $table->decimal('pbjt_rate', 4, 2)->default(10.00);
            $table->decimal('ppn_rate', 4, 2)->default(11.00);
            $table->decimal('service_charge_rate', 4, 2)->default(0.00);

            // ── Notifikasi ─────────────────────────────────────────────────
            $table->boolean('wa_notif_enabled')->default(false);
            $table->string('wa_phone_number', 20)->nullable();
            $table->boolean('email_notif_enabled')->default(true);

            // ── Integrasi Marketplace ──────────────────────────────────────
            $table->string('gofood_merchant_id')->nullable();
            $table->string('grab_merchant_id')->nullable();
            $table->string('shopeefood_merchant_id')->nullable();

            // ── White Label (enterprise only) ──────────────────────────────
            $table->string('logo_path')->nullable();
            $table->string('primary_color', 10)->nullable(); // hex e.g. '#3B82F6'
            $table->string('brand_display_name', 100)->nullable(); // overrides brand_name

            $table->timestamps();
        });

        // ── Data migration: salin dari tenants ke tenant_settings ──────────
        // Semua tenant existing mendapat row, dengan nilai dari kolom lama.
        // Kolom lama (tax_type, pbjt_rate, dll.) BELUM di-drop di sini.
        $tenants = DB::table('tenants')->select(
            'id', 'tax_type', 'pbjt_rate', 'ppn_rate', 'service_charge_rate'
        )->get();

        foreach ($tenants as $tenant) {
            DB::table('tenant_settings')->insertOrIgnore([
                'tenant_id'           => $tenant->id,
                'tax_type'            => $tenant->tax_type ?? 'pbjt',
                'pbjt_rate'           => $tenant->pbjt_rate ?? 10.00,
                'ppn_rate'            => $tenant->ppn_rate ?? 11.00,
                'service_charge_rate' => $tenant->service_charge_rate ?? 0.00,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Rollback: cukup hapus tabel baru — data asli di tenants masih utuh
        Schema::dropIfExists('tenant_settings');
    }
};
