import { useState, type ChangeEvent } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';

import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, formatRupiah } from '../../Components/Shared';
import { ChefHat, Plus, Upload, Pencil, Trash2, X } from 'lucide-react';
import { ProductImage } from '../../Components/ProductImage';

type Category = { id: number; name: string };
type Outlet = { id: number; name: string };
type MenuItemType = {
    id: number;
    outlet_id: number | null;
    menu_category_id: number;
    name: string;
    description: string | null;
    price: number;
    image_path: string | null;
    is_available: boolean;
    is_popular: boolean;
    sort_order: number;
};

function convertToWebP(_file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                const size = Math.min(img.width, img.height, 500);
                canvas.width = size;
                canvas.height = size;
                const sx = (img.width - size) / 2;
                const sy = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
                resolve(canvas.toDataURL('image/webp', 0.85));
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

export default function KatalogMenu({
    menuItems = [],
    outlets = [],
    categories = [],
}: {
    menuItems: MenuItemType[];
    outlets: Outlet[];
    categories: Category[];
}) {
    const [items, setItems] = useState<MenuItemType[]>(menuItems);
    const [activeFilter, setActiveFilter] = useState('all');
    const [editing, setEditing] = useState<MenuItemType | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        price: 0,
        menu_category_id: categories[0]?.id ?? 0,
        outlet_id: '',
        is_available: true,
        is_popular: false,
        photo: '',
    });
    const [processing, setProcessing] = useState(false);

    const filtered =
        activeFilter === 'all' ? items : items.filter((i) => String(i.menu_category_id) === String(activeFilter));

    const openAdd = () => {
        setEditing(null);
        setForm({
            name: '',
            description: '',
            price: 0,
            menu_category_id: categories[0]?.id ?? 0,
            outlet_id: '',
            is_available: true,
            is_popular: false,
            photo: '',
        });
        setShowForm(true);
    };

    const openEdit = (item: MenuItemType) => {
        setEditing(item);
        setForm({
            name: item.name,
            description: item.description ?? '',
            price: item.price,
            menu_category_id: item.menu_category_id,
            outlet_id: item.outlet_id ? String(item.outlet_id) : '',
            is_available: item.is_available,
            is_popular: item.is_popular,
            photo: item.image_path ?? '',
        });
        setShowForm(true);
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const webp = await convertToWebP(file);
            setForm((f) => ({ ...f, photo: webp }));
        } catch (err) {
            console.error('Gagal konversi gambar', err);
        }
    };

    const submit = () => {
        setProcessing(true);
        const payload = {
            ...form,
            outlet_id: form.outlet_id ? Number(form.outlet_id) : null,
            price: Number(form.price),
        };
        if (editing) {
            router.put(`/api/menu/${editing.id}`, payload, {
                onSuccess: () => {
                    setShowForm(false);
                    setProcessing(false);
                    router.reload({ only: ['menuItems'] });
                },
                onError: () => setProcessing(false),
            });
        } else {
            router.post('/api/menu', payload, {
                onSuccess: () => {
                    setShowForm(false);
                    setProcessing(false);
                    router.reload({ only: ['menuItems'] });
                },
                onError: () => setProcessing(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus item menu ini?')) return;
        router.delete(`/api/menu/${id}`, {
            onSuccess: () => router.reload({ only: ['menuItems'] }),
        });
    };

    return (
        <MainLayout>
            <Head title="Katalog Menu" />
            <Screen title="Katalog Menu">
                <div className="flex justify-center">
                    <Glass className="w-full max-w-5xl p-6 flex flex-col h-[calc(100vh-120px)]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                                    <ChefHat className="size-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">
                                        Katalog Menu (Mode Edit)
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Kelola daftar menu dan ketersediaan</p>
                                </div>
                            </div>
                            <button
                                onClick={openAdd}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors"
                            >
                                <Plus className="size-4" /> Tambah Menu
                            </button>
                        </div>

                        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                                    activeFilter === 'all'
                                        ? 'bg-white/10 text-white border border-white/20'
                                        : 'bg-white/[0.02] border border-white/10 text-slate-300 hover:bg-white/5'
                                }`}
                            >
                                Semua
                            </button>
                            {categories.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveFilter(String(c.id))}
                                    className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                                        activeFilter === String(c.id)
                                            ? 'bg-white/10 text-white border border-white/20'
                                            : 'bg-white/[0.02] border border-white/10 text-slate-300 hover:bg-white/5'
                                    }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pb-6">
                                {filtered.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col group hover:border-white/20 transition-all hover:bg-white/[0.04]"
                                    >
                                        <div className="aspect-square bg-slate-800/50 relative flex items-center justify-center border-b border-white/5 group/img overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                            <ProductImage
                                                src={item.image_path || null}
                                                alt={item.name}
                                                variant="full"
                                                className="group-hover/img:scale-105 transition-transform duration-300 absolute inset-0 !rounded-none"
                                            />
                                            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-medium text-slate-300 border border-white/10 z-20">
                                                {categories.find((c) => c.id === item.menu_category_id)?.name ?? 'Menu'}
                                            </div>
                                            {!item.is_available && (
                                                <div className="absolute inset-0 bg-black/50 z-30 flex items-center justify-center text-xs font-semibold text-red-300">
                                                    Habis
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-200 mb-1 leading-tight">
                                                    {item.name}
                                                </h3>
                                                <p className="text-xs font-mono font-medium text-emerald-400">
                                                    {formatRupiah(item.price)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-slate-300 text-xs font-medium transition-colors border border-transparent hover:border-blue-500/30"
                                                >
                                                    <Pencil className="size-3" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-xs font-medium transition-colors border border-transparent hover:border-red-500/30"
                                                >
                                                    <Trash2 className="size-3" /> Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div
                                onClick={openAdd}
                                className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] cursor-pointer hover:bg-white/[0.03] hover:border-white/20 transition-all text-slate-500 hover:text-white group"
                            >
                                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus className="size-5" />
                                </div>
                                <span className="text-sm font-medium">Tambah Menu Baru</span>
                            </div>
                        </div>
                    </Glass>
                </div>

                {showForm && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">
                                    {editing ? 'Edit Menu' : 'Tambah Menu'}
                                </h3>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                                    <X className="size-5" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                    placeholder="Nama menu"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                    placeholder="Deskripsi (opsional)"
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                                <input
                                    type="number"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                    placeholder="Harga"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                                />
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                    value={form.menu_category_id}
                                    onChange={(e) => setForm({ ...form, menu_category_id: Number(e.target.value) })}
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id} className="bg-slate-900">
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                    value={form.outlet_id}
                                    onChange={(e) => setForm({ ...form, outlet_id: e.target.value })}
                                >
                                    <option value="" className="bg-slate-900">
                                        Semua Outlet (global)
                                    </option>
                                    {outlets.map((o) => (
                                        <option key={o.id} value={o.id} className="bg-slate-900">
                                            {o.name}
                                        </option>
                                    ))}
                                </select>
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={form.is_available}
                                        onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                                    />
                                    Tersedia
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={form.is_popular}
                                        onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
                                    />
                                    Populer
                                </label>
                                <div className="flex items-center gap-3">
                                    <label className="flex-1 cursor-pointer flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300">
                                        <Upload className="size-4" /> Upload Foto
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    {form.photo && (
                                        <div className="size-12 rounded-lg overflow-hidden border border-white/10">
                                            <img
                                                src={form.photo}
                                                alt="preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-5">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2 rounded-lg bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={submit}
                                    disabled={processing}
                                    className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Screen>
        </MainLayout>
    );
}
