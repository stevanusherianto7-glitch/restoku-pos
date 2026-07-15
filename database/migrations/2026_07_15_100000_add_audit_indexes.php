<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * S-29 / S-30: index tambahan utk query laporan & stock alert.
 * - orders: (tenant_id, payment_status) utk laporanVoid(); (tenant_id, outlet_id, status) utk KDS/queue filter.
 * - menu_items: (track_stock, stock, stock_threshold) utk getStockAlerts().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['tenant_id', 'payment_status'], 'orders_tenant_payment_status_idx');
            $table->index(['tenant_id', 'outlet_id', 'status'], 'orders_tenant_outlet_status_idx');
            $table->index(['tenant_id', 'table_number'], 'orders_tenant_table_number_idx');
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->index(['track_stock', 'stock', 'stock_threshold'], 'menu_items_stock_alert_idx');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_tenant_payment_status_idx');
            $table->dropIndex('orders_tenant_outlet_status_idx');
            $table->dropIndex('orders_tenant_table_number_idx');
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropIndex('menu_items_stock_alert_idx');
        });
    }
};
