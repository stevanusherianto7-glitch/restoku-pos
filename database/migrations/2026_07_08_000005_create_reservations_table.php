<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('outlet_id')->nullable()->constrained()->onDelete('set null');

            $table->string('reservation_code')->nullable(); // e.g. RSV-001, unique per tenant
            $table->string('name');
            $table->string('phone', 20);
            $table->date('date');
            $table->time('time');
            $table->unsignedSmallInteger('guests');
            $table->string('type')->default('meja'); // meja, acara, ulang_tahun, dll.
            $table->text('notes')->nullable();

            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed'])
                  ->default('pending');

            $table->timestamps();

            $table->unique(['tenant_id', 'reservation_code']);
            $table->index(['tenant_id', 'date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
