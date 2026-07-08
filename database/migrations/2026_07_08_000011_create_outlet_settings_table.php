<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Membuat tabel outlet_settings yang berstruktur.
 *
 * Menggabungkan data dari:
 *   - outlets.operating_hours (JSON)
 *   - receipt_configs tabel terpisah
 *   - outlets.settings JSON blob (jika ada)
 *
 * receipt_configs TIDAK langsung di-drop (migration terpisah setelah verifikasi).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outlet_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->unique()->constrained()->onDelete('cascade');

            // ── Jam Operasional ────────────────────────────────────────────
            // Format: {mon:{open:"08:00",close:"22:00",closed:false}, tue:{...}, ...}
            $table->json('operating_hours')->nullable();

            // ── Struk / Receipt ────────────────────────────────────────────
            $table->text('receipt_header')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->string('paper_width', 10)->default('80mm');   // '58mm' | '80mm'
            $table->string('font_type', 20)->default('font-a');   // 'font-a' | 'font-b'
            $table->boolean('show_pbjt')->default(true);
            $table->boolean('show_service_charge')->default(false);
            $table->boolean('show_ppn')->default(false);

            // ── Printer ────────────────────────────────────────────────────
            $table->string('printer_ip', 45)->nullable();   // IPv4 atau IPv6
            $table->unsignedSmallInteger('printer_port')->default(9100);
            $table->boolean('auto_print_on_order')->default(false); // pro feature

            // ── Display ────────────────────────────────────────────────────
            $table->string('kds_display_mode', 20)->default('grid'); // 'grid' | 'list'
            $table->unsignedTinyInteger('kds_alert_minutes')->default(10); // alert jika > N menit

            $table->timestamps();
        });

        // ── Data migration: salin dari outlets.operating_hours ─────────────
        $outlets = DB::table('outlets')->select('id', 'operating_hours')->get();
        foreach ($outlets as $outlet) {
            $operatingHours = null;
            if ($outlet->operating_hours) {
                // Bisa berupa JSON string atau sudah array (tergantung cast model)
                $operatingHours = is_string($outlet->operating_hours)
                    ? $outlet->operating_hours
                    : json_encode($outlet->operating_hours);
            }

            DB::table('outlet_settings')->insertOrIgnore([
                'outlet_id'       => $outlet->id,
                'operating_hours' => $operatingHours,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        // ── Data migration: merge dari receipt_configs ─────────────────────
        if (Schema::hasTable('receipt_configs')) {
            $receipts = DB::table('receipt_configs')->get();
            foreach ($receipts as $r) {
                DB::table('outlet_settings')
                    ->where('outlet_id', $r->outlet_id)
                    ->update([
                        'receipt_header'      => $r->header ?? null,
                        'receipt_footer'      => $r->footer ?? null,
                        'paper_width'         => $r->paper_width ?? '80mm',
                        'font_type'           => $r->font_type ?? 'font-a',
                        'show_pbjt'           => $r->show_pbjt ?? true,
                        'show_service_charge' => $r->show_service_charge ?? false,
                        'updated_at'          => now(),
                    ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('outlet_settings');
    }
};
