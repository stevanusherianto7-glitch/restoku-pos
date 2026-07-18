import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { DeleteIcon } from '../../Components/icons';
import { RestokuWordmark, verifyPin, DEFAULT_EMPLOYEES } from '../../Components/Shared';
import type { Staff } from '../../Types/staff';

export default function StaffLogin() {
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const tenantName = 'Restoku';

    // ── Daftar Karyawan dari Inertia Shared Props ──────────────────────────
    // MIGRASI dari localStorage ke usePage().props.login_employees
    // login_employees di-share oleh HandleInertiaRequests HANYA di halaman /login
    const { login_employees } = usePage<{ login_employees?: Staff[] }>().props;

    // Fallback: localStorage untuk backward-compat jika props kosong (incognito/cache)
    const [employeesList] = useState<Staff[]>(() => {
        // Helper: filter karyawan yang memiliki pin valid (bukan null/undefined)
        const filterValid = (arr: Staff[]) =>
            Array.isArray(arr) ? arr.filter((e) => e && typeof e.pin === 'string' && e.pin.length > 0) : [];

        if (Array.isArray(login_employees) && login_employees.length > 0) {
            const valid = filterValid(login_employees);
            if (valid.length > 0) return valid;
        }
        // Fallback ke localStorage jika props tidak tersedia
        try {
            const raw = localStorage.getItem('tenant_employees');
            if (raw) {
                const parsed = JSON.parse(raw);
                const valid = filterValid(parsed);
                if (valid.length > 0) return valid;
            }
        } catch {
            // ignore invalid blob storage
        }
        return [];
    });

    const handleNumberClick = (num: string) => {
        if (pin.length < 6 && !isLoading) {
            setPin((prev) => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        if (pin.length > 0 && !isLoading) {
            setPin((prev) => prev.slice(0, -1));
            setError(false);
        }
    };

    // DEFAULT_EMPLOYEES from Shared.tsx (single source of truth)

    // Auto-login when PIN is 6 digits
    useEffect(() => {
        if (pin.length === 6) {
            setIsLoading(true);
            // [B-FIX] If shared props carry the broken literal "pin" (backend shares
            // raw DB column instead of a hash), treat the list as unusable and fall
            // back to DEFAULT_EMPLOYEES so the documented 999999 manager PIN works.
            const propsBroken =
                Array.isArray(employeesList) &&
                employeesList.length > 0 &&
                employeesList.every((e) => e && e.pin === 'pin');
            const primaryList = propsBroken
                ? []
                : Array.isArray(employeesList) && employeesList.length > 0
                  ? employeesList
                  : DEFAULT_EMPLOYEES;

            (async () => {
                let matched: Staff | null = null;
                // Try props list first, then fall back to DEFAULT_EMPLOYEES.
                for (const list of [primaryList, DEFAULT_EMPLOYEES]) {
                    if (!Array.isArray(list) || list.length === 0) continue;
                    for (const emp of list) {
                        if (!emp.pin) continue;
                        const ok = await verifyPin(pin, emp.pin);
                        if (ok) {
                            matched = emp;
                            break;
                        }
                    }
                    if (matched) break;
                }
                setTimeout(() => {
                    if (matched) {
                        localStorage.setItem(
                            'activeKaryawan',
                            JSON.stringify({
                                id: matched.id,
                                name: matched.name,
                                role: matched.role,
                                token: `${matched.id}_${matched.role}_auth_ok`,
                            }),
                        );
                        router.post('/login', {
                            pin: pin,
                            role: matched.role,
                            name: matched.name,
                        });
                    } else {
                        setError(true);
                        setPin('');
                        setIsLoading(false);
                    }
                }, 800);
            })();
        }
    }, [pin, employeesList]);

    return (
        <div className="min-h-screen w-full bg-[#030303] flex flex-col md:flex-row font-display selection:bg-white/20">
            <Head title={`Staff Login - ${tenantName}`} />

            {/* Left side - Branding (Hidden on mobile) */}
            <div className="hidden md:flex flex-1 flex-col justify-between p-12 bg-white/[0.02] border-r border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <RestokuWordmark className="h-9 w-auto brightness-110" />
                        <div>
                            <div className="text-xl font-bold text-white tracking-tight">{tenantName} OS</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Cabang Pawon Salam</div>
                        </div>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                        Masuk ke <br />
                        Sistem Operasional.
                    </h1>
                    <p className="text-slate-400 text-lg max-w-md">
                        Silakan masukkan PIN otorisasi Anda untuk masuk ke sistem Kasir (POS) dan Dapur.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-slate-500">
                    <p>
                        &copy; {new Date().getFullYear()} {tenantName}. Mode Kasir Aktif.
                    </p>
                </div>
            </div>

            {/* Right side - PIN Pad */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
                <div className="w-full max-w-sm">
                    <div className="md:hidden flex items-center justify-center gap-2 mb-10">
                        <RestokuWordmark className="h-7 w-auto" />
                        <span className="text-xl font-bold text-white">{tenantName}</span>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-white mb-2">Masukkan PIN</h2>
                        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                            {(Array.isArray(employeesList) && employeesList.length > 0
                                ? employeesList
                                : DEFAULT_EMPLOYEES
                            ).map((e) => (
                                <span key={e.id}>
                                    <span
                                        className={`font-bold uppercase ${
                                            e.role === 'kasir'
                                                ? 'text-blue-400'
                                                : e.role === 'kitchen'
                                                  ? 'text-red-400'
                                                  : e.role === 'waiter'
                                                    ? 'text-emerald-400'
                                                    : 'text-amber-400'
                                        }`}
                                    >
                                        {e.role}
                                    </span>{' '}
                                    · {(e.pin?.length ?? 0) === 64 ? '******' : (e.pin ?? '—')}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* PIN Display */}
                    <div className="flex justify-center gap-4 mb-12">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                            <div
                                key={index}
                                className={`size-4 md:size-5 rounded-full transition-all duration-300 ${
                                    error
                                        ? 'bg-red-500'
                                        : index < pin.length
                                          ? 'bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] scale-110'
                                          : 'bg-white/10'
                                }`}
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm text-center mb-6 -mt-6 animate-pulse">
                            PIN salah, silakan coba lagi.
                        </p>
                    )}

                    {/* Numpad */}
                    <div className="grid grid-cols-3 gap-4 md:gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num.toString())}
                                disabled={isLoading}
                                className="h-16 md:h-20 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/10 border border-white/5 hover:border-white/20 text-2xl md:text-3xl font-medium text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                            >
                                {num}
                            </button>
                        ))}
                        <div className="h-16 md:h-20 flex items-center justify-center">
                            {/* Empty space bottom left */}
                        </div>
                        <button
                            onClick={() => handleNumberClick('0')}
                            disabled={isLoading}
                            className="h-16 md:h-20 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/10 border border-white/5 hover:border-white/20 text-2xl md:text-3xl font-medium text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                        >
                            0
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isLoading || pin.length === 0}
                            className="h-16 md:h-20 rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 hover:border-red-500/40 text-red-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center"
                        >
                            <DeleteIcon className="size-6 md:size-8" />
                        </button>
                    </div>

                    <div className="mt-12 text-center">
                        <Link
                            href="/"
                            className="text-sm font-medium text-slate-500 hover:text-white transition-colors"
                        >
                            Batal & Kembali
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
