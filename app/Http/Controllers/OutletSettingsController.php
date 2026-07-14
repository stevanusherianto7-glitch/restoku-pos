<?php

namespace App\Http\Controllers;

use App\Jobs\DeleteCloudinaryPhoto;
use App\Models\Models\Scopes\TenantScope;
use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\SettingsService;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * OutletSettingsController — refactored untuk multi-tenant scale.
 *
 * Perubahan dari versi sebelumnya:
 *   - Auth::user()->tenant_id → $this->ctx->id() (via TenantContext)
 *   - withoutGlobalScope(TenantScope::class) → tidak perlu lagi karena
 *     TenantScope membaca dari container yang sudah di-set oleh middleware
 *   - Simpan pajak/jam ke tenant_settings/outlet_settings via SettingsService
 *     (dengan cache invalidation otomatis)
 *   - findOutletForTenant() tetap ada sebagai security check
 */
class OutletSettingsController extends Controller
{
    private const ALLOWED_ROLES = ['cashier', 'admin', 'kitchen', 'waiter', 'manager'];

    private const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    public function __construct(
        private TenantContext $ctx,
        private SettingsService $settings,
        private CloudinaryService $cloudinary,
    ) {}

    // =========================================================================
    // GET /pengaturan-outlet
    // =========================================================================

    public function index(): Response
    {
        $tenantId = $this->ctx->id();
        $user = Auth::user();
        $tenant = $this->ctx->tenant();

        // TenantScope aktif — outlet sudah otomatis difilter per tenant
        // Tidak perlu withoutGlobalScope lagi
        $outlet = Outlet::when($user->outlet_id, fn ($q) => $q->orderByRaw(
            'CASE WHEN id = ? THEN 0 ELSE 1 END', [$user->outlet_id]
        ))->first();

        $outlets = Outlet::select('id', 'name', 'is_active')->get();
        $outletSettings = $outlet ? $this->settings->forOutlet($outlet->id) : null;
        $tenantSettings = $this->settings->forTenant($tenantId);

        $employees = User::where('role', '!=', 'owner')
            ->select('id', 'name', 'email', 'role', 'outlet_id')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'outlet_id' => $u->outlet_id,
            ]);

        return Inertia::render('PengaturanOutlet/Index', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'brand_name' => $tenant->brand_name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'npwp' => $tenant->npwp,
                'nib' => $tenant->nib,
                'address' => $tenant->address,
                // Pajak dari tenant_settings (dengan COALESCE fallback ke tenants)
                'tax_type' => $tenantSettings->tax_type,
                'pbjt_rate' => (float) $tenantSettings->pbjt_rate,
                'ppn_rate' => (float) $tenantSettings->ppn_rate,
                'service_charge_rate' => (float) $tenantSettings->service_charge_rate,
            ],
            'outlet' => $outlet ? [
                'id' => $outlet->id,
                'name' => $outlet->name,
                'address' => $outlet->address,
                'phone' => $outlet->phone,
                'latitude' => $outlet->latitude ? (float) $outlet->latitude : null,
                'longitude' => $outlet->longitude ? (float) $outlet->longitude : null,
                'geo_radius_meters' => $outlet->geo_radius_meters ?? 50,
                'is_active' => (bool) ($outlet->is_active ?? true),
                // Jam operasional dari outlet_settings (bukan outlets.operating_hours lagi)
                'operating_hours' => $outletSettings?->operating_hours
                    ?? OutletSetting::defaultOperatingHours(),
                'logo_path' => $outlet->logo_path ?? null,
            ] : null,
            'outlets' => $outlets,
            'employees' => $employees,
            'roles' => self::ALLOWED_ROLES,
        ]);
    }

    // =========================================================================
    // PUT /api/outlet-settings/profil
    // =========================================================================

    public function updateProfil(Request $request): RedirectResponse
    {
        $tenantId = $this->ctx->id();

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'brand_name' => 'required|string|max:100',
            'email' => ['required', 'email', 'max:150',
                Rule::unique('tenants', 'email')->ignore($tenantId)],
            'phone' => 'nullable|string|max:20',
            'npwp' => 'nullable|string|max:30',
            'nib' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:500',
            // Q75: logo tenant di-unggah ke Cloudinary (bukan file lokal).
            'logo' => ['nullable', 'string', 'max:'.(5 * 1024 * 1024)],
        ]);

        // Q75: upload logo ke Cloudinary bila ada, hapus lama (async) bila ganti.
        if (! empty($validated['logo']) && $validated['logo'] !== $request->input('logo_current')) {
            $uploaded = $this->cloudinary->uploadMenuPhoto($validated['logo'], $tenantId, 'logo');
            if ($uploaded) {
                $outlet = Outlet::where('tenant_id', $tenantId)->orderBy('id')->first();
                if ($outlet?->logo_public_id) {
                    DeleteCloudinaryPhoto::dispatch($outlet->logo_public_id);
                }
                if ($outlet) {
                    $outlet->update([
                        'logo_path' => $uploaded['url'],
                        'logo_public_id' => $uploaded['public_id'],
                    ]);
                }
            }
        }

        // Update identitas di tenants (name, brand_name, email, dll.)
        Tenant::where('id', $tenantId)->update($validated);

        return back()->with('success', 'Profil outlet berhasil diperbarui.');
    }

    // =========================================================================
    // PUT /api/outlet-settings/lokasi
    // =========================================================================

    public function updateLokasi(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'outlet_id' => 'required|integer',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'geo_radius_meters' => 'required|integer|min:10|max:5000',
        ]);

        // findOutletForTenant() memastikan outlet milik tenant ini
        $this->findOutletForTenant($validated['outlet_id'])->update([
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'geo_radius_meters' => $validated['geo_radius_meters'],
        ]);

        return back()->with('success', 'Lokasi outlet berhasil diperbarui.');
    }

    // =========================================================================
    // PUT /api/outlet-settings/pajak
    // =========================================================================

    public function updatePajak(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tax_type' => 'required|in:pbjt,ppn',
            'pbjt_rate' => 'required|numeric|min:0|max:10',
            'ppn_rate' => 'required|numeric|min:0|max:12',
            'service_charge_rate' => 'required|numeric|min:0|max:10',
        ]);

        // Simpan ke tenant_settings (via SettingsService → cache invalidation otomatis)
        $this->settings->saveTenantSettings($this->ctx->id(), $validated);

        // Backward-compat: sync ke kolom tenants lama juga (hingga migration drop-columns)
        Tenant::where('id', $this->ctx->id())->update([
            'tax_type' => $validated['tax_type'],
            'pbjt_rate' => $validated['pbjt_rate'],
            'ppn_rate' => $validated['ppn_rate'],
            'service_charge_rate' => $validated['service_charge_rate'],
        ]);

        return back()->with('success', 'Pengaturan pajak berhasil diperbarui.');
    }

    // =========================================================================
    // PUT /api/outlet-settings/jam
    // =========================================================================

    public function updateJam(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'outlet_id' => 'required|integer',
            'operating_hours' => 'required|array',
        ]);

        $hours = [];
        foreach (self::DAYS as $day) {
            $dayData = $validated['operating_hours'][$day] ?? [];
            $hours[$day] = [
                'open' => preg_match('/^\d{2}:\d{2}$/', $dayData['open'] ?? '') ? $dayData['open'] : '08:00',
                'close' => preg_match('/^\d{2}:\d{2}$/', $dayData['close'] ?? '') ? $dayData['close'] : '22:00',
                'closed' => (bool) ($dayData['closed'] ?? false),
            ];
        }

        $outlet = $this->findOutletForTenant($validated['outlet_id']);

        // Simpan ke outlet_settings (via SettingsService → cache invalidation)
        $this->settings->saveOutletSettings($outlet->id, ['operating_hours' => $hours]);

        // Backward-compat: sync ke outlets.operating_hours lama
        $outlet->update(['operating_hours' => $hours]);

        return back()->with('success', 'Jam operasional berhasil diperbarui.');
    }

    // =========================================================================
    // PUT /api/outlet-settings/all
    // =========================================================================

    public function updateAll(Request $request): RedirectResponse
    {
        $tenantId = $this->ctx->id();

        DB::transaction(function () use ($request, $tenantId) {
            // 1. Profil Tenant
            if ($request->has('profil')) {
                $validatedProfil = $request->validate([
                    'profil.name' => 'required|string|max:150',
                    'profil.brand_name' => 'required|string|max:100',
                    'profil.email' => ['required', 'email', 'max:150', Rule::unique('tenants', 'email')->ignore($tenantId)],
                    'profil.phone' => 'nullable|string|max:20',
                    'profil.npwp' => 'nullable|string|max:30',
                    'profil.nib' => 'nullable|string|max:30',
                    'profil.address' => 'nullable|string|max:500',
                ])['profil'];
                Tenant::where('id', $tenantId)->update($validatedProfil);
            }

            // 2. Outlet (Lokasi & Nama/Alamat cabang)
            $outletId = $request->input('lokasi.outlet_id') ?? $request->input('outlet_id') ?? Auth::user()?->outlet_id;
            if ($outletId && $request->has('lokasi')) {
                $validatedLokasi = $request->validate([
                    'lokasi.outlet_id' => 'required|integer',
                    'lokasi.name' => 'nullable|string|max:150',
                    'lokasi.address' => 'nullable|string|max:500',
                    'lokasi.phone' => 'nullable|string|max:20',
                    'lokasi.latitude' => 'nullable|numeric|between:-90,90',
                    'lokasi.longitude' => 'nullable|numeric|between:-180,180',
                    'lokasi.geo_radius_meters' => 'required|integer|min:10|max:5000',
                ])['lokasi'];

                $outletData = [
                    'latitude' => $validatedLokasi['latitude'] ?? null,
                    'longitude' => $validatedLokasi['longitude'] ?? null,
                    'geo_radius_meters' => $validatedLokasi['geo_radius_meters'],
                ];
                if (! empty($validatedLokasi['name'])) {
                    $outletData['name'] = $validatedLokasi['name'];
                }
                if (isset($validatedLokasi['address'])) {
                    $outletData['address'] = $validatedLokasi['address'];
                }
                if (isset($validatedLokasi['phone'])) {
                    $outletData['phone'] = $validatedLokasi['phone'];
                }

                $this->findOutletForTenant($validatedLokasi['outlet_id'])->update($outletData);
            }

            // 3. Pajak
            if ($request->has('pajak')) {
                $validatedPajak = $request->validate([
                    'pajak.tax_type' => 'required|in:pbjt,ppn',
                    'pajak.pbjt_rate' => 'required|numeric|min:0|max:10',
                    'pajak.ppn_rate' => 'required|numeric|min:0|max:12',
                    'pajak.service_charge_rate' => 'required|numeric|min:0|max:10',
                ])['pajak'];

                $this->settings->saveTenantSettings($tenantId, $validatedPajak);
                Tenant::where('id', $tenantId)->update($validatedPajak);
            }

            // 4. Jam Operasional
            if ($outletId && $request->has('jam.operating_hours')) {
                $validatedJam = $request->validate([
                    'jam.operating_hours' => 'required|array',
                ])['jam'];

                $hours = [];
                foreach (self::DAYS as $day) {
                    $dayData = $validatedJam['operating_hours'][$day] ?? [];
                    $hours[$day] = [
                        'open' => preg_match('/^\d{2}:\d{2}$/', $dayData['open'] ?? '') ? $dayData['open'] : '08:00',
                        'close' => preg_match('/^\d{2}:\d{2}$/', $dayData['close'] ?? '') ? $dayData['close'] : '22:00',
                        'closed' => (bool) ($dayData['closed'] ?? false),
                    ];
                }

                $outlet = $this->findOutletForTenant($outletId);
                $this->settings->saveOutletSettings($outlet->id, ['operating_hours' => $hours]);
                $outlet->update(['operating_hours' => $hours]);
            }
        });

        return back()->with('success', 'Semua pengaturan outlet berhasil disimpan ke database.');
    }

    /**
     * Q97: simpan tema layar (screen_mode) ke DB per-outlet.
     * FE useTenantSettings sync ke sini agar tema tetap saat ganti device.
     */
    public function updateScreenMode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'outlet_id' => ['required', 'integer',
                Rule::exists('outlets', 'id')->where('tenant_id', $this->ctx->id())],
            'screen_mode' => ['required', 'string', 'in:light,dark,glassmorphic,nano-banana,krem'],
        ]);

        $this->settings->saveOutletSettings(
            $validated['outlet_id'],
            ['screen_mode' => $validated['screen_mode']]
        );

        return response()->json(['success' => true, 'screen_mode' => $validated['screen_mode']]);
    }

    // =========================================================================
    // Karyawan CRUD
    // =========================================================================

    public function listKaryawan(): JsonResponse
    {
        $employees = User::where('role', '!=', 'owner')
            ->select('id', 'name', 'email', 'role', 'outlet_id')
            ->get();

        return response()->json($employees);
    }

    public function createKaryawan(Request $request): RedirectResponse
    {
        $tenantId = $this->ctx->id();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|max:20',
            'role' => ['required', Rule::in(self::ALLOWED_ROLES)],
            'outlet_id' => ['nullable', 'integer',
                Rule::exists('outlets', 'id')->where('tenant_id', $tenantId)],
        ]);

        // TenantScope aktif → User::create() perlu explicit tenant_id
        // karena create() bukan query (scope hanya apply ke SELECT)
        User::create([
            'tenant_id' => $tenantId,
            'outlet_id' => $validated['outlet_id'] ?? null,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return back()->with('success', "Karyawan {$validated['name']} berhasil ditambahkan.");
    }

    public function updateKaryawan(Request $request, int $id): RedirectResponse
    {
        $tenantId = $this->ctx->id();
        $employee = $this->findEmployeeForTenant($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($id)],
            'password' => 'nullable|string|min:8|max:20',
            'role' => ['required', Rule::in(self::ALLOWED_ROLES)],
            'outlet_id' => ['nullable', 'integer',
                Rule::exists('outlets', 'id')->where('tenant_id', $tenantId)],
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'outlet_id' => $validated['outlet_id'] ?? null,
        ];
        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $employee->update($data);

        return back()->with('success', "Data karyawan {$validated['name']} berhasil diperbarui.");
    }

    public function deleteKaryawan(int $id): RedirectResponse
    {
        $employee = $this->findEmployeeForTenant($id);

        if ($employee->id === Auth::id()) {
            return back()->withErrors(['delete' => 'Anda tidak bisa menghapus akun sendiri.']);
        }

        $name = $employee->name;
        $employee->delete();

        return back()->with('success', "Karyawan {$name} berhasil dihapus.");
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Temukan outlet berdasarkan ID dan pastikan milik tenant ini.
     * TenantScope tidak dibutuhkan di sini karena kita query langsung dengan
     * where('tenant_id') — ini lebih eksplisit dan lebih aman.
     */
    private function findOutletForTenant(int $outletId): Outlet
    {
        // Bypass scope karena kita ingin query eksplisit dengan tenant_id
        return \App\Models\Scopes\TenantScope::bypass(
            fn () => Outlet::where('id', $outletId)
                ->where('tenant_id', $this->ctx->id())
                ->firstOrFail()
        );
    }

    /**
     * Fase 1 — Bulk-create N outlet (owner input, max 500, idempoten).
     * Nama outlet dari request (array atau textarea 1/baris). Slug auto-generated
     * via mutator setNameAttribute. Idempoten: skip nama yang sudah ada.
     */
    public function bulkCreateOutlets(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'names' => 'required|string',
            'count' => 'nullable|integer|min:1|max:500',
        ]);

        $names = collect(explode("\n", $validated['names']))
            ->map(fn ($n) => trim($n))
            ->filter(fn ($n) => $n !== '')
            ->slice(0, (int) ($validated['count'] ?? 500))
            ->unique();

        $existing = Outlet::where('tenant_id', $this->ctx->id())
            ->whereIn('name', $names->all())
            ->pluck('name')
            ->all();

        $created = 0;
        foreach ($names as $name) {
            if (in_array($name, $existing, true)) {
                continue; // idempoten: jangan duplikat
            }
            Outlet::create([
                'tenant_id' => $this->ctx->id(),
                'name' => $name,
                'is_active' => true,
            ]);
            $created++;
        }

        return back()->with('success', "{$created} outlet baru ditambahkan.");
    }

    /**
     * Temukan karyawan dan pastikan milik tenant ini dan bukan owner.
     */
    private function findEmployeeForTenant(int $userId): User
    {
        return \App\Models\Scopes\TenantScope::bypass(
            fn () => User::where('id', $userId)
                ->where('tenant_id', $this->ctx->id())
                ->where('role', '!=', 'owner')
                ->firstOrFail()
        );
    }
}
