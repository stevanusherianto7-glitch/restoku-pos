<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('google_reviews', function (Blueprint $table) {
            // Sumber ulasan: 'places' (Google Places API) | 'bp' (Business Profile, legacy) | 'demo'.
            $table->string('source')->default('places')->after('google_review_id');
        });
    }

    public function down(): void
    {
        Schema::table('google_reviews', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
