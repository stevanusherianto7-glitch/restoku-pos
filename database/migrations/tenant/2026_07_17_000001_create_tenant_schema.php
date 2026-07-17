<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 2 — Konsolidasi skema per-tenant (tenant-scoped tables).
 *
 * Dijalankan HANYA via `php artisan tenant:migrate` (koneksi schema/DB
 * tenant_{id} terpisah). TIDAK dijalankan oleh `php artisan migrate` biasa
 * (yang memindai database/migrations/ root, bukan subfolder tenant/).
 *
 * Desain (Architect decision — opsi A):
 *  - Semua tabel tenant-scoped di-build di sini DENGAN struktur FINAL
 *    (termasuk kolom dari migrasi alter: slug global, outlet_id di menu_items,
 *    cook_status, destination, food/drink_served_at, dll).
 *  - Kolom `tenant_id` DIPERTAHANKAN (nullable) agar TenantBackfillCommand
 *    yang menyalin row apa adanya tetap idempoten & tidak break. Drop di
 *    fase cleanup terpisah saat backfill selesai.
 *  - TIDAK ADA foreign key ke tabel shared (users, tenants) karena schema
 *    fisik terpisah — FK hanya antar tabel dalam schema tenant yang sama.
 *
 * Hanya Postgres mendukung declarative partitioning untuk orders; MySQL/
 * fallback membuat tabel biasa.
 */
return new class extends Migration
{
    public function up(): void
    {
        $isPgsql = DB::connection()->getDriverName() === 'pgsql';

        Schema::create('outlets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('slug');
            $table->unique('slug'); // global-unique per invarian
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('logo_path')->nullable();
            $table->string('logo_public_id')->nullable();
            $table->json('operating_hours')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('google_place_id')->nullable();
            $table->string('old_slug')->nullable();
            $table->integer('geo_radius_meters')->default(50);
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('menu_categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('type')->default('food'); // food | beverage
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->foreignId('menu_category_id')->nullable()->constrained('menu_categories')->onDelete('set null');
            $table->unsignedBigInteger('outlet_id')->nullable()->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->integer('stock')->default(0);
            $table->integer('stock_threshold')->default(10);
            $table->boolean('track_stock')->default(false);
            $table->string('unit_type')->nullable();
            $table->string('image_path')->nullable();
            $table->string('image_public_id')->nullable();
            $table->boolean('is_available')->default(true);
            $table->boolean('is_popular')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('modifiers')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'is_available']);
            $table->index(['tenant_id', 'outlet_id']);
            $table->index(['track_stock', 'stock', 'stock_threshold']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            // FK ke orders ter-partisi: PK orders = (id, created_at) -> reference harus include keduanya.
            $table->unsignedBigInteger('order_id');
            $table->timestamp('order_created_at')->nullable();
            $table->foreign(['order_id', 'order_created_at'], 'order_items_order_fk')
                  ->references(['id', 'created_at'])->on('orders')->onDelete('cascade');
            $table->foreignId('menu_item_id')->nullable()->constrained('menu_items')->onDelete('set null');
            $table->string('item_name');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('subtotal', 14, 2);
            $table->text('notes')->nullable();
            $table->string('cook_status', 32)->default('dikonfirmasi');
            $table->timestamps();
            $table->index(['tenant_id', 'order_id']);
        });

        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('outlet_id')->nullable()->index();
            $table->string('reservation_code')->nullable();
            $table->string('name');
            $table->string('phone', 20);
            $table->date('date');
            $table->time('time');
            $table->unsignedSmallInteger('guests');
            $table->string('type')->default('meja');
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->unique(['tenant_id', 'reservation_code']);
            $table->index(['tenant_id', 'date', 'status']);
        });

        Schema::create('outlet_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->unique()->constrained('outlets')->onDelete('cascade');
            $table->json('operating_hours')->nullable();
            $table->text('receipt_header')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->string('paper_width', 10)->default('80mm');
            $table->string('font_type', 20)->default('font-a');
            $table->boolean('show_pbjt')->default(true);
            $table->boolean('show_service_charge')->default(false);
            $table->boolean('show_ppn')->default(false);
            $table->string('printer_ip', 45)->nullable();
            $table->unsignedSmallInteger('printer_port')->default(9100);
            $table->boolean('auto_print_on_order')->default(false);
            $table->string('kds_display_mode', 20)->default('grid');
            $table->unsignedTinyInteger('kds_alert_minutes')->default(10);
            $table->string('screen_mode')->default('light');
            $table->timestamps();
        });

        Schema::create('receipt_configs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('header')->default('RESTOKU');
            $table->text('footer')->default("Terima kasih atas kunjungan Anda!\nSampai jumpa kembali.");
            $table->boolean('show_npwp')->default(false);
            $table->boolean('show_nib')->default(false);
            $table->boolean('show_service_charge')->default(false);
            $table->boolean('show_pbjt')->default(true);
            $table->string('paper_width', 10)->default('80mm');
            $table->string('font_type', 20)->default('font-a');
            $table->string('print_density', 10)->default('normal');
            $table->boolean('auto_write_cashier')->default(true);
            $table->string('void_policy', 16)->default('audit_full');
            $table->timestamps();
            $table->unique('tenant_id');
        });

        Schema::create('print_jobs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('job_code');
            $table->string('type');
            $table->string('order_ref')->nullable();
            $table->string('target');
            $table->string('status', 16)->default('queued');
            $table->text('error')->nullable();
            $table->unsignedTinyInteger('retry_count')->default(0);
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
            $table->unique(['tenant_id', 'job_code']);
        });

        Schema::create('outlet_tables', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('outlet_id')->index();
            $table->string('label');
            $table->string('pin_hash');
            $table->boolean('is_queue')->default(false);
            $table->string('qr_type')->default('frame');
            $table->string('last_scan_token', 64)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
            $table->unique(['outlet_id', 'label']);
        });

        Schema::create('outlet_daily_pins', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('outlet_id')->index();
            $table->date('pin_date');
            $table->string('pin_hash', 100);
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->timestamps();
            $table->unique(['outlet_id', 'pin_date']);
            $table->index(['outlet_id', 'pin_date']);
        });

        Schema::create('google_reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('outlet_id')->nullable()->index();
            $table->string('google_review_id')->unique();
            $table->string('source')->default('places');
            $table->string('reviewer_name');
            $table->string('reviewer_photo')->nullable();
            $table->integer('rating');
            $table->text('comment')->nullable();
            $table->text('reply_text')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->timestamp('reviewed_at');
            $table->timestamps();
        });

        Schema::create('google_bp_tokens', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('google_account')->nullable();
            $table->text('access_token');
            $table->text('refresh_token')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('location_id')->nullable();
            $table->string('location_name')->nullable();
            $table->string('place_id')->nullable();
            $table->timestamps();
            $table->unique('tenant_id');
        });

        Schema::create('sales_daily_rollups', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('outlet_id')->nullable()->index();
            $table->date('date');
            $table->unsignedInteger('order_count')->default(0);
            $table->decimal('gross_revenue', 16, 2)->default(0);
            $table->decimal('discount_total', 16, 2)->default(0);
            $table->decimal('tax_total', 16, 2)->default(0);
            $table->decimal('service_total', 16, 2)->default(0);
            $table->decimal('net_revenue', 16, 2)->default(0);
            $table->decimal('avg_order_value', 16, 2)->default(0);
            $table->timestamps();
            $table->unique(['tenant_id', 'outlet_id', 'date']);
            $table->index(['tenant_id', 'date']);
        });

        Schema::create('sales_monthly_rollups', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('outlet_id')->nullable()->index();
            $table->year('year');
            $table->unsignedTinyInteger('month');
            $table->unsignedInteger('order_count')->default(0);
            $table->decimal('gross_revenue', 16, 2)->default(0);
            $table->decimal('discount_total', 16, 2)->default(0);
            $table->decimal('tax_total', 16, 2)->default(0);
            $table->decimal('service_total', 16, 2)->default(0);
            $table->decimal('net_revenue', 16, 2)->default(0);
            $table->decimal('avg_order_value', 16, 2)->default(0);
            $table->timestamps();
            $table->unique(['tenant_id', 'outlet_id', 'year', 'month']);
            $table->index(['tenant_id', 'year', 'month']);
        });

        Schema::create('orders_archive', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('outlet_id')->nullable()->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('order_code');
            $table->string('table_number')->nullable();
            $table->string('source')->default('pos');
            $table->string('status', 32)->default('antrian_masuk');
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->decimal('service_charge_amount', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->string('payment_status', 16)->default('unpaid');
            $table->string('payment_method')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->string('void_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'order_code']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'outlet_id', 'created_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('action');
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('outlet_id')->nullable()->index();
            $table->string('category');
            $table->text('description')->nullable();
            $table->decimal('amount', 14, 2);
            $table->date('expense_date');
            $table->boolean('is_recurring')->default(false);
            $table->timestamps();
            $table->index('expense_date');
        });

        Schema::create('cashier_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('outlet_id')->nullable()->index();
            $table->unsignedBigInteger('user_id');
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->decimal('opening_balance', 14, 2)->default(0);
            $table->decimal('closing_balance', 14, 2)->nullable();
            $table->integer('transaction_count')->default(0);
            $table->decimal('total_sales', 14, 2)->default(0);
            $table->timestamps();
            $table->index(['tenant_id', 'opened_at']);
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('user_id');
            $table->date('attendance_date');
            $table->string('status', 16)->default('present');
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'user_id', 'attendance_date']);
        });

        Schema::create('shift_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('user_id');
            $table->tinyInteger('day_of_week');
            $table->time('shift_start');
            $table->time('shift_end');
            $table->timestamps();
            $table->index(['tenant_id', 'day_of_week']);
        });

        Schema::create('agent_conversations', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('title');
            $table->timestamps();
            $table->index(['user_id', 'updated_at']);
        });

        Schema::create('agent_conversation_messages', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('conversation_id', 36)->index();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('agent');
            $table->string('role', 25);
            $table->text('content');
            $table->text('attachments');
            $table->text('tool_calls');
            $table->text('tool_results');
            $table->text('usage');
            $table->text('meta');
            $table->timestamps();
            $table->index(['conversation_id', 'user_id', 'updated_at']);
        });
    }

    public function down(): void
    {
        $tables = [
            'agent_conversation_messages', 'agent_conversations',
            'shift_schedules', 'attendances', 'cashier_sessions', 'expenses',
            'audit_logs', 'orders_archive', 'sales_monthly_rollups',
            'sales_daily_rollups', 'google_bp_tokens', 'google_reviews',
            'outlet_daily_pins', 'outlet_tables', 'print_jobs', 'receipt_configs',
            'outlet_settings', 'reservations', 'order_items', 'orders',
            'menu_items', 'menu_categories', 'outlets',
        ];
        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }
};
