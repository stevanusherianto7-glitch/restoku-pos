<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 0 (Scalability + QR): slug outlet harus GLOBAL-unique, bukan per-tenant.
 *
 * Alasan: URL buku menu tamu `/m/{slug}` (route publik guest, web.php:38) bersifat
 * global. Slug yang hanya unik per-tenant (`unique(['tenant_id','slug'])`) menyebabkan
 * collision lintas tenant: dua tenant dengan outlet bernama sama (mis. "Kedai Nusantara"
 * atau auto-outlet "Outlet Utama") menghasilkan slug identik → QR tenant B bisa membuka
 * menu tenant A (cross-tenant leak) di skala 5000 tenant.
 *
 * Migrasi ini mengubah constraint menjadi unique('slug') global. Generator slug
 * collision-free (app/Services/OutletSlug.php) menangani duplikat via suffix tenant id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            // Hapus unique per-tenant, ganti dengan unique global.
            $table->dropUnique(['tenant_id', 'slug']);
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->unique(['tenant_id', 'slug']);
        });
    }
};
