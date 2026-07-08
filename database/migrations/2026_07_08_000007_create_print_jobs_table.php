<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');

            $table->string('job_code'); // e.g. PRJ-0001
            $table->string('type');    // 'Struk Kasir', 'Pesanan Dapur', 'Laporan Z'
            $table->string('order_ref')->nullable(); // order_code reference (not FK — order may be voided)
            $table->string('target');  // Printer name/connection
            $table->enum('status', ['queued', 'printing', 'done', 'failed'])->default('queued');
            $table->text('error')->nullable();
            $table->unsignedTinyInteger('retry_count')->default(0);

            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->unique(['tenant_id', 'job_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_jobs');
    }
};
