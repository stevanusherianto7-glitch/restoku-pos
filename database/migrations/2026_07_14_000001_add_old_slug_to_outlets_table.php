<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Q29/Q84: simpan slug lama saat owner rename outlet, agar QR tercetak
 * (yang menunjuk ke /m/{slug_lama}) tetap mengalihkan ke slug baru
 * alih-alih 404. Redirect 301 di PublicOrderController::getPublicMenu.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->string('old_slug')->nullable()->after('slug');
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn('old_slug');
        });
    }
};
