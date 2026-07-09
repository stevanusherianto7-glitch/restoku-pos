<?php

namespace App\Ai\Tools;

use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Services\TenantContext;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class OutletOperatingHoursTool implements Tool
{
    public function __construct(private ?TenantContext $ctx = null) {}

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Mengecek dan mengambil informasi jam operasional outlet Restoku berdasarkan ID outlet.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        // SECURITY (C-3): resolve tenant from authenticated context, never the LLM request.
        if (! $this->ctx || ! $this->ctx->isInitialized()) {
            abort(403, 'Tenant context tidak tersedia.');
        }
        $outletId = $request->integer('outlet_id');
        // Lock the outlet to the current tenant so a foreign outlet_id cannot leak
        // another tenant's operating hours.
        $outlet = Outlet::where('tenant_id', $this->ctx->id())
            ->where('id', $outletId)
            ->first();

        if (! $outlet) {
            return json_encode([
                'error' => 'Outlet tidak ditemukan untuk tenant ini.',
            ]);
        }

        $setting = OutletSetting::where('outlet_id', $outlet->id)->first();

        if (! $setting) {
            return json_encode([
                'error' => 'Jam operasional outlet tidak ditemukan atau menggunakan jam default 08:00 - 22:00.',
            ]);
        }

        return json_encode([
            'outlet_id' => $outletId,
            'operating_hours' => $setting->toPublicScheduleArray(),
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'outlet_id' => $schema->integer()->required()->description('ID dari outlet yang ingin dicek jam operasionalnya'),
        ];
    }
}
