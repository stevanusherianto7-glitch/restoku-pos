<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel subscriptions menyimpan paket & status billing tiap tenant.
 *
 * Dipisah dari tabel tenants agar:
 *   1. Satu tenant bisa punya history subscription (upgrade/downgrade).
 *   2. Plan & billing bisa berubah tanpa menyentuh data bisnis tenant.
 *   3. Query "tenant mana yang sedang active plan X" bisa diindeks.
 *
 * Default: semua tenant existing di-assign plan 'pro' oleh SubscriptionSeeder
 * agar tidak ada akses yang terputus saat pertama kali migasi.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');

            // Plan tier — harus match dengan FeatureRegistry::PLAN_HIERARCHY
            $table->enum('plan', ['basic', 'pro', 'enterprise'])->default('basic');

            // Status lifecycle subscription
            $table->enum('status', [
                'trialing',   // masa percobaan gratis, belum bayar
                'active',     // aktif dan bayar
                'past_due',   // pembayaran gagal, masih ada grace period
                'cancelled',  // dibatalkan oleh tenant (masih aktif hingga period_end)
                'expired',    // period sudah habis, akses dicabut
            ])->default('trialing');

            $table->timestamp('trial_ends_at')->nullable();         // null = tidak ada trial
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();    // null = perpetual/manual
            $table->timestamp('cancelled_at')->nullable();

            // Referensi ke payment gateway (Midtrans/Xendit invoice ID, dll.)
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Composite index: paling sering diquery "tenant X, status active"
            $table->index(['tenant_id', 'status']);
            $table->index(['status', 'current_period_end']); // untuk cron expiry check
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
