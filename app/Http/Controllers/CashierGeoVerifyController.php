<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Services\DailyPinService;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * CashierGeoVerifyController — verifikasi geolokasi kasir via PIN harian.
 *
 * - GET  /owner/outlet/daily-pin        → PIN hari ini (owner-only, TenantScope)
 * - POST /api/cashier/verify-location   → { pin, lat, lng, accuracy? } → status
 */
final class CashierGeoVerifyController extends Controller
{
    public function __construct(
        private DailyPinService $pins,
        private TenantContext $ctx,
    ) {}

    /** Owner-only: lihat PIN hari ini untuk outlet aktif kasir. */
    public function dailyPin(Request $request): JsonResponse
    {
        $user = Auth::user();
        $outlet = $user->outlet ?? Outlet::where('tenant_id', $this->ctx->id())->first();

        if (! $outlet) {
            return response()->json(['error' => 'Outlet tidak ditemukan'], 404);
        }

        $pin = $this->pins->getOrGenerate($outlet->id, now()->toDateString());

        return response()->json([
            'outlet_id' => $outlet->id,
            'outlet_name' => $outlet->name,
            'date' => now()->toDateString(),
            'pin' => $pin,
            'latitude' => $outlet->latitude ? (float) $outlet->latitude : null,
            'longitude' => $outlet->longitude ? (float) $outlet->longitude : null,
            'geo_radius_meters' => $outlet->geo_radius_meters ?? 50,
        ]);
    }

    /** Kasir: verifikasi PIN + GPS. */
    public function verify(Request $request): JsonResponse
    {
        $user = Auth::user();
        $outlet = $user->outlet ?? Outlet::where('tenant_id', $this->ctx->id())->first();

        if (! $outlet) {
            return response()->json(['error' => 'Outlet tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'pin' => 'required|string|size:4|regex:/^[0-9]{4}$/',
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0|max:1000',
        ]);

        $pinOk = $this->pins->verify($outlet->id, $validated['pin'], now()->toDateString());

        $distance = null;
        $withinRadius = false;
        $gpsProvided = isset($validated['lat']) && isset($validated['lng']);

        if ($gpsProvided) {
            $distance = $this->pins->distanceToOutlet(
                $outlet,
                (float) $validated['lat'],
                (float) $validated['lng'],
            );
            $withinRadius = $this->pins->isWithinRadius(
                $outlet,
                (float) $validated['lat'],
                (float) $validated['lng'],
                $validated['accuracy'] ?? null,
            );
        }

        // Verifikasi sukses = PIN benar. GPS opsional: kalau diberikan harus dalam radius.
        $verified = $pinOk && (! $gpsProvided || $withinRadius);

        if ($verified) {
            $this->pins->markVerified($outlet->id, $user, now()->toDateString());
        }

        return response()->json([
            'verified' => $verified,
            'pin_ok' => $pinOk,
            'gps_provided' => $gpsProvided,
            'distance_m' => $distance !== null ? round($distance) : null,
            'within_radius' => $withinRadius,
            'radius_m' => (int) ($outlet->geo_radius_meters ?? 50),
            'method' => $gpsProvided ? ($withinRadius ? 'GPS' : 'GPS_OUT_OF_RANGE') : 'PIN_ONLY',
            'message' => $verified
                ? 'Lokasi terverifikasi.'
                : (! $pinOk ? 'PIN salah.' : 'Anda berada di luar area restoran.'),
        ]);
    }
}
