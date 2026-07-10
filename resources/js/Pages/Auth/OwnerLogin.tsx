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
                {/* Logo sejajar dengan heading */}
                <Link href="/" className="flex items-center gap-3 group mb-12">
                    <RestokuWordmark className="h-8 w-auto brightness-110" />
                    <span className="text-xl font-bold tracking-tight text-white">{tenantName}</span>
                </Link>

                <div className="w-full max-w-sm mx-auto">
                    <h1 className="font-extrabold text-white tracking-tight mb-3 leading-tight">
                        <span className="block text-lg md:text-xl font-medium text-slate-400">Selamat Datang,</span>
                        <span className="block text-4xl md:text-5xl">Owner.</span>
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

                    {/* Masuk dengan Google — owner lupa password langsung diarahkan ke Gmail */}
                    <div className="mt-6">
                        <div className="relative flex items-center justify-center my-5">
                            <div className="absolute inset-x-0 h-px bg-white/10" />
                            <span className="relative px-3 text-xs text-slate-500 bg-black">atau</span>
                        </div>
                        <a
                            href="/oauth/google"
                            className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl bg-white text-slate-700 font-semibold text-base hover:bg-slate-100 transition-colors border border-white/10"
                        >
                            <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
                                <path
                                    fill="#EA4335"
                                    d="M24 9.5c3.54 0 6.7 1.22 9.2 3.62l6.85-6.85C35.9 2.38 30.3 0 24 0 14.6 0 6.46 5.38 2.62 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                />
                                <path
                                    fill="#4285F4"
                                    d="M46.1 24.55c0-1.57-.14-3.08-.4-4.55H24v9.1h12.4c-.54 2.9-2.18 5.36-4.66 7.04l7.2 5.6c4.2-3.88 6.66-9.6 6.66-17.19z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M10.6 28.66a14.5 14.5 0 0 1 0-9.32l-7.98-6.19a24 24 0 0 0 0 21.7l7.98-6.19z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M24 48c6.3 0 11.6-2.1 15.46-5.7l-7.2-5.6c-2 1.34-4.6 2.14-8.26 2.14-6.26 0-11.57-4.22-13.4-9.9l-7.99 6.19C6.46 42.62 14.6 48 24 48z"
                                />
                            </svg>
                            Masuk dengan Google
                        </a>
                    </div>

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

            {/* Right Column - Owner Success Photo */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#09090b] items-center justify-center p-12">
                {/* Foto owner sukses memegang tablet dashboard */}
                <img
                    src="/images/owner-success.png"
                    alt="Owner restoran memantau dasbor Restoku secara real-time"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    loading="eager"
                />
                {/* Gradient overlay bawah utk keterbacaan testimonial */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Testimonial Overlay */}
                <div className="absolute bottom-12 right-12 left-12 max-w-md p-6 rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 shadow-2xl">
                    <Quote className="size-8 text-amber-500/60 mb-3" />
                    <p className="text-slate-200 leading-relaxed italic mb-4">
                        &quot;Sejak menggunakan Restoku, memantau penjualan dari 5 cabang berbeda menjadi semudah
                        membalikkan telapak tangan.&quot;
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 p-[2px]">
                            <div className="size-full rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                                BS
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Budi Santoso</div>
                            <div className="text-xs text-slate-400">Founder, Kedai Nusantara</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
