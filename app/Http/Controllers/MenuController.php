<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Scopes\TenantScope;
use App\Services\CloudinaryService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * MenuController — CRUD menu items (Fase 1).
 *
 * Tenant-scoped via TenantScope (aktif otomatis). Upload foto ke Cloudinary
 * (CDN offload) via CloudinaryService. Cache buku menu di-invalidate saat update.
 */
class MenuController extends Controller
{
    public function __construct(
        private TenantContext $ctx,
        private CloudinaryService $cloudinary,
    ) {}

    // ─── Halaman kelola menu (owner) ──────────────────────────────────────────

    public function index(): Response
    {
        $items = MenuItem::with('category:id,name')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'outlet_id', 'menu_category_id', 'name', 'description', 'price', 'image_path', 'is_available', 'is_popular', 'sort_order']);

        $outlets = Outlet::select('id', 'name')->get();

        return Inertia::render('KatalogMenu/Index', [
            'menuItems' => $items,
            'outlets' => $outlets,
        ]);
    }

    // ─── API CRUD ─────────────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'description' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0|max:99999999',
            'menu_category_id' => ['required', 'integer',
                Rule::exists('menu_categories', 'id')
                    ->where('tenant_id', $this->ctx->id())],
            'outlet_id' => ['nullable', 'integer',
                Rule::exists('outlets', 'id')
                    ->where('tenant_id', $this->ctx->id())],
            'is_popular' => 'boolean',
            'is_available' => 'boolean',
            'sort_order' => 'integer|min:0',
            'photo' => 'nullable|string', // data URL base64 dari frontend
        ]);

        $photoUrl = null;
        if (! empty($validated['photo'])) {
            $photoUrl = $this->cloudinary->uploadMenuPhoto(
                $validated['photo'], $this->ctx->id()
            );
        }

        MenuItem::create([
            'tenant_id' => $this->ctx->id(),
            'outlet_id' => $validated['outlet_id'] ?? null,
            'menu_category_id' => $validated['menu_category_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'image_path' => $photoUrl,
            'is_popular' => $validated['is_popular'] ?? false,
            'is_available' => $validated['is_available'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        $this->invalidateMenuCache($validated['outlet_id'] ?? null);

        return back()->with('success', 'Item menu ditambahkan.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $item = MenuItem::findOrFail($id); // TenantScope -> hanya milik tenant ini

        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'description' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0|max:99999999',
            'menu_category_id' => ['required', 'integer',
                Rule::exists('menu_categories', 'id')
                    ->where('tenant_id', $this->ctx->id())],
            'outlet_id' => ['nullable', 'integer',
                Rule::exists('outlets', 'id')
                    ->where('tenant_id', $this->ctx->id())],
            'is_popular' => 'boolean',
            'is_available' => 'boolean',
            'sort_order' => 'integer|min:0',
            'photo' => 'nullable|string',
        ]);

        $oldOutletId = $item->outlet_id; // capture SEBELUM update (bisa jadi null)

        $photoUrl = $item->image_path;
        if (! empty($validated['photo']) && $validated['photo'] !== $item->image_path) {
            $uploaded = $this->cloudinary->uploadMenuPhoto(
                $validated['photo'], $this->ctx->id()
            );
            if ($uploaded) {
                $photoUrl = $uploaded;
            }
        }

        $item->update([
            'outlet_id' => $validated['outlet_id'] ?? null,
            'menu_category_id' => $validated['menu_category_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'image_path' => $photoUrl,
            'is_popular' => $validated['is_popular'] ?? false,
            'is_available' => $validated['is_available'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        $this->invalidateMenuCache($oldOutletId);

        return back()->with('success', 'Item menu diperbarui.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $item = MenuItem::findOrFail($id);
        $outletId = $item->outlet_id;
        $item->delete();

        $this->invalidateMenuCache($outletId);

        return back()->with('success', 'Item menu dihapus.');
    }

    // ─── Cache invalidation ───────────────────────────────────────────────────

    private function invalidateMenuCache(?int $outletId): void
    {
        Cache::forget("menu:tenant:{$this->ctx->id()}:outlet:".($outletId ?? 'global'));
    }
}
