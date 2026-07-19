import { Glass } from '../../../Components/Shared';
import { SparklesIcon, ImageIcon, CheckIcon, XIcon, Edit2Icon, Trash2Icon, PlusIcon } from '../../../Components/icons';
import type { PanelProps } from '../types';

export default function BrandingPanel(props: PanelProps) {
    const {
        h2Class,
        labelClass,
        inputClass,
        h3Class,
        cardRowClass,
        isLight,
        logoOptions,
        nameInput,
        setNameInput,
        namaOutletInput,
        setNamaOutletInput,
        imageInput,
        setImageInput,
        logoInput,
        setLogoInput,
        employeesList,
        editingId,
        editName,
        setEditName,
        editEmail,
        setEditEmail,
        editRole,
        setEditRole,
        editPassword,
        setEditPassword,
        newEmpName,
        setNewEmpName,
        newEmpEmail,
        setNewEmpEmail,
        newEmpRole,
        setNewEmpRole,
        newEmpPassword,
        setNewEmpPassword,
        ownerInput,
        setOwnerInput,
        handleLogoUpload,
        handleAddEmployee,
        handleDeleteEmployee,
        handleStartEdit,
        handleSaveEdit,
        setEditingId,
    } = props;

    return (
        <Glass className="p-6 border-emerald-500/10">
            <h2 className={h2Class}>
                <SparklesIcon className="size-4 text-emerald-400" /> Branding Kustom Tenant (White-Label)
            </h2>
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-4 col-span-2 md:col-span-1">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Nama Restoran / Cafe</label>
                            <input
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="e.g. Restoku"
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Cabang Outlet</label>
                            <input
                                value={namaOutletInput}
                                onChange={(e) => setNamaOutletInput(e.target.value)}
                                placeholder="e.g. Bandung / Cabang Utama"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                        <label className={labelClass}>Unggah Logo Gambar (WebP)</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                id="branding-logo-upload"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            {imageInput ? (
                                <div className="flex items-center gap-3">
                                    <img
                                        src={imageInput}
                                        alt="Logo Preview"
                                        className={`size-10 object-cover rounded-lg border ${isLight ? 'border-slate-300 bg-slate-100' : 'border-white/10 bg-white/5'}`}
                                    />
                                    <button
                                        onClick={() => setImageInput(null)}
                                        className="text-xs text-red-500 hover:text-red-400 font-bold"
                                    >
                                        Hapus Foto
                                    </button>
                                </div>
                            ) : (
                                <label
                                    htmlFor="branding-logo-upload"
                                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${isLight ? 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800' : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`}
                                >
                                    <ImageIcon className="size-3.5" /> Pilih File Logo
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {!imageInput && (
                    <div className="space-y-1.5">
                        <label className={labelClass}>Atau Pilih Logo Ikon Bawaan</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {logoOptions.map(({ name, label, Icon }) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setLogoInput(name)}
                                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-all ${logoInput === name ? (isLight ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] shadow-sm' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400') : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'}`}
                                >
                                    <Icon className="size-5" />
                                    <span className="text-[9px] font-medium leading-none">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Struktur Personil / Karyawan & PIN (CRUD Mode) */}
                <div className={`space-y-4 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                    <div className="flex justify-between items-center">
                        <h3 className={h3Class}>Struktur & PIN Otorisasi Karyawan</h3>
                        <div className="text-[10px] text-slate-500 font-medium">Mode CRUD Dinamis</div>
                    </div>

                    {/* CRUD List / Table */}
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                        {employeesList.map((emp) => (
                            <div key={emp.id} className={cardRowClass}>
                                {editingId === emp.id ? (
                                    /* EDITING MODE ROW */
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className={inputClass}
                                            placeholder="Nama Staf"
                                        />
                                        <input
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            className={inputClass}
                                            placeholder="Email Staf"
                                        />
                                        <select
                                            value={editRole}
                                            onChange={(e) =>
                                                setEditRole(
                                                    e.target.value as 'cashier' | 'kitchen' | 'waiter' | 'admin',
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="cashier">KASIR (CASHIER)</option>
                                            <option value="kitchen">KITCHEN</option>
                                            <option value="waiter">WAITER</option>
                                            <option value="admin">MANAGER / ADMIN</option>
                                        </select>
                                        <input
                                            type="password"
                                            value={editPassword}
                                            onChange={(e) => setEditPassword(e.target.value)}
                                            className={inputClass}
                                            placeholder="Password baru (opsional)"
                                        />
                                    </div>
                                ) : (
                                    /* DISPLAY MODE ROW */
                                    <div className="flex items-center gap-3 flex-1">
                                        <div
                                            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border shrink-0 w-20 text-center ${emp.role === 'cashier' || emp.role === 'kasir' ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20 text-[var(--color-primary)]' : emp.role === 'kitchen' ? 'bg-red-500/10 border-red-500/20 text-red-500' : emp.role === 'waiter' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}
                                        >
                                            {emp.role}
                                        </div>
                                        <div
                                            className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-200'}`}
                                        >
                                            {emp.name}
                                        </div>
                                        <div
                                            className={`text-xs font-mono ml-auto px-2 py-0.5 rounded-md ${isLight ? 'text-slate-600 bg-slate-200/60' : 'text-slate-500 bg-white/5'}`}
                                        >
                                            Email: {emp.email || '-'}
                                        </div>
                                    </div>
                                )}

                                {/* ROW ACTIONS */}
                                <div className="flex items-center gap-1.5">
                                    {editingId === emp.id ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleSaveEdit}
                                                className="p-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                                                title="Simpan Edit"
                                            >
                                                <CheckIcon className="size-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingId(null)}
                                                className={`p-1 rounded-lg transition-colors ${isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-300'}`}
                                                title="Batal"
                                            >
                                                <XIcon className="size-3.5" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(emp)}
                                                className={`p-1 rounded-lg transition-colors ${isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-300'}`}
                                                title="Ubah Staf"
                                            >
                                                <Edit2Icon className="size-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteEmployee(emp.id)}
                                                className={`p-1 rounded-lg transition-colors ${isLight ? 'bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-600' : 'bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400'}`}
                                                title="Hapus Staf"
                                            >
                                                <Trash2Icon className="size-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ADD NEW EMPLOYEE INLINE FORM */}
                    <div
                        className={`border border-dashed p-3 rounded-xl space-y-3 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-white/[0.02] border-white/10'}`}
                    >
                        <div className={h3Class}>Tambah Karyawan Baru</div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            <input
                                value={newEmpName}
                                onChange={(e) => setNewEmpName(e.target.value)}
                                className={`sm:col-span-1 ${inputClass}`}
                                placeholder="Nama Lengkap"
                                autoComplete="off"
                            />
                            <input
                                value={newEmpEmail}
                                onChange={(e) => setNewEmpEmail(e.target.value)}
                                className={`sm:col-span-1 ${inputClass}`}
                                placeholder="Email Login"
                                autoComplete="off"
                            />
                            <select
                                value={newEmpRole}
                                onChange={(e) =>
                                    setNewEmpRole(e.target.value as '' | 'cashier' | 'kitchen' | 'waiter' | 'admin')
                                }
                                className={inputClass}
                            >
                                <option value="" disabled>
                                    Pilih Role
                                </option>
                                <option value="cashier">KASIR (CASHIER)</option>
                                <option value="kitchen">KITCHEN</option>
                                <option value="waiter">WAITER</option>
                                <option value="admin">MANAGER / ADMIN</option>
                            </select>
                            <div className="sm:col-span-2 flex gap-2">
                                <input
                                    type="password"
                                    value={newEmpPassword}
                                    onChange={(e) => setNewEmpPassword(e.target.value)}
                                    className={`flex-1 font-mono ${inputClass}`}
                                    placeholder="Password (min 4 karakter)"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddEmployee}
                                    className="rounded-lg bg-emerald-500 hover:bg-emerald-400 p-2 text-slate-950 transition-colors flex items-center justify-center"
                                    title="Tambah Staf"
                                >
                                    <PlusIcon className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* OWNER SECTION (Static, Email Login) */}
                    <div
                        className={`flex gap-3 border p-3 rounded-xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.01] border-white/5'}`}
                    >
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-purple-500 uppercase tracking-wide">
                                Nama Owner
                            </label>
                            <input
                                value={ownerInput}
                                onChange={(e) => setOwnerInput(e.target.value)}
                                className={inputClass}
                                placeholder="LALU GUSTI"
                            />
                        </div>
                        <div className="w-24 space-y-1">
                            <label className="text-[10px] font-bold text-purple-500 uppercase tracking-wide">
                                Akses Login
                            </label>
                            <div className="w-full rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 px-3 py-2 text-[10px] text-center font-bold uppercase">
                                Email
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Glass>
    );
}
