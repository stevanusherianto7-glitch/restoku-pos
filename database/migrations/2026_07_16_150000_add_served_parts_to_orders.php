<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * FNB-001: tracking penyajian per kategori dalam 1 order utuh.
     * waiter menandai minuman/makanan sudah disajikan terpisah;
     * order baru masuk kasir (siap_bayar) bila allServed() = true.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('food_served_at')->nullable()->after('destination');
            $table->timestamp('drink_served_at')->nullable()->after('food_served_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['food_served_at', 'drink_served_at']);
        });
    }
};
