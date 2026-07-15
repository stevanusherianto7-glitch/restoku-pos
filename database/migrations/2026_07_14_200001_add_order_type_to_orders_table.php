<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * [L3] Tambah order_type ke orders (Dine-In / Take Away / Delivery).
     * Default dine_in supaya order lama tetap valid (backward-compat).
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('order_type', ['dine_in', 'take_away', 'delivery'])
                ->default('dine_in')
                ->after('source');
            $table->index(['tenant_id', 'order_type']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'order_type']);
            $table->dropColumn('order_type');
        });
    }
};
