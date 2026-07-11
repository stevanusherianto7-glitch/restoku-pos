import React, { useState } from 'react';
import { Screen, Glass, Badge, Button, formatRupiah as formatCurrency } from '../Shared';
import { Calculator, CheckCircle2, Download, FileText, Search, Send, DollarSign, Calendar } from 'lucide-react';

const MOCK_PAYROLL = [
    {
        id: 1,
        user: { name: 'Budi Hartono', role: 'Waiter', dept: 'Service' },
        period: 'Juli 2026',
        base: 3500000,
        allowances: 800000,
        overtime: 200000,
        deductions: 338333,
        net: 4161667,
        status: 'draft',
    },
    {
        id: 2,
        user: { name: 'Sari Pertiwi', role: 'Chef', dept: 'Kitchen' },
        period: 'Juli 2026',
        base: 6000000,
        allowances: 1000000,
        overtime: 500000,
        deductions: 500000,
        net: 7000000,
        status: 'approved',
    },
    {
        id: 3,
        user: { name: 'Andi Saputra', role: 'Kitchen Helper', dept: 'Kitchen' },
        period: 'Juli 2026',
        base: 2800000,
        allowances: 500000,
        overtime: 0,
        deductions: 100000,
        net: 3200000,
        status: 'paid',
    },
];

export function PayrollManagement() {
    const [payrolls, setPayrolls] = useState(MOCK_PAYROLL);
    const [selectedPayslip, setSelectedPayslip] = useState<(typeof MOCK_PAYROLL)[number] | null>(null);

    const approvePayroll = (id: number) => {
        setPayrolls((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)));
    };

    const markPaid = (id: number) => {
        setPayrolls((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'paid' } : p)));
    };

    return (
        <Screen
            title="Payroll & Penggajian"
            actions={
                <>
                    <Button variant="outline">
                        <Calendar className="size-4 mr-2" /> Juli 2026
                    </Button>
                    <Button>
                        <Calculator className="size-4 mr-2" /> Generate Gaji Bulan Ini
                    </Button>
                </>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Glass className="p-5 border-blue-500/30">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <FileText className="size-5" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Total Draft</p>
                            <p className="text-2xl font-bold text-white">1</p>
                        </div>
                    </div>
                </Glass>
                <Glass className="p-5 border-amber-500/30">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <CheckCircle2 className="size-5" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Menunggu Pembayaran</p>
                            <p className="text-2xl font-bold text-white">1</p>
                        </div>
                    </div>
                </Glass>
                <Glass className="p-5 border-emerald-500/30">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <DollarSign className="size-5" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Total Telah Dibayar</p>
                            <p className="text-2xl font-bold text-white">{formatCurrency(3200000)}</p>
                        </div>
                    </div>
                </Glass>
            </div>

            <Glass className="p-0 overflow-hidden relative">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari karyawan..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Send className="size-4 mr-2" />
                            Kirim Semua Slip via WA
                        </Button>
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium">Karyawan</th>
                            <th className="px-4 py-3 font-medium text-right">Gaji Pokok</th>
                            <th className="px-4 py-3 font-medium text-right">Tunjangan + Lembur</th>
                            <th className="px-4 py-3 font-medium text-right">Potongan (BPJS/Absen)</th>
                            <th className="px-4 py-3 font-medium text-right">Gaji Bersih (THP)</th>
                            <th className="px-4 py-3 font-medium text-center">Status</th>
                            <th className="px-4 py-3 font-medium text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {payrolls.map((pr) => (
                            <tr key={pr.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3">
                                    <div className="text-white font-medium">{pr.user.name}</div>
                                    <div className="text-xs text-slate-500">
                                        {pr.user.role} · {pr.user.dept}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-300">{formatCurrency(pr.base)}</td>
                                <td className="px-4 py-3 text-right text-emerald-400">
                                    +{formatCurrency(pr.allowances + pr.overtime)}
                                </td>
                                <td className="px-4 py-3 text-right text-red-400">-{formatCurrency(pr.deductions)}</td>
                                <td className="px-4 py-3 text-right text-white font-bold">{formatCurrency(pr.net)}</td>
                                <td className="px-4 py-3 text-center">
                                    <Badge
                                        tone={
                                            pr.status === 'paid'
                                                ? 'emerald'
                                                : pr.status === 'approved'
                                                  ? 'blue'
                                                  : 'slate'
                                        }
                                    >
                                        {pr.status === 'paid'
                                            ? 'Terbayar'
                                            : pr.status === 'approved'
                                              ? 'Disetujui'
                                              : 'Draft'}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedPayslip(pr)}>
                                        <FileText className="size-4" />
                                    </Button>
                                    {pr.status === 'draft' && (
                                        <Button size="sm" onClick={() => approvePayroll(pr.id)}>
                                            Approve
                                        </Button>
                                    )}
                                    {pr.status === 'approved' && (
                                        <Button
                                            size="sm"
                                            className="bg-emerald-500 hover:bg-emerald-600"
                                            onClick={() => markPaid(pr.id)}
                                        >
                                            Bayar
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Glass>

            {/* Slip Gaji Modal */}
            {selectedPayslip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white text-black w-full max-w-sm rounded-lg shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Preview Slip Gaji</h3>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-600 hover:bg-slate-200 h-8 w-8 p-0 rounded-full"
                                >
                                    <Download className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedPayslip(null)}
                                    className="text-slate-600 hover:bg-slate-200 px-3 h-8 rounded-full"
                                >
                                    Tutup
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 font-mono text-sm leading-relaxed overflow-y-auto max-h-[70vh]">
                            <div className="text-center mb-6">
                                <div className="font-bold text-lg mb-1">SLIP GAJI</div>
                                <div className="font-bold">RUMAH MAKAN SEDAP</div>
                                <div className="text-xs">Periode: {selectedPayslip.period}</div>
                            </div>

                            <div className="border-y border-dashed border-slate-300 py-3 mb-4 space-y-1">
                                <div className="flex justify-between">
                                    <span>Nama:</span> <span className="font-bold">{selectedPayslip.user.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Jabatan:</span> <span>{selectedPayslip.user.role}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Dept:</span> <span>{selectedPayslip.user.dept}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="font-bold mb-2">PENERIMAAN</div>
                                <div className="flex justify-between">
                                    <span>Gaji Pokok</span> <span>{formatCurrency(selectedPayslip.base)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tunjangan</span> <span>{formatCurrency(selectedPayslip.allowances)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Lembur</span> <span>{formatCurrency(selectedPayslip.overtime)}</span>
                                </div>
                                <div className="border-t border-slate-300 mt-2 pt-2 flex justify-between font-bold">
                                    <span>Total Penerimaan</span>{' '}
                                    <span>
                                        {formatCurrency(
                                            selectedPayslip.base +
                                                selectedPayslip.allowances +
                                                selectedPayslip.overtime,
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="font-bold mb-2">POTONGAN</div>
                                <div className="flex justify-between text-red-600">
                                    <span>BPJS/Absen</span> <span>-{formatCurrency(selectedPayslip.deductions)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>PPh 21</span> <span>-Rp 0</span>
                                </div>
                                <div className="border-t border-slate-300 mt-2 pt-2 flex justify-between font-bold text-red-600">
                                    <span>Total Potongan</span>{' '}
                                    <span>-{formatCurrency(selectedPayslip.deductions)}</span>
                                </div>
                            </div>

                            <div className="border-2 border-slate-800 p-3 text-center bg-slate-50 mb-6">
                                <div className="font-bold mb-1 text-xs">GAJI BERSIH (Take Home Pay)</div>
                                <div className="font-bold text-xl">{formatCurrency(selectedPayslip.net)}</div>
                            </div>

                            <div className="text-center text-xs">
                                <div>Transfer via: BCA 1234567890</div>
                                <div>A.n. {selectedPayslip.user.name}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Screen>
    );
}
