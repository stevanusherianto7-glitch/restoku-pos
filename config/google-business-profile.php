<?php

return [

    /*
     * Google Business Profile API (ulasan resto sungguhan).
     * OAuth memakai Socialite driver 'google' (config/services.php) — scope ditambah
     * di runtime (business.manage + offline). Client ID/Secret reuse .env GOOGLE_*.
     */
    'scopes' => [
        'openid',
        'profile',
        'email',
        'https://www.googleapis.com/auth/business.manage',
    ],

    // Endpoint Business Profile API (v1) — TIDAK LAGI DIPAKAI (gated Google).
    // Dipertahankan untuk referensi, alur ulasan sekarang via Places API (lihat bawah).
    'api_base' => 'https://businessprofile.googleapis.com/v1',

    /*
     * Google Places API (ulasan real-time by Place ID).
     * Satu server-key Restoku untuk SEMUA tenant (bukan per-tenant).
     * Key diisi di .env GOOGLE_PLACES_API_KEY — jangan expose ke FE.
     */
    'places_api_key' => env('GOOGLE_PLACES_API_KEY', ''),
    'places_api_base' => 'https://maps.googleapis.com/maps/api/place/details/json',
    'geocode_api_base' => 'https://maps.googleapis.com/maps/api/geocode/json',
    'serpapi_key' => env('SERPAPI_KEY', ''),


    /*
     * Override accountId GBP (resource name: accounts/{id}).
     * DARI SCREENSHOT GBP PAWON SALAM: "ID Profil Bisnis" = 11440950457431200377.
     * Ini adalah ACCOUNT id, BUKAN location id. Dipakai agar resolveAccount deterministik
     * (hindari auto-discovery yang ambigu bila akun punya banyak profile).
     * Kosongkan ('') untuk auto-discover via GET /accounts.
     */
    'account_id' => env('GOOGLE_BP_ACCOUNT_ID', '11440950457431200377'),

    /*
     * Override locationId GBP (resource: accounts/{account}/locations/{id}).
     * Untuk Pawon Salam Resto, angka 11440950457431200377 SUDAH DIKONFIRMASI
     * merupakan location id yang sama dengan account id (single-profile).
     * Maka fetchReviews/postReply langsung pakai ini tanpa owner pilih dropdown.
     * Kosongkan ('') bila akun multi-lokasi → owner pilih via bpLocations.
     */
    'location_id' => env('GOOGLE_BP_LOCATION_ID', '11440950457431200377'),

    // Redirect setelah owner mengizinkan akses GBP.
    'redirect_uri' => env('GOOGLE_REDIRECT_URI', 'http://localhost:8000/oauth/google/callback'),
    'bp_redirect_uri' => env('GOOGLE_BP_REDIRECT_URI', 'http://localhost:8000/owner/google-reviews/callback'),

    /*
     * Mode fallback saat tenant BELUM terhubung GBP (tidak ada GoogleBpToken).
     * 'demo' = seeding mock (UI tidak kosong, transparan status:'demo').
     * 'off'  = langsung error transparan (tidak ada data palsu).
     */
    'fallback_mode' => env('GOOGLE_BP_FALLBACK', 'demo'),

    // TTL cache ulasan (detik) — cukup untuk polling 30 detik.
    'cache_ttl' => 60,
];
