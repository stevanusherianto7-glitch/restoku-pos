<?php

namespace App\Models\Concerns;

use App\Services\TenantConnection;
use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Model;

/**
 * UsesTenantConnection — trait untuk model yang hidup di schema per-tenant (Fase 2).
 *
 * Saat sharding aktif (Postgres prod): model query ke koneksi `tenant_{id}`
 * (schema dipisah). Saat non-aktif (sqlite/test): fallback ke koneksi default
 * + TenantScope tetap menyaring (backward-compatible, Fase 1 test tidak break).
 *
 * Pemakaian:
 *   class MenuItem extends Model { use UsesTenantConnection; ... }
 */
trait UsesTenantConnection
{
    public function getConnectionName(): ?string
    {
        // Hindari resolve saat di luar request (mis. saat migration bootstrap)
        if (app()->bound(TenantContext::class) && app(TenantContext::class)->isInitialized()) {
            /** @var TenantConnection $conn */
            $conn = app(TenantConnection::class);
            if ($conn->isSharded()) {
                return $conn->resolve();
            }
        }

        return parent::getConnectionName();
    }
}
