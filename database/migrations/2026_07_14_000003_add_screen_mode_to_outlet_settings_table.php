<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Q97: persist tema layar (screen_mode) ke DB per-outlet, agar tidak
 * hilang saat ganti device (sebelumnya hanya localStorage).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlet_settings', function (Blueprint $table) {
            $table->string('screen_mode')->default('light')->after('auto_print_on_order');
        });
    }

    public function down(): void
    {
        Schema::table('outlet_settings', function (Blueprint $table) {
            $table->dropColumn('screen_mode');
        });
    }
};
