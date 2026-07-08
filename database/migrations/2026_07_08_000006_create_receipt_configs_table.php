<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipt_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');

            $table->string('header')->default('RESTOKU');
            $table->text('footer')->default("Terima kasih atas kunjungan Anda!\nSampai jumpa kembali.");

            $table->boolean('show_npwp')->default(false);
            $table->boolean('show_nib')->default(false);
            $table->boolean('show_service_charge')->default(false);
            $table->boolean('show_pbjt')->default(true);

            $table->enum('paper_width', ['58mm', '80mm'])->default('80mm');
            $table->enum('font_type', ['font-a', 'font-b'])->default('font-a');
            $table->enum('print_density', ['light', 'normal', 'dark'])->default('normal');
            $table->boolean('auto_write_cashier')->default(true);
            $table->enum('void_policy', ['audit_full', 'audit_minimal', 'no_audit'])->default('audit_full');

            $table->timestamps();

            // Satu config per tenant
            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_configs');
    }
};
