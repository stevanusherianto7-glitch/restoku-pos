<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Fase 0 (Scalability + QR): Outlet butuh `slug` unik per-tenant sebagai
     * basis URL buku menu digital tamu (/m/{slug}?t={meja}).
     * Sekaligus backfill slug dari nama outlet untuk data existing.
     */
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
            // unik per tenant (bukan global) agar tiap tenant bebas pakai 'outlet-utama'
            $table->unique(['tenant_id', 'slug']);
        });

        // Backfill: slug dari nama outlet, unik per tenant.
        // Jalankan per-tenant agar tidak bentrok antar tenant.
        $tenants = DB::table('tenants')->select('id')->get();
        foreach ($tenants as $tenant) {
            $outlets = DB::table('outlets')
                ->where('tenant_id', $tenant->id)
                ->whereNull('slug')
                ->get();
            $used = [];
            foreach ($outlets as $outlet) {
                $base = Str::slug($outlet->name) ?: 'outlet';
                $slug = $base;
                $i = 1;
                while (in_array($slug, $used, true)) {
                    $slug = $base.'-'.$i++;
                }
                $used[] = $slug;
                DB::table('outlets')
                    ->where('id', $outlet->id)
                    ->update(['slug' => $slug]);
            }
        }

        // Set NOT NULL setelah backfill (semua sudah punya slug)
        Schema::table('outlets', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'slug']);
            $table->dropColumn('slug');
        });
    }
};
