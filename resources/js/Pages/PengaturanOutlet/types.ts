// Shared prop contract for PengaturanOutlet panels.
// The parent (PengaturanOutletInner orchestrator) owns ALL state + handlers;
// each panel is a pure presentational slice that receives this single object.
// Pure extraction from the original god-component — no behaviour change.

import type { Dispatch, SetStateAction, ElementType, ChangeEvent } from 'react';
import type { VoidPolicy } from '../../Types/outlet';
import type { Staff } from '../../Types/staff';
import type { ScreenMode } from '../../lib/screenMode';

export interface DayHour {
    day: string;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
}

export type LogoOption = { name: string; label: string; Icon: ElementType };

export type TabKey = string;

export interface PanelProps {
    // ── Navigation (sidebar) ─────────────────────────────────────────────
    activeTab: TabKey;
    onTabChange: (v: TabKey) => void;
    allTabs: TabKey[];
    tabIcons: Record<TabKey, ElementType>;
    tabLabels: Record<TabKey, string>;
    saveSuccessMsg: boolean;

    // ── Branding / profile ───────────────────────────────────────────────
    nameInput: string;
    setNameInput: Dispatch<SetStateAction<string>>;
    namaOutletInput: string;
    setNamaOutletInput: Dispatch<SetStateAction<string>>;
    imageInput: string | null;
    setImageInput: Dispatch<SetStateAction<string | null>>;
    logoInput: string;
    setLogoInput: Dispatch<SetStateAction<string>>;
    ownerInput: string;
    setOwnerInput: Dispatch<SetStateAction<string>>;

    // ── Staff CRUD ───────────────────────────────────────────────────────
    employeesList: Staff[];
    setEmployeesList: Dispatch<SetStateAction<Staff[]>>;
    newEmpName: string;
    setNewEmpName: Dispatch<SetStateAction<string>>;
    newEmpEmail: string;
    setNewEmpEmail: Dispatch<SetStateAction<string>>;
    newEmpPassword: string;
    setNewEmpPassword: Dispatch<SetStateAction<string>>;
    newEmpRole: '' | 'cashier' | 'kitchen' | 'waiter' | 'admin';
    setNewEmpRole: Dispatch<SetStateAction<'' | 'cashier' | 'kitchen' | 'waiter' | 'admin'>>;
    editingId: string | number | null;
    setEditingId: Dispatch<SetStateAction<string | number | null>>;
    editName: string;
    setEditName: Dispatch<SetStateAction<string>>;
    editEmail: string;
    setEditEmail: Dispatch<SetStateAction<string>>;
    editPassword: string;
    setEditPassword: Dispatch<SetStateAction<string>>;
    editRole: 'cashier' | 'kitchen' | 'waiter' | 'admin';
    setEditRole: Dispatch<SetStateAction<'cashier' | 'kitchen' | 'waiter' | 'admin'>>;

    // ── Location ─────────────────────────────────────────────────────────
    alamatInput: string;
    setAlamatInput: Dispatch<SetStateAction<string>>;
    latitudeInput: string;
    setLatitudeInput: Dispatch<SetStateAction<string>>;
    longitudeInput: string;
    setLongitudeInput: Dispatch<SetStateAction<string>>;
    isFetchingGeo: boolean;
    setIsFetchingGeo: Dispatch<SetStateAction<boolean>>;

    // ── Outlet profile ───────────────────────────────────────────────────
    teleponInput: string;
    setTeleponInput: Dispatch<SetStateAction<string>>;
    npwpInput: string;
    setNpwpInput: Dispatch<SetStateAction<string>>;
    nibInput: string;
    setNibInput: Dispatch<SetStateAction<string>>;

    // ── Tax & service ────────────────────────────────────────────────────
    taxType: 'pbjt' | 'ppn';
    setTaxType: Dispatch<SetStateAction<'pbjt' | 'ppn'>>;
    isTaxActive: boolean;
    setIsTaxActive: Dispatch<SetStateAction<boolean>>;
    taxRateInput: number;
    setTaxRateInput: Dispatch<SetStateAction<number>>;
    serviceChargeInput: number;
    setServiceChargeInput: Dispatch<SetStateAction<number>>;

    // ── Receipt / struk ──────────────────────────────────────────────────
    strukHeader: string;
    setStrukHeader: Dispatch<SetStateAction<string>>;
    strukFooter: string;
    setStrukFooter: Dispatch<SetStateAction<string>>;
    strukPaperWidth: string;
    setStrukPaperWidth: Dispatch<SetStateAction<string>>;
    strukPreviewMode: 'transaksi' | 'dapur' | 'closing';
    setStrukPreviewMode: Dispatch<SetStateAction<'transaksi' | 'dapur' | 'closing'>>;
    voidPolicy: VoidPolicy;
    setVoidPolicy: Dispatch<SetStateAction<VoidPolicy>>;

    // ── Appearance ───────────────────────────────────────────────────────
    screenMode: ScreenMode;
    setScreenMode: Dispatch<SetStateAction<ScreenMode>>;
    tenantLayout: string;
    saveLayout: (mode: ScreenMode) => void;

    // ── Operating hours ──────────────────────────────────────────────────
    jamOperasional: DayHour[];
    setJamOperasional: Dispatch<SetStateAction<DayHour[]>>;

    // ── Handlers ─────────────────────────────────────────────────────────
    handleGeocodeAddress: (address: string) => void;
    handleScreenModeChange: (mode: ScreenMode) => void;
    handleLogoUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    handleAddEmployee: () => void;
    handleDeleteEmployee: (id: string | number) => void;
    handleStartEdit: (emp: Staff) => void;
    handleSaveEdit: () => void;
    handleSaveAllChanges: () => void;

    // ── Derived style helpers ────────────────────────────────────────────
    isLight: boolean;
    h2Class: string;
    h3Class: string;
    labelClass: string;
    inputClass: string;
    descClass: string;
    selectClass: string;
    cardRowClass: string;
    optionBtnClass: (active: boolean) => string;
    logoOptions: LogoOption[];
}
