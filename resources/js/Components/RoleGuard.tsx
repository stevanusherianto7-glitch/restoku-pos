import { useEffect, useState, type ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import MainLayout from '../Layouts/MainLayout';
import { ShieldAlertIcon } from './icons';

// ─── Role Guard Hook ──────────────────────────────────────────────────────────
/**
 * Reads activeKaryawan from localStorage and checks whether the current role
 * is in the list of allowedRoles.
 *
 * Returns:
 *   - status: "loading" | "allowed" | "denied"
 */
export function useRoleGuard(allowedRoles: string[]): 'loading' | 'allowed' | 'denied' {
    const { auth } = (usePage<any>().props as any) ?? {};
    const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');

    useEffect(() => {
        // Owner session (login via owner, bukan staff PIN) → izinkan bila 'owner' di-allow.
        // Ini menangani kasus di mana localStorage.activeKaryawan kosong untuk owner.
        if (auth?.user?.role === 'owner' && allowedRoles.includes('owner')) {
            setStatus('allowed');
            return;
        }

        try {
            const raw = localStorage.getItem('activeKaryawan');
            if (!raw) {
                setStatus('denied');
                return;
            }
            const parsed = JSON.parse(raw);
            const { name, role, token } = parsed;

            // Reject spoofed objects missing proper identity properties
            if (!role || !name) {
                console.warn('[RoleGuard Security] Access denied: missing identity credentials.');
                setStatus('denied');
                return;
            }

            // Normalize role aliases (frontend uses 'kasir', PengaturanOutlet may store 'cashier', etc.)
            const norm = (r: string): string => {
                const map: Record<string, string> = {
                    cashier: 'kasir',
                    kitchen: 'kitchen',
                    waiter: 'waiter',
                    manager: 'manager',
                    owner: 'owner',
                    admin: 'admin',
                    dapur: 'kitchen',
                    pelayan: 'waiter',
                };
                return map[r?.toLowerCase()] ?? r?.toLowerCase();
            };

            const allowedNormalized = allowedRoles.map(norm);
            if (!allowedNormalized.includes(norm(role))) {
                setStatus('denied');
                return;
            }

            // Validate cryptographic session token format (set by StaffLogin after PIN verify)
            if (token && !/^.+_.+_auth_ok$/.test(token)) {
                console.warn('[RoleGuard Security] Access denied: invalid session token.');
                setStatus('denied');
                return;
            }

            setStatus('allowed');
        } catch {
            setStatus('denied');
        }
    }, [auth?.user?.role, allowedRoles]);

    return status;
}

// ─── Access Denied UI ─────────────────────────────────────────────────────────
interface AccessDeniedProps {
    /** Human-readable name of the page being blocked (shown in message). */
    pageName?: string;
    /** Comma-separated list of roles that are allowed (shown in sub-message). */
    allowedRoleLabel?: string;
}

export function AccessDenied({ pageName, allowedRoleLabel }: AccessDeniedProps) {
    return (
        <MainLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 animate-in fade-in duration-300">
                <div className="p-5 rounded-full bg-red-500/10 border border-red-500/20">
                    <ShieldAlertIcon className="size-12 text-red-400" />
                </div>
                <div className="space-y-2 max-w-sm">
                    <h1 className="text-2xl font-bold text-white">Akses Ditolak</h1>
                    {pageName && (
                        <p className="text-slate-400 text-sm">
                            Halaman <strong className="text-slate-200">{pageName}</strong> tidak dapat diakses dengan
                            role Anda saat ini.
                        </p>
                    )}
                    {allowedRoleLabel && (
                        <p className="text-slate-500 text-xs mt-1">
                            Diizinkan untuk: <span className="text-slate-300">{allowedRoleLabel}</span>
                        </p>
                    )}
                </div>
                <Link
                    href="/dashboard"
                    className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-semibold transition-colors"
                >
                    ← Kembali ke Dashboard
                </Link>
            </div>
        </MainLayout>
    );
}

// ─── RoleGuard Wrapper Component ─────────────────────────────────────────────
interface RoleGuardProps {
    allowedRoles: string[];
    children: ReactNode;
    pageName?: string;
    allowedRoleLabel?: string;
}

/**
 * Wraps any page component. Shows null while loading, then renders children
 * if authorized or <AccessDenied> if not.
 *
 * Usage:
 *   export default function MyPage() {
 *     return (
 *       <RoleGuard allowedRoles={["manager","owner"]} pageName="Laporan">
 *         <MyPageContent />
 *       </RoleGuard>
 *     );
 *   }
 *   function MyPageContent() { ... original hooks and JSX ... }
 */
export function RoleGuard({ allowedRoles, children, pageName, allowedRoleLabel }: RoleGuardProps) {
    const status = useRoleGuard(allowedRoles);

    if (status === 'loading') return null;
    if (status === 'denied') {
        return <AccessDenied pageName={pageName} allowedRoleLabel={allowedRoleLabel} />;
    }
    return <>{children}</>;
}
