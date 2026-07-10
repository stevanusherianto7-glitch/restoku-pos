import { Screen, Glass } from '../Shared';
import { AlertCircle, Package } from 'lucide-react';

export function InventoryAlerts() {
    const alerts = [
        { id: 1, item: 'Nasi Putih', stock: 0, unit: 'kg', status: 'HABIS', tone: 'red' },
        { id: 2, item: 'Daging Ayam', stock: 0.5, unit: 'kg', status: 'HABIS', tone: 'red' },
        { id: 3, item: 'Minyak Goreng', stock: 2, unit: 'liter', status: 'Menipis', tone: 'amber' },
        { id: 4, item: 'Telur Ayam', stock: 5, unit: 'butir', status: 'Menipis', tone: 'amber' },
    ];

    return (
        <Screen title="Peringatan Stok">
            <div className="max-w-3xl space-y-6">
                <Glass className="p-6 border-amber-500/20">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <AlertCircle className="size-5 text-amber-500" /> Barang Perlu Perhatian
                    </h3>

                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 rounded-xl border flex items-center justify-between ${
                                    alert.tone === 'red'
                                        ? 'bg-red-500/10 border-red-500/20'
                                        : 'bg-amber-500/10 border-amber-500/20'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 rounded-lg ${alert.tone === 'red' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}
                                    >
                                        <Package
                                            className={`size-4 ${alert.tone === 'red' ? 'text-red-400' : 'text-amber-400'}`}
                                        />
                                    </div>
                                    <div>
                                        <div
                                            className={`font-semibold ${alert.tone === 'red' ? 'text-red-200' : 'text-amber-200'}`}
                                        >
                                            {alert.item}
                                        </div>
                                        <div
                                            className={`text-sm mt-0.5 ${alert.tone === 'red' ? 'text-red-300/80' : 'text-amber-300/80'}`}
                                        >
                                            Sisa: {alert.stock} {alert.unit}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                        alert.tone === 'red' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                                    }`}
                                >
                                    {alert.status}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex gap-3 items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <p className="text-sm font-medium text-emerald-200">
                            Semua bahan baku lainnya dalam kondisi aman.
                        </p>
                    </div>
                </Glass>

                <Glass className="p-6 bg-white/5 border border-white/5 flex items-center justify-center text-center">
                    <div className="max-w-xs">
                        <Package className="size-8 text-slate-500 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium text-slate-300 mb-1">Mode Read-Only</p>
                        <p className="text-xs text-slate-500">
                            Anda masuk sebagai Owner. Restock dan pengelolaan inventaris dilakukan oleh Admin/Dapur.
                        </p>
                    </div>
                </Glass>
            </div>
        </Screen>
    );
}
