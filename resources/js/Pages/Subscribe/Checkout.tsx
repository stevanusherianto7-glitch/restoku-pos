import { Link, useForm } from '@inertiajs/react';

// Inline check icon (hindari lucide-react per preferensi proyek)
function Check() {
    return (
        <svg
            className="size-4 text-emerald-500 shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
        >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function Checkout({
    plan,
    name,
    price_idr,
    tagline,
    features,
    popular,
}: {
    plan: string;
    name: string;
    price_idr: number;
    tagline: string;
    features: string[];
    popular: boolean;
}) {
    const { post, processing } = useForm();
    const submit = () => post(`/subscribe/${plan}`);
    const fmt = new Intl.NumberFormat('id-ID').format(price_idr);

    return (
        <div className="min-h-screen w-full bg-[#072f24] text-white flex items-center justify-center p-6 font-display">
            <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                {popular && (
                    <span className="absolute -top-4 inset-x-0 flex justify-center">
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Paling Populer
                        </span>
                    </span>
                )}

                <h1 className="text-2xl font-bold">{name}</h1>
                <p className="text-sm text-slate-500">{tagline}</p>
                <div className="text-4xl font-black my-4">
                    Rp {fmt}
                    <span className="text-sm font-normal text-slate-500">/bln</span>
                </div>

                <ul className="space-y-3 my-6">
                    {features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                            <Check />
                            {f}
                        </li>
                    ))}
                </ul>

                <button
                    onClick={submit}
                    disabled={processing}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-60"
                >
                    {processing ? 'Memproses…' : 'Lanjutkan (Trial 14 Hari)'}
                </button>

                {plan === 'enterprise' && (
                    <p className="text-center text-xs text-slate-500 mt-3">
                        Tim sales kami akan menghubungi Anda untuk setup dedicated.
                    </p>
                )}

                <Link
                    href="/"
                    className="block text-center mt-4 text-sm text-slate-500 hover:text-emerald-700 transition-colors"
                >
                    Kembali ke beranda
                </Link>
            </div>
        </div>
    );
}
