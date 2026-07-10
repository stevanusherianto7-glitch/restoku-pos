import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { EmployeeMaster } from '../../Components/HRD/EmployeeMaster';
import { ShieldAlert } from 'lucide-react';

const AUTHORIZED_ROLES = ['manager', 'owner'];

export default function AdminEmployeesPage() {
    const [roleChecked, setRoleChecked] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem('activeKaryawan');
        if (raw) {
            try {
                const { role } = JSON.parse(raw);
                setAuthorized(AUTHORIZED_ROLES.includes(role));
            } catch {
                setAuthorized(false);
            }
        } else {
            // No session = assume unauthenticated / default kasir
            setAuthorized(false);
        }
        setRoleChecked(true);
    }, []);

    // Tampilkan access-denied sebelum check selesai (mencegah flash konten)
    if (!roleChecked) return null;

    if (!authorized) {
        return (
            <MainLayout>
                <Head title="Akses Ditolak" />
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
                    <div className="p-5 rounded-full bg-red-500/10 border border-red-500/20">
                        <ShieldAlert className="size-12 text-red-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white">Akses Ditolak</h1>
                        <p className="text-slate-400 text-sm max-w-sm">
                            Halaman <strong>HRD &amp; Data Karyawan</strong> hanya dapat diakses oleh{' '}
                            <strong className="text-amber-400">Manager</strong> atau{' '}
                            <strong className="text-purple-400">Owner</strong>.
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                            Role Anda saat ini tidak memiliki otorisasi untuk halaman ini.
                        </p>
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

    return (
        <MainLayout>
            <Head title="HRD & Data Karyawan" />

            {/* Top Header Navigation Tabs matching StafShift layout */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6 print:hidden">
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    >
                        DAFTAR KARYAWAN
                    </button>
                    <Link
                        href="/staf-shift"
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                    >
                        JADWAL SHIFT
                    </Link>
                </div>
                <div className="text-xs text-slate-400">Cabang Senopati</div>
            </div>

            <EmployeeMaster />
        </MainLayout>
    );
}
