<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BiayaOperasionalController extends Controller
{
    public function __construct(private TenantContext $ctx) {}

    /**
     * [L2] Halaman Biaya Operasional — daftar pengeluaran + form input.
     * Data nyata dari tabel expenses (tenant-scoped).
     */
    public function index(Request $request)
    {
        $tenantId = $this->ctx->id();

        $expenses = Expense::where('tenant_id', $tenantId)
            ->orderByDesc('expense_date')
            ->paginate(20);

        $totalThisMonth = (float) Expense::where('tenant_id', $tenantId)
            ->whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year)
            ->sum('amount');

        return Inertia::render('BiayaOperasional/Index', [
            'expenses' => $expenses,
            'total_this_month' => $totalThisMonth,
            'categories' => ['listrik', 'gaji', 'sewa', 'bahan', 'lainnya'],
        ]);
    }

    /**
     * Simpan pengeluaran baru (tenant-scoped).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:50',
            'description' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'outlet_id' => 'nullable|integer',
            'is_recurring' => 'boolean',
        ]);

        Expense::create([
            'tenant_id' => $this->ctx->id(),
            'outlet_id' => $validated['outlet_id'] ?? null,
            'category' => $validated['category'],
            'description' => $validated['description'] ?? null,
            'amount' => $validated['amount'],
            'expense_date' => $validated['expense_date'],
            'is_recurring' => (bool) ($validated['is_recurring'] ?? false),
        ]);

        return redirect()->back()->with('success', 'Pengeluaran berhasil dicatat.');
    }
}
