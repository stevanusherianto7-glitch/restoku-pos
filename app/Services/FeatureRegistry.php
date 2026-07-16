<?php

namespace App\Services;

/**
 * FeatureRegistry — SINGLE SOURCE OF TRUTH untuk feature → plan mapping.
 *
 * Sebelumnya definisi ini ada DI DUA TEMPAT:
 *   - Frontend: PLAN_FEATURES + FEATURE_LOCKS di Shared.tsx (hardcoded)
 *   - Backend: tidak ada → gate hanya di frontend → mudah di-bypass
 *
 * Sekarang:
 *   - Backend (file ini) adalah source of truth
 *   - Frontend membaca via Inertia shared props (HandleInertiaRequests::share())
 *   - Shared.tsx tidak lagi punya PLAN_FEATURES / FEATURE_LOCKS hardcoded
 *
 * Ketika menambah/menghapus fitur: CUKUP edit file ini.
 * Frontend akan otomatis sinkron di request berikutnya.
 *
 * Plan hierarchy: basic < pro < enterprise
 * Enterprise adalah superset penuh dari pro, pro adalah superset penuh dari basic.
 */
class FeatureRegistry
{
    /**
     * Plan hierarchy — semakin tinggi angka semakin banyak fitur.
     */
    public const PLAN_HIERARCHY = [
        'basic' => 1,
        'pro' => 2,
        'enterprise' => 3,
    ];

    /**
     * Feature → minimum plan yang dibutuhkan.
     *
     * Fitur yang tidak ada di sini = GRATIS untuk semua plan.
     * Naming convention: snake_case, match dengan route names & sidebar keys.
     */
    public const FEATURE_LOCKS = [
        // ── Enterprise features (exclusive) ───────────────────────────────
        'white_label' => 'enterprise',
        'priority_support' => 'enterprise',
        'unlimited_outlet' => 'enterprise',

        // ── Pro features ──────────────────────────────────────────────────────
        'kds' => 'pro',
        'multi_outlet' => 'pro',
        'wa_notif' => 'pro',
        'laporan_excel' => 'pro',
        'perbandingan_outlet' => 'pro',
        'arus_kas' => 'pro',
        'auto_print' => 'pro',
        'ppn_tax' => 'pro',
        'service_charge' => 'pro',
        'gofood_sync' => 'pro',
        'grab_sync' => 'pro',
        'shopeefood_sync' => 'pro',
        'staf_shift' => 'pro',
        'stok_opname' => 'pro',
        'pembelian_vendor' => 'pro',
        'dashboard_inventory' => 'pro',
        'inventory' => 'pro',
        'cashier_session' => 'pro',
        'refund_void' => 'pro',
    ];

    /**
     * Semua fitur yang tersedia per plan (termasuk fitur gratis).
     * Disusun sebagai superset: enterprise ⊃ pro ⊃ basic.
     */
    public const PLAN_FEATURES = [
        'basic' => [
            'pbjt_tax', 'qris', 'gopay', 'bank_transfer',
            'qrcode_order', 'thermal_print', 'email_notif',
        ],
        'pro' => [
            'pbjt_tax', 'ppn_tax', 'service_charge',
            'qris', 'gopay', 'ovo', 'dana', 'bank_transfer', 'credit_card',
            'qrcode_order', 'thermal_print', 'auto_print',
            'email_notif', 'wa_notif',
            'gofood_sync', 'grab_sync', 'shopeefood_sync',
            'multi_outlet', 'catatan_pesanan', 'laporan_excel',
            'perbandingan_outlet', 'arus_kas', 'staf_shift',
            'stok_opname', 'pembelian_vendor', 'dashboard_inventory',
            'inventory', 'cashier_session', 'refund_void', 'kds',
        ],
        'enterprise' => [
            // Semua fitur pro
            'pbjt_tax', 'ppn_tax', 'service_charge',
            'qris', 'gopay', 'ovo', 'dana', 'bank_transfer', 'credit_card',
            'qrcode_order', 'thermal_print', 'auto_print',
            'email_notif', 'wa_notif',
            'gofood_sync', 'grab_sync', 'shopeefood_sync',
            'multi_outlet', 'catatan_pesanan', 'laporan_excel',
            'perbandingan_outlet', 'arus_kas', 'staf_shift',
            'stok_opname', 'pembelian_vendor', 'dashboard_inventory',
            'inventory', 'cashier_session', 'refund_void', 'kds',
            // Enterprise-exclusive
            'unlimited_outlet', 'white_label', 'priority_support',
        ],
    ];

    // ─── Methods ──────────────────────────────────────────────────────────────

    /**
     * Apakah plan X memiliki fitur Y?
     */
    public static function planHasFeature(string $plan, string $feature): bool
    {
        $features = self::PLAN_FEATURES[$plan] ?? [];

        return in_array($feature, $features, strict: true);
    }

    /**
     * Minimum plan yang diperlukan untuk sebuah fitur.
     * null berarti fitur tersedia gratis di semua plan.
     */
    public static function minimumPlanFor(string $feature): ?string
    {
        return self::FEATURE_LOCKS[$feature] ?? null;
    }

    /**
     * Semua fitur yang dimiliki oleh plan tertentu.
     */
    public static function allFeaturesForPlan(string $plan): array
    {
        return self::PLAN_FEATURES[$plan] ?? self::PLAN_FEATURES['basic'];
    }

    /**
     * Apakah plan A lebih tinggi atau sama dengan plan B?
     */
    public static function planMeetsRequirement(string $userPlan, string $requiredPlan): bool
    {
        $userLevel = self::PLAN_HIERARCHY[$userPlan] ?? 0;
        $requiredLevel = self::PLAN_HIERARCHY[$requiredPlan] ?? 999;

        return $userLevel >= $requiredLevel;
    }

    /**
     * Serialisasi untuk dikirim ke frontend via Inertia shared props.
     * Frontend tidak perlu hardcode PLAN_FEATURES / FEATURE_LOCKS lagi.
     */
    public static function toInertiaPayload(): array
    {
        return [
            'feature_locks' => self::FEATURE_LOCKS,   // feature → min_plan
            'plan_hierarchy' => self::PLAN_HIERARCHY,
        ];
    }
}
