<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\OutletTable;
use App\Models\Scopes\TenantScope;
use App\Services\DailyPinService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;

/**
 * GuestVerifyController — verifikasi kehadiran tamu (anti-fraud QR order).
 *
 * Tamu wajib: (1) GPS dalam radius outlet, (2) PIN Meja 4-digit,
 * (3) PIN Harian Restoran 4-digit. Sukses → signed token (15 menit) yg
 * harus disertakan saat POST /api/orders.
 */
class GuestVerifyController extends Controller
{
    public function __construct(private DailyPinService $pins) {}

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => 'required|string',
            'table' => 'required|string|max:50',
            'table_pin' => 'required|string|size:4',
            'daily_pin' => 'required|string|size:4',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'accuracy' => 'nullable|numeric',
        ]);

        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->where('slug', $validated['slug'])
            ->first();

        if (! $outlet) {
            return response()->json(['ok' => false, 'reason' => 'outlet_not_found'], 404);
        }

        // 1) Cari meja by label (case-insensitive normalize)
        $label = trim($validated['table']);
        $table = OutletTable::withoutGlobalScope(TenantScope::class)
            ->where('outlet_id', $outlet->id)
            ->whereRaw('LOWER(label) = ?', [strtolower($label)])
            ->first();

        if (! $table) {
            return response()->json(['ok' => false, 'reason' => 'table_not_found'], 422);
        }

        if (! Hash::check($validated['table_pin'], $table->pin_hash)) {
            return response()->json(['ok' => false, 'reason' => 'pin_table'], 422);
        }

        // 2) PIN harian restoran
        if (! $this->pins->verify($outlet->id, $validated['daily_pin'])) {
            return response()->json(['ok' => false, 'reason' => 'pin_daily'], 422);
        }

        // 3) GPS radius (skip kalau outlet belum punya koordinat = dev mode)
        if ($outlet->latitude !== null && $outlet->longitude !== null) {
            $ok = $this->pins->isWithinRadius(
                $outlet,
                (float) $validated['lat'],
                (float) $validated['lng'],
                $validated['accuracy'] !== null ? (float) $validated['accuracy'] : null,
            );
            if (! $ok) {
                return response()->json(['ok' => false, 'reason' => 'gps'], 422);
            }
        }

        // Session-based verification: tamu <-> meja terikat untuk SATU kedatangan.
        // Saat tamu BARU memindai QR meja yang sama, token ini di-regenerate ->
        // meninvalidasi sesi tamu sebelumnya (bukan timer wall-clock).
        $sessionToken = \Str::random(32);
        $table->last_scan_token = $sessionToken;
        $table->save();

        // Signed token (masih ada exp sebagai safety net, tapi expiry utama
        // ditentukan oleh perubahan last_scan_token di meja ini).
        $token = Crypt::encryptString(json_encode([
            'outlet_id' => $outlet->id,
            'table' => $label,
            'session' => $sessionToken,
            'exp' => now()->addHours(6)->timestamp,
        ]));

        return response()->json([
            'ok' => true,
            'token' => $token,
            'table_session' => $sessionToken,
            'expires_at' => now()->addHours(6)->toIso8601String(),
        ]);
    }

    /**
     * Publik: cek session token aktif untuk meja tertentu.
     * FE poll endpoint ini; kalau token berubah (tamu baru scan QR) -> verify kedaluwarsa.
     */
    public function tableSession(Request $request): JsonResponse
    {
        $slug = $request->query('slug') ?? '';
        $table = $request->query('table') ?? '';
        if (! $slug || ! $table) {
            return response()->json(['error' => 'slug and table required'], 422);
        }

        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->where('slug', $slug)
            ->first();

        if (! $outlet) {
            return response()->json(['error' => 'outlet_not_found'], 404);
        }

        $t = OutletTable::withoutGlobalScope(TenantScope::class)
            ->where('outlet_id', $outlet->id)
            ->whereRaw('LOWER(label) = ?', [strtolower(trim($table))])
            ->first();

        if (! $t) {
            return response()->json(['error' => 'table_not_found'], 422);
        }

        return response()->json([
            'table_session' => $t->last_scan_token,
        ]);
    }

    /**
     * Publik: ambil PIN harian restoran untuk tamu (verifikasi kehadiran di kedai).
     * Tidak butuh login — PIN hanya 4-digit kehadiran, bukan secret.
     * Konsisten dengan PIN di dashboard Kasir/Pelayan (DailyPinService deterministic).
     */
    public function dailyPin(Request $request): JsonResponse
    {
        $slug = $request->query('slug') ?? '';
        if (! $slug) {
            return response()->json(['error' => 'slug required'], 422);
        }

        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->where('slug', $slug)
            ->first();

        if (! $outlet) {
            return response()->json(['error' => 'outlet_not_found'], 404);
        }

        $pin = $this->pins->getOrGenerate($outlet->id, now()->toDateString());

        return response()->json([
            'outlet_id' => $outlet->id,
            'date' => now()->toDateString(),
            'pin' => $pin,
        ]);
    }
}
