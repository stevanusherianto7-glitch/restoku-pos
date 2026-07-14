import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass, formatRupiah as formatRp } from '../../Components/Shared';
import { AwardIcon, ShoppingCartIcon } from '../../Components/icons';

interface TopProduct {
    name: string;
    qty_sold: number;
    revenue: number;
    progress: number;
}

interface Props {
    topProducts: TopProduct[];
    filters?: { date_range?: string };
}

export default function LaporanProduk({ topProducts }: Props) {
    return (
        <MainLayout>
            <Head title="Laporan Produk - Restoku" />
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Laporan Produk & Kategori</h1>
                <p className="text-slate-400 mt-1">Ranking produk terlaris, qty terjual, dan revenue.</p>
            </div>

            <Glass className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AwardIcon className="size-5 text-amber-400" /> Top 10 Produk
                </h3>
                <div className="space-y-4">
                    {topProducts.map((p, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="size-8 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                                #{i + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-200 font-medium">{p.name}</span>
                                    <span className="text-slate-400">
                                        {p.qty_sold}x • {formatRp(p.revenue)}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400/80 rounded-full"
                                        style={{ width: `${p.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {topProducts.length === 0 && (
                        <p className="text-slate-500 text-sm">Belum ada data penjualan periode ini.</p>
                    )}
                </div>
            </Glass>
        </MainLayout>
    );
}
