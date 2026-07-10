import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChefHat, Mail, Lock, ArrowRight, Quote, Eye, EyeOff } from 'lucide-react';
import { Input, Button, RestokuLogo, RestokuWordmark } from '../../Components/Shared';

export default function OwnerLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const tenantName = 'Restoku';
    const { errors } = usePage().props;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            '/owner/login',
            {
                email,
                password,
            },
            {
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <div className="min-h-screen w-full bg-[#030303] flex font-display selection:bg-white/20">
            <Head title={`Owner Login - ${tenantName}`} />

            {/* Left Column - Login Form */}
            <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 relative z-10 bg-black shadow-[20px_0_60px_rgba(0,0,0,0.5)]">
                <div className="absolute top-8 left-8 lg:top-12 lg:left-12">
                    <Link href="/" className="flex items-center gap-3 group">
                        <RestokuWordmark className="h-8 w-auto brightness-110" />
                        <span className="text-xl font-bold tracking-tight text-white">{tenantName}</span>
                    </Link>
                </div>

                <div className="w-full max-w-sm mx-auto mt-12">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
                        Selamat Datang, <br />
                        Owner.
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-10">
                        Akses dasbor analitik dan pantau performa seluruh cabang restoran Anda secara real-time.
                    </p>

                    {errors && errors.email && (
                        <div className="p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                            {errors.email}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Email Bisnis</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="owner@restoran.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-12 h-14 text-base bg-white/[0.02] border-white/5 focus:bg-white/[0.04] focus:border-blue-500/50 rounded-2xl transition-all shadow-inner"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-slate-300">Password</label>
                                <a
                                    href="#"
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                                >
                                    Lupa?
                                </a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 pr-12 h-14 text-base bg-white/[0.02] border-white/5 focus:bg-white/[0.04] focus:border-blue-500/50 rounded-2xl transition-all shadow-inner"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                tone="primary"
                                className="w-full h-14 text-base font-semibold group rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] border-0"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-3">
                                        <span className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Membuka Dasbor...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Masuk Dasbor{' '}
                                        <ArrowRight className="size-5 group-hover:translate-x-1.5 transition-transform" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                        <p className="text-sm text-slate-400">
                            Belum mendaftarkan bisnis Anda? <br />
                            <a
                                href="#"
                                className="text-white hover:text-blue-400 font-medium transition-colors mt-2 inline-block border-b border-white/20 hover:border-blue-400"
                            >
                                Daftar Trial 14 Hari Sekarang
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column - Visual/Abstract Brand */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#09090b] items-center justify-center p-20">
                {/* Beautiful Abstract Gradients */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.15)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.1)_0%,transparent_40%)]" />

                {/* Floating Glass UI Elements to suggest "Dashboard" */}
                <div className="relative w-full max-w-2xl aspect-[4/3] rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-700 ease-out">
                    <div className="h-12 border-b border-white/10 flex items-center px-6 gap-2 bg-black/40">
                        <div className="size-3 rounded-full bg-red-500/80" />
                        <div className="size-3 rounded-full bg-amber-500/80" />
                        <div className="size-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex-1 p-8 flex flex-col gap-6 bg-gradient-to-br from-white/[0.01] to-transparent">
                        <div className="w-1/3 h-8 rounded-lg bg-white/5" />
                        <div className="flex gap-6">
                            <div className="flex-1 h-32 rounded-2xl bg-blue-500/10 border border-blue-500/20" />
                            <div className="flex-1 h-32 rounded-2xl bg-emerald-500/10 border border-emerald-500/20" />
                            <div className="flex-1 h-32 rounded-2xl bg-amber-500/10 border border-amber-500/20" />
                        </div>
                        <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 mt-4" />
                    </div>
                </div>

                {/* Testimonial Overlay */}
                <div className="absolute bottom-12 right-12 max-w-md p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl">
                    <Quote className="size-8 text-blue-500/50 mb-3" />
                    <p className="text-slate-300 leading-relaxed italic mb-4">
                        "Sejak menggunakan Restoku, memantau penjualan dari 5 cabang berbeda menjadi semudah membalikkan
                        telapak tangan."
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 p-[2px]">
                            <div className="size-full rounded-full bg-black border border-white/10" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Budi Santoso</div>
                            <div className="text-xs text-slate-500">Founder, Kedai Nusantara</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
