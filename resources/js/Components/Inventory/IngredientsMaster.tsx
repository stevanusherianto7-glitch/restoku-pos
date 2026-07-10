import { useState } from 'react';
import { Screen, Glass, Badge, Button, Input, formatRupiah as formatRp } from '../Shared';
import { Search, Plus, Filter, Edit2, Trash2, Package, Truck, LayoutList } from 'lucide-react';

export function IngredientsMaster({ initialTab = 'bahan' }: { initialTab?: 'bahan' | 'kategori' | 'supplier' }) {
    const [activeTab, setActiveTab] = useState(initialTab);

    const ingredients = [
        {
            id: 1,
            sku: 'ING-001',
            name: 'Beras Premium',
            category: 'Bahan Kering',
            stock: 25,
            min_stock: 10,
            unit: 'kg',
            recipe_unit: 'gr',
            conversion: 1000,
            cost: 12000,
            method: 'FIFO',
        },
        {
            id: 2,
            sku: 'ING-002',
            name: 'Daging Ayam',
            category: 'Bahan Segar',
            stock: 3,
            min_stock: 5,
            unit: 'kg',
            recipe_unit: 'gr',
            conversion: 1000,
            cost: 35000,
            method: 'FEFO',
        },
        {
            id: 3,
            sku: 'ING-003',
            name: 'Minyak Goreng',
            category: 'Bahan Kering',
            stock: 10,
            min_stock: 5,
            unit: 'liter',
            recipe_unit: 'ml',
            conversion: 1000,
            cost: 18000,
            method: 'FIFO',
        },
    ];

    const categories = [
        { id: 1, name: 'Bahan Segar', items: 45 },
        { id: 2, name: 'Bahan Kering', items: 32 },
        { id: 3, name: 'Bumbu & Seasoning', items: 60 },
    ];

    const suppliers = [
        { id: 1, name: 'PT. Pangan Sentosa', contact: '0812-3456-7890', terms: 'Net 14', items: 12 },
        { id: 2, name: 'Toko Daging Barokah', contact: '0811-2222-3333', terms: 'Cash', items: 5 },
        { id: 3, name: 'Depot Sayur Makmur', contact: '0855-4444-5555', terms: 'Net 7', items: 20 },
    ];

    return (
        <Screen
            title="Master Bahan Baku & Supplier"
            action={
                <Button className="gap-2">
                    <Plus className="size-4" />
                    {activeTab === 'bahan'
                        ? 'Tambah Bahan Baku'
                        : activeTab === 'kategori'
                          ? 'Tambah Kategori'
                          : 'Tambah Supplier'}
                </Button>
            }
        >
            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 mb-6 pb-px overflow-x-auto">
                <button
                    onClick={() => setActiveTab('bahan')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'bahan' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <Package className="size-4" /> Bahan Baku
                </button>
                <button
                    onClick={() => setActiveTab('kategori')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'kategori' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <LayoutList className="size-4" /> Kategori
                </button>
                <button
                    onClick={() => setActiveTab('supplier')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'supplier' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <Truck className="size-4" /> Supplier
                </button>
            </div>

            <Glass className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6 md:items-center justify-between">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input placeholder={`Cari ${activeTab}...`} className="pl-9 w-full md:w-80" />
                    </div>
                    {activeTab === 'bahan' && (
                        <Button variant="outline" className="gap-2">
                            <Filter className="size-4" /> Filter Kategori
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-white/5">
                            {activeTab === 'bahan' && (
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Nama Bahan</th>
                                    <th className="px-4 py-3">Kategori</th>
                                    <th className="px-4 py-3">Stok</th>
                                    <th className="px-4 py-3">Satuan</th>
                                    <th className="px-4 py-3">Harga Rata-Rata</th>
                                    <th className="px-4 py-3">Metode</th>
                                    <th className="px-4 py-3 text-center rounded-tr-lg">Aksi</th>
                                </tr>
                            )}
                            {activeTab === 'kategori' && (
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg w-1/2">Nama Kategori</th>
                                    <th className="px-4 py-3">Jumlah Item</th>
                                    <th className="px-4 py-3 text-center rounded-tr-lg">Aksi</th>
                                </tr>
                            )}
                            {activeTab === 'supplier' && (
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Nama Supplier</th>
                                    <th className="px-4 py-3">Kontak</th>
                                    <th className="px-4 py-3">Term Pembayaran</th>
                                    <th className="px-4 py-3">Jumlah Item Disuplai</th>
                                    <th className="px-4 py-3 text-center rounded-tr-lg">Aksi</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {activeTab === 'bahan' &&
                                ingredients.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">{item.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                {item.sku}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge tone="emerald">{item.category}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span>{item.stock}</span>
                                                {item.stock <= item.min_stock && <Badge tone="amber">Low</Badge>}
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                Min: {item.min_stock} {item.unit}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{item.unit}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                1 {item.unit} = {item.conversion} {item.recipe_unit}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{formatRp(item.cost)}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">per {item.unit}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">{item.method}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white">
                                                    <Edit2 className="size-4" />
                                                </button>
                                                <button className="p-1 hover:bg-red-500/20 rounded-md transition-colors text-slate-400 hover:text-red-400">
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                            {activeTab === 'kategori' &&
                                categories.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                                        <td className="px-4 py-3 text-slate-400">{item.items} bahan</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white">
                                                    <Edit2 className="size-4" />
                                                </button>
                                                <button className="p-1 hover:bg-red-500/20 rounded-md transition-colors text-slate-400 hover:text-red-400">
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                            {activeTab === 'supplier' &&
                                suppliers.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                                        <td className="px-4 py-3 text-slate-400">{item.contact}</td>
                                        <td className="px-4 py-3">
                                            <Badge tone="blue">{item.terms}</Badge>
                                        </td>
                                        <td className="px-4 py-3">{item.items} item</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white">
                                                    <Edit2 className="size-4" />
                                                </button>
                                                <button className="p-1 hover:bg-red-500/20 rounded-md transition-colors text-slate-400 hover:text-red-400">
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </Glass>
        </Screen>
    );
}
