<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Q75: logo tenant di-unggah ke Cloudinary (konsisten invarian foto menu),
 * bukan lagi file lokal public/images. Simpan public_id agar bisa di-destroy.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->string('logo_public_id')->nullable()->after('logo_path');
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn('logo_public_id');
        });
    }
};
