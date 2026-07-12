<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Resolve Google Place ID dari APA PUN input user:
 *   - Place ID langsung (ChIJ...)
 *   - URL Maps berisi ChIJ / ftid
 *   - Koordinat @lat,lng,z  (reverse-geocode via Geocoding API)
 *   - Format !3d lat !4d lng (varian URL Maps lama)
 *   - Nama + koordinat tidak ada → null (error transparan, bukan tebakan).
 *
 * Semua panggilan eksternal pakai 1 server-key Restoku (GOOGLE_PLACES_API_KEY).
 */
class PlaceIdResolver
{
    public function resolve(string $input): ?string
    {
        $input = trim($input);
        if ($input === '') {
            return null;
        }

        // 1. Place ID langsung / di dalam string.
        if (preg_match('/ChIJ[A-Za-z0-9_\-]+/', $input, $m)) {
            return $m[0];
        }

        // 2. Koordinat @lat,lng  ATAU  !3d lat !4d lng.
        $lat = $lng = null;
        if (preg_match('/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/', $input, $m)) {
            $lat = $m[1];
            $lng = $m[2];
        } elseif (preg_match('/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/', $input, $m)) {
            $lat = $m[1];
            $lng = $m[2];
        }

        if ($lat !== null && $lng !== null) {
            return $this->reverseGeocode($lat, $lng);
        }

        return null;
    }

    private function reverseGeocode(string $lat, string $lng): ?string
    {
        $key = config('google-business-profile.places_api_key');
        if (! $key) {
            return null;
        }

        $resp = Http::get(config('google-business-profile.geocode_api_base'), [
            'latlng' => "{$lat},{$lng}",
            'key' => $key,
        ]);

        if (! $resp->successful()) {
            return null;
        }

        $results = $resp->json('results') ?? [];
        if (empty($results)) {
            return null;
        }

        return $results[0]['place_id'] ?? null;
    }
}
