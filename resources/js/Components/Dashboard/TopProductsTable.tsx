import { Glass, formatRupiah } from '../../Components/Shared';
import { SparklesIcon } from '../../Components/icons';

type Product = { name: string; cat: string; sold: number; rev: number };

export function TopProductsTable({
    products,
    isNanoBanana,
    isGlobal,
    selectedOutlet,
}: {
    products: Product[];
    isNanoBanana: boolean;
    isGlobal: boolean;
    selectedOutlet: string;
}) {
    return (
        <Glass className="p-6 border-white/10" hover>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        {isNanoBanana && <SparklesIcon className="size-4 text-amber-400" />}
                        Produk Terlaris {isGlobal ? '(Akumulasi 100 Cabang)' : `(${selectedOutlet})`}
                    </h2>
                    <p className="text-xs text-slate-400">
                        Kontributor pendapatan utama berdasarkan volume penjualan item.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-[1.6fr_1fr_.8fr_1fr] border-b border-white/10 pb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Nama Produk</span>
                <span>Kategori</span>
                <span>Terjual</span>
                <span>Total Pendapatan</span>
            </div>
            <div className="divide-y divide-white/5">
                {products.map((p, i) => (
                    <div
                        className="grid grid-cols-[1.6fr_1fr_.8fr_1fr] items-center py-3.5 text-sm hover:bg-white/[0.03] px-2 rounded-lg transition-colors group"
                        key={p.name}
                    >
                        <span className="flex items-center gap-3 text-slate-200 font-semibold">
                            <span
                                className={`size-8 rounded-lg border flex items-center justify-center text-xs font-bold ${
                                    isNanoBanana && i === 0
                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                        : 'bg-white/5 border-white/10 text-slate-400 group-hover:border-white/20'
                                }`}
                            >
                                {i + 1}
                            </span>
                            {p.name}
                        </span>
                        <span className="text-slate-400">{p.cat}</span>
                        <span className="font-mono font-semibold text-slate-300">
                            {p.sold.toLocaleString('id-ID')} Porsi
                        </span>
                        <span className={`font-bold font-mono ${isNanoBanana ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {formatRupiah(p.rev)}
                        </span>
                    </div>
                ))}
            </div>
        </Glass>
    );
}
