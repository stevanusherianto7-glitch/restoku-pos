import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass } from '../../Components/Shared';
import { QrCode, Plus, LayoutGrid, Printer, Users } from 'lucide-react';
import { useState } from 'react';

type TableStatus = 'available' | 'occupied' | 'reserved' | 'dirty';

interface Table {
    id: string;
    name: string;
    capacity: number;
    status: TableStatus;
}

export default function TableManagement() {
    const [tables, setTables] = useState<Table[]>([
        { id: 't1', name: 'Meja 1', capacity: 2, status: 'available' },
        { id: 't2', name: 'Meja 2', capacity: 2, status: 'occupied' },
        { id: 't3', name: 'Meja 3', capacity: 4, status: 'available' },
        { id: 't4', name: 'Meja 4', capacity: 4, status: 'reserved' },
        { id: 't5', name: 'Meja 5', capacity: 6, status: 'dirty' },
        { id: 't6', name: 'Meja 6', capacity: 8, status: 'available' },
        { id: 't7', name: 'VIP 1', capacity: 10, status: 'available' },
        { id: 't8', name: 'VIP 2', capacity: 12, status: 'occupied' },
    ]);

    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const getStatusColor = (status: TableStatus) => {
        switch (status) {
            case 'available':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'occupied':
                return 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/30';
            case 'reserved':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'dirty':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
        }
    };

    const getStatusLabel = (status: TableStatus) => {
        switch (status) {
            case 'available':
                return 'Tersedia';
            case 'occupied':
                return 'Terisi';
            case 'reserved':
                return 'Dipesan';
            case 'dirty':
                return 'Kotor';
        }
    };

    const handleGenerateQr = (table: Table) => {
        setSelectedTable(table);
        setIsQrModalOpen(true);
    };

    return (
        <MainLayout>
            <Head title="Manajemen Meja & QR" />
            <Screen
                title="Manajemen Meja & QR"
                action={
                    <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/100 text-white rounded-xl transition-colors font-medium">
                        <Plus className="size-5" />
                        <span>Tambah Meja</span>
                    </button>
                }
            >
                <div className="flex gap-6 h-full">
                    {/* Main Grid */}
                    <div className="flex-1 space-y-6">
                        <Glass className="p-4 flex gap-4 overflow-x-auto">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 whitespace-nowrap">
                                <LayoutGrid className="size-4" /> Semua Meja
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-slate-300 rounded-lg whitespace-nowrap">
                                Lantai 1
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-slate-300 rounded-lg whitespace-nowrap">
                                Lantai 2
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-slate-300 rounded-lg whitespace-nowrap">
                                Area VIP
                            </button>
                        </Glass>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {tables.map((table) => (
                                <div
                                    key={table.id}
                                    className={`p-6 rounded-2xl border transition-all ${getStatusColor(table.status)} hover:-translate-y-1 hover:shadow-lg backdrop-blur-md cursor-pointer`}
                                    onClick={() => handleGenerateQr(table)}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-2xl font-bold font-mono tracking-tight">{table.name}</h3>
                                        <div className="flex items-center gap-1 opacity-70">
                                            <Users className="size-4" />
                                            <span className="text-sm font-medium">{table.capacity}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-sm font-medium px-3 py-1 rounded-full bg-black/20">
                                            {getStatusLabel(table.status)}
                                        </span>
                                        <button
                                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                            title="Generate QR Code"
                                        >
                                            <QrCode className="size-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* QR Modal */}
                {isQrModalOpen && selectedTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <Glass className="w-full max-w-md p-8 relative flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setIsQrModalOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>

                            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center mb-6">
                                <QrCode className="size-8 text-[var(--color-primary)]" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">QR Code {selectedTable.name}</h2>
                            <p className="text-slate-400 mb-8">Scan QR Code ini untuk memesan langsung dari meja.</p>

                            <div className="bg-white p-4 rounded-2xl mb-8 w-64 h-64 flex items-center justify-center shadow-xl">
                                {/* Mock QR Code Image */}
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://restoku.app/order/${selectedTable.id}`}
                                    alt={`QR ${selectedTable.name}`}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            <div className="flex gap-4 w-full">
                                <button className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2">
                                    <Printer className="size-5" /> Cetak
                                </button>
                                <button className="flex-1 py-3 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/100 text-white rounded-xl font-medium transition-colors">
                                    Unduh PNG
                                </button>
                            </div>
                        </Glass>
                    </div>
                )}
            </Screen>
        </MainLayout>
    );
}
