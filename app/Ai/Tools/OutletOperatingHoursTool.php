<?php

namespace App\Ai\Tools;

use App\Models\OutletSetting;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class OutletOperatingHoursTool implements Tool
{
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
        $outletId = $request->integer('outlet_id');
        $setting = OutletSetting::where('outlet_id', $outletId)->first();

        if (!$setting) {
            return json_encode([
                'error' => 'Jam operasional outlet tidak ditemukan atau menggunakan jam default 08:00 - 22:00.'
            ]);
        }

        return json_encode([
            'outlet_id' => $outletId,
            'operating_hours' => $setting->toPublicScheduleArray()
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

