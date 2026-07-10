<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\Scopes\TenantScope;
use Illuminate\Support\Str;

/**
 * Generator slug outlet yang GLOBAL-unique (lintas tenant).
 *
 * Route buku menu tamu `/m/{slug}` bersifat global, sehingga slug outlet wajib
 * unik di seluruh tabel (bukan per-tenant). Helper ini menjamin itu:
 *
 *   1. Coba base = Str::slug(name)
 *   2. Jika base sudah ada MILIK tenant yang sama → kembalikan base (itu slug sendiri, idempoten)
 *   3. Jika base bentrok dengan tenant LAIN → base . '-' . $tenantId (unik global)
 *   4. Fallback terakhir → base . '-' . Str::random(6)
 *
 * Query dilakukan WITHOUT TenantScope agar tidak terpengaruh context request
 * (endpoint publik tamu tidak mengikat tenant.id).
 */
final class OutletSlug
{
    public static function unique(string $name, ?int $tenantId = null): string
    {
        $base = Str::slug($name) ?: 'outlet';

        if (! self::exists($base)) {
            return $base;
        }

        // base sudah ada — jika milik tenant yang SAMA, itu slug sendiri (idempoten).
        if ($tenantId && self::ownedBy($base, $tenantId)) {
            return $base;
        }

        if ($tenantId) {
            $candidate = $base.'-'.$tenantId;
            if (! self::exists($candidate)) {
                return $candidate;
            }
        }

        return $base.'-'.Str::random(6);
    }

    private static function exists(string $slug): bool
    {
        return Outlet::withoutGlobalScope(TenantScope::class)
            ->where('slug', $slug)
            ->exists();
    }

    private static function ownedBy(string $slug, int $tenantId): bool
    {
        return Outlet::withoutGlobalScope(TenantScope::class)
            ->where('slug', $slug)
            ->where('tenant_id', $tenantId)
            ->exists();
    }
}
