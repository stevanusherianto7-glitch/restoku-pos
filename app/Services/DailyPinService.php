<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\OutletDailyPin;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * DailyPinService — PIN 4-digit verifikasi geolokasi kasir.
 *
 * - 1 PIN per (outlet_id, tanggal hari ini), generate otomatis (lazy).
 * - PIN di-hash bcrypt, tidak pernah dikirim plaintext ke client kecuali
 *   via endpoint owner-only (Pengaturan Outlet).
 * - Rotate otomatis: kalau tanggal berubah, generate PIN baru.
 * - Verifikasi = PIN benar DAN (opsional) jarak GPS <= radius outlet.
 */
final class DailyPinService
{
    /** Generate / ambil PIN hari ini untuk outlet. Return plaintext (owner-only). */
    public function getOrGenerate(int $outletId, ?string $date = null): string
    {
        $date = $date ?? now()->toDateString();

        $plain = $this->derivePlain($outletId, $date);

        // updateOrCreate agar aman dipanggil berulang (idempoten per hari).
        OutletDailyPin::updateOrCreate(
            ['outlet_id' => $outletId, 'pin_date' => $date],
            ['pin_hash' => Hash::make($plain)],
        );

        return $plain;
    }

    /** Verifikasi PIN (plaintext dari input kasir) untuk hari ini. */
    public function verify(int $outletId, string $plainPin, ?string $date = null): bool
    {
        $date = $date ?? now()->toDateString();

        $row = OutletDailyPin::where('outlet_id', $outletId)
            ->where('pin_date', $date)
            ->first();

        if (! $row) {
            // Generate dulu agar verifikasi tetap bisa jalan.
            $this->getOrGenerate($outletId, $date);
            $row = OutletDailyPin::where('outlet_id', $outletId)
                ->where('pin_date', $date)
                ->firstOrFail();
        }

        return Hash::check($plainPin, $row->pin_hash);
    }

    /** Tandai sudah diverifikasi oleh kasir. */
    public function markVerified(int $outletId, ?User $user = null, ?string $date = null): void
    {
        $date = $date ?? now()->toDateString();

        $row = OutletDailyPin::where('outlet_id', $outletId)
            ->where('pin_date', $date)
            ->first();

        if ($row && $row->verified_at === null) {
            $row->update([
                'verified_at' => now(),
                'verified_by' => $user?->id,
            ]);
        }
    }

    /**
     * Hitung jarak GPS (meter) ke outlet via Haversine.
     * Kembalian null kalau outlet/koordinat tidak terset.
     */
    public function distanceToOutlet(Outlet $outlet, float $lat, float $lng): ?float
    {
        if ($outlet->latitude === null || $outlet->longitude === null) {
            return null;
        }

        return self::haversine($lat, $lng, (float) $outlet->latitude, (float) $outlet->longitude);
    }

    public function isWithinRadius(Outlet $outlet, float $lat, float $lng, ?float $accuracy = null): bool
    {
        $dist = $this->distanceToOutlet($outlet, $lat, $lng);
        if ($dist === null) {
            return false;
        }

        $radius = (int) ($outlet->geo_radius_meters ?? 50);
        // Toleransi: akurasi GPS buruk (>20m) → radius +50%.
        $adjusted = ($accuracy !== null && $accuracy > 20) ? $radius * 1.5 : $radius;

        return $dist <= $adjusted;
    }

    /** Haversine distance in meters. */
    public static function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R = 6371000; // meters
        $toRad = fn ($x) => ($x * M_PI) / 180;
        $dLat = $toRad($lat2 - $lat1);
        $dLng = $toRad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 +
            cos($toRad($lat1)) * cos($toRad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $R * $c;
    }

    /**
     * Derive PIN 4-digit stabil per (outlet, date) tanpa simpan plaintext.
     * Gunakan hash kripto dari seed → ambil 4 digit terakhir yang aman.
     */
    private function derivePlain(int $outletId, string $date): string
    {
        $seed = hash('sha256', "restoku:dailypin:{$outletId}:{$date}");
        // 4 digit angka 0000-9999
        $digits = substr(preg_replace('/\D/', '', $seed), -4);
        $digits = str_pad($digits, 4, '0', STR_PAD_LEFT);

        return $digits;
    }
}
