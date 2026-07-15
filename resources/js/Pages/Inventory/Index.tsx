import { Head } from '@inertiajs/react';

import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, Badge, formatRupiah, MOCK_OUTLET } from '../../Components/Shared';
import { SearchIcon, PlusIcon, SlidersHorizontalIcon, DownloadIcon, PencilIcon } from '../../Components/icons';

import { RoleGuard } from '../../Components/RoleGuard';

function InventoryInner() {
    const rows = [
        { name: 'Beras Premium', cat: 'Staple', stock: 42, unit: 'kg', cost: 14500, updated: '2 mnt lalu', low: false },
        { name: 'Daging Sapi', cat: 'Protein', stock: 4.2, unit: 'kg', cost: 128000, updated: '8 mnt lalu', low: true },
        {
            name: 'Minyak Goreng',
            cat: 'Grocery',
            stock: 18,
            unit: 'liter',
            cost: 17800,
            updated: '15 mnt lalu',
            low: false,
        },
        { name: 'Cabai Merah', cat: 'Produce', stock: 850, unit: 'gram', cost: 62, updated: '24 mnt lalu', low: true },
        { name: 'Gula Aren', cat: 'Beverage', stock: 6, unit: 'kg', cost: 31000, updated: '1 jam lalu', low: false },
        { name: 'Terigu Cakra', cat: 'Staple', stock: 25, unit: 'kg', cost: 12000, updated: '3 jam lalu', low: false },
    ];
    return (
        <MainLayout>
            <Head title="Master Bahan Baku & Stok" />
            <Screen
                title="Master Bahan Baku & Stok"
                action={
                    <button className="rounded-lg bg-slate-100 hover:bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors flex items-center gap-2">
                        <PlusIcon className="size-4" />
                        Tambah Bahan Baru
                    </button>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 flex-1 max-w-xs focus-within:border-white/20 transition-colors">
                            <SearchIcon className="size-4 text-slate-400" />
                            <input
                                placeholder="Cari bahan baku..."
                                className="w-full bg-transparent py-2 text-sm outline-none text-slate-200 placeholder:text-slate-400"
                            />
                        </div>
                        <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 flex items-center gap-2">
                            <SlidersHorizontalIcon className="size-4" />
                            Kategori
                        </button>
                        <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10">
                            Outlet {MOCK_OUTLET}
                        </button>
                        <div className="ml-auto flex gap-3">
                            <button className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors flex items-center gap-2">
                                <DownloadIcon className="size-4" />
                                Export Excel
                            </button>
                        </div>
                    </div>
                    <Glass className="overflow-hidden">
                        <div className="p-5">
                            <div className="grid grid-cols-[1.4fr_1fr_1.2fr_.7fr_1fr_1fr_.5fr] border-b border-white/5 pb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                <span>Nama Bahan</span>
                                <span>Kategori</span>
                                <span>Stok</span>
                                <span>Satuan</span>
                                <span>Harga/Satuan</span>
                                <span>Diperbarui</span>
                                <span></span>
                            </div>
                            {rows.map((r) => (
                                <div
                                    className="grid grid-cols-[1.4fr_1fr_1.2fr_.7fr_1fr_1fr_.5fr] items-center border-b border-white/5 py-4 text-sm"
                                    key={r.name}
                                >
                                    <span className="font-medium text-slate-200">{r.name}</span>
                                    <span className="text-slate-400">{r.cat}</span>
                                    <span>
                                        {r.low ? (
                                            <Badge tone="red">Rendah � {r.stock}</Badge>
                                        ) : (
                                            <Badge tone="emerald">OK � {r.stock}</Badge>
                                        )}
                                    </span>
                                    <span className="font-mono text-slate-400">{r.unit}</span>
                                    <span className="font-mono text-slate-300">{formatRupiah(r.cost)}</span>
                                    <span className="text-slate-400">{r.updated}</span>
                                    <button className="text-slate-500 hover:text-slate-300 transition-colors">
                                        <PencilIcon className="size-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Glass>
                </div>
            </Screen>
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function Inventory() {
    return (
        <RoleGuard allowedRoles={['manager', 'owner']} pageName="Stok & Inventaris" allowedRoleLabel="Manager, Owner">
            <InventoryInner />
        </RoleGuard>
    );
}
