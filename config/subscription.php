<?php

return [
    // Durasi trial gratis (hari) untuk simulasi checkout.
    'trial_days' => 14,

    // Definisi paket — single source of truth untuk landing page & checkout.
    // Struktur BERTINGKAT: tiap tier di atas mewarisi fitur tier di bawahnya.
    //   - `features`  = fitur TAMBAHAN di tier ini (extra di atas inherits).
    //   - `inherits`  = tier di bawahnya yang diwarisi seluruh fiturnya.
    //   `all_features` (lihat app/Services/SubscriptionConfig.php) = flatten inherits + extra.
    'plans' => [
        'basic' => [
            'name' => 'Basic',
            'price_idr' => 149000,
            'tagline' => 'Untuk bisnis kuliner pemula',
            'inherits' => null,
            'features' => [
                '1 Outlet',
                'Fitur POS Inti',
                'QRIS & Pembayaran Tunai',
                'Buku Menu Digital',
                'Laporan Standar',
            ],
            'popular' => false,
        ],
        'pro' => [
            'name' => 'Pro',
            'price_idr' => 399000,
            'tagline' => 'Untuk restoran menengah ke atas',
            'inherits' => 'basic',
            'features' => [
                'Hingga 3 Outlet',
                'Integrasi GoFood & Grab',
                'Notifikasi WhatsApp API',
                'Laporan Keuangan Ekspor',
                'Manajemen Karyawan',
            ],
            'popular' => true,
        ],
        'enterprise' => [
            'name' => 'Enterprise',
            'price_idr' => 999000,
            'tagline' => 'Untuk franchise & bisnis besar',
            'inherits' => 'pro',
            'features' => [
                'Outlet Tidak Terbatas',
                'Kitchen Display System (KDS)',
                'Multi-Outlet Branding',
                'Dedicated Account Manager',
                'Custom API Integration',
            ],
            'popular' => false,
        ],
    ],

    // Urutan tampilan di landing / checkout.
    'order' => ['basic', 'pro', 'enterprise'],
];
