<?php

namespace App\Jobs;

use App\Models\Outlet;
use App\Models\OutletTable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Q87: export QR per-batch (50/print-page) untuk skala 15000 node.
 * Menghasilkan file HTML print-ready (A4, grid QR) yg bisa di-print-to-PDF
 * tanpa merender 15000 node DOM sekaligus di browser.
 */
class ExportQrPdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $tenantId,
        public int $page,
        public int $perPage = 50,
    ) {}

    public function handle(): void
    {
        $outlets = Outlet::where('tenant_id', $this->tenantId)
            ->orderBy('id')
            ->forPage($this->page, $this->perPage)
            ->get(['id', 'name', 'slug']);

        $cards = '';
        foreach ($outlets as $outlet) {
            $tables = OutletTable::where('outlet_id', $outlet->id)->get();
            foreach ($tables as $t) {
                $label = $t->label ?? ('#'.$t->id);
                $url = config('app.url')."/m/{$outlet->slug}?t=".urlencode($label);
                $cards .= "<div class='card'>
                    <img src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=".urlencode($url)."' />
                    <div class='meta'>{$outlet->name} · Meja {$t->label}</div>
                </div>";
            }
        }

        $html = "<!doctype html><html><head><meta charset='utf-8'>
        <style>
            body{font-family:sans-serif;margin:0}
            .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px}
            .card{border:1px solid #ccc;border-radius:8px;padding:8px;text-align:center;page-break-inside:avoid}
            .card img{width:160px;height:160px}
            .meta{font-size:11px;margin-top:4px}
            @media print{.card{border:none}}
        </style></head><body><div class='grid'>{$cards}</div></body></html>";

        $dir = "qr-export/{$this->tenantId}";
        Storage::makeDirectory($dir);
        Storage::put("{$dir}/page-{$this->page}.html", $html);
    }
}
