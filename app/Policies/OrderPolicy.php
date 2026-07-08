<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any orders (tenant-scoped list).
     */
    public function viewAny(User $user): bool
    {
        return (bool) $user->tenant_id;
    }

    /**
     * Determine whether the user can view a specific order.
     * TenantScope sudah menyaring query di level DB, ini adalah lapisan kedua
     * agar developer yang lupa scope-nya (mis. pakai withoutGlobalScope) tetap tertahan.
     */
    public function view(User $user, Order $order): bool
    {
        return $user->tenant_id === $order->tenant_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Owner tidak bisa membuat order POS
        return $user->role !== 'owner';
    }

    /**
     * Determine whether the user can update the order (ubah status, dsb).
     */
    public function update(User $user, Order $order): bool
    {
        return $user->tenant_id === $order->tenant_id && $user->role !== 'owner';
    }
}
