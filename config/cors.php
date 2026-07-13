<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Settings untuk laravel/cors. Dipakai oleh HandleCors middleware.
    | Paths di-exclude adalah public API endpoints (guest QR ordering).
    |
    */

    'paths' => ['api/*', 'login', 'owner/login', 'oauth/*', 'subscribe/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('APP_URL', 'http://localhost:8000'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
