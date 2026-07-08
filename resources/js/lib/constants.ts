// ─── Application Constants ────────────────────────────────────────────────────
// Single source of truth for all business constants, mock data, and config.
// When connecting to a real API, replace MOCK_* values with actual session data.

import type { Plan } from "../Types";

// ─── Session Mock (replace with real auth/session later) ──────────────────────
export const MOCK_PLAN: Plan = "pro";
export const MOCK_OUTLET = "Senopati";
export const MOCK_OUTLET_ID = "outlet-01";
export const MOCK_TRIAL_DAYS_LEFT = 0; // 0 = already paid/subscribed

// ─── Order Status Labels (Indonesian) ─────────────────────────────────────────
export const ORDER_STATUS: Record<string, string> = {
  pending:          "Menunggu",
  processing:       "Diproses",
  ready_for_pickup: "Siap Diambil",
  completed:        "Selesai",
  cancelled:        "Dibatalkan",
  void:             "Void",
};

// ─── Payment Method Labels (Indonesian) ───────────────────────────────────────
export const PAYMENT_METHODS: Record<string, string> = {
  cash:          "Tunai",
  qris:          "QRIS",
  gopay:         "GoPay",
  ovo:           "OVO",
  dana:          "DANA",
  shopeepay:     "ShopeePay",
  bank_transfer: "Transfer Bank",
  credit_card:   "Kartu Kredit",
};

// ─── Tax Config ───────────────────────────────────────────────────────────────
export const TAX_LABELS: Record<string, string> = {
  pbjt: "PBJT (Pajak Restoran)",
  ppn:  "PPN 11%",
};

export const TAX_RATES: Record<string, number> = {
  pbjt: 0.10,
  ppn:  0.11,
  service_charge: 0.05,
};

// ─── Plan Labels & Styling ────────────────────────────────────────────────────
export const PLAN_LABELS: Record<Plan, string> = {
  basic:      "Basic",
  pro:        "Pro",
  enterprise: "Enterprise",
};

export const PLAN_TONES: Record<Plan, string> = {
  basic:      "text-slate-300 bg-slate-400/10 border-slate-400/20",
  pro:        "text-blue-300 bg-blue-500/10 border-blue-500/20",
  enterprise: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
};

// ─── Plan Feature Gating ──────────────────────────────────────────────────────
export const PLAN_FEATURES: Record<Plan, string[]> = {
  basic: [
    "pbjt_tax", "qris", "gopay", "bank_transfer",
    "qrcode_order", "thermal_print", "email_notif",
  ],
  pro: [
    "pbjt_tax", "ppn_tax", "service_charge",
    "qris", "gopay", "ovo", "dana", "bank_transfer", "credit_card",
    "qrcode_order", "thermal_print", "auto_print",
    "email_notif", "wa_notif",
    "gofood_sync", "grab_sync", "shopeefood_sync",
    "multi_outlet_3", "catatan_pesanan", "laporan_excel",
    "shift_management", "buku_menu_digital", "qr_order",
  ],
  enterprise: [
    "pbjt_tax", "ppn_tax", "service_charge",
    "qris", "gopay", "ovo", "dana", "bank_transfer", "credit_card",
    "qrcode_order", "thermal_print", "auto_print",
    "email_notif", "wa_notif",
    "gofood_sync", "grab_sync", "shopeefood_sync",
    "unlimited_outlet", "catatan_pesanan", "laporan_excel",
    "kds", "white_label", "priority_support",
    "shift_management", "payroll", "advanced_inventory",
    "buku_menu_digital", "qr_order", "wa_integration",
  ],
};

// ─── Feature Lock Mapping (sidebar nav items → feature keys) ──────────────────
export const FEATURE_LOCKS: Record<string, { feature: string }> = {
  "Buku Menu Digital":         { feature: "buku_menu_digital" },
  "Manajemen QR":              { feature: "qr_order" },
  "QR Code Meja":              { feature: "qr_order" },
  "Sesi Kasir":                { feature: "shift_management" },
  "Shift Kerja":               { feature: "shift_management" },
  "Payroll/Penggajian":        { feature: "payroll" },
  "Stock Opname":              { feature: "advanced_inventory" },
  "WhatsApp API integration":  { feature: "wa_integration" },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
export const planHasFeature = (plan: Plan, feature: string): boolean =>
  PLAN_FEATURES[plan]?.includes(feature) ?? false;
