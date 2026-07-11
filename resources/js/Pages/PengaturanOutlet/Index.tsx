import { useState, ElementType, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, PlanBadge, TAX_LABELS, useTenantSettings } from '../../Components/Shared';
import { useSubscription } from '../../Hooks/useSubscription';
import {
    StoreIcon,
    MapPinIcon,
    ReceiptIcon,
    ClockIcon,
    LocateFixedIcon,
    PercentIcon,
    AlertTriangleIcon,
    ChefHatIcon,
    CoffeeIcon,
    WineIcon,
    FlameIcon,
    CakeIcon,
    PizzaIcon,
    ImageIcon,
    SparklesIcon,
    PlusIcon,
    Trash2Icon,
    Edit2Icon,
    CheckIcon,
    XIcon,
} from '../../Components/icons';

import { RoleGuard } from '../../Components/RoleGuard';
import { runLocalGeocoder } from '../../lib/geocoder';
import { TAB_SLUGS, SLUG_TO_TAB } from '../../lib/outletTabs';
import { serializeStruk, parseStruk } from '../../lib/strukConfig';
import { applyScreenMode, isScreenMode, type ScreenMode } from '../../lib/screenMode';

function PengaturanOutletInner() {
    const [activeTab, setActiveTab] = useState('Profil Outlet');
    const [taxType, setTaxType] = useState<'pbjt' | 'ppn'>('pbjt');
    const { plan } = useSubscription();
    const {
        tenantName,
        tenantLogo,
        tenantImage,
        saveSettings,
        tenantLayout,
        saveLayout,
        staffOwner,
        employees,
        saveEmployees,
    } = useTenantSettings();
    const { tenant, outlet, employees: dbEmployees } = usePage<any>().props;
    const [nameInput, setNameInput] = useState(tenantName);
    const [logoInput, setLogoInput] = useState(tenantLogo);
    const [imageInput, setImageInput] = useState<string | null>(tenantImage);
    const authUser = (usePage<any>().props as any)?.auth?.user;
    const [ownerInput, setOwnerInput] = useState(
        staffOwner && staffOwner !== 'LALU GUSTI' ? staffOwner : (authUser?.name ?? ''),
    );

    // CRUD States for Staff List
    const [employeesList, setEmployeesList] = useState<any[]>(dbEmployees || employees);
    const [newEmpName, setNewEmpName] = useState('');
    const [newEmpEmail, setNewEmpEmail] = useState('');
    const [newEmpPassword, setNewEmpPassword] = useState('');
    const [newEmpRole, setNewEmpRole] = useState<'' | 'cashier' | 'kitchen' | 'waiter' | 'admin'>('');
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState<'cashier' | 'kitchen' | 'waiter' | 'admin'>('waiter');
    const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

    // Address and geolocation states
    const [alamatInput, setAlamatInput] = useState('Jl. Braga No. 1, Bandung');
    const [latitudeInput, setLatitudeInput] = useState('-6.223847');
    const [longitudeInput, setLongitudeInput] = useState('106.808162');
    const [isFetchingGeo, setIsFetchingGeo] = useState(false);

    // ─── NEW: Outlet Profile States ───────────────────────────────────────────
    const [namaOutletInput, setNamaOutletInput] = useState('Pawon Salam - Bandung');
    const [teleponInput, setTeleponInput] = useState('021-1234-5678');
    const [npwpInput, setNpwpInput] = useState('01.234.567.8-012.000');
    const [nibInput, setNibInput] = useState('9120123456789');

    // ─── NEW: Tax & Service Charge States ─────────────────────────────────────
    const [isTaxActive, setIsTaxActive] = useState(true);
    const [taxRateInput, setTaxRateInput] = useState(10);
    const [serviceChargeInput, setServiceChargeInput] = useState(0);

    // ─── NEW: ReceiptIcon/Struk States ────────────────────────────────────────────
    const [strukHeader, setStrukHeader] = useState('Terima Kasih Telah Berkunjung!');
    const [strukFooter, setStrukFooter] = useState('Barang yang sudah dibeli tidak dapat ditukar');
    const [strukPaperWidth, setStrukPaperWidth] = useState('80mm');
    const [strukPreviewMode, setStrukPreviewMode] = useState<'transaksi' | 'dapur' | 'closing'>('transaksi');
    const [voidPolicy, setVoidPolicy] = useState<'audit_full' | 'zero_out' | 'manager_only'>('audit_full');

    // ─── NEW: Mode Screen UI State ────────────────────────────────────────────
    const [screenMode, setScreenMode] = useState<'terang' | 'gelap' | 'glassmorphic' | 'nano-banana'>('nano-banana');

    // ─── NEW: Jam Operasional States ──────────────────────────────────────────
    const [jamOperasional, setJamOperasional] = useState([
        { day: 'Senin', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Selasa', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Rabu', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Kamis', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Jumat', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Sabtu', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Minggu', isOpen: false, openTime: '10:00', closeTime: '21:00' },
    ]);

    // ─── URL Hash Tab Navigation (maps live in lib/outletTabs) ────────────────

    const handleTabChange = (label: string) => {
        setActiveTab(label);
        const slug = TAB_SLUGS[label] || 'profil';
        const url = new URL(window.location.href);
        url.searchParams.set('tab', slug);
        window.history.pushState({}, '', url.toString());
        const el = document.getElementById(slug);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // ─── Init from URL hash ────────────────────────────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && SLUG_TO_TAB[tab]) {
            setActiveTab(SLUG_TO_TAB[tab]);
            setTimeout(() => {
                const el = document.getElementById(tab);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, []);

    // ─── Load settings from DB (if available) with localStorage fallback ────────
    useEffect(() => {
        if (tenant) {
            setNameInput(tenant.brand_name || tenant.name || tenantName);
            setNpwpInput(tenant.npwp || '');
            setNibInput(tenant.nib || '');
            setAlamatInput(tenant.address || '');
            setTeleponInput(tenant.phone || '');
            if (tenant.tax_type) setTaxType(tenant.tax_type);
            setTaxRateInput(tenant.tax_type === 'ppn' ? tenant.ppn_rate : tenant.pbjt_rate);
            if (tenant.service_charge_rate !== undefined) setServiceChargeInput(tenant.service_charge_rate);
        } else {
            setNameInput(tenantName);
            const sNpwp = localStorage.getItem('outlet_npwp');
            if (sNpwp) setNpwpInput(sNpwp);
            const sNib = localStorage.getItem('outlet_nib');
            if (sNib) setNibInput(sNib);
            const sAlamat = localStorage.getItem('outlet_alamat');
            if (sAlamat) setAlamatInput(sAlamat);
            const sTelepon = localStorage.getItem('outlet_telepon');
            if (sTelepon) setTeleponInput(sTelepon);
            const sTaxType = localStorage.getItem('outlet_tax_type');
            if (sTaxType) setTaxType(sTaxType as 'pbjt' | 'ppn');
            const sTaxRate = localStorage.getItem('outlet_tax_rate');
            if (sTaxRate) setTaxRateInput(Number(sTaxRate));
            const sSvcCharge = localStorage.getItem('outlet_service_charge');
            if (sSvcCharge) setServiceChargeInput(Number(sSvcCharge));
        }

        if (outlet) {
            setNamaOutletInput(outlet.name || '');
            if (outlet.address) setAlamatInput(outlet.address);
            if (outlet.phone) setTeleponInput(outlet.phone);
            if (outlet.latitude) setLatitudeInput(String(outlet.latitude));
            if (outlet.longitude) setLongitudeInput(String(outlet.longitude));

            if (outlet.operating_hours && typeof outlet.operating_hours === 'object') {
                const dayMap: Record<string, string> = {
                    mon: 'Senin',
                    tue: 'Selasa',
                    wed: 'Rabu',
                    thu: 'Kamis',
                    fri: 'Jumat',
                    sat: 'Sabtu',
                    sun: 'Minggu',
                };
                const newJam = Object.entries(dayMap).map(([key, label]) => {
                    const val = outlet.operating_hours[key] || { open: '08:00', close: '22:00', closed: false };
                    return {
                        day: label,
                        isOpen: !val.closed,
                        openTime: val.open || '08:00',
                        closeTime: val.close || '22:00',
                    };
                });
                setJamOperasional(newJam);
            }
        } else {
            const sNama = localStorage.getItem('outlet_nama');
            if (sNama) setNamaOutletInput(sNama);
            const sLat = localStorage.getItem('outlet_latitude');
            if (sLat) setLatitudeInput(sLat);
            const sLng = localStorage.getItem('outlet_longitude');
            if (sLng) setLongitudeInput(sLng);
            const sJam = localStorage.getItem('outlet_jam_operasional');
            if (sJam) {
                try {
                    setJamOperasional(JSON.parse(sJam));
                } catch {
                    // ignore malformed jam operasional
                }
            }
        }

        if (dbEmployees && Array.isArray(dbEmployees)) {
            setEmployeesList(dbEmployees);
        } else {
            setEmployeesList(employees);
        }

        setLogoInput(tenantLogo);
        setImageInput(tenantImage);
        setOwnerInput(staffOwner);

        const sMode = localStorage.getItem('outlet_screen_mode');
        if (isScreenMode(sMode)) setScreenMode(sMode);
        else setScreenMode('nano-banana');
        const sTaxActive = localStorage.getItem('outlet_tax_active');
        if (sTaxActive !== null) setIsTaxActive(sTaxActive === 'true');
        const sStruk = localStorage.getItem('outlet_struk_config');
        const parsedStruk = parseStruk(sStruk);
        if (parsedStruk.headerText) setStrukHeader(parsedStruk.headerText);
        if (parsedStruk.footerText) setStrukFooter(parsedStruk.footerText);
        if (parsedStruk.paperWidth) setStrukPaperWidth(parsedStruk.paperWidth);
    }, [tenant, outlet, dbEmployees, tenantName, tenantLogo, tenantImage, staffOwner, employees]);

    // runLocalGeocoder() now lives in lib/geocoder (pure, unit-tested).
    const runLocalGeocoderFor = (address: string) => {
        const { lat, lng } = runLocalGeocoder(address);
        setLatitudeInput(lat);
        setLongitudeInput(lng);
    };

    const handleGeocodeAddress = (address: string) => {
        if (!address.trim()) return;
        setIsFetchingGeo(true);
        const apiKey = localStorage.getItem('gmaps_api_key') || '';

        if (apiKey) {
            fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
            )
                .then((res) => res.json())
                .then((data) => {
                    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
                        const loc = data.results[0].geometry.location;
                        setLatitudeInput(loc.lat.toFixed(6));
                        setLongitudeInput(loc.lng.toFixed(6));
                    } else {
                        runLocalGeocoderFor(address);
                    }
                })
                .catch((err) => {
                    console.warn('Google Geocoding failed, using local parser fallback', err);
                    runLocalGeocoderFor(address);
                })
                .finally(() => setIsFetchingGeo(false));
        } else {
            setTimeout(() => {
                runLocalGeocoderFor(address);
                setIsFetchingGeo(false);
            }, 700);
        }
    };

    const handleScreenModeChange = (mode: ScreenMode) => {
        setScreenMode(mode);
        localStorage.setItem('outlet_screen_mode', mode);
        applyScreenMode(mode, document.documentElement);
        window.dispatchEvent(new Event('storage'));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const size = 120;
                    canvas.width = size;
                    canvas.height = size;
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, size, size);
                        const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
                        setImageInput(webpDataUrl);
                    } else {
                        setImageInput(result);
                    }
                } catch (err) {
                    console.error('Canvas draw failed, falling back to direct base64', err);
                    setImageInput(result);
                }
            };
            img.onerror = () => {
                console.error('Failed to load image, setting direct base64');
                setImageInput(result);
            };
            img.src = result;
        };
        reader.readAsDataURL(file);
    };

    const handleAddEmployee = () => {
        if (!newEmpName.trim() || !newEmpEmail.trim() || !newEmpPassword.trim()) {
            alert('Nama, Email, dan Password wajib diisi.');
            return;
        }
        if (!newEmpRole) {
            alert('Pilih Role karyawan.');
            return;
        }
        router.post(
            '/api/outlet-settings/karyawan',
            {
                name: newEmpName.toUpperCase(),
                email: newEmpEmail,
                password: newEmpPassword,
                role: newEmpRole,
                outlet_id: outlet?.id ?? null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewEmpName('');
                    setNewEmpEmail('');
                    setNewEmpPassword('');
                },
                onError: (err: any) => {
                    alert('Gagal menambah karyawan: ' + JSON.stringify(err));
                },
            },
        );
    };

    const handleDeleteEmployee = (id: string | number) => {
        const emp = employeesList.find((e) => e.id === id);
        if (!emp) return;
        if (!window.confirm(`Hapus "${emp.name}" dari daftar karyawan?`)) return;
        router.delete(`/api/outlet-settings/karyawan/${id}`, {
            preserveScroll: true,
            onError: (err: any) => alert('Gagal menghapus karyawan: ' + JSON.stringify(err)),
        });
    };

    const handleStartEdit = (emp: any) => {
        setEditingId(emp.id);
        setEditName(emp.name);
        setEditEmail(emp.email || '');
        setEditPassword('');
        setEditRole(emp.role || 'waiter');
    };

    const handleSaveEdit = () => {
        if (!editName.trim() || !editEmail.trim()) {
            alert('Nama dan Email wajib diisi.');
            return;
        }
        router.put(
            `/api/outlet-settings/karyawan/${editingId}`,
            {
                name: editName.toUpperCase(),
                email: editEmail,
                password: editPassword || undefined,
                role: editRole,
                outlet_id: outlet?.id ?? null,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditingId(null),
                onError: (err: any) => alert('Gagal mengupdate karyawan: ' + JSON.stringify(err)),
            },
        );
    };

    const handleSaveAllChanges = () => {
        // Save to localStorage for backward compatibility with unmigrated POS components
        saveSettings(nameInput, logoInput, imageInput, ownerInput);
        if (Array.isArray(employeesList)) saveEmployees(employeesList);

        localStorage.setItem('outlet_nama', namaOutletInput);
        localStorage.setItem('outlet_telepon', teleponInput);
        localStorage.setItem('outlet_npwp', npwpInput);
        localStorage.setItem('outlet_nib', nibInput);
        localStorage.setItem('outlet_alamat', alamatInput);
        localStorage.setItem('outlet_latitude', latitudeInput);
        localStorage.setItem('outlet_longitude', longitudeInput);
        localStorage.setItem('outlet_screen_mode', screenMode);
        localStorage.setItem('outlet_tax_active', String(isTaxActive));
        localStorage.setItem('outlet_tax_type', taxType);
        localStorage.setItem('outlet_tax_rate', taxRateInput.toString());
        localStorage.setItem('outlet_service_charge', serviceChargeInput.toString());

        const strukConfig = serializeStruk({
            headerText: strukHeader,
            footerText: strukFooter,
            paperWidth: strukPaperWidth,
        });
        localStorage.setItem('outlet_struk_config', strukConfig);
        fetch('/api/receipt-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ header: strukHeader, footer: strukFooter, paperWidth: strukPaperWidth }),
        }).catch((err) => console.warn('[Struk] API sync failed (will use localStorage):', err));

        localStorage.setItem('outlet_jam_operasional', JSON.stringify(jamOperasional));
        window.dispatchEvent(new Event('storage'));

        // NEW: Save to Database API
        const reverseDayMap: Record<string, string> = {
            Senin: 'mon',
            Selasa: 'tue',
            Rabu: 'wed',
            Kamis: 'thu',
            Jumat: 'fri',
            Sabtu: 'sat',
            Minggu: 'sun',
        };
        const opHours: Record<string, any> = {};
        jamOperasional.forEach((j) => {
            const key = reverseDayMap[j.day] || 'mon';
            opHours[key] = { open: j.openTime || '08:00', close: j.closeTime || '22:00', closed: !j.isOpen };
        });

        router.put(
            '/api/outlet-settings/all',
            {
                profil: {
                    name: nameInput,
                    brand_name: nameInput,
                    email: tenant?.email || 'owner@restoku.id',
                    phone: teleponInput,
                    npwp: npwpInput,
                    nib: nibInput,
                    address: alamatInput,
                },
                lokasi: {
                    outlet_id: outlet?.id || 1,
                    name: namaOutletInput,
                    address: alamatInput,
                    phone: teleponInput,
                    latitude: Number(latitudeInput) || null,
                    longitude: Number(longitudeInput) || null,
                    geo_radius_meters: outlet?.geo_radius_meters || 50,
                },
                pajak: {
                    tax_type: taxType,
                    pbjt_rate: taxType === 'pbjt' ? Number(taxRateInput) : 0,
                    ppn_rate: taxType === 'ppn' ? Number(taxRateInput) : 0,
                    service_charge_rate: Number(serviceChargeInput),
                },
                jam: {
                    operating_hours: opHours,
                },
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSaveSuccessMsg(true);
                    setTimeout(() => setSaveSuccessMsg(false), 3000);
                },
                onError: (err: any) => {
                    console.error('Gagal menyimpan ke database:', err);
                    alert(
                        '⚠️ Pengaturan tersimpan secara lokal, namun gagal sync ke server database: ' +
                            JSON.stringify(err),
                    );
                },
            },
        );
    };

    const logoOptions = [
        { name: 'ChefHatIcon', label: 'Topi Chef', Icon: ChefHatIcon },
        { name: 'CoffeeIcon', label: 'Kopi & Cafe', Icon: CoffeeIcon },
        { name: 'WineIcon', label: 'Bar & Drinks', Icon: WineIcon },
        { name: 'FlameIcon', label: 'Grill & Steak', Icon: FlameIcon },
        { name: 'CakeIcon', label: 'Bakery', Icon: CakeIcon },
        { name: 'PizzaIcon', label: 'PizzaIcon', Icon: PizzaIcon },
    ];

    const isLight = screenMode === 'terang';
    const h2Class = `mb-5 text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-200'}`;
    const h3Class = `text-xs font-bold tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-slate-300'}`;
    const labelClass = `text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`;
    const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${isLight ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[var(--color-primary)] shadow-sm' : 'border-white/10 bg-white/5 text-slate-200 focus:border-emerald-500/30'}`;
    const descClass = `text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`;
    const selectClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-[var(--color-primary)] shadow-sm' : 'border-white/10 bg-white/5 text-slate-200 focus:border-emerald-500/30'}`;
    const cardRowClass = `flex items-center justify-between gap-3 border p-3 rounded-xl transition-colors ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 shadow-sm' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.02]'}`;
    const optionBtnClass = (active: boolean) =>
        `flex flex-col text-left rounded-xl border p-3 transition-all relative overflow-hidden group ${
            active
                ? isLight
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10/80 ring-1 ring-[var(--color-primary)]/40 shadow-sm'
                    : 'border-amber-500 bg-amber-500/[0.05] ring-1 ring-amber-500/40 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                : isLight
                  ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-sm'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
        }`;

    return (
        <MainLayout>
            <Head title="Pengaturan Outlet" />
            <Screen title="Pengaturan Outlet" action={<PlanBadge plan={plan} />}>
                <div className="grid grid-cols-[240px_1fr] gap-5 items-start">
                    <Glass className="p-3">
                        <div className="space-y-1">
                            {(
                                [
                                    { label: 'Profil Outlet', Icon: StoreIcon },
                                    { label: 'Lokasi Restoran', Icon: MapPinIcon },
                                    { label: 'Pajak & Tarif', Icon: PercentIcon },
                                    { label: 'Tampilan Struk', Icon: ReceiptIcon },
                                    { label: 'Jam Operasional', Icon: ClockIcon },
                                ] as Array<{ label: string; Icon: ElementType }>
                            ).map(({ label, Icon }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => handleTabChange(label)}
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors ${
                                        activeTab === label
                                            ? isLight
                                                ? 'bg-slate-900 text-white font-bold shadow-md'
                                                : 'bg-white/10 text-white font-bold'
                                            : isLight
                                              ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                                              : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                                    }`}
                                >
                                    <Icon className="size-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </Glass>
                    <div className="space-y-5">
                        {/* TAB 1: PROFIL OUTLET */}
                        <div id="profil" className="space-y-5">
                            {/* Tenant White-Label Branding Customization */}
                            <Glass className="p-6 border-emerald-500/10">
                                <h2 className={h2Class}>
                                    <SparklesIcon className="size-4 text-emerald-400" /> Branding Kustom Tenant
                                    (White-Label)
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
                                                        <span className="text-[9px] font-medium leading-none">
                                                            {label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Struktur Personil / Karyawan & PIN (CRUD Mode) */}
                                    <div
                                        className={`space-y-4 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <h3 className={h3Class}>Struktur & PIN Otorisasi Karyawan</h3>
                                            <div className="text-[10px] text-slate-500 font-medium">
                                                Mode CRUD Dinamis
                                            </div>
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
                                                                onChange={(e) => setEditRole(e.target.value as any)}
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
                                                                className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border shrink-0 w-20 text-center ${
                                                                    emp.role === 'cashier' || emp.role === 'kasir'
                                                                        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20 text-[var(--color-primary)]'
                                                                        : emp.role === 'kitchen'
                                                                          ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                                                          : emp.role === 'waiter'
                                                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                                }`}
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
                                                    onChange={(e) => setNewEmpRole(e.target.value as any)}
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

                            <Glass className="p-6">
                                <h2 className={h2Class}>Profil Outlet</h2>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Cabang Outlet</label>
                                        <input
                                            value={namaOutletInput}
                                            onChange={(e) => setNamaOutletInput(e.target.value)}
                                            placeholder="e.g. Bandung / Cabang Utama"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Telepon</label>
                                        <input
                                            value={teleponInput}
                                            onChange={(e) => setTeleponInput(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>NPWP</label>
                                        <input
                                            value={npwpInput}
                                            onChange={(e) => setNpwpInput(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>NIB</label>
                                        <input
                                            value={nibInput}
                                            onChange={(e) => setNibInput(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className={labelClass}>Alamat Lengkap</label>
                                            {isFetchingGeo && (
                                                <span className="text-[10px] text-emerald-500 animate-pulse font-medium">
                                                    🔄 Auto-fetching Google Maps...
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            value={alamatInput}
                                            onChange={(e) => setAlamatInput(e.target.value)}
                                            onBlur={() => handleGeocodeAddress(alamatInput)}
                                            placeholder="Masukkan alamat lengkap restoran Anda..."
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </Glass>

                            <Glass className="p-6">
                                <h2 className={h2Class}>
                                    <SparklesIcon className="size-4 text-emerald-500" /> Mode Screen UI (Tema Sistem &
                                    POS)
                                </h2>
                                <div className="space-y-4">
                                    <p className={descClass}>
                                        Pilih mode tampilan antarmuka (UI Screen) untuk dasbor admin, kasir POS, dan
                                        operasional outlet Anda.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            {
                                                id: 'nano-banana',
                                                name: 'Nano Banana',
                                                desc: 'WOW Cyber Gold',
                                                theme: 'bg-[#030712] border-amber-500/50 text-amber-400',
                                                preview: 'from-amber-500/20 via-[#030712] to-yellow-500/20',
                                            },
                                            {
                                                id: 'terang',
                                                name: 'Terang (Light)',
                                                desc: 'Bersih & Cerah',
                                                theme: 'bg-white border-slate-200 text-slate-800',
                                                preview: 'from-slate-100 to-white',
                                            },
                                            {
                                                id: 'gelap',
                                                name: 'Gelap (Dark)',
                                                desc: 'Mewah & Nyaman',
                                                theme: 'bg-slate-900 border-emerald-500/30 text-emerald-400',
                                                preview: 'from-slate-950 to-slate-900',
                                            },
                                            {
                                                id: 'glassmorphic',
                                                name: 'Glassmorphic',
                                                desc: 'Transparan & Futuristik',
                                                theme: 'bg-white/10 backdrop-blur-md border-white/20 text-white',
                                                preview: 'from-emerald-900/40 via-slate-900/60 to-purple-900/40',
                                            },
                                            {
                                                id: 'krem',
                                                name: 'Krem Hangat',
                                                desc: 'Warm & Cozy',
                                                theme: 'bg-[#ffe6c0] border-amber-300 text-amber-900',
                                                preview: 'from-[#fff3e0] via-[#ffe6c0] to-[#ffd99f]',
                                            },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => handleScreenModeChange(opt.id as any)}
                                                className={optionBtnClass(screenMode === opt.id)}
                                            >
                                                <div
                                                    className={`h-8 w-full rounded-lg bg-gradient-to-br ${opt.preview} border ${isLight ? 'border-slate-200' : 'border-white/5'} mb-2.5 flex items-center justify-center shadow-inner`}
                                                >
                                                    <span
                                                        className={`text-[9px] font-extrabold opacity-80 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
                                                    >
                                                        UI Mode
                                                    </span>
                                                </div>
                                                <div
                                                    className={`font-bold text-[11px] ${isLight ? 'text-slate-900' : 'text-slate-200'}`}
                                                >
                                                    {opt.name}
                                                </div>
                                                <div
                                                    className={`text-[9px] mt-0.5 leading-tight ${isLight ? 'text-slate-600' : 'text-slate-500'}`}
                                                >
                                                    {opt.desc}
                                                </div>

                                                {screenMode === opt.id && (
                                                    <div
                                                        className={`absolute top-1 right-1 size-2 rounded-full ${isLight ? 'bg-[var(--color-primary)]' : 'bg-amber-400'} animate-pulse`}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </Glass>

                            <Glass className="p-6">
                                <h2 className={h2Class}>
                                    <SparklesIcon className="size-4 text-emerald-500" /> Tampilan Frontend (Buku Menu
                                    Tamu)
                                </h2>
                                <div className="space-y-4">
                                    <p className={descClass}>
                                        Pilih tema tampilan e-menu yang sesuai dengan konsep restoran Anda. Perubahan
                                        akan langsung terlihat pada menu digital tamu.
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            {
                                                id: 'premium-dark',
                                                name: 'Premium Dark',
                                                desc: 'Gelap & Mewah',
                                                theme: 'bg-slate-900 border-emerald-500/30 text-emerald-400',
                                                preview: 'from-emerald-950 to-slate-950',
                                            },
                                            {
                                                id: 'minimalist-light',
                                                name: 'Minimalist Light',
                                                desc: 'Bersih & Terang',
                                                theme: 'bg-white border-slate-200 text-slate-800',
                                                preview: 'from-slate-100 to-white',
                                            },
                                            {
                                                id: 'warm-cozy',
                                                name: 'Warm Cozy',
                                                desc: 'Krem & Hangat',
                                                theme: 'bg-[#fcf8f2] border-amber-200 text-amber-900',
                                                preview: 'from-amber-100/50 to-[#fdfaf6]',
                                            },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => saveLayout(opt.id as any)}
                                                className={optionBtnClass(tenantLayout === opt.id)}
                                            >
                                                {/* Theme mini preview block */}
                                                <div
                                                    className={`h-8 w-full rounded-lg bg-gradient-to-br ${opt.preview} border ${isLight ? 'border-slate-200' : 'border-white/5'} mb-2.5 flex items-center justify-center`}
                                                >
                                                    <span
                                                        className={`text-[8px] font-bold opacity-80 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
                                                    >
                                                        Aa
                                                    </span>
                                                </div>
                                                <div
                                                    className={`font-bold text-[11px] ${isLight ? 'text-slate-900' : 'text-slate-200'}`}
                                                >
                                                    {opt.name}
                                                </div>
                                                <div
                                                    className={`text-[9px] mt-0.5 leading-tight ${isLight ? 'text-slate-600' : 'text-slate-500'}`}
                                                >
                                                    {opt.desc}
                                                </div>

                                                {tenantLayout === opt.id && (
                                                    <div
                                                        className={`absolute top-1 right-1 size-2 rounded-full ${isLight ? 'bg-[var(--color-primary)]' : 'bg-emerald-500'}`}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </Glass>
                        </div>

                        {/* TAB 2: LOKASI RESTORAN */}
                        <div id="lokasi" className="space-y-5">
                            <Glass className="p-6">
                                <h2 className={h2Class}>
                                    <MapPinIcon className="size-4 text-emerald-500" /> Lokasi Restoran (Geolokasi)
                                </h2>
                                <div className="space-y-4">
                                    <p className={descClass}>
                                        Tentukan koordinat GPS restoran untuk mencegah order fiktif dari luar area
                                        restoran (misalnya pesanan dine-in palsu dari jarak jauh).
                                    </p>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <label className={labelClass}>Latitude</label>
                                                <span className="text-[9px] text-slate-500 font-semibold">
                                                    (Auto-filled)
                                                </span>
                                            </div>
                                            <input
                                                id="geo-lat"
                                                value={latitudeInput}
                                                onChange={(e) => setLatitudeInput(e.target.value)}
                                                className={`font-mono ${inputClass}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <label className={labelClass}>Longitude</label>
                                                <span className="text-[9px] text-slate-500 font-semibold">
                                                    (Auto-filled)
                                                </span>
                                            </div>
                                            <input
                                                id="geo-lng"
                                                value={longitudeInput}
                                                onChange={(e) => setLongitudeInput(e.target.value)}
                                                className={`font-mono ${inputClass}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <label className={labelClass}>Radius Toleransi (Meter)</label>
                                            <input type="number" defaultValue="50" className={inputClass} />
                                            <p
                                                className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}
                                            >
                                                Radius 50 meter disarankan untuk restoran di dalam mall.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => {
                                                if (navigator.geolocation) {
                                                    navigator.geolocation.getCurrentPosition(
                                                        (pos) => {
                                                            setLatitudeInput(pos.coords.latitude.toString());
                                                            setLongitudeInput(pos.coords.longitude.toString());
                                                        },
                                                        () => alert('Gagal mengambil lokasi.'),
                                                    );
                                                }
                                            }}
                                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
                                        >
                                            <LocateFixedIcon className="size-4" /> Deteksi Otomatis
                                        </button>
                                        <button
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isLight ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm' : 'bg-slate-100 hover:bg-white text-slate-900'}`}
                                        >
                                            Simpan Lokasi
                                        </button>
                                    </div>
                                </div>
                            </Glass>
                        </div>

                        {/* TAB 3: PAJAK & TARIF */}
                        <div id="pajak" className="space-y-5">
                            <Glass className="p-6">
                                <h2 className={h2Class}>
                                    <PercentIcon className="size-4 text-[var(--color-primary)]" /> Konfigurasi Pajak &
                                    Biaya
                                </h2>

                                {/* Referensi Regulasi Pemerintah */}
                                <div
                                    className={`mb-5 rounded-xl border p-4 space-y-2 ${isLight ? 'border-emerald-300 bg-emerald-50' : 'border-emerald-500/20 bg-emerald-500/5'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}
                                        >
                                            <SparklesIcon className="size-3.5 text-emerald-500" /> Referensi Regulasi
                                            Perpajakan Restoran (Indonesia)
                                        </span>
                                        <span
                                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${isLight ? 'bg-emerald-200/80 text-emerald-900 border-emerald-400 font-bold' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}
                                        >
                                            UU HKPD No. 1/2022
                                        </span>
                                    </div>
                                    <p
                                        className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                                    >
                                        Berdasarkan{' '}
                                        <strong className={isLight ? 'text-slate-950' : 'text-white'}>
                                            UU No. 1 Tahun 2022 (HKPD) Pasal 53 & 58
                                        </strong>
                                        , makanan dan/atau minuman yang disediakan oleh restoran, kafe, atau rumah makan
                                        merupakan objek{' '}
                                        <strong className={isLight ? 'text-emerald-700 font-bold' : 'text-emerald-300'}>
                                            PBJT (Pajak Barang dan Jasa Tertentu)
                                        </strong>{' '}
                                        yang dipungut Pemerintah Daerah dengan tarif maksimal{' '}
                                        <strong className={isLight ? 'text-slate-950' : 'text-white'}>10%</strong>. PBJT
                                        dikecualikan dari PPN (UU HPP) untuk mencegah pajak ganda.{' '}
                                        <strong
                                            className={
                                                isLight
                                                    ? 'text-[var(--color-primary)] font-bold'
                                                    : 'text-[var(--color-primary)]'
                                            }
                                        >
                                            Service Charge
                                        </strong>{' '}
                                        diatur secara terpisah sebagai biaya layanan usaha restoran.
                                    </p>
                                </div>

                                {/* Status Penerapan Pajak (Capsule Switch Active - Inactive) */}
                                <div
                                    className={`mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'}`}
                                >
                                    <div className="space-y-1">
                                        <div
                                            className={`text-xs font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}
                                        >
                                            Status Penerapan Pajak & Tarif di POS
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isTaxActive ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'}`}
                                            >
                                                {isTaxActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                            Jika Inactive, perhitungan pajak (PBJT/PPN) & service charge dinonaktifkan
                                            (0%) pada seluruh transaksi POS kasir dan cetak struk.
                                        </p>
                                    </div>

                                    {/* Tombol Switch Kapsul Active - Inactive */}
                                    <div
                                        className={`flex items-center p-1 rounded-full border shrink-0 shadow-inner ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-[#0c0c0c] border-white/10'}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setIsTaxActive(true)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                isTaxActive
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <CheckIcon className="size-3.5" /> Active
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsTaxActive(false)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                !isTaxActive
                                                    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md shadow-rose-500/20 scale-[1.02]'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <XIcon className="size-3.5" /> Inactive
                                        </button>
                                    </div>
                                </div>

                                <div
                                    className={`space-y-5 transition-all ${!isTaxActive ? 'opacity-40 pointer-events-none' : ''}`}
                                >
                                    <div>
                                        <label className={`${labelClass} block mb-2`}>Jenis Pajak</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => {
                                                    setTaxType('pbjt');
                                                    setTaxRateInput(10);
                                                }}
                                                className={`rounded-lg border px-4 py-3 text-sm font-medium text-left transition-colors ${taxType === 'pbjt' ? (isLight ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] shadow-sm' : 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/40 text-[var(--color-primary)]') : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                            >
                                                <div className="font-semibold">PBJT</div>
                                                <div className="text-xs mt-0.5 opacity-70">Pajak Restoran (Daerah)</div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setTaxType('ppn');
                                                    setTaxRateInput(11);
                                                }}
                                                className={`rounded-lg border px-4 py-3 text-sm font-medium text-left transition-colors ${taxType === 'ppn' ? (isLight ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] shadow-sm' : 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/40 text-[var(--color-primary)]') : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                            >
                                                <div className="font-semibold">PPN 11%</div>
                                                <div className="text-xs mt-0.5 opacity-70">
                                                    Untuk PKP (Omzet &gt;Rp4,8M)
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className={labelClass}>{TAX_LABELS[taxType]} (%)</label>
                                            <input
                                                type="number"
                                                value={taxRateInput}
                                                onChange={(e) => setTaxRateInput(Number(e.target.value))}
                                                min={0}
                                                max={taxType === 'ppn' ? 11 : 10}
                                                className={inputClass}
                                            />
                                            <p
                                                className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}
                                            >
                                                {taxType === 'pbjt'
                                                    ? 'Tarif PBJT daerah: 0–10%. Cek peraturan daerah Anda.'
                                                    : 'PPN 11% sesuai UU HPP.'}
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={labelClass}>Service Charge (%)</label>
                                            <input
                                                type="number"
                                                value={serviceChargeInput}
                                                onChange={(e) => setServiceChargeInput(Number(e.target.value))}
                                                min={0}
                                                max={5}
                                                className={inputClass}
                                            />
                                            <p
                                                className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}
                                            >
                                                Opsional. 0–5%. Bukan pajak, adalah pendapatan restoran.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Real-time tax calculation preview */}
                                <div
                                    className={`mt-5 rounded-xl border p-4 transition-all ${isTaxActive ? (isLight ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-primary)]/10 bg-[var(--color-primary)]/5') : isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-500/10 bg-slate-500/5'}`}
                                >
                                    <p
                                        className={`text-xs font-medium mb-1 flex items-center gap-1.5 ${isTaxActive ? (isLight ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary)]') : 'text-slate-500'}`}
                                    >
                                        <AlertTriangleIcon className="size-3.5" /> Contoh kalkulasi struk (
                                        {isTaxActive ? 'Pajak & Layanan Aktif' : 'Pajak & Layanan Inactive'})
                                    </p>
                                    <p
                                        className={`text-xs ${isTaxActive ? (isLight ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary)]/70') : 'text-slate-500'}`}
                                    >
                                        Subtotal Rp 100.000
                                        {isTaxActive ? (
                                            <>
                                                {' → '} {TAX_LABELS[taxType]} {taxRateInput}% = Rp{' '}
                                                {((100000 * taxRateInput) / 100).toLocaleString('id-ID')}
                                                {serviceChargeInput > 0 &&
                                                    ` + Service Charge ${serviceChargeInput}% = Rp ${((100000 * serviceChargeInput) / 100).toLocaleString('id-ID')}`}
                                                {' → '} Total Rp{' '}
                                                {(
                                                    100000 *
                                                    (1 + taxRateInput / 100 + serviceChargeInput / 100)
                                                ).toLocaleString('id-ID')}
                                            </>
                                        ) : (
                                            <>{' → Pajak & Service Charge Inactive (0%) → '} Total Rp 100.000</>
                                        )}
                                    </p>
                                </div>
                                <p
                                    className={`mt-4 text-[11px] flex items-center gap-1 ${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}`}
                                >
                                    ✓ Data pajak & status aktivasi ini digunakan oleh POS untuk kalkulasi total
                                    transaksi.
                                </p>
                            </Glass>
                        </div>

                        {/* TAB 4: TAMPILAN STRUK */}
                        <div id="struk" className="space-y-5">
                            <Glass className="p-6">
                                <h2 className={h2Class}>
                                    <ReceiptIcon className="size-4 text-emerald-500" /> Pengaturan Tampilan Struk
                                </h2>
                                <p className={`${descClass} mb-5`}>
                                    Kustomisasi informasi header dan footer yang tercetak pada struk pembelian
                                    pelanggan.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className={labelClass}>Header Struk (Pesan Selamat Datang)</label>
                                            <input
                                                value={strukHeader}
                                                onChange={(e) => setStrukHeader(e.target.value)}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={labelClass}>Footer Struk (Pesan Penutup)</label>
                                            <input
                                                value={strukFooter}
                                                onChange={(e) => setStrukFooter(e.target.value)}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={labelClass}>Lebar Kertas Struk</label>
                                            <select
                                                value={strukPaperWidth}
                                                onChange={(e) => setStrukPaperWidth(e.target.value)}
                                                className={selectClass}
                                            >
                                                <option value="58mm">58mm (Kecil)</option>
                                                <option value="80mm">80mm (Standar POS)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label
                                                className={`text-xs font-medium flex items-center gap-1.5 ${isLight ? 'text-emerald-800 font-bold' : 'text-emerald-400'}`}
                                            >
                                                <span>🛡️ Kebijakan Keamanan & Struk Void</span>
                                            </label>
                                            <select
                                                value={voidPolicy}
                                                onChange={(e) => setVoidPolicy(e.target.value as any)}
                                                className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors shadow-sm font-medium ${isLight ? 'border border-emerald-400 bg-emerald-50/50 text-emerald-950 focus:border-emerald-600 focus:bg-white' : 'border border-emerald-500/30 bg-[#0c0c0c] text-emerald-300 focus:border-emerald-500'}`}
                                            >
                                                <option value="audit_full">
                                                    🛡️ Wajib Otorisasi Manager & Tampilkan Item Void (Audit Full)
                                                </option>
                                                <option value="zero_out">
                                                    📑 Nol-kan / Sembunyikan Item Void pada Struk Pelanggan (Zero-Out)
                                                </option>
                                                <option value="manager_only">
                                                    🔒 Kunci Total Fitur Void Kasir (Manager Only via Dasbor)
                                                </option>
                                            </select>
                                        </div>
                                        <p
                                            className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}`}
                                        >
                                            ✓ Konfigurasi disimpan via tombol "Simpan Semua Perubahan" & disinkronkan ke
                                            API.
                                        </p>
                                    </div>

                                    {/* Visual receipt mockup container with switch selector */}
                                    <div className="space-y-3.5">
                                        <div
                                            className={`flex items-center justify-between p-1 rounded-xl border shadow-inner gap-1 ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-[#0c0c0c] border-white/10'}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setStrukPreviewMode('transaksi')}
                                                className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                                    strukPreviewMode === 'transaksi'
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-bold scale-[1.01]'
                                                        : isLight
                                                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                                                          : 'text-slate-400 hover:text-slate-200'
                                                }`}
                                            >
                                                <ReceiptIcon className="size-3.5 shrink-0" /> Struk Pelanggan
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStrukPreviewMode('dapur')}
                                                className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                                    strukPreviewMode === 'dapur'
                                                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-bold scale-[1.01]'
                                                        : isLight
                                                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                                                          : 'text-slate-400 hover:text-slate-200'
                                                }`}
                                            >
                                                <ChefHatIcon className="size-3.5 shrink-0" /> Tiket Dapur (KDS)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStrukPreviewMode('closing')}
                                                className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                                    strukPreviewMode === 'closing'
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-bold scale-[1.01]'
                                                        : isLight
                                                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                                                          : 'text-slate-400 hover:text-slate-200'
                                                }`}
                                            >
                                                <ClockIcon className="size-3.5 shrink-0" /> Laporan Shift
                                            </button>
                                        </div>

                                        {strukPreviewMode === 'transaksi' ? (
                                            <div className="bg-[#fafafa] text-slate-950 p-5 rounded-2xl border border-slate-200 font-mono text-[11px] space-y-2 shadow-xl animate-fadeIn leading-relaxed select-none">
                                                {/* Header */}
                                                <div className="text-center space-y-0.5">
                                                    <div className="font-bold text-sm">
                                                        {nameInput || tenantName || 'Pawon Salam'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-700 px-2 leading-tight">
                                                        {alamatInput || 'Jl. Pertanian No. 57, Lebak Bulus, Jak-Sel'}
                                                    </div>
                                                    {teleponInput && (
                                                        <div className="text-[10px] text-slate-700">
                                                            WA: {teleponInput}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-b border-dashed border-slate-400 my-1" />

                                                {/* Metadata */}
                                                <div className="text-[10px] space-y-0.5">
                                                    <div className="flex">
                                                        <span className="w-14">Tgl</span>
                                                        <span>
                                                            :{' '}
                                                            {new Date().toLocaleDateString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'numeric',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="w-14">Jam</span>
                                                        <span>
                                                            :{' '}
                                                            {new Date().toLocaleTimeString('id-ID', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}{' '}
                                                            WIB
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="w-14">No</span>
                                                        <span>: #MP9S13Z4</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="w-14">Kasir</span>
                                                        <span>
                                                            :{' '}
                                                            {(employeesList || []).find(
                                                                (e) =>
                                                                    e.role?.toLowerCase() === 'kasir' ||
                                                                    e.role?.toLowerCase() === 'manager',
                                                            )?.name ||
                                                                ownerInput ||
                                                                'Verena'}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="w-14">Meja</span>
                                                        <span>: Meja 5 (DINE-IN)</span>
                                                    </div>
                                                </div>
                                                <div className="border-b border-dashed border-slate-400 my-1" />

                                                {/* Column Header */}
                                                <div className="flex justify-between font-bold text-[10px] uppercase">
                                                    <span className="flex-1">Item</span>
                                                    <span className="w-8 text-center">Qty</span>
                                                    <span className="w-16 text-right">Harga</span>
                                                    <span className="w-16 text-right">Total</span>
                                                </div>
                                                <div className="border-b border-dashed border-slate-400 my-1" />

                                                {/* Items */}
                                                <div className="space-y-1.5 text-[10px]">
                                                    <div>
                                                        <div className="flex justify-between font-bold">
                                                            <span className="flex-1 truncate">BAKMI GORENG JAWA</span>
                                                            <span className="w-8 text-center">1</span>
                                                            <span className="w-16 text-right">24.000</span>
                                                            <span className="w-16 text-right">24.000</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between font-bold">
                                                            <span className="flex-1 truncate">NASI GORENG KAMPUNG</span>
                                                            <span className="w-8 text-center">1</span>
                                                            <span className="w-16 text-right">31.000</span>
                                                            <span className="w-16 text-right">31.000</span>
                                                        </div>
                                                    </div>
                                                    {voidPolicy === 'audit_full' ? (
                                                        <div className="bg-rose-50/90 p-1 rounded border border-rose-300 mt-1 space-y-0.5 animate-fadeIn">
                                                            <div className="flex justify-between text-rose-600 line-through text-[9px] font-bold">
                                                                <span className="flex-1 truncate">
                                                                    [VOID] ES JERUK NIPIS
                                                                </span>
                                                                <span className="w-8 text-center">1</span>
                                                                <span className="w-16 text-right">15.000</span>
                                                                <span className="w-16 text-right">-15.000</span>
                                                            </div>
                                                            <div className="text-[8px] bg-white text-slate-700 px-1 py-0.5 rounded font-mono border border-slate-300 w-fit font-bold">
                                                                🔒 Auth: SITI MANAGER (PIN Verified)
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <div className="border-b border-dashed border-slate-400 my-1" />

                                                {/* Totals */}
                                                <div className="space-y-1 text-[10px]">
                                                    <div className="flex justify-between">
                                                        <span>Subtotal:</span>
                                                        <span>{voidPolicy === 'audit_full' ? '70.000' : '55.000'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Diskon (20%):</span>
                                                        <span>-10.000</span>
                                                    </div>
                                                    {voidPolicy === 'audit_full' && (
                                                        <div className="flex justify-between text-rose-600 font-semibold">
                                                            <span>Potongan Item Void:</span>
                                                            <span>-15.000</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between font-bold text-[11px] pt-0.5">
                                                        <span>TOTAL:</span>
                                                        <span>{voidPolicy === 'audit_full' ? '45.000' : '45.000'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Metode:</span>
                                                        <span>QRIS</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Bayar:</span>
                                                        <span>{voidPolicy === 'audit_full' ? '45.000' : '45.000'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Kembali:</span>
                                                        <span>0</span>
                                                    </div>
                                                </div>
                                                <div className="border-b border-dashed border-slate-400 my-1" />

                                                {/* Dynamic Security Policy Badge Banner */}
                                                {voidPolicy === 'audit_full' && (
                                                    <div className="bg-rose-50 border border-rose-300 p-1.5 rounded text-[8px] text-rose-900 space-y-0.5 leading-tight font-sans shadow-sm animate-fadeIn">
                                                        <div className="font-bold flex items-center gap-1 text-rose-700 text-[9px]">
                                                            <span>🛡️ MODE VOID: AUDIT FULL (TAMPIL)</span>
                                                        </div>
                                                        <div>
                                                            Item pembatalan/void tetap dicantumkan dengan coretan merah
                                                            pada struk pelanggan beserta bukti otorisasi Manager untuk
                                                            transparansi total.
                                                        </div>
                                                    </div>
                                                )}
                                                {voidPolicy === 'zero_out' && (
                                                    <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)] p-1.5 rounded text-[8px] text-[var(--color-primary)] space-y-0.5 leading-tight font-sans shadow-sm animate-fadeIn">
                                                        <div className="font-bold flex items-center gap-1 text-[var(--color-primary)] text-[9px]">
                                                            <span>📑 MODE VOID: ZERO-OUT (NOL-KAN)</span>
                                                        </div>
                                                        <div>
                                                            Item yang dibatalkan disembunyikan total (dinolkan) dari
                                                            cetakan struk pelanggan agar struk tetap bersih, rapi, dan
                                                            tanpa jejak pembatalan.
                                                        </div>
                                                    </div>
                                                )}
                                                {voidPolicy === 'manager_only' && (
                                                    <div className="bg-amber-50 border border-amber-300 p-1.5 rounded text-[8px] text-amber-900 space-y-0.5 leading-tight font-sans shadow-sm animate-fadeIn">
                                                        <div className="font-bold flex items-center gap-1 text-amber-800 text-[9px]">
                                                            <span>🔒 MODE VOID: KUNCI POS (MANAGER ONLY)</span>
                                                        </div>
                                                        <div>
                                                            Tombol void dikunci total di layar Kasir POS. Pembatalan
                                                            pesanan hanya dapat dieksekusi oleh Manager atau Owner
                                                            melalui Dasbor Pusat.
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="border-b border-dashed border-slate-400 my-1" />

                                                {/* Footer */}
                                                <div className="text-center text-[10px] space-y-0.5 pt-1">
                                                    {strukHeader && (
                                                        <div className="font-semibold mb-1">{strukHeader}</div>
                                                    )}
                                                    <div className="font-bold leading-tight whitespace-pre-line">
                                                        {strukFooter ||
                                                            'Dukung UMKM Indonesia\nTulang Punggung Ekonomi Nasional'}
                                                    </div>
                                                    <div className="text-[8px] text-slate-400 mt-1">
                                                        Powered by Restoku OS · {strukPaperWidth}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : strukPreviewMode === 'dapur' ? (
                                            <div className="bg-[#fafafa] text-slate-950 p-5 rounded-2xl border border-slate-200 font-mono text-[11px] space-y-2 shadow-xl animate-fadeIn leading-relaxed select-none">
                                                <div className="text-center">
                                                    <div className="font-bold text-sm tracking-wider uppercase">
                                                        *** STRUK DAPUR ***
                                                    </div>
                                                </div>
                                                <div className="border-b border-dashed border-slate-400 my-1" />

                                                {/* Kitchen Metadata */}
                                                <div className="text-[11px] space-y-0.5 font-bold">
                                                    <div className="flex">
                                                        <span className="w-16">TIPE</span>
                                                        <span>: DINE-IN</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="w-16">Meja</span>
                                                        <span>: Meja 5 (A3)</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="w-16">Jam</span>
                                                        <span>
                                                            :{' '}
                                                            {new Date().toLocaleTimeString('id-ID', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                second: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="w-16">Order</span>
                                                        <span>: #MP9S13Z4</span>
                                                    </div>
                                                </div>
                                                <div className="border-b border-dashed border-slate-400 my-1" />

                                                {/* Kitchen Items & Chef Notes */}
                                                <div className="space-y-3 font-bold text-[11px]">
                                                    <div>
                                                        <div className="text-xs">1x BAKMI GORENG JAWA</div>
                                                        <div className="text-[10px] bg-amber-100 text-amber-950 p-1.5 rounded border border-amber-300 font-semibold mt-1 flex items-start gap-1">
                                                            <span>👨‍🍳</span>
                                                            <span>
                                                                Pesan Chef: Pedas Level 3, No Timun, Jangan Terlalu
                                                                Berminyak
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs">2x ES TEH MANIS</div>
                                                        <div className="text-[10px] bg-slate-200 text-slate-900 p-1.5 rounded border border-slate-300 font-semibold mt-1 flex items-start gap-1">
                                                            <span>📝</span>
                                                            <span>Pesan: Es Dipisah, Gula Sedikit Saja</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs">1x AYAM BAKAR MADU</div>
                                                        <div className="text-[10px] bg-amber-100 text-amber-950 p-1.5 rounded border border-amber-300 font-semibold mt-1 flex items-start gap-1">
                                                            <span>👨‍🍳</span>
                                                            <span>Pesan Chef: Bagian Dada, Sambal Dipisah</span>
                                                        </div>
                                                    </div>

                                                    {voidPolicy === 'audit_full' && (
                                                        <div className="border-t border-dashed border-slate-400 pt-2 mt-2">
                                                            <div className="flex items-center justify-between text-slate-900 line-through text-[10px] bg-rose-100 p-1.5 rounded border border-rose-300 font-normal">
                                                                <span className="font-bold text-rose-800">
                                                                    [VOID / BATAL] 1x Es Jeruk Nipis
                                                                </span>
                                                                <span className="text-[8px] uppercase font-bold text-rose-900">
                                                                    (POS Auth: SITI MANAGER)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {voidPolicy === 'zero_out' && (
                                                        <div className="border-t border-dashed border-slate-400 pt-2 mt-2">
                                                            <div className="flex items-center justify-between text-slate-900 line-through text-[10px] bg-[var(--color-primary)]/10 p-1.5 rounded border border-[var(--color-primary)] font-normal">
                                                                <span className="font-bold text-[var(--color-primary)]">
                                                                    [VOID ZERO-OUT] 1x Es Jeruk Nipis
                                                                </span>
                                                                <span className="text-[8px] uppercase font-bold text-[var(--color-primary)]">
                                                                    (Stop Masak - Disembunyikan di Tamu)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {voidPolicy === 'manager_only' && (
                                                        <div className="border-t border-dashed border-slate-400 pt-2 mt-2">
                                                            <div className="flex items-center justify-between text-slate-900 line-through text-[10px] bg-amber-100 p-1.5 rounded border border-amber-300 font-normal">
                                                                <span className="font-bold text-amber-900">
                                                                    [VOID BY MANAGER] 1x Es Jeruk Nipis
                                                                </span>
                                                                <span className="text-[8px] uppercase font-bold text-amber-900">
                                                                    (Otorisasi Dasbor Pusat)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-b border-dashed border-slate-400 my-1.5" />

                                                {/* Global Chef Order Message */}
                                                <div className="bg-slate-900 text-white p-3 rounded-lg border-2 border-slate-900 font-mono shadow-md">
                                                    <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <span>🔔 PESAN UTAMA UNTUK CHEF / DAPUR:</span>
                                                    </div>
                                                    <div className="text-[11px] font-bold leading-snug uppercase tracking-wide">
                                                        *** TOLONG HIDANGAN ANAK DIKELUARKAN DULUAN, PASTIKAN TIDAK
                                                        PEDAS & TIDAK ASIN ***
                                                    </div>
                                                </div>
                                                <div className="border-b border-dashed border-slate-400 my-1" />

                                                <div className="text-center text-[9px] text-slate-700 space-y-0.5 pt-0.5">
                                                    <div className="font-bold">
                                                        Server:{' '}
                                                        {(employeesList || []).find(
                                                            (e) =>
                                                                e.role?.toLowerCase() === 'pelayan' ||
                                                                e.role?.toLowerCase() === 'waiter',
                                                        )?.name || 'Budi (Waiters)'}
                                                    </div>
                                                    <div className="italic text-[8px] text-slate-500">
                                                        Struk tercetak otomatis dari sistem POS ke Printer Dapur
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-[#fafafa] text-slate-950 p-5 rounded-2xl border border-slate-200 font-mono text-[10px] space-y-2.5 shadow-xl leading-relaxed animate-fadeIn">
                                                <div className="text-center space-y-0.5">
                                                    <div className="font-bold text-sm">
                                                        {nameInput || tenantName || 'Pawon Salam'}
                                                    </div>
                                                    <div className="text-[9px] text-slate-600 px-2 leading-tight">
                                                        {alamatInput ||
                                                            'Ruko Beryl Commercial, Summarecon, Jl. Bulevar Selatan No.78, Bandung'}
                                                    </div>
                                                </div>

                                                <div className="pt-2 space-y-1 text-center">
                                                    <div className="font-bold tracking-wider text-[11px]">
                                                        LAPORAN SHIFT
                                                    </div>
                                                    <div className="text-slate-600 text-[9px]">
                                                        status: ditutup / rekap selesai
                                                    </div>
                                                    <div className="bg-slate-200/80 p-1.5 rounded-lg border border-slate-300 text-slate-800 font-medium text-[9px] mt-1 flex justify-between items-center shadow-sm">
                                                        <span className="text-slate-600">Waktu Cetak:</span>
                                                        <span className="font-bold">
                                                            {new Date().toLocaleDateString('id-ID', {
                                                                weekday: 'short',
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}{' '}
                                                            ·{' '}
                                                            {new Date().toLocaleTimeString('id-ID', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}{' '}
                                                            WIB
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 pt-1 border-t border-dashed border-slate-300">
                                                    <div className="flex justify-between items-center">
                                                        <span>Kasir Bertugas</span>
                                                        <span className="font-bold uppercase bg-slate-200 px-1.5 py-0.5 rounded text-[9px]">
                                                            {(employeesList || []).find(
                                                                (e) =>
                                                                    e.role?.toLowerCase() === 'kasir' ||
                                                                    e.role?.toLowerCase() === 'manager',
                                                            )?.name ||
                                                                ownerInput ||
                                                                'MARIO'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-slate-600">Mulai Shift</span>
                                                        <span className="text-right font-medium">
                                                            {new Date().toLocaleDateString('id-ID', {
                                                                weekday: 'short',
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                            <br />
                                                            <span className="text-slate-600 font-normal">
                                                                Jam 09:18:00 WIB
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-slate-600">Selesai Shift</span>
                                                        <span className="text-right font-medium">
                                                            {new Date().toLocaleDateString('id-ID', {
                                                                weekday: 'short',
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                            <br />
                                                            <span className="text-slate-600 font-normal">
                                                                Jam 18:30:00 WIB
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between font-semibold pt-1 border-t border-slate-200">
                                                        <span>Jumlah Pengunjung</span>
                                                        <span>6 Orang</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-0.5 pt-1 border-t border-dashed border-slate-300">
                                                    <div className="flex justify-between">
                                                        <span>Terjual item</span>
                                                        <span>15 item</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Terjual porsi</span>
                                                        <span>43 porsi</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-0.5 pt-1 border-t border-dashed border-slate-300">
                                                    <div className="flex justify-between font-semibold">
                                                        <span>Total Penjualan (Gross)</span>
                                                        <span>Rp 835.000</span>
                                                    </div>
                                                    <div className="flex justify-between text-emerald-700 font-medium">
                                                        <span>Diskon Promo / Voucher (5 trx)</span>
                                                        <span>-Rp 51.750</span>
                                                    </div>
                                                    <div className="flex justify-between text-rose-600 font-medium">
                                                        <span>Transaksi Void (2 bill / 3 item)</span>
                                                        <span>-Rp 45.000</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold pt-1 border-t border-slate-300 text-[11px]">
                                                        <span>Penjualan Bersih (Net)</span>
                                                        <span>Rp 738.250</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 pt-1.5 border-t border-dashed border-slate-300">
                                                    <div className="font-bold text-[9px] uppercase text-slate-900 flex items-center justify-between">
                                                        <span>🛡️ Audit Keamanan Void</span>
                                                        <span className="bg-emerald-200 text-emerald-950 px-1 py-0.5 rounded text-[8px] font-bold">
                                                            100% AUTHORIZED
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[9px]">
                                                        <span className="text-slate-600">Otorisasi Manager:</span>
                                                        <span className="font-semibold text-slate-900">
                                                            SITI MANAGER (#8821)
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[9px]">
                                                        <span className="text-slate-600">Kebijakan Struk:</span>
                                                        <span className="font-semibold text-slate-900">
                                                            {voidPolicy === 'zero_out'
                                                                ? 'Zero-Out Struk Pelanggan'
                                                                : voidPolicy === 'manager_only'
                                                                  ? 'Strict Lockout POS'
                                                                  : 'Audit Full (Tampil)'}
                                                        </span>
                                                    </div>
                                                    <div className="bg-amber-100/90 border border-amber-400 p-1 rounded text-[8px] text-amber-950 mt-1 font-semibold">
                                                        ⚠️ [SECURITY ALERT]: 1x Void dilakukan pasca cetak Pre-Bill
                                                        (Meja 5 - Rp 15.000). Telah diverifikasi Manager.
                                                    </div>
                                                </div>

                                                <div className="border-b-2 border-double border-slate-400 pt-1" />
                                                <div className="font-bold text-[9px] tracking-widest text-center uppercase py-0.5">
                                                    DETAIL TRANSAKSI
                                                </div>
                                                <div className="border-b-2 border-double border-slate-400" />

                                                <div className="space-y-1 pt-1 text-[9px] max-h-48 overflow-y-auto pr-1">
                                                    <div className="flex justify-between">
                                                        <span>Air Mineral</span>
                                                        <span>x 3</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Jeruk Peras Hangat</span>
                                                        <span>x 1</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Kerupuk Udang</span>
                                                        <span>x 1</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Mie Godog</span>
                                                        <span>x 4</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Mie Goreng Jawa</span>
                                                        <span>x 6</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Nasi Goreng Kampung</span>
                                                        <span>x 2</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Nasi Putih</span>
                                                        <span>x 2</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Nasi Soto Ayam</span>
                                                        <span>x 3</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Pisgor Cheese Milk Crunchy</span>
                                                        <span>x 2</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Pisgor Cheese Tiramisu Chru</span>
                                                        <span>x 1</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Rawon tanpa nasi</span>
                                                        <span>x 1</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Sate Telur Puyuh</span>
                                                        <span>x 2</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Soto Ayam</span>
                                                        <span>x 4</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Teh Tawar</span>
                                                        <span>x 5</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Tempe Goreng</span>
                                                        <span>x 4</span>
                                                    </div>
                                                </div>

                                                <div className="border-b-2 border-double border-slate-400 pt-1" />
                                                <div className="font-bold text-[9px] tracking-widest text-center uppercase py-0.5">
                                                    DETAIL PEMASUKAN
                                                </div>
                                                <div className="border-b-2 border-double border-slate-400" />

                                                <div className="space-y-1 pt-1">
                                                    <div className="flex justify-between">
                                                        <span>QRIS</span>
                                                        <span>Rp 420.100</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>TUNAI</span>
                                                        <span>Rp 338.150</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold pt-1 border-t border-slate-300">
                                                        <span>TOTAL PEMASUKAN</span>
                                                        <span>Rp 758.250</span>
                                                    </div>
                                                </div>

                                                <div className="border-b-2 border-double border-slate-400 pt-1" />
                                                <div className="font-bold text-[9px] tracking-widest text-center uppercase py-0.5">
                                                    TRANSAKSI KAS KECIL
                                                </div>
                                                <div className="border-b-2 border-double border-slate-400" />

                                                <div className="space-y-1 pt-1">
                                                    <div className="flex justify-between font-semibold">
                                                        <span>KAS AWAL</span>
                                                        <span>Rp 560.400</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>gula x3</span>
                                                        <span>(Rp 52.500)</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>kecap x2</span>
                                                        <span>(Rp 40.100)</span>
                                                    </div>
                                                    <div className="flex justify-between pt-1">
                                                        <span>SALDO</span>
                                                        <span>Rp 467.800</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold text-[11px] pt-1 border-t border-slate-300">
                                                        <span>TOTAL KAS</span>
                                                        <span>Rp 805.950</span>
                                                    </div>
                                                </div>

                                                <div className="border-b border-dashed border-slate-400 py-2" />
                                                <div className="text-center text-[9px] pt-1 space-y-0.5">
                                                    <div className="font-semibold">Diterbitkan oleh</div>
                                                    <div className="font-bold">
                                                        Restoku OS - Self Order &amp; POS App
                                                    </div>
                                                    <div className="text-slate-400">
                                                        Powered by Restoku OS · {strukPaperWidth}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Glass>
                        </div>

                        {/* TAB 5: JAM OPERASIONAL */}
                        <div id="jam" className="space-y-5">
                            <Glass className="p-6">
                                <h2 className={h2Class}>
                                    <ClockIcon className="size-4 text-emerald-500" /> Jam Operasional Outlet
                                </h2>
                                <p className={`${descClass} mb-4`}>
                                    Atur jadwal operasional outlet Anda untuk membatasi pemesanan online oleh pelanggan
                                    di luar jam buka.
                                </p>

                                <div
                                    className={`flex flex-wrap items-center gap-2 mb-5 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}
                                >
                                    <span
                                        className={`text-[11px] font-semibold mr-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}
                                    >
                                        Aksi Cepat:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setJamOperasional((prev) => prev.map((d) => ({ ...d, isOpen: true })))
                                        }
                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors border ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
                                    >
                                        Buka Semua Hari
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setJamOperasional((prev) =>
                                                prev.map((d) =>
                                                    d.day === 'Minggu'
                                                        ? { ...d, isOpen: false }
                                                        : { ...d, isOpen: true },
                                                ),
                                            )
                                        }
                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors border ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'}`}
                                    >
                                        Libur Minggu Saja
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setJamOperasional((prev) =>
                                                prev.map((d) => ({ ...d, openTime: '09:00', closeTime: '22:00' })),
                                            )
                                        }
                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors border ${isLight ? 'bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)] shadow-sm' : 'bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/20'}`}
                                    >
                                        Set Waktu Standar (09:00 - 22:00)
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {jamOperasional.map((item, idx) => (
                                        <div
                                            key={item.day}
                                            className={`flex items-center gap-4 p-3 rounded-xl transition-colors border ${isLight ? 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'}`}
                                        >
                                            <div
                                                className={`w-20 text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}
                                            >
                                                {item.day}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={item.openTime}
                                                    onChange={(e) =>
                                                        setJamOperasional((prev) =>
                                                            prev.map((d, i) =>
                                                                i === idx ? { ...d, openTime: e.target.value } : d,
                                                            ),
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                                <span
                                                    className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-500'}`}
                                                >
                                                    s/d
                                                </span>
                                                <input
                                                    type="time"
                                                    value={item.closeTime}
                                                    onChange={(e) =>
                                                        setJamOperasional((prev) =>
                                                            prev.map((d, i) =>
                                                                i === idx ? { ...d, closeTime: e.target.value } : d,
                                                            ),
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div className="ml-auto flex items-center gap-2">
                                                <span
                                                    className={`text-[10px] font-bold uppercase ${item.isOpen ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : 'text-slate-500'}`}
                                                >
                                                    {item.isOpen ? 'Buka' : 'Tutup'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setJamOperasional((prev) =>
                                                            prev.map((d, i) =>
                                                                i === idx ? { ...d, isOpen: !d.isOpen } : d,
                                                            ),
                                                        )
                                                    }
                                                    className={`w-8 h-4 rounded-full border flex items-center px-0.5 transition-all cursor-pointer ${
                                                        item.isOpen
                                                            ? isLight
                                                                ? 'bg-emerald-200 border-emerald-500 justify-end'
                                                                : 'bg-emerald-500/20 border-emerald-500/40 justify-end'
                                                            : isLight
                                                              ? 'bg-slate-200 border-slate-300 justify-start'
                                                              : 'bg-white/5 border-white/10 justify-start'
                                                    }`}
                                                >
                                                    <div
                                                        className={`size-3 rounded-full transition-colors ${item.isOpen ? (isLight ? 'bg-emerald-600' : 'bg-emerald-400') : 'bg-slate-500'}`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p
                                    className={`mt-3 text-[11px] flex items-center gap-1 ${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}`}
                                >
                                    ✓ Jam operasional disimpan via tombol "Simpan Semua Perubahan".
                                </p>
                            </Glass>
                        </div>

                        {/* GLOBAL SAVE ALL CHANGES BUTTON — AT THE VERY BOTTOM FOR ALL TABS */}
                        <Glass
                            className={`p-5 sticky bottom-0 z-20 backdrop-blur-xl shadow-2xl border ${isLight ? 'border-slate-300 bg-white/90' : 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-slate-900/40'}`}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-1">
                                    <div
                                        className={`font-bold text-sm flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}
                                    >
                                        <CheckIcon className="size-4 text-emerald-500" /> Simpan Semua Pengaturan Outlet
                                    </div>
                                    <p className={descClass}>
                                        Perubahan pada branding, profil, lokasi, pajak, struk, mode UI, dan jam
                                        operasional akan disimpan secara global.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                                    {saveSuccessMsg && (
                                        <span
                                            className={`text-xs font-bold animate-pulse flex items-center gap-1 px-3 py-1.5 rounded-lg border ${isLight ? 'text-emerald-700 bg-emerald-50 border-emerald-300' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}
                                        >
                                            ✓ Berhasil Disimpan!
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleSaveAllChanges}
                                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-6 py-3 text-xs font-extrabold text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <CheckIcon className="size-4 stroke-[3]" />
                                        Simpan Semua Perubahan
                                    </button>
                                </div>
                            </div>
                        </Glass>
                    </div>
                </div>
            </Screen>
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function PengaturanOutlet() {
    return (
        <RoleGuard allowedRoles={['manager', 'owner']} pageName="Pengaturan Outlet" allowedRoleLabel="Manager, Owner">
            <PengaturanOutletInner />
        </RoleGuard>
    );
}
