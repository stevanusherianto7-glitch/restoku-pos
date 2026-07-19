import { Fragment } from 'react';
import { ArrowLeftIcon } from '../../../Components/icons';
import { formatRupiah } from '../../../lib/formatters';

interface OrderItem {
    id: number | string;
    name: string;
    qty?: number;
    notes?: string;
    cook_step?: number;
}

interface OrderRow {
    id: number | string;
    label: string;
    status: string;
    duration: string;
    items: OrderItem[];
    total: number;
    destination?: string;
}

interface StatusPanelProps {
    orders: OrderRow[];
    activeOrderId: number | string | null;
    orderHasFood: boolean;
    orderHasDrink: boolean;
    orderDrinkServed: boolean;
    orderFoodServed: boolean;
    setActiveTab: (t: 'menu' | 'cart' | 'reservasi' | 'galeri' | 'status') => void;
}

const itemSteps = ['Dikonfirmasi', 'Sedang Dimasak', 'Selesai Masak', 'Siap Saji', 'Sudah Disajikan'];

export function StatusPanel(p: StatusPanelProps) {
    return (
        <main className="flex-1 p-4 pb-28 flex flex-col gap-3 overflow-y-auto bg-[#FAF5EE]">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#1A1410] flex items-center gap-2">
                    <ArrowLeftIcon className="size-4 text-[#FF5B35]" /> Status Pesanan
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#0F8A4D] flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-[#0F8A4D] inline-block" /> Auto Aktif
                    </span>
                    <span className="text-[#9B8D7E] text-sm cursor-pointer" onClick={() => p.setActiveTab('menu')}>
                        ⟳
                    </span>
                </div>
            </div>
            {p.orders.map((o) => {
                const isFood = o.destination !== 'bar';
                const routeLabel = isFood ? '🍳 Rute: Dapur (KDS)' : '🥤 Rute: Bar (Waiter)';
                const routeCls = isFood ? 'bg-[#FCE3D6] text-[#C9431F]' : 'bg-[#EAF2FB] text-[#1666C9]';
                const items = Array.isArray(o.items) ? o.items : [];
                return (
                    <div key={o.id} className="bg-white border border-[#EFE2D4] rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p
                                className={`text-[13px] font-extrabold flex items-center gap-1.5 ${o.status === 'ready' ? 'text-[#0F8A4D]' : 'text-[#C9431F]'}`}
                            >
                                {o.status === 'ready' ? '✓ ' : '🍴 '} {o.label}
                            </p>
                            <span className="text-[10px] font-bold text-[#9B8D7E]">{o.id}</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#9B8D7E] mt-0.5">DURASI PROSES: {o.duration}</p>
                        <div className="mt-3 space-y-2">
                            {items.map((it, idx) => {
                                const cookStep = it.cook_step ?? 1;
                                return (
                                    <div
                                        key={it.id ?? idx}
                                        className="bg-[#FAF5EE] border border-[#EFE2D4] rounded-xl p-2.5"
                                    >
                                        <p className="text-[11px] font-extrabold text-[#1A1410] mb-1.5">
                                            {it.qty ?? 1}x {it.name}
                                            {it.notes ? (
                                                <span className="font-normal text-[#9B8D7E]"> ({it.notes})</span>
                                            ) : null}
                                        </p>
                                        <div className="flex items-center justify-between px-0.5">
                                            {itemSteps.map((s, i) => {
                                                const n = i + 1;
                                                const state = n < cookStep ? 'done' : n === cookStep ? 'on' : 'off';
                                                const bubCls =
                                                    state === 'done'
                                                        ? 'bg-[#0F8A4D] text-white rs-step-done'
                                                        : state === 'on'
                                                          ? 'bg-[#FF5B35] text-white rs-step-on'
                                                          : 'bg-[#EFE7DD] text-[#9B8D7E]';
                                                return (
                                                    <Fragment key={s}>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div
                                                                className={`size-6 rounded-full ${bubCls} grid place-items-center text-[10px] font-extrabold`}
                                                            >
                                                                {n}
                                                            </div>
                                                            <span
                                                                className={`text-[8px] font-extrabold tracking-wide ${state === 'done' ? 'text-[#0F8A4D]' : state === 'on' ? 'text-[#FF5B35]' : 'text-[#9B8D7E]'}`}
                                                            >
                                                                {s.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        {n < 5 && (
                                                            <div
                                                                className="h-0.5 flex-1 mx-1 -mt-4"
                                                                style={{
                                                                    background:
                                                                        n < cookStep
                                                                            ? '#0F8A4D'
                                                                            : n === cookStep
                                                                              ? '#FF5B35'
                                                                              : '#EFE7DD',
                                                                }}
                                                            />
                                                        )}
                                                    </Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-end justify-between mt-3 pt-3 border-t border-[#EFE2D4]">
                            <p className="text-[13px] font-extrabold text-[#1A1410]">
                                {items.map((it) => `${it.qty ?? 1}x ${it.name}`).join(', ')}
                            </p>
                            <span className="text-[14px] font-extrabold text-[#0F8A4D]">{formatRupiah(o.total)}</span>
                        </div>
                        {o.id === p.activeOrderId && (p.orderHasFood || p.orderHasDrink) && (
                            <div className="mt-3 pt-3 border-t border-[#EFE2D4] space-y-2">
                                {p.orderHasDrink && (
                                    <div className="flex items-center gap-2 text-[11px] font-bold">
                                        <span
                                            className={`size-2 rounded-full ${p.orderDrinkServed ? 'bg-[#0F8A4D]' : 'bg-[#FF5B35] animate-pulse'}`}
                                        />
                                        <span className={p.orderDrinkServed ? 'text-[#0F8A4D]' : 'text-[#C9431F]'}>
                                            🥤 Minuman {p.orderDrinkServed ? 'Sudah Disajikan' : 'Disajikan ke Meja…'}
                                        </span>
                                    </div>
                                )}
                                {p.orderHasFood && (
                                    <div className="flex items-center gap-2 text-[11px] font-bold">
                                        <span
                                            className={`size-2 rounded-full ${p.orderFoodServed ? 'bg-[#0F8A4D]' : 'bg-[#FF5B35]'}`}
                                        />
                                        <span className={p.orderFoodServed ? 'text-[#0F8A4D]' : 'text-[#C9431F]'}>
                                            🍳 Makanan {p.orderFoodServed ? 'Sudah Disajikan' : 'Disajikan ke Meja…'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        <span
                            className={`inline-flex items-center gap-1.5 mt-3 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg ${routeCls}`}
                        >
                            {routeLabel}
                        </span>
                    </div>
                );
            })}
        </main>
    );
}
