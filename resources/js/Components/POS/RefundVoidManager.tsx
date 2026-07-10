import { useState } from 'react';
import { Screen, Glass, Button, Badge, formatRupiah } from '../Shared';
import { Search, SlidersHorizontal, Download, FileX, ArrowLeftRight, CheckCircle2, XCircle } from 'lucide-react';

export function RefundVoidManager() {
    const [activeTab, setActiveTab] = useState<'refund' | 'void'>('refund');

    const refunds = [
        {
            id: 'RF-1002',
            orderId: '#ORD-0706-55',
            date: 'Hari ini, 14:30',
            customer: 'Bpk. Budi',
            amount: 150000,
            method: 'qris',
            reason: 'Double payment',
            status: 'Approved',
            admin: 'Admin Pusat',
        },
        {
            id: 'RF-1001',
            orderId: '#ORD-0705-12',
            date: 'Kemarin, 19:45',
            customer: 'Ibu Siti',
            amount: 45000,
            method: 'cash',
            reason: 'Makanan tidak sesuai',
            status: 'Pending',
            admin: '-',
        },
    ];

    const voids = [
        {
            id: 'VD-2005',
            orderId: '#ORD-0706-88',
            date: 'Hari ini, 16:15',
            cashier: 'Maya Indah',
            amount: 85000,
            reason: 'Tamu batal pesan (kelamaan)',
            status: 'Approved',
            admin: 'Manager 1',
        },
        {
            id: 'VD-2004',
            orderId: '#ORD-0706-90',
            date: 'Hari ini, 16:20',
            cashier: 'Bima',
            amount: 25000,
            reason: 'Salah input menu',
            status: 'Rejected',
            admin: 'Manager 1',
        },
    ];

    return (
        <Screen
            title="Manajemen Refund & Void"
            action={
                <div className="flex gap-2 bg-white/5 border border-white/10 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('refund')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'refund' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Riwayat Refund
                    </button>
                    <button
                        onClick={() => setActiveTab('void')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'void' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Riwayat Void
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 flex-1 max-w-sm focus-within:border-white/20 transition-colors">
                        <Search className="size-4 text-slate-400" />
                        <input
                            placeholder={`Cari ID Order atau alasan ${activeTab}...`}
                            className="w-full bg-transparent py-2 text-sm outline-none text-slate-200 placeholder:text-slate-400"
                        />
                    </div>
                    <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 flex items-center gap-2">
                        <SlidersHorizontal className="size-4" />
                        Filter Status
                    </button>
                    <div className="ml-auto">
                        <button className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors flex items-center gap-2">
                            <Download className="size-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                <Glass className="overflow-hidden">
                    {activeTab === 'refund' ? (
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-4 text-sm text-blue-300 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                                <ArrowLeftRight className="size-4" />
                                <span>
                                    <b>Refund</b> adalah pengembalian dana ke pelanggan untuk order yang sudah LUNAS.
                                </span>
                            </div>
                            <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr_1.5fr_1fr] border-b border-white/5 pb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-2">
                                <span>ID Refund</span>
                                <span>Order ID</span>
                                <span>Waktu & Pelanggan</span>
                                <span>Nominal</span>
                                <span>Metode</span>
                                <span>Alasan & Admin</span>
                                <span>Status</span>
                            </div>
                            {refunds.map((r) => (
                                <div
                                    className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr_1.5fr_1fr] items-center border-b border-white/5 py-4 text-sm"
                                    key={r.id}
                                >
                                    <span className="font-medium text-slate-200">{r.id}</span>
                                    <span className="text-blue-400 hover:underline cursor-pointer">{r.orderId}</span>
                                    <div className="flex flex-col">
                                        <span className="text-slate-300">{r.customer}</span>
                                        <span className="text-[11px] text-slate-500">{r.date}</span>
                                    </div>
                                    <span className="font-mono text-slate-200">{formatRupiah(r.amount)}</span>
                                    <span className="uppercase text-[11px] tracking-wider text-slate-400 bg-white/5 px-2 py-1 rounded-md w-fit border border-white/10">
                                        {r.method}
                                    </span>
                                    <div className="flex flex-col pr-4">
                                        <span className="text-slate-300 text-xs italic">"{r.reason}"</span>
                                        <span className="text-[10px] text-slate-500 mt-0.5">Oleh: {r.admin}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {r.status === 'Approved' ? (
                                            <Badge tone="emerald">
                                                <CheckCircle2 className="size-3 mr-1" /> Approved
                                            </Badge>
                                        ) : (
                                            <>
                                                <Badge tone="amber">Pending</Badge>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <button className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30">
                                                        Setujui
                                                    </button>
                                                    <button className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30">
                                                        Tolak
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                <FileX className="size-4" />
                                <span>
                                    <b>Void</b> adalah pembatalan transaksi order yang BELUM dibayar (meja belum close
                                    bill).
                                </span>
                            </div>
                            <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr_1fr] border-b border-white/5 pb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-2">
                                <span>ID Void</span>
                                <span>Order ID</span>
                                <span>Waktu & Kasir</span>
                                <span>Nominal Order</span>
                                <span>Alasan & Approval</span>
                                <span>Status</span>
                            </div>
                            {voids.map((v) => (
                                <div
                                    className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr_1fr] items-center border-b border-white/5 py-4 text-sm"
                                    key={v.id}
                                >
                                    <span className="font-medium text-slate-200">{v.id}</span>
                                    <span className="text-blue-400 hover:underline cursor-pointer">{v.orderId}</span>
                                    <div className="flex flex-col">
                                        <span className="text-slate-300">{v.cashier}</span>
                                        <span className="text-[11px] text-slate-500">{v.date}</span>
                                    </div>
                                    <span className="font-mono text-slate-200">{formatRupiah(v.amount)}</span>
                                    <div className="flex flex-col pr-4">
                                        <span className="text-slate-300 text-xs italic">"{v.reason}"</span>
                                        <span className="text-[10px] text-slate-500 mt-0.5">Approve by: {v.admin}</span>
                                    </div>
                                    <div>
                                        {v.status === 'Approved' ? (
                                            <Badge tone="emerald">
                                                <CheckCircle2 className="size-3 mr-1" /> Approved
                                            </Badge>
                                        ) : (
                                            <Badge tone="red">
                                                <XCircle className="size-3 mr-1" /> Rejected
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Glass>
            </div>
        </Screen>
    );
}
