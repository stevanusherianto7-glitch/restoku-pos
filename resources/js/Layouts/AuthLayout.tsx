import { type ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeftIcon } from '../Components/icons';
import { RestokuWordmark } from '../Components/Shared';

interface AuthLayoutProps {
    children: ReactNode;
    /** Optional: shown at the top of the left branding panel. */
    title?: string;
    /** Optional: shown below the title in the left panel. */
    subtitle?: string;
    /** Whether to show the back-to-home link. Defaults to true. */
    showBackLink?: boolean;
}

/**
 * Layout shell for all authentication pages (staff login, owner login).
 * Provides a consistent split-screen (branding left | form right) structure.
 * The left panel accepts custom title/subtitle for context-specific messaging.
 */
export default function AuthLayout({
    children,
    title = 'Selamat Datang Kembali.',
    subtitle = 'Masuk ke sistem untuk memulai shift Anda.',
    showBackLink = true,
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-[#030303] flex font-display selection:bg-white/20">
            {/* Left — Branding Panel (hidden on mobile) */}
            <div className="hidden lg:flex w-[42%] xl:w-[38%] shrink-0 flex-col justify-between p-14 bg-white/[0.015] border-r border-white/5 relative overflow-hidden">
                {/* Decorative gradient blob */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.06)_0%,transparent_40%)] pointer-events-none" />

                {/* Logo */}
                <div className="relative flex items-center gap-3">
                    <RestokuWordmark className="h-9 w-auto brightness-110" />
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                            Sistem Manajemen Restoran
                        </div>
                    </div>
                </div>

                {/* Headline */}
                <div className="relative">
                    <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                        {title}
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed max-w-sm">{subtitle}</p>
                </div>

                {/* Footer */}
                <p className="relative text-xs text-slate-600">
                    &copy; {new Date().getFullYear()} Restoku · All rights reserved.
                </p>
            </div>

            {/* Right — Form Panel */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
                {/* Back link */}
                {showBackLink && (
                    <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors group"
                        >
                            <ArrowLeftIcon className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                            Kembali ke website
                        </Link>
                    </div>
                )}

                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center gap-2 mb-10">
                    <RestokuWordmark className="h-7 w-auto" />
                </div>

                {/* Form content slot */}
                <div className="w-full max-w-sm">{children}</div>
            </div>
        </div>
    );
}
