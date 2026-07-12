<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            // Place ID Google Maps (ChIJ...) untuk mengambil ulasan real-time via Places API.
            $table->string('google_place_id')->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn('google_place_id');
        });
    }
};
