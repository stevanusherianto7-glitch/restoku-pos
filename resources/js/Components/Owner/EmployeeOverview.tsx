import { Screen, Glass, formatRupiah as formatRp } from '../Shared';
import { UsersIcon, AlertCircleIcon, ClockIcon } from '../icons';

export function EmployeeOverview() {
    const departments = [
        { name: 'Service', count: 5, salary: 4200000, color: 'bg-blue-500' },
        { name: 'Kitchen', count: 7, salary: 6500000, color: 'bg-amber-500' },
        { name: 'Cashier', count: 2, salary: 1400000, color: 'bg-emerald-500' },
        { name: 'Management', count: 1, salary: 730580, color: 'bg-purple-500' },
    ];

    const totalEmployees = departments.reduce((acc, curr) => acc + curr.count, 0);
    const totalSalary = departments.reduce((acc, curr) => acc + curr.salary, 0);

    return (
        <Screen title="Ringkasan Karyawan">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                <Glass className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <UsersIcon className="size-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Total Karyawan</h3>
                            <p className="text-sm text-slate-400">Juli 2026</p>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-4xl font-bold text-white">{totalEmployees}</div>
                        <div className="text-sm text-slate-400">Orang</div>
                    </div>

                    <div className="text-sm text-slate-300 mb-6">
                        Gaji Bulan Ini: <span className="font-semibold text-white">{formatRp(totalSalary)}</span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Perbaikan per Departemen
                    </h4>
                    <div className="space-y-4">
                        {departments.map((dept) => (
                            <div key={dept.name}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-300">
                                        {dept.name}{' '}
                                        <span className="text-slate-500 text-xs ml-1">({dept.count} org)</span>
                                    </span>
                                    <span className="text-white font-medium">{formatRp(dept.salary)}</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/5">
                                    <div
                                        className={`h-full rounded-full ${dept.color}`}
                                        style={{ width: `${(dept.salary / totalSalary) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Glass>

                <div className="space-y-6">
                    <Glass className="p-6">
                        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <AlertCircleIcon className="size-4 text-amber-500" /> Perhatian HRD
                        </h3>

                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
                                <ClockIcon className="size-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-200">Kontrak Habis Bulan Depan</p>
                                    <p className="text-xs text-amber-300/70 mt-0.5">
                                        Ada 2 karyawan yang masa kontraknya akan berakhir pada Agustus 2026. Admin telah
                                        diberitahu.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Glass>

                    <Glass className="p-6 bg-white/5 border border-white/5 flex items-center justify-center text-center">
                        <div className="max-w-xs">
                            <UsersIcon className="size-8 text-slate-500 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium text-slate-300 mb-1">Mode Read-Only</p>
                            <p className="text-xs text-slate-500">
                                Anda masuk sebagai Owner. Pengelolaan data karyawan, shift, dan payroll hanya dapat
                                dilakukan oleh Admin/HRD.
                            </p>
                        </div>
                    </Glass>
                </div>
            </div>
        </Screen>
    );
}
