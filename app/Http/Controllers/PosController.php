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
    public function menuView(): Response
    {
        $items = MenuItem::with('category:id,name')
            ->where('is_available', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get([
                'id', 'outlet_id', 'menu_category_id', 'name',
                'description', 'price', 'image_path', 'is_popular',
            ]);

        $menu = $items->map(function (MenuItem $item) {
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
            'posMenu' => $menu,
        ]);
    }

    public function menu(Request $request): JsonResponse
    {
        $outletId = $request->query('outlet_id')
            ? (int) $request->query('outlet_id')
            : null;

        $items = MenuItem::withoutGlobalScope(TenantScope::class)
            ->with('category:id,name')
            ->where('is_available', true)
            ->where(function ($q) use ($outletId) {
                $q->whereNull('outlet_id');
                if ($outletId) {
                    $q->orWhere('outlet_id', $outletId);
                }
            })
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get([
                'id', 'outlet_id', 'menu_category_id', 'name',
                'description', 'price', 'image_path', 'is_popular',
            ]);

        $mapped = $items->map(function (MenuItem $item) {
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

        return response()->json(['menu' => $mapped]);
    }
}
