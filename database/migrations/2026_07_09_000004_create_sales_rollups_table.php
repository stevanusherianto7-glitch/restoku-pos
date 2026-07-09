<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 3.1 — Tabel rollup penjualan harian per outlet.
 *
 * Menyimpan agregat (revenue, jumlah order, rata-rata) sehingga dashboard owner
 * TIDAK perlu scan 25jt order/hari. Diisi oleh SalesRollupService + scheduled command.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_daily_rollups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('outlet_id')->nullable()->constrained()->onDelete('cascade');
            $table->date('date');
            $table->unsignedInteger('order_count')->default(0);
            $table->decimal('gross_revenue', 16, 2)->default(0);
            $table->decimal('discount_total', 16, 2)->default(0);
            $table->decimal('tax_total', 16, 2)->default(0);
            $table->decimal('service_total', 16, 2)->default(0);
            $table->decimal('net_revenue', 16, 2)->default(0);
            $table->decimal('avg_order_value', 16, 2)->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'outlet_id', 'date']);
            $table->index(['tenant_id', 'date']);
        });

        Schema::create('sales_monthly_rollups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('outlet_id')->nullable()->constrained()->onDelete('cascade');
            $table->year('year');
            $table->unsignedTinyInteger('month'); // 1-12
            $table->unsignedInteger('order_count')->default(0);
            $table->decimal('gross_revenue', 16, 2)->default(0);
            $table->decimal('discount_total', 16, 2)->default(0);
            $table->decimal('tax_total', 16, 2)->default(0);
            $table->decimal('service_total', 16, 2)->default(0);
            $table->decimal('net_revenue', 16, 2)->default(0);
            $table->decimal('avg_order_value', 16, 2)->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'outlet_id', 'year', 'month']);
            $table->index(['tenant_id', 'year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_monthly_rollups');
        Schema::dropIfExists('sales_daily_rollups');
    }
};
