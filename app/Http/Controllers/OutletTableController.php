<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\OutletTable;
use App\Models\Scopes\TenantScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * OutletTableController — manajemen meja outlet (PIN untuk display ke owner/waiter).
 * Semua method butuh auth+tenant (didefinisikan di routes).
 */
class OutletTableController extends Controller
{
    /**
     * List meja per outlet dengan PIN plaintext (untuk ditampilkan ke owner/waiter,
     * bukan untuk tamu). PIN di-derive ulang dari seed deterministik.
     */
    public function index(Request $request, int $outletId): JsonResponse
    {
        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->where('id', $outletId)
            ->first();

        if (! $outlet || $outlet->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tables = OutletTable::withoutGlobalScope(TenantScope::class)
            ->where('outlet_id', $outlet->id)
            ->orderBy('label')
            ->get(['id', 'outlet_id', 'label', 'latitude', 'longitude', 'is_queue', 'qr_type']);

        return response()->json([
            'outlet' => ['id' => $outlet->id, 'name' => $outlet->name],
            'tables' => $tables->map(fn ($t) => [
                'id' => $t->id,
                'label' => $t->label,
                'pin' => $t->pin,
                'latitude' => $t->latitude,
                'longitude' => $t->longitude,
                'is_queue' => (bool) $t->is_queue,
                'qr_type' => $t->qr_type,
            ]),
        ]);
    }

    /**
     * Buat meja baru untuk outlet (CRUD nyata, persist is_queue + qr_type).
     */
    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $outlet = $this->resolveOutlet((int) $request->input('outlet_id'), $user->tenant_id);
        if (! $outlet) {
            abort(403);
        }

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:32'],
            'is_queue' => ['sometimes', 'boolean'],
            'qr_type' => ['sometimes', 'in:qr,logo,frame'],
        ]);

        $label = trim($validated['label']);
        $exists = OutletTable::withoutGlobalScope(TenantScope::class)
            ->where('outlet_id', $outlet->id)
            ->where('label', $label)
            ->exists();
        if ($exists) {
            return response()->json(['error' => "Meja {$label} sudah ada di outlet ini."], 422);
        }

        $table = OutletTable::withoutGlobalScope(TenantScope::class)
            ->create([
                'tenant_id' => $outlet->tenant_id,
                'outlet_id' => $outlet->id,
                'label' => $label,
                'pin_hash' => Hash::make(OutletTable::derivePin($outlet->id, $label)),
                'is_queue' => (bool) ($validated['is_queue'] ?? false),
                'qr_type' => $validated['qr_type'] ?? 'frame',
            ]);

        return response()->json([
            'id' => $table->id,
            'label' => $table->label,
            'pin' => $table->pin,
            'is_queue' => (bool) $table->is_queue,
            'qr_type' => $table->qr_type,
        ], 201);
    }

    /**
     * Update meja (label / is_queue / qr_type).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = auth()->user();
        $table = OutletTable::withoutGlobalScope(TenantScope::class)->findOrFail($id);
        $outlet = $this->resolveOutlet($table->outlet_id, $user->tenant_id);
        if (! $outlet) {
            abort(403);
        }

        $validated = $request->validate([
            'label' => ['sometimes', 'string', 'max:32'],
            'is_queue' => ['sometimes', 'boolean'],
            'qr_type' => ['sometimes', 'in:qr,logo,frame'],
        ]);

        if (isset($validated['label'])) {
            $label = trim($validated['label']);
            $dup = OutletTable::withoutGlobalScope(TenantScope::class)
                ->where('outlet_id', $outlet->id)
                ->where('label', $label)
                ->where('id', '!=', $table->id)
                ->exists();
            if ($dup) {
                return response()->json(['error' => "Meja {$label} sudah ada di outlet ini."], 422);
            }
            $table->label = $label;
            // Pin di-derive ulang dari (outlet, label) biar tetap stabil per meja.
            $table->pin_hash = Hash::make(OutletTable::derivePin($outlet->id, $label));
        }
        if (isset($validated['is_queue'])) {
            $table->is_queue = (bool) $validated['is_queue'];
        }
        if (isset($validated['qr_type'])) {
            $table->qr_type = $validated['qr_type'];
        }
        $table->save();

        return response()->json([
            'id' => $table->id,
            'label' => $table->label,
            'pin' => $table->pin,
            'is_queue' => (bool) $table->is_queue,
            'qr_type' => $table->qr_type,
        ]);
    }

    /**
     * Import massal dari CSV (Upload di FE). Baris berisi {label, is_queue, qr_type}.
     * Cross-tenant safe: outlet di-resolve dari tenant user. Duplikat (dalam file / sudah ada)
     * dilewati dan dilaporkan, bukan gagal total.
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $user = auth()->user();
        $outlet = $this->resolveOutlet((int) $request->input('outlet_id'), $user->tenant_id);
        if (! $outlet) {
            abort(403);
        }

        $rows = $request->input('rows', []);
        if (! is_array($rows) || count($rows) === 0) {
            return response()->json(['error' => 'Tidak ada baris untuk diimpor.'], 422);
        }

        $created = 0;
        $skipped = 0;
        $errors = [];
        $seen = [];

        foreach ($rows as $i => $row) {
            $label = isset($row['label']) ? trim((string) $row['label']) : '';
            if ($label === '') {
                $errors[] = 'Baris '.($i + 1).': label kosong.';
                $skipped++;

                continue;
            }
            $qrType = in_array($row['qr_type'] ?? null, ['qr', 'logo', 'frame'], true)
                ? $row['qr_type']
                : 'frame';
            $isQueue = filter_var($row['is_queue'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // Duplikat dalam satu file import.
            if (in_array(strtolower($label), $seen, true)) {
                $errors[] = 'Baris '.($i + 1).": meja {$label} duplikat dalam file.";
                $skipped++;

                continue;
            }
            // Sudah ada di DB.
            $exists = OutletTable::withoutGlobalScope(TenantScope::class)
                ->where('outlet_id', $outlet->id)
                ->where('label', $label)
                ->exists();
            if ($exists) {
                $errors[] = 'Baris '.($i + 1).": meja {$label} sudah ada (dilewati).";
                $skipped++;

                continue;
            }

            OutletTable::withoutGlobalScope(TenantScope::class)->create([
                'tenant_id' => $outlet->tenant_id,
                'outlet_id' => $outlet->id,
                'label' => $label,
                'pin_hash' => Hash::make(OutletTable::derivePin($outlet->id, $label)),
                'is_queue' => $isQueue,
                'qr_type' => $qrType,
            ]);
            $seen[] = strtolower($label);
            $created++;
        }

        return response()->json([
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ], 201);
    }

    /**
     * Hapus meja.
     */
    public function destroy(int $id): JsonResponse
    {
        $user = auth()->user();
        $table = OutletTable::withoutGlobalScope(TenantScope::class)->findOrFail($id);
        $outlet = $this->resolveOutlet($table->outlet_id, $user->tenant_id);
        if (! $outlet) {
            abort(403);
        }
        $table->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Resolve outlet milik tenant (cegah cross-tenant).
     */
    private function resolveOutlet(int $outletId, int $tenantId): ?Outlet
    {
        return Outlet::withoutGlobalScope(TenantScope::class)
            ->where('id', $outletId)
            ->where('tenant_id', $tenantId)
            ->first();
    }
}
