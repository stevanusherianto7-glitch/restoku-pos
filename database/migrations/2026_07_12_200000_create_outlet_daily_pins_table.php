<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * PIN verifikasi harian per-outlet untuk geolokasi kasir.
     * 1 PIN per (outlet_id, date) — generate otomatis tiap hari, hash bcrypt.
     */
    public function up(): void
    {
        Schema::create('outlet_daily_pins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->date('pin_date');                       // Y-m-d, 1 per hari
            $table->string('pin_hash', 100);               // bcrypt hash PIN 4-digit
            $table->timestamp('verified_at')->nullable();  // kapan kasir verifikasi
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['outlet_id', 'pin_date']);
            $table->index(['outlet_id', 'pin_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outlet_daily_pins');
    }
};
