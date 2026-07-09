<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 4.1 — Tabel orders_archive (cold storage).
 *
 * Mirror tabel orders tapi untuk data >6 bulan. Off hot partition →
 * partisi aktif orders tetap kecil & cepat. Data TETAP queryable (compliance).
 *
 * Di Postgres prod ini bisa jadi tabel terpisah di schema yang sama
 * (atau schema archive terpisah). Di sqlite/test struktur sama.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders_archive', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('outlet_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('order_code');

            $table->string('table_number')->nullable();
            $table->enum('source', ['pos', 'guest_qr', 'waiter'])->default('pos');
            $table->enum('status', [
                'antrian_masuk', 'sedang_dimasak', 'siap_sajikan', 'siap_bayar', 'selesai', 'dibatalkan',
            ])->default('antrian_masuk');

            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->decimal('service_charge_amount', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);

            $table->enum('payment_status', ['unpaid', 'paid', 'refunded', 'void'])->default('unpaid');
            $table->string('payment_method')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->text('notes')->nullable();
            $table->string('void_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'order_code']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'outlet_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders_archive');
    }
};
