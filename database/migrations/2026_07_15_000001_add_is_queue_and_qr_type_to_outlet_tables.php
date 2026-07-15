<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlet_tables', function (Blueprint $table) {
            $table->boolean('is_queue')->default(false)->after('pin_hash');
            $table->string('qr_type')->default('frame')->after('is_queue'); // qr | logo | frame
        });
    }

    public function down(): void
    {
        Schema::table('outlet_tables', function (Blueprint $table) {
            $table->dropColumn(['is_queue', 'qr_type']);
        });
    }
};
