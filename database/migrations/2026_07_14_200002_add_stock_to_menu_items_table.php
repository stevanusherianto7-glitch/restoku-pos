<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * [L3] Tambah stok ke menu_items untuk fitur alert stok.
     * track_stock default false (opt-in) supaya tidak false-alarm.
     */
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->integer('stock')->default(0)->after('price');
            $table->integer('stock_threshold')->default(10)->after('stock');
            $table->boolean('track_stock')->default(false)->after('stock_threshold');
            $table->string('unit_type')->nullable()->after('track_stock');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['stock', 'stock_threshold', 'track_stock']);
        });
    }
};
