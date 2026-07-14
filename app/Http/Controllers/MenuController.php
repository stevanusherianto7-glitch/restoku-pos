<?php

namespace App\Http\Controllers;

use App\Jobs\DeleteCloudinaryPhoto;
use App\Models\MenuCategory;
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

    public function index(Request $request): Response
    {
        // Q5/Q20/Q34: paginasi + server-side filter — jangan kirim 5000 item sekaligus.
        $perPage = min((int) $request->input('per_page', 100), 500);

        $itemQuery = MenuItem::with('category:id,name')
            ->orderBy('sort_order')
            ->orderBy('name');

        // Filter per-outlet (FE dropdown): default semua (global + per-outlet tenant ini).
        $outletFilter = $request->input('outlet_id');
        if (is_numeric($outletFilter)) {
            $itemQuery->where(function ($q) use ($outletFilter) {
                $q->whereNull('outlet_id')->orWhere('outlet_id', (int) $outletFilter);
            });
        }
        if ($request->filled('search')) {
            $itemQuery->where('name', 'like', '%'.$request->input('search').'%');
        }

        $items = $itemQuery->paginate($perPage, [
            'id', 'outlet_id', 'menu_category_id', 'name', 'description',
            'price', 'image_path', 'is_available', 'is_popular', 'sort_order',
        ]);

        // Q5/Q20/Q34: outlet juga dipaginasi (300 outlet/tenant skala besar).
        $outletPage = min((int) $request->input('outlet_page', 1), 1000);
        $outlets = Outlet::select('id', 'name')
            ->orderBy('name')
            ->paginate(50, ['id', 'name'], 'outlet_page', $outletPage);
        $categories = MenuCategory::where('tenant_id', $this->ctx->id())
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('KatalogMenu/Index', [
            'menuItems' => $items,
            'outlets' => $outlets,
            'categories' => $categories,
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
            // Q22: batasi ukuran (base64 ≈ 1.37× bytes) & jumlah foto per tenant.
            'photo' => [
                'nullable',
                'string',
                'max:'.(5 * 1024 * 1024), // ~5MB setelah decode base64
                function ($attribute, $value, $fail) {
                    // Cegah abuse quota Cloudinary di 5000 tenant.
                    $used = MenuItem::where('tenant_id', $this->ctx->id())
                        ->whereNotNull('image_path')
                        ->where('image_path', 'not like', 'https://res.cloudinary.com/%')
                        ->count();
                    $maxPhotos = (int) config('app.max_menu_photos_per_tenant', 500);
                    if ($used >= $maxPhotos) {
                        $fail("Kuota foto menu tenant penuh ({$maxPhotos}). Hapus foto lama dulu.");
                    }
                },
            ],
        ]);

        $photoUrl = null;
        $photoPublicId = null;
        if (! empty($validated['photo'])) {
            $uploaded = $this->cloudinary->uploadMenuPhoto(
                $validated['photo'], $this->ctx->id()
            );
            if ($uploaded) {
                $photoUrl = $uploaded['url'];
                $photoPublicId = $uploaded['public_id'];
            }
        }

        MenuItem::create([
            'tenant_id' => $this->ctx->id(),
            'outlet_id' => $validated['outlet_id'] ?? null,
            'menu_category_id' => $validated['menu_category_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'image_path' => $photoUrl,
            'image_public_id' => $photoPublicId,
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
        $photoPublicId = $item->image_public_id;
        if (! empty($validated['photo']) && $validated['photo'] !== $item->image_path) {
            $uploaded = $this->cloudinary->uploadMenuPhoto(
                $validated['photo'], $this->ctx->id()
            );
            if ($uploaded) {
                // Q23: hapus foto lama async (queue) — jangan block request.
                if ($item->image_public_id) {
                    DeleteCloudinaryPhoto::dispatch($item->image_public_id);
                }
                $photoUrl = $uploaded['url'];
                $photoPublicId = $uploaded['public_id'];
            }
        }

        $item->update([
            'outlet_id' => $validated['outlet_id'] ?? null,
            'menu_category_id' => $validated['menu_category_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'image_path' => $photoUrl,
            'image_public_id' => $photoPublicId,
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

        // Q23: hapus foto di Cloudinary async (queue) — jangan block request.
        if ($item->image_public_id) {
            DeleteCloudinaryPhoto::dispatch($item->image_public_id);
        }

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
