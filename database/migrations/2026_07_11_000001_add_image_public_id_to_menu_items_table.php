<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom image_public_id untuk menyimpan Cloudinary public_id,
     * supaya foto lama bisa di-destroy saat item diupdate/dihapus (cegah orphan).
     */
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->string('image_public_id')->nullable()->after('image_path');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn('image_public_id');
        });
    }
};
