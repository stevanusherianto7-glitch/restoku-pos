import React, { useState } from 'react';
import { Screen, Glass, Badge, Button, Input } from '../Shared';
import {
    UsersIcon,
    UserPlusIcon,
    SearchIcon,
    ChevronRightIcon,
    FileTextIcon,
    CheckCircle2Icon,
    AlertTriangleIcon,
    BriefcaseIcon,
    FileBadgeIcon,
    CalendarOffIcon,
    ShieldAlertIcon,
    SaveIcon,
    UploadIcon,
} from '../icons';

type Employee = {
    id: number;
    nik: string;
    name: string;
    role: string;
    dept: string;
    status: string;
    phone: string;
    email: string;
    joinDate: string;
    contractEnd: string;
};

const MOCK_EMPLOYEES: Employee[] = [
    {
        id: 1,
        nik: '3174123456789012',
        name: 'Budi Hartono',
        role: 'Waiter',
        dept: 'Service',
        status: 'Kontrak',
        phone: '0812-3456-7890',
        email: 'budi@restoku.app',
        joinDate: '01/01/2026',
        contractEnd: '30 Agt 2026',
    },
    {
        id: 2,
        nik: '3174123456789013',
        name: 'Sari Pertiwi',
        role: 'Chef',
        dept: 'Kitchen',
        status: 'Permanent',
        phone: '0812-1111-2222',
        email: 'sari@restoku.app',
        joinDate: '15/03/2024',
        contractEnd: '-',
    },
    {
        id: 3,
        nik: '3174123456789014',
        name: 'Andi Saputra',
        role: 'Kitchen Helper',
        dept: 'Kitchen',
        status: 'Probation',
        phone: '0812-3333-4444',
        email: 'andi@restoku.app',
        joinDate: '01/06/2026',
        contractEnd: '15 Agt 2026',
    },
];

export function EmployeeMaster() {
    const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
    const [selectedUser, setSelectedUser] = useState<Employee | null>(null);

    if (view === 'form') {
        return <EmployeeForm user={selectedUser} onBack={() => setView('dashboard')} />;
    }

    return (
        <Screen
            title="HRD & Data Karyawan"
            actions={
                <Button
                    onClick={() => {
                        setSelectedUser(null);
                        setView('form');
                    }}
                >
                    <UserPlusIcon className="size-4 mr-2" /> Tambah Karyawan
                </Button>
            }
        >
            {/* HRD Dashboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Glass className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm">Total Karyawan</p>
                        <p className="text-2xl font-bold text-white mt-1">12</p>
                    </div>
                    <div className="size-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)]">
                        <UsersIcon className="size-5" />
                    </div>
                </Glass>
                <Glass className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm">Karyawan Aktif</p>
                        <p className="text-2xl font-bold text-white mt-1">10</p>
                    </div>
                    <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2Icon className="size-5" />
                    </div>
                </Glass>
                <Glass className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm">Cuti Hari Ini</p>
                        <p className="text-2xl font-bold text-white mt-1">2</p>
                    </div>
                    <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                        <CalendarOffIcon className="size-5" />
                    </div>
                </Glass>
                <Glass className="p-4 flex items-center justify-between border-red-500/30">
                    <div>
                        <p className="text-slate-400 text-sm">Kontrak Habis</p>
                        <p className="text-2xl font-bold text-red-400 mt-1">
                            2 <span className="text-sm font-normal">bln dpn</span>
                        </p>
                    </div>
                    <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                        <AlertTriangleIcon className="size-5" />
                    </div>
                </Glass>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Glass className="p-5 lg:col-span-2">
                    <h3 className="font-semibold text-white mb-4">Karyawan Aktif per Departemen</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">Service (Waiter, Head Waiter)</span>
                                <span className="text-white font-medium">5 orang</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2">
                                <div
                                    className="bg-[var(--color-primary)]/100 h-2 rounded-full"
                                    style={{ width: '40%' }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">Kitchen (Chef, Cook, Helper)</span>
                                <span className="text-white font-medium">7 orang</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">Cashier</span>
                                <span className="text-white font-medium">2 orang</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                            </div>
                        </div>
                    </div>
                </Glass>

                <Glass className="p-5">
                    <h3 className="font-semibold text-white mb-4">Status Kontrak</h3>
                    <div className="space-y-3">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="size-2 rounded-full bg-amber-400" />
                                <span className="text-white font-medium text-sm">Andi Saputra</span>
                            </div>
                            <p className="text-xs text-slate-400 mb-2">Probation habis 15 Agt 2026</p>
                            <Button variant="outline" className="w-full text-xs py-1">
                                Evaluasi
                            </Button>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="size-2 rounded-full bg-red-400" />
                                <span className="text-white font-medium text-sm">Budi Hartono</span>
                            </div>
                            <p className="text-xs text-slate-400 mb-2">Kontrak habis 30 Agt 2026</p>
                            <Button variant="outline" className="w-full text-xs py-1">
                                Perpanjang / Tdk
                            </Button>
                        </div>
                    </div>
                </Glass>
            </div>

            <Glass className="p-0 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="relative w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari karyawan..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                            <option>Semua Departemen</option>
                            <option>Service</option>
                            <option>Kitchen</option>
                        </select>
                    </div>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium">Nama Karyawan</th>
                            <th className="px-4 py-3 font-medium">Jabatan & Dept</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Kontrak Berakhir</th>
                            <th className="px-4 py-3 font-medium text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {MOCK_EMPLOYEES.map((emp) => (
                            <tr
                                key={emp.id}
                                className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                onClick={() => {
                                    setSelectedUser(emp);
                                    setView('form');
                                }}
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-slate-700 flex items-center justify-center font-medium text-white">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{emp.name}</div>
                                            <div className="text-xs text-slate-500">{emp.nik}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-slate-200">{emp.role}</div>
                                    <div className="text-xs text-slate-500">{emp.dept}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge
                                        tone={
                                            emp.status === 'Permanent'
                                                ? 'emerald'
                                                : emp.status === 'Kontrak'
                                                  ? 'blue'
                                                  : 'amber'
                                        }
                                    >
                                        {emp.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-slate-400">{emp.contractEnd}</td>
                                <td className="px-4 py-3 text-right">
                                    <Button variant="ghost" className="opacity-0 group-hover:opacity-100">
                                        <ChevronRightIcon className="size-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Glass>
        </Screen>
    );
}

function EmployeeForm({ user, onBack }: { user: Employee | null; onBack: () => void }) {
    const [activeTab, setActiveTab] = useState('Profil');
    const tabs = ['Profil', 'Identitas & Alamat', 'Pekerjaan', 'Dokumen', 'Kontrak', 'Kedisiplinan (SP)'];

    return (
        <Screen
            title={user ? 'Profil Karyawan' : 'Tambah Karyawan Baru'}
            actions={
                <>
                    <Button variant="ghost" onClick={onBack}>
                        Batal
                    </Button>
                    <Button>
                        <SaveIcon className="size-4 mr-2" /> Simpan Data
                    </Button>
                </>
            }
        >
            <div className="flex flex-col md:flex-row gap-6 h-full">
                {/* Sidebar Tabs */}
                <Glass className="w-full md:w-64 p-2 shrink-0 h-fit">
                    <div className="flex flex-col gap-1">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === t ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </Glass>

                {/* Content */}
                <div className="flex-1 space-y-6">
                    {activeTab === 'Profil' && (
                        <Glass className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-6">Informasi Dasar</h2>
                            <div className="flex gap-6 mb-8">
                                <div className="size-24 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer hover:bg-white/10 transition-colors">
                                    <UploadIcon className="size-6" />
                                    <span className="text-[10px] uppercase tracking-wider">UploadIcon Foto</span>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Nama Lengkap
                                        </label>
                                        <Input defaultValue={user?.name} placeholder="cth. Budi Hartono" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                                        <Input
                                            type="email"
                                            defaultValue={user?.email}
                                            placeholder="cth. budi@restoku.app"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">No. HP</label>
                                        <Input defaultValue={user?.phone} placeholder="cth. 0812-..." />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        Tempat Lahir
                                    </label>
                                    <Input defaultValue={user ? 'Jakarta' : ''} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        Tanggal Lahir
                                    </label>
                                    <Input type="date" defaultValue={user ? '1995-08-17' : ''} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]">
                                        <option>Laki-laki</option>
                                        <option>Perempuan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Agama</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]">
                                        <option>Islam</option>
                                        <option>Kristen</option>
                                        <option>Katolik</option>
                                        <option>Hindu</option>
                                        <option>Buddha</option>
                                        <option>Konghucu</option>
                                    </select>
                                </div>
                            </div>
                        </Glass>
                    )}

                    {activeTab === 'Identitas & Alamat' && (
                        <>
                            <Glass className="p-6 mb-6">
                                <h2 className="text-lg font-semibold text-white mb-6">Data Identitas Resmi</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            NIK (KTP)
                                        </label>
                                        <Input defaultValue={user?.nik} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            No. Kartu Keluarga
                                        </label>
                                        <Input defaultValue={user?.nik} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                NPWP
                                            </label>
                                            <Input defaultValue={user ? '98.765.432.1-000.000' : ''} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                Status PTKP (PPh 21)
                                            </label>
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                                                defaultValue="TK/0"
                                            >
                                                <option>TK/0 (Tidak Kawin, 0 Tanggungan)</option>
                                                <option>TK/1 (Tidak Kawin, 1 Tanggungan)</option>
                                                <option>K/0 (Kawin, 0 Tanggungan)</option>
                                                <option>K/1 (Kawin, 1 Tanggungan)</option>
                                                <option>K/2 (Kawin, 2 Tanggungan)</option>
                                                <option>K/3 (Kawin, 3 Tanggungan)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                BPJS Ketenagakerjaan
                                            </label>
                                            <Input defaultValue={user ? '1234567890' : ''} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                BPJS Kesehatan
                                            </label>
                                            <Input defaultValue={user ? '0987654321' : ''} />
                                        </div>
                                    </div>
                                </div>
                            </Glass>
                            <Glass className="p-6">
                                <h2 className="text-lg font-semibold text-white mb-6">Alamat & Kontak Darurat</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Alamat Sesuai KTP
                                        </label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                                            rows={2}
                                            defaultValue="Jl. Merdeka No. 123, Jakarta Pusat"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Alamat Domisili
                                        </label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                                            rows={2}
                                            defaultValue="Sama dengan KTP"
                                        ></textarea>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                Nama Kontak Darurat
                                            </label>
                                            <Input defaultValue="Siti (Ibu)" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                No. HP Kontak Darurat
                                            </label>
                                            <Input defaultValue="0812-1111-2222" />
                                        </div>
                                    </div>
                                </div>
                            </Glass>
                        </>
                    )}

                    {activeTab === 'Pekerjaan' && (
                        <Glass className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-6">Informasi Pekerjaan</h2>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Jabatan</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                                        defaultValue={user?.role}
                                    >
                                        <option>Waiter</option>
                                        <option>Head Waiter</option>
                                        <option>Chef</option>
                                        <option>Cook</option>
                                        <option>Kitchen Helper</option>
                                        <option>Cashier</option>
                                        <option>Store Manager</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        Status Karyawan
                                    </label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                                        defaultValue={user?.status}
                                    >
                                        <option>Probation</option>
                                        <option>Kontrak</option>
                                        <option>Permanent</option>
                                        <option>Freelance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        Tanggal Masuk
                                    </label>
                                    <Input type="date" defaultValue="2026-01-01" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        Tanggal Keluar (Resign)
                                    </label>
                                    <Input type="date" />
                                </div>
                            </div>
                            <h3 className="text-sm font-semibold text-white mb-4">
                                Informasi Penggajian & Rekening Bank
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        Gaji Pokok (Basic Salary)
                                    </label>
                                    <Input type="number" defaultValue="3500000" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Nama Bank</label>
                                    <Input defaultValue="BCA" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        No. Rekening
                                    </label>
                                    <Input defaultValue="1234567890" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Atas Nama</label>
                                    <Input defaultValue={user?.name} />
                                </div>
                            </div>
                        </Glass>
                    )}

                    {activeTab === 'Dokumen' && (
                        <Glass className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-white">Dokumen Tersimpan</h2>
                                <Button variant="outline" size="sm">
                                    <UploadIcon className="size-4 mr-2" /> UploadIcon Dokumen
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {['KTP.pdf', 'Kartu Keluarga.pdf', 'Ijazah_Terakhir.pdf'].map((doc, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileTextIcon className="size-5 text-[var(--color-primary)]" />
                                            <span className="text-sm text-white">{doc}</span>
                                        </div>
                                        <Badge tone="emerald">Terverifikasi</Badge>
                                    </div>
                                ))}
                            </div>
                        </Glass>
                    )}

                    {activeTab === 'Kontrak' && (
                        <Glass className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-white">Riwayat Kontrak</h2>
                                <Button variant="outline" size="sm">
                                    <BriefcaseIcon className="size-4 mr-2" /> Buat Kontrak Baru
                                </Button>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-white flex items-center gap-2">
                                                Contract 1 <Badge tone="blue">Aktif</Badge>
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1">No: CONT/2026/001</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-white">01 Jan 2026 - 31 Des 2026</div>
                                            <div className="text-xs text-slate-400 mt-1">Gaji Pokok: Rp 3.500.000</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10 flex gap-4 text-xs text-slate-300">
                                        <span>Tunj. Makan: Rp 500.000</span>
                                        <span>Tunj. Transport: Rp 300.000</span>
                                        <span>Jatah Cuti: 12 Hari</span>
                                    </div>
                                </div>
                            </div>
                        </Glass>
                    )}

                    {activeTab === 'Kedisiplinan (SP)' && (
                        <Glass className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-white">
                                    Catatan Pelanggaran & Surat Peringatan
                                </h2>
                                <Button variant="outline" size="sm">
                                    <ShieldAlertIcon className="size-4 mr-2" /> Catat Pelanggaran
                                </Button>
                            </div>
                            <div className="text-center py-12">
                                <FileBadgeIcon className="size-12 mx-auto text-slate-600 mb-3" />
                                <p className="text-slate-400">Belum ada catatan pelanggaran untuk karyawan ini.</p>
                            </div>
                        </Glass>
                    )}
                </div>
            </div>
        </Screen>
    );
}
