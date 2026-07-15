<?php

/*
 * Benchmark laba resto (COGS / OpEx).
 * Digunakan OwnerDashboardService utk estimasi laba (bukan angka riil per-tenant).
 * Tenant dapat override via tenant_settings di masa depan.
 */
return [
    // Cost of Goods Sold — porsi revenue yang jadi biaya bahan baku.
    'cogs' => 0.35,

    // Operational expenses — porsi revenue utk operasional (gaji, sewa, listrik, dsb).
    'opex' => 0.20,
];
