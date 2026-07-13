<?php

namespace App\Http\Controllers;

use App\Models\PrintJob;
use App\Models\ReceiptConfig;
use App\Services\TenantContext;
use Illuminate\Http\Request;

/**
 * PrintController — Print jobs dan receipt config.
 * Hanya untuk user yang sudah login (auth + tenant middleware).
 */
class PrintController extends Controller
{
    public function __construct(
        private TenantContext $ctx,
    ) {}

    /**
     * Daftar print job dari DB.
     */
    public function getPrintJobs(Request $request)
    {
        $jobs = PrintJob::orderByDesc('created_at')
            ->take(50)
            ->get()
            ->map(fn ($j) => [
                'id' => $j->job_code,
                'type' => $j->type,
                'orderId' => $j->order_ref ?? '-',
                'target' => $j->target,
                'status' => $j->status,
                'time' => $j->created_at->diffForHumans(),
                'error' => $j->error,
                'retryCount' => $j->retry_count,
            ]);

        return response()->json($jobs);
    }

    /**
     * Cetak struk → simpan ke tabel print_jobs.
     */
    public function printReceipt(Request $request)
    {
        $request->validate([
            'orderId' => 'nullable|string|max:50',
            'table' => 'required|string|max:50',
            'total' => 'required|numeric|min:0',
        ]);

        $tenantId = $this->ctx->id();
        $orderId = $request->input('orderId') ?? 'TRX-'.date('ymd').'-'.rand(1000, 9999);

        PrintJob::create([
            'tenant_id' => $tenantId,
            'job_code' => PrintJob::generateCode($tenantId),
            'type' => 'Struk Kasir (BT)',
            'order_ref' => $orderId,
            'target' => 'Kasir Depan (Bluetooth)',
            'status' => 'printing',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cetak struk ke printer Bluetooth berhasil dimulai.',
        ]);
    }

    /**
     * Ambil receipt config dari DB.
     */
    public function getReceiptConfig(Request $request)
    {
        $config = ReceiptConfig::forTenant($this->ctx->id());

        return response()->json($config->toArray());
    }

    /**
     * Simpan receipt config ke DB.
     */
    public function updateReceiptConfig(Request $request)
    {
        $validated = $request->validate([
            'header' => 'sometimes|string|max:255',
            'footer' => 'sometimes|string|max:1000',
            'show_npwp' => 'sometimes|boolean',
            'show_nib' => 'sometimes|boolean',
            'show_service_charge' => 'sometimes|boolean',
            'show_pbjt' => 'sometimes|boolean',
            'paper_width' => 'sometimes|in:58mm,80mm',
            'font_type' => 'sometimes|in:font-a,font-b',
            'print_density' => 'sometimes|in:light,normal,dark',
            'auto_write_cashier' => 'sometimes|boolean',
            'void_policy' => 'sometimes|in:audit_full,audit_minimal,no_audit',
        ]);

        $config = ReceiptConfig::forTenant($this->ctx->id());
        $config->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Format struk berhasil diperbarui.',
            'config' => $config->fresh()->toArray(),
        ]);
    }
}
