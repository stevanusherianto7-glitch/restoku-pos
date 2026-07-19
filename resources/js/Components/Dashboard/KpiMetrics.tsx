import { Glass, toneMap, type Tone } from '../../Components/Shared';

type Metric = {
    label: string;
    value: string | number;
    sub: string;
    Icon: React.ElementType;
    tone: Tone;
    delta: string;
};

export function KpiMetrics({ metrics, isNanoBanana }: { metrics: Metric[]; isNanoBanana: boolean }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map(({ label, value, sub, Icon, tone, delta }, idx) => (
                <Glass className="p-5 flex flex-col justify-between border-white/10" hover key={label}>
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div
                                className={`grid size-10 place-items-center rounded-xl border ${
                                    toneMap[tone]
                                } ${isNanoBanana && idx === 0 ? 'border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : ''}`}
                            >
                                <Icon className="size-4.5" />
                            </div>
                            <span
                                className={`font-semibold text-[11px] px-2.5 py-1 rounded-full ${
                                    delta.startsWith('+') ||
                                    delta.includes('Normal') ||
                                    delta.includes('mnt') ||
                                    delta.includes('Stable')
                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                }`}
                            >
                                {delta}
                            </span>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                        <div
                            className={`text-2xl lg:text-3xl font-bold tracking-tight mt-1 ${
                                isNanoBanana && idx === 0
                                    ? 'bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent'
                                    : 'text-white'
                            }`}
                        >
                            {value}
                        </div>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 border-t border-white/5 pt-2.5">{sub}</p>
                </Glass>
            ))}
        </div>
    );
}
