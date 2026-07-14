<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Scopes\TenantScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PosController — menu untuk layar Kasir (POS).
 *
 * Mengembalikan daftar menu aktif tenant (global + per-outlet bila outlet
 * dipilih) lengkap dengan URL foto Cloudinary (image_path) dan nama kategori.
 * Frontend POS memetakan field: id, name, price, category (nama), image.
 */
class PosController extends Controller
{
    /**
     * Halaman Kasir (POS) — pass menu dari DB (bukan hardcode MOCK).
     */
    public function menuView(Request $request): Response
    {
        // Q5/Q20/Q34: paginasi + server-side filter — jangan kirim 5000 item sekaligus.
        $perPage = min((int) $request->query('per_page', 100), 500);
        $outletId = $request->query('outlet_id') ? (int) $request->query('outlet_id') : null;

        $query = MenuItem::with('category:id,name')
            ->where('is_available', true)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($outletId) {
            $query->where(function ($q) use ($outletId) {
                $q->whereNull('outlet_id')->orWhere('outlet_id', $outletId);
            });
        }

        $items = $query->paginate($perPage, [
            'id', 'outlet_id', 'menu_category_id', 'name',
            'description', 'price', 'image_path', 'is_popular',
        ]);

        $menu = $items->getCollection()->map(function (MenuItem $item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'price' => (float) $item->price,
                'category' => $item->category?->name ?? 'Lainnya',
                'image' => $item->image_path ?: null,
                'description' => $item->description,
                'is_popular' => (bool) $item->is_popular,
            ];
        });

        return Inertia::render('POS/Index', [
            'posMenu' => [
                'data' => $menu,
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function menu(Request $request): JsonResponse
    {
        $outletId = $request->query('outlet_id')
            ? (int) $request->query('outlet_id')
            : null;

        $perPage = min((int) $request->query('per_page', 100), 500);

        $query = MenuItem::withoutGlobalScope(TenantScope::class)
            ->with('category:id,name')
            ->where('is_available', true)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($outletId) {
            $query->where(function ($q) use ($outletId) {
                $q->whereNull('outlet_id')->orWhere('outlet_id', $outletId);
            });
        }

        $items = $query->paginate($perPage, [
            'id', 'outlet_id', 'menu_category_id', 'name',
            'description', 'price', 'image_path', 'is_popular',
        ]);

        $mapped = $items->getCollection()->map(function (MenuItem $item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'price' => (float) $item->price,
                'category' => $item->category?->name ?? 'Lainnya',
                'image' => $item->image_path ?: null,
                'description' => $item->description,
                'is_popular' => (bool) $item->is_popular,
            ];
        });

        return response()->json([
            'menu' => $mapped,
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
            'per_page' => $items->perPage(),
            'total' => $items->total(),
        ]);
    }
}
