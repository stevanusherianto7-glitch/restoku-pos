<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FNB-003: per-item cook tracker 5-stage.
 * Tiap OrderItem punya cook_status mandiri
 * (dikonfirmasi >> sedang_dimasak >> selesai_masak >> siap_sajikan >> selesai)
 * agar KDS/CustomerView bisa telusuri progres tiap menu, bukan cuma order.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('cook_status', 32)->default('dikonfirmasi');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('cook_status');
        });
    }
};
