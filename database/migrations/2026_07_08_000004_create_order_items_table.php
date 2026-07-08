<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            // tenant_id disimpan langsung (denormalized) supaya TenantScope bisa
            // diterapkan tanpa perlu join ke tabel orders di setiap query.
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('menu_item_id')->nullable()->constrained()->onDelete('set null');

            $table->string('item_name'); // snapshot nama menu saat order dibuat
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2); // snapshot harga saat order dibuat
            $table->decimal('subtotal', 14, 2);
            $table->text('notes')->nullable(); // e.g. "pedas sedang, tanpa sambal"

            $table->timestamps();

            $table->index(['tenant_id', 'order_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
