<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 2.6 — Tabel orders ter-partisi (Postgres declarative partitioning).
 *
 * PARTITION BY RANGE (created_at): siap untuk ~25jt order/hari di 500k outlet.
 * Partisi bulanan dibuat otomatis oleh TenantPartitionManager (cron bulanan).
 *
 * Hanya dijalankan via `php artisan tenant:migrate` (koneksi schema tenant_{id}).
 * Tidak dijalankan di sqlite/test (sharding=false → fallback shared migration).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Hanya Postgres mendukung declarative partitioning.
        if (DB::connection()->getDriverName() !== 'pgsql') {
            // Fallback: tabel biasa (MySQL tanpa partisi deklaratif).
            Schema::create('orders', function (Blueprint $table) {
                $this->columns($table);
            });
            return;
        }

        // Buat tabel ter-partisi
        DB::statement(<<<'SQL'
            CREATE TABLE orders (
                id bigserial,
                tenant_id bigint NOT NULL,
                outlet_id bigint NULL,
                created_by bigint NULL,
                order_code varchar(255) NOT NULL,
                table_number varchar(255) NULL,
                source varchar(255) NOT NULL DEFAULT 'pos',
                status varchar(255) NOT NULL DEFAULT 'antrian_masuk',
                subtotal numeric(14,2) NOT NULL DEFAULT 0,
                discount_amount numeric(14,2) NOT NULL DEFAULT 0,
                tax_amount numeric(14,2) NOT NULL DEFAULT 0,
                service_charge_amount numeric(14,2) NOT NULL DEFAULT 0,
                total numeric(14,2) NOT NULL DEFAULT 0,
                payment_status varchar(255) NOT NULL DEFAULT 'unpaid',
                payment_method varchar(255) NULL,
                paid_at timestamp NULL,
                notes text NULL,
                void_reason varchar(255) NULL,
                cancelled_at timestamp NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                PRIMARY KEY (id, created_at)
            ) PARTITION BY RANGE (created_at);
        SQL);

        // Index (termasuk partition key untuk pruning + constraint unik Postgres).
        // Postgres melarang UNIQUE INDEX pada partitioned table jika tidak include
        // kolom partition key (created_at). Maka unique = (tenant_id, order_code, created_at).
        DB::statement('CREATE INDEX orders_tenant_status_idx ON orders (tenant_id, status)');
        DB::statement('CREATE INDEX orders_tenant_outlet_created_idx ON orders (tenant_id, outlet_id, created_at)');
        DB::statement('CREATE UNIQUE INDEX orders_tenant_code_unique ON orders (tenant_id, order_code, created_at)');
    }

    private function columns(Blueprint $table): void
    {
        $table->id();
        $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
        $table->foreignId('outlet_id')->nullable()->constrained()->onDelete('set null');
        $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
        $table->string('order_code');
        $table->string('table_number')->nullable();
        $table->enum('source', ['pos', 'guest_qr', 'waiter'])->default('pos');
        $table->enum('status', ['antrian_masuk', 'sedang_dimasak', 'siap_sajikan', 'siap_bayar', 'selesai', 'dibatalkan'])->default('antrian_masuk');
        $table->decimal('subtotal', 14, 2)->default(0);
        $table->decimal('discount_amount', 14, 2)->default(0);
        $table->decimal('tax_amount', 14, 2)->default(0);
        $table->decimal('service_charge_amount', 14, 2)->default(0);
        $table->decimal('total', 14, 2)->default(0);
        $table->enum('payment_status', ['unpaid', 'paid', 'refunded', 'void'])->default('unpaid');
        $table->string('payment_method')->nullable();
        $table->timestamp('paid_at')->nullable();
        $table->text('notes')->nullable();
        $table->string('void_reason')->nullable();
        $table->timestamp('cancelled_at')->nullable();
        $table->timestamps();
        $table->unique(['tenant_id', 'order_code']);
        $table->index(['tenant_id', 'status']);
        $table->index(['tenant_id', 'outlet_id', 'created_at']);
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
