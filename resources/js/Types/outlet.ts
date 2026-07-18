// ─── Outlet & Business Types ──────────────────────────────────────────────────

export type Plan = 'basic' | 'pro' | 'enterprise';

export interface Outlet {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    email?: string;
    taxId?: string; // NPWP
    plan: Plan;
    isActive: boolean;
    openTime: string; // "HH:mm"
    closeTime: string; // "HH:mm"
    timezone: string; // e.g., "Asia/Jakarta"
    currency: string; // "IDR"
    logoUrl?: string;
    receiptFooter?: string;
}

export interface Table {
    id: string;
    number: number;
    name: string; // e.g., "Meja 1", "VIP 1"
    capacity: number;
    area: string; // "Lantai 1", "Lantai 2", "VIP", "Outdoor"
    status: 'available' | 'occupied' | 'reserved' | 'dirty';
    qrCodeUrl?: string;
    currentOrderId?: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    sku?: string;
    category: string;
    unit: string; // "kg", "liter", "pcs"
    currentStock: number;
    minimumStock: number;
    unitCost: number;
    supplierId?: string;
    supplierName?: string;
    lastRestocked?: string;
}

export interface DailySummary {
    date: string;
    outletId: string;
    totalRevenue: number;
    totalOrders: number;
    totalCovers: number; // number of guests
    avgOrderValue: number;
    topItems: Array<{ name: string; sold: number; revenue: number }>;
    paymentBreakdown: Record<string, number>;
}

export type QrKind = 'frame' | 'sticker' | 'stand';

export interface ApiTable {
    id: string;
    label: string;
    pin: string;
    is_queue: boolean;
    qr_type: QrKind;
}

export interface OperatingHour {
    day: number; // 0=Sunday … 6=Saturday
    open: string; // "HH:mm"
    close: string; // "HH:mm"
    is_closed: boolean;
}

export type VoidPolicy = 'audit_full' | 'zero_out' | 'manager_only';
