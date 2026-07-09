<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fase 1 — tambahkan kolom yang dibutuhkan di menu_items:
     *  - outlet_id nullable (menu per-outlet atau global tenant)
     *  - is_popular boolean (highlight di buku menu tamu)
     * Skema scaffold awal hanya punya menu_category_id + image_path + modifiers.
     */
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->unsignedBigInteger('outlet_id')->nullable()->after('menu_category_id');
            $table->boolean('is_popular')->default(false)->after('is_available');
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('cascade');
            $table->index(['tenant_id', 'outlet_id']);
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropForeign(['outlet_id']);
            $table->dropColumn(['outlet_id', 'is_popular']);
        });
    }
};
