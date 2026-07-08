<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('brand_name');
            $table->string('email')->unique();
            $table->string('npwp')->nullable();
            $table->string('nib')->nullable();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('tax_type')->default('pbjt'); // pbjt / ppn
            $table->decimal('pbjt_rate', 4, 2)->default(10.00);
            $table->decimal('service_charge_rate', 4, 2)->default(0.00);
            $table->json('settings')->nullable();
            $table->timestamp('onboarding_completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
