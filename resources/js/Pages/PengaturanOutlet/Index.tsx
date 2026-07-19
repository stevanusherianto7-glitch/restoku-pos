import { useState, ElementType, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, TAX_LABELS, useTenantSettings } from '../../Components/Shared';
import { PlanBadge } from '../../Components/shared/PlanBadge';
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
import { applyScreenMode, isScreenMode } from '../../lib/screenMode';
import { serializeStruk, parseStruk } from '../../lib/strukConfig';
import type { Outlet, VoidPolicy } from '../../Types/outlet';
import type { Staff } from '../../Types/staff';
import type { ScreenMode } from '../../lib/screenMode';

import Sidebar from './Sidebar';
import SaveBar from './SaveBar';
import BrandingPanel from './panels/BrandingPanel';
import ProfilePanel from './panels/ProfilePanel';
import AppearancePanel from './panels/AppearancePanel';
import LocationPanel from './panels/LocationPanel';
import TaxPanel from './panels/TaxPanel';
import ReceiptPanel from './panels/ReceiptPanel';
import HoursPanel from './panels/HoursPanel';

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
        persistScreenMode,
    } = useTenantSettings();
    const {
        tenant,
        outlet,
        employees: dbEmployees,
    } = usePage<{
        tenant?: unknown;
        outlet?: Outlet;
        employees?: Staff[];
    }>().props;
    const [nameInput, setNameInput] = useState(tenantName);
    const [logoInput, setLogoInput] = useState(tenantLogo);
    const [imageInput, setImageInput] = useState<string | null>(tenantImage);
    const authUser: { name?: string } | undefined = usePage<{ auth?: { user?: { name?: string } } }>().props.auth?.user;
    const [ownerInput, setOwnerInput] = useState(
        staffOwner && staffOwner !== 'LALU GUSTI' ? staffOwner : (authUser?.name ?? ''),
    );

    // CRUD States for Staff List
    const [employeesList, setEmployeesList] = useState<Staff[]>(dbEmployees || employees);
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

    // Outlet Profile States
    const [namaOutletInput, setNamaOutletInput] = useState('Pawon Salam - Bandung');
    const [teleponInput, setTeleponInput] = useState('021-1234-5678');
    const [npwpInput, setNpwpInput] = useState('01.234.567.8-012.000');
    const [nibInput, setNibInput] = useState('9120123456789');

    // Tax & Service Charge States
    const [isTaxActive, setIsTaxActive] = useState(true);
    const [taxRateInput, setTaxRateInput] = useState(10);
    const [serviceChargeInput, setServiceChargeInput] = useState(0);

    // Receipt/Struk States
    const [strukHeader, setStrukHeader] = useState('Terima Kasih Telah Berkunjung!');
    const [strukFooter, setStrukFooter] = useState('Barang yang sudah dibeli tidak dapat ditukar');
    const [strukPaperWidth, setStrukPaperWidth] = useState('80mm');
    const [strukPreviewMode, setStrukPreviewMode] = useState<'transaksi' | 'dapur' | 'closing'>('transaksi');
    const [voidPolicy, setVoidPolicy] = useState<VoidPolicy>('audit_full');

    // Mode Screen UI State
    const [screenMode, setScreenMode] = useState<ScreenMode>('nano-banana');

    // Jam Operasional States
    const [jamOperasional, setJamOperasional] = useState([
        { day: 'Senin', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Selasa', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Rabu', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Kamis', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Jumat', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Sabtu', isOpen: true, openTime: '09:00', closeTime: '22:00' },
        { day: 'Minggu', isOpen: false, openTime: '10:00', closeTime: '21:00' },
    ]);

    // URL Hash Tab Navigation (maps live in lib/outletTabs)
    const handleTabChange = (label: string) => {
        setActiveTab(label);
        const slug = TAB_SLUGS[label] || 'profil';
        const url = new URL(window.location.href);
        url.searchParams.set('tab', slug);
        window.history.pushState({}, '', url.toString());
        const el = document.getElementById(slug);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Init from URL hash
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

    // Load settings from DB (if available) with localStorage fallback
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
        // Q97: persist ke localStorage + sinkron ke DB (lintas-device).
        persistScreenMode(mode, outlet?.id);
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
                onError: (err: unknown) => {
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
            onError: (err: unknown) => alert('Gagal menghapus karyawan: ' + JSON.stringify(err)),
        });
    };

    const handleStartEdit = (emp: Staff) => {
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
                onError: (err: unknown) => alert('Gagal mengupdate karyawan: ' + JSON.stringify(err)),
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
        // Q97: sinkron ke DB juga (lintas-device).
        persistScreenMode(screenMode, outlet?.id);
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
        const opHours: Record<string, { open: string; close: string; closed: boolean }> = {};
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
                onError: (err: unknown) => {
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

    const allTabs = ['Profil Outlet', 'Lokasi Restoran', 'Pajak & Tarif', 'Tampilan Struk', 'Jam Operasional'];
    const tabIcons: Record<string, ElementType> = {
        'Profil Outlet': StoreIcon,
        'Lokasi Restoran': MapPinIcon,
        'Pajak & Tarif': PercentIcon,
        'Tampilan Struk': ReceiptIcon,
        'Jam Operasional': ClockIcon,
    };
    const tabLabels: Record<string, string> = {
        'Profil Outlet': 'Profil Outlet',
        'Lokasi Restoran': 'Lokasi Restoran',
        'Pajak & Tarif': 'Pajak & Tarif',
        'Tampilan Struk': 'Tampilan Struk',
        'Jam Operasional': 'Jam Operasional',
    };

    const panelProps = {
        // navigation
        activeTab,
        onTabChange: handleTabChange,
        allTabs,
        tabIcons,
        tabLabels,
        saveSuccessMsg,
        // branding / profile
        nameInput,
        setNameInput,
        namaOutletInput,
        setNamaOutletInput,
        imageInput,
        setImageInput,
        logoInput,
        setLogoInput,
        ownerInput,
        setOwnerInput,
        // staff
        employeesList,
        setEmployeesList,
        newEmpName,
        setNewEmpName,
        newEmpEmail,
        setNewEmpEmail,
        newEmpPassword,
        setNewEmpPassword,
        newEmpRole,
        setNewEmpRole,
        editingId,
        setEditingId,
        editName,
        setEditName,
        editEmail,
        setEditEmail,
        editPassword,
        setEditPassword,
        editRole,
        setEditRole,
        // location
        alamatInput,
        setAlamatInput,
        latitudeInput,
        setLatitudeInput,
        longitudeInput,
        setLongitudeInput,
        isFetchingGeo,
        setIsFetchingGeo,
        // outlet profile
        teleponInput,
        setTeleponInput,
        npwpInput,
        setNpwpInput,
        nibInput,
        setNibInput,
        // tax
        taxType,
        setTaxType,
        isTaxActive,
        setIsTaxActive,
        taxRateInput,
        setTaxRateInput,
        serviceChargeInput,
        setServiceChargeInput,
        // receipt
        strukHeader,
        setStrukHeader,
        strukFooter,
        setStrukFooter,
        strukPaperWidth,
        setStrukPaperWidth,
        strukPreviewMode,
        setStrukPreviewMode,
        voidPolicy,
        setVoidPolicy,
        // appearance
        screenMode,
        setScreenMode,
        tenantLayout,
        saveLayout,
        // hours
        jamOperasional,
        setJamOperasional,
        // handlers
        handleGeocodeAddress,
        handleScreenModeChange,
        handleLogoUpload,
        handleAddEmployee,
        handleDeleteEmployee,
        handleStartEdit,
        handleSaveEdit,
        handleSaveAllChanges,
        // style helpers
        isLight,
        h2Class,
        h3Class,
        labelClass,
        inputClass,
        descClass,
        selectClass,
        cardRowClass,
        optionBtnClass,
        logoOptions,
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Outlet" />
            <Screen title="Pengaturan Outlet" action={<PlanBadge plan={plan} />}>
                <div className="grid grid-cols-[240px_1fr] gap-5 items-start">
                    <Glass className="p-3">
                        <Sidebar {...panelProps} />
                    </Glass>
                    <div className="space-y-5">
                        {activeTab === 'Profil Outlet' && (
                            <>
                                <BrandingPanel {...panelProps} />
                                <ProfilePanel {...panelProps} />
                                <AppearancePanel {...panelProps} />
                            </>
                        )}
                        {activeTab === 'Lokasi Restoran' && <LocationPanel {...panelProps} />}
                        {activeTab === 'Pajak & Tarif' && <TaxPanel {...panelProps} />}
                        {activeTab === 'Tampilan Struk' && <ReceiptPanel {...panelProps} />}
                        {activeTab === 'Jam Operasional' && <HoursPanel {...panelProps} />}
                        <SaveBar {...panelProps} />
                    </div>
                </div>
            </Screen>
        </MainLayout>
    );
}

export default function PengaturanOutlet() {
    return (
        <RoleGuard allowedRoles={['manager', 'owner']} pageName="Pengaturan Outlet" allowedRoleLabel="Manager, Owner">
            <PengaturanOutletInner />
        </RoleGuard>
    );
}
