<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * [L2] Tabel biaya operasional — input pengeluaran harian owner.
     * Tenant-scoped (tenant_id) supaya tidak cross-tenant leak.
     */
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('outlet_id')->nullable();
            $table->string('category'); // listrik, gaji, sewa, bahan, lainnya
            $table->text('description')->nullable();
            $table->decimal('amount', 14, 2);
            $table->date('expense_date');
            $table->boolean('is_recurring')->default(false);
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('expense_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
