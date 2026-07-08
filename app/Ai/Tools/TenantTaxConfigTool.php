<?php

namespace App\Ai\Tools;

use App\Models\TenantSetting;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class TenantTaxConfigTool implements Tool
{
    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Mengecek konfigurasi pajak (PBJT / PPN / Service Charge) untuk tenant Restoku.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $tenantId = $request->integer('tenant_id');
        $setting = TenantSetting::where('tenant_id', $tenantId)->first();

        if (!$setting) {
            return json_encode([
                'tax_type' => 'pbjt',
                'pbjt_rate' => 10,
                'ppn_rate' => 11,
                'service_charge_rate' => 0,
                'is_active' => true
            ]);
        }

        return json_encode($setting->toTaxShareableArray());
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'tenant_id' => $schema->integer()->required()->description('ID Tenant Restoku yang ingin dicek pajaknya'),
        ];
    }
}

