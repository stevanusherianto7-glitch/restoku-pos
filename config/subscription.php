<?php

return [
    // Durasi trial gratis (hari) untuk simulasi checkout.
    'trial_days' => 14,

    // Definisi paket — single source of truth untuk landing page & checkout.
    'plans' => [
        'basic' => [
            'name'     => 'Basic',
            'price_idr' => 149000,
            'tagline'  => 'Untuk bisnis kuliner pemula',
            'features' => [
                '1 Outlet',
                'Fitur POS Inti',
                'QRIS & Pembayaran Tunai',
                'Buku Menu Digital',
                'Laporan Standar',
            ],
            'popular'  => false,
        ],
        'pro' => [
            'name'     => 'Pro',
            'price_idr' => 399000,
            'tagline'  => 'Untuk restoran menengah ke atas',
            'features' => [
                'Hingga 3 Outlet',
                'Integrasi GoFood & Grab',
                'Notifikasi WhatsApp API',
                'Laporan Keuangan Ekspor',
                'Manajemen Karyawan',
            ],
            'popular'  => true,
        ],
        'enterprise' => [
            'name'     => 'Enterprise',
            'price_idr' => 999000,
            'tagline'  => 'Untuk franchise & bisnis besar',
            'features' => [
                'Outlet Tidak Terbatas',
                'Kitchen Display System (KDS)',
                'Multi-Outlet Branding',
                'Dedicated Account Manager',
                'Custom API Integration',
            ],
            'popular'  => false,
        ],
    ],

    // Urutan tampilan di landing / checkout.
    'order' => ['basic', 'pro', 'enterprise'],
];
