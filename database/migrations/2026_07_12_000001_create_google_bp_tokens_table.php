<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Token OAuth Google Business Profile per-tenant.
     * Multi-tenant safe: unik per tenant, token terenkripsi di DB.
     * Refresh token hanya diberikan sekali (saat consent pertama) → wajib disimpan.
     */
    public function up(): void
    {
        Schema::create('google_bp_tokens', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('google_account')->nullable();   // email akun manager GBP
            $table->text('access_token');                   // terenkripsi otomatis (cast encrypted)
            $table->text('refresh_token')->nullable();      // terenkripsi otomatis (cast encrypted)
            $table->timestamp('expires_at')->nullable();
            $table->string('location_id')->nullable();      // numerik BP locationId terpilih
            $table->string('location_name')->nullable();    // untuk display di UI
            $table->string('place_id')->nullable();         // Place ID Maps (opsional, untuk cocokkan)
            $table->timestamps();

            $table->unique('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_bp_tokens');
    }
};
