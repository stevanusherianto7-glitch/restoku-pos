import { ProductImage } from '../../../Components/ProductImage';
import { formatRupiah } from '../../../lib/formatters';
import { MinusIcon, PlusIcon } from '../../../Components/icons';
import { type MenuItem } from '../../CustomerView';

interface MenuItemCardProps {
    item: MenuItem;
    isNanoBanana: boolean;
    qty: number;
    onOpenDetail: (item: MenuItem) => void;
    onAdd: (id: number) => void;
    onRemove: (id: number) => void;
}

export function MenuItemCard({ item, isNanoBanana, qty, onOpenDetail, onAdd, onRemove }: MenuItemCardProps) {
    return (
        <div
            onClick={() => onOpenDetail(item)}
            className="flex gap-4 bg-white/[0.03] p-4 rounded-3xl shadow-sm border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden cursor-pointer"
        >
            <div className="relative size-20 rounded-2xl overflow-hidden shrink-0 bg-slate-900 border border-white/5">
                <ProductImage
                    src={item.image}
                    alt={item.name}
                    variant="small"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.isPopular && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-black text-[7px] uppercase tracking-wider px-1 py-0.5 rounded shadow">
                        POPULAR
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                    <div className="flex items-start justify-between gap-1.5">
                        <h3
                            className={`text-sm font-bold text-white leading-snug transition-colors truncate ${isNanoBanana ? 'group-hover:text-amber-400' : 'group-hover:text-emerald-400'}`}
                        >
                            {item.name}
                        </h3>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1 line-clamp-2">
                        {item.description || 'Hidangan lezat diolah higienis dengan resep rahasia.'}
                    </p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span
                        className={`text-xs font-mono font-bold ${isNanoBanana ? 'text-amber-400' : 'text-emerald-400'}`}
                    >
                        {formatRupiah(item.price)}
                    </span>
                    <div className="flex items-center">
                        {qty ? (
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5">
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className={`size-6 rounded-full text-slate-950 flex items-center justify-center font-bold transition-colors ${isNanoBanana ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
                                >
                                    <MinusIcon className="size-3" />
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-white">{qty}</span>
                                <button
                                    onClick={() => onAdd(item.id)}
                                    className={`size-6 rounded-full text-slate-950 flex items-center justify-center font-bold transition-colors ${isNanoBanana ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
                                >
                                    <PlusIcon className="size-3" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => onAdd(item.id)}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm ${isNanoBanana ? 'bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500 hover:text-slate-950 text-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-emerald-500/10 border border-emerald-500/35 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400'}`}
                            >
                                Tambah
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
