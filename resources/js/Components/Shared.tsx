// ─── COMPATIBILITY SHIM ───────────────────────────────────────────────────────
// This file previously contained all design-system primitives and constants.
// They have been migrated to:
//   - Components/shared/   (Button, Input, Badge, Glass, Screen, ErrorBoundary)
//   - lib/constants.ts     (MOCK_PLAN, PLAN_FEATURES, FEATURE_LOCKS, etc.)
//   - lib/formatters.ts    (formatRupiah, formatDate)
//   - Types/               (Plan, Order, Staff, etc.)
//
// This file now re-exports everything from the new locations so that all
// existing import paths like:
//   import { Button, formatRupiah } from "../../Components/Shared"
// continue to work without modification during the migration period.
//
// TODO: Gradually migrate all consumers to the new import paths, then
//       delete this file entirely.
// ─────────────────────────────────────────────────────────────────────────────

export { Button }        from "./shared/Button";
export { Input }         from "./shared/Input";
export { Badge, toneMap, cardToneMap } from "./shared/Badge";
export { Glass }         from "./shared/Glass";
export { Screen }        from "./shared/Screen";
export { ErrorBoundary } from "./shared/ErrorBoundary";
export type { ButtonProps } from "./shared/Button";
export type { InputProps }  from "./shared/Input";
export type { Tone }        from "./shared/Badge";
export { formatRupiah, formatDate } from "../lib/formatters";
export {
  MOCK_PLAN, MOCK_OUTLET, MOCK_TRIAL_DAYS_LEFT,
  ORDER_STATUS, PAYMENT_METHODS, TAX_LABELS,
  PLAN_LABELS, PLAN_TONES, PLAN_FEATURES, FEATURE_LOCKS,
  planHasFeature,
} from "../lib/constants";
export type { Plan } from "../Types";

// PlanBadge — kept here since it depends on PLAN_TONES and PLAN_LABELS
import { Crown } from "lucide-react";
import { PLAN_TONES, PLAN_LABELS } from "../lib/constants";
import type { Plan } from "../Types";

export function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${PLAN_TONES[plan]}`}>
      {plan === "enterprise" && <Crown className="size-3" />}
      {PLAN_LABELS[plan]}
    </span>
  );
}

// FeatureLock — kept here for backward compatibility
import { type ReactNode } from "react";
import { Lock } from "lucide-react";
export function FeatureLock({ requiredPlan, children }: { requiredPlan: Plan; children: ReactNode }) {
  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 rounded-2xl backdrop-blur-sm">
        <Lock className="size-6 text-slate-400" />
        <p className="text-xs text-slate-400">Fitur <PlanBadge plan={requiredPlan} /></p>
        <button className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 transition-colors">
          Upgrade Paket
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";

export interface StaffMember {
  id: string;
  name: string;
  role: "kasir" | "kitchen" | "waiter" | "manager";
  pin: string; // stored as sha256 hex after first save; plaintext on initial seed only
}

// ─── [C-2 FIX] PIN Security Utilities ────────────────────────────────────────
/**
 * Hashes a 6-digit PIN using SHA-256 via the Web Crypto API.
 * Returns a 64-char hex string, e.g.: "8d969eef6ecad3c29a3a629280e686cf..."
 */
export async function hashPin(pin: string): Promise<string> {
  const encoded = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Returns true if the string looks like a SHA-256 hash (64 hex chars). */
export function isHashedPin(pin: string): boolean {
  return /^[a-f0-9]{64}$/.test(pin);
}

/**
 * Verifies a plaintext PIN against a stored value (which may be hashed or plaintext).
 * Backward compatible: if stored value is plaintext it compares directly.
 */
export async function verifyPin(plainPin: string, storedPin: string): Promise<boolean> {
  if (!isHashedPin(storedPin)) {
    // Legacy: plaintext comparison
    return plainPin === storedPin;
  }
  const hashed = await hashPin(plainPin);
  return hashed === storedPin;
}

export const DEFAULT_EMPLOYEES: StaffMember[] = [
  { id: "1", name: "BUDI HARTONO",  role: "kasir",   pin: "123456" },
  { id: "2", name: "DEDI CAHYONO",  role: "kitchen", pin: "111111" },
  { id: "3", name: "SARI PERTIWI",  role: "waiter",  pin: "654321" },
  { id: "4", name: "AGUS SETIAWAN", role: "manager", pin: "999999" }
];

export function useTenantSettings() {
  const [tenantName, setTenantName] = useState("Restoku");
  const [tenantLogo, setTenantLogo] = useState("ChefHat");
  const [tenantImage, setTenantImage] = useState<string | null>(null);
  const [tenantLayout, setTenantLayout] = useState<"premium-dark" | "minimalist-light" | "warm-cozy">("premium-dark");
  const [screenMode, setScreenMode] = useState<"terang" | "gelap" | "glassmorphic" | "nano-banana">("nano-banana");
  const [staffOwner, setStaffOwner] = useState("LALU GUSTI");
  const [employees, setEmployees] = useState<StaffMember[]>(DEFAULT_EMPLOYEES);

  // Backward compatibility shims:
  const staffKasir = employees.find(e => e.role === "kasir")?.name ?? "BUDI HARTONO";
  const staffKitchen = employees.find(e => e.role === "kitchen")?.name ?? "DEDI CAHYONO";
  const staffWaiter = employees.find(e => e.role === "waiter")?.name ?? "SARI PERTIWI";
  const staffManager = employees.find(e => e.role === "manager")?.name ?? "AGUS SETIAWAN";
  const pinKasir = employees.find(e => e.role === "kasir")?.pin ?? "123456";
  const pinKitchen = employees.find(e => e.role === "kitchen")?.pin ?? "111111";
  const pinWaiter = employees.find(e => e.role === "waiter")?.pin ?? "654321";
  const pinManager = employees.find(e => e.role === "manager")?.pin ?? "999999";

  const loadSettings = () => {
    const savedName = localStorage.getItem("tenant_name");
    const savedLogo = localStorage.getItem("tenant_logo");
    const savedImage = localStorage.getItem("tenant_image");
    const savedLayout = localStorage.getItem("tenant_layout");
    const savedOwner = localStorage.getItem("tenant_staff_owner");

    if (savedName) setTenantName(savedName);
    if (savedLogo) setTenantLogo(savedLogo);
    if (savedImage) setTenantImage(savedImage);
    if (savedLayout) setTenantLayout(savedLayout as any);
    if (savedOwner) setStaffOwner(savedOwner);

    const savedScreenMode = localStorage.getItem("outlet_screen_mode");
    if (savedScreenMode === "terang" || savedScreenMode === "gelap" || savedScreenMode === "glassmorphic" || savedScreenMode === "nano-banana") {
      setScreenMode(savedScreenMode as any);
      document.documentElement.setAttribute("data-screen-mode", savedScreenMode);
      if (savedScreenMode === "nano-banana") {
        document.documentElement.classList.add("nano-banana", "dark");
        document.documentElement.classList.remove("light");
      } else if (savedScreenMode === "terang") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark", "nano-banana");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light", "nano-banana");
      }
    } else {
      setScreenMode("nano-banana");
      document.documentElement.setAttribute("data-screen-mode", "nano-banana");
      document.documentElement.classList.add("nano-banana", "dark");
      document.documentElement.classList.remove("light");
    }

    const savedEmployees = localStorage.getItem("tenant_employees");
    if (savedEmployees) {
      try {
        setEmployees(JSON.parse(savedEmployees));
      } catch {
        setEmployees(DEFAULT_EMPLOYEES);
      }
    } else {
      // Fallback: migrate if old individual keys exist
      const savedKasir = localStorage.getItem("tenant_staff_kasir");
      const savedKitchen = localStorage.getItem("tenant_staff_kitchen");
      const savedWaiter = localStorage.getItem("tenant_staff_waiter");
      const savedManager = localStorage.getItem("tenant_staff_manager");
      const savedPinKasir = localStorage.getItem("tenant_pin_kasir");
      const savedPinKitchen = localStorage.getItem("tenant_pin_kitchen");
      const savedPinWaiter = localStorage.getItem("tenant_pin_waiter");
      const savedPinManager = localStorage.getItem("tenant_pin_manager");

      if (savedKasir || savedKitchen || savedWaiter || savedManager) {
        const migrated: StaffMember[] = [
          { id: "1", name: savedKasir || "BUDI HARTONO", role: "kasir", pin: savedPinKasir || "123456" },
          { id: "2", name: savedKitchen || "DEDI CAHYONO", role: "kitchen", pin: savedPinKitchen || "111111" },
          { id: "3", name: savedWaiter || "SARI PERTIWI", role: "waiter", pin: savedPinWaiter || "654321" },
          { id: "4", name: savedManager || "AGUS SETIAWAN", role: "manager", pin: savedPinManager || "999999" }
        ];
        setEmployees(migrated);
        localStorage.setItem("tenant_employees", JSON.stringify(migrated));
      } else {
        setEmployees(DEFAULT_EMPLOYEES);
      }
    }
  };

  useEffect(() => {
    loadSettings();
    const handleStorageChange = () => {
      loadSettings();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /**
   * [C-1 FIX] saveSettings now ONLY handles branding (name, logo, image, owner).
   * It NO LONGER touches employee data to prevent overwriting the CRUD list.
   * Call saveEmployees() separately to persist employee changes.
   */
  const saveSettings = (
    name: string,
    logo: string,
    image: string | null,
    ownerName: string,
  ) => {
    localStorage.setItem("tenant_name", name);
    localStorage.setItem("tenant_logo", logo);
    if (image) {
      localStorage.setItem("tenant_image", image);
    } else {
      localStorage.removeItem("tenant_image");
    }
    localStorage.setItem("tenant_staff_owner", ownerName);
    setTenantName(name);
    setTenantLogo(logo);
    setTenantImage(image);
    setStaffOwner(ownerName);
    // Single storage event — no double dispatch
    window.dispatchEvent(new Event("storage"));
  };

  const saveEmployees = async (newEmployees: StaffMember[]) => {
    // [C-2 FIX] Hash any plaintext PINs before storing
    const hashedEmployees = await Promise.all(
      newEmployees.map(async (emp) => {
        if (isHashedPin(emp.pin)) return emp; // already hashed
        const hashed = await hashPin(emp.pin);
        return { ...emp, pin: hashed };
      })
    );
    localStorage.setItem("tenant_employees", JSON.stringify(hashedEmployees));
    setEmployees(hashedEmployees);
    window.dispatchEvent(new Event("storage"));
  };

  const saveLayout = (layout: "premium-dark" | "minimalist-light" | "warm-cozy") => {
    localStorage.setItem("tenant_layout", layout);
    setTenantLayout(layout);
    window.dispatchEvent(new Event("storage"));
  };

  const renderLogo = (className = "size-5 text-slate-200") => {
    if (tenantImage) {
      return <img src={tenantImage} alt={tenantName} className="size-full object-cover" />;
    }
    if (tenantLogo === "ChefHat") {
      return <RestokuLogo className={className} />;
    }
    const IconComponent = (LucideIcons as any)[tenantLogo] || LucideIcons.ChefHat;
    return <IconComponent className={className} />;
  };

  return { 
    tenantName, 
    tenantLogo, 
    tenantImage, 
    tenantLayout, 
    staffKasir, 
    staffKitchen, 
    staffWaiter, 
    staffManager, 
    staffOwner, 
    pinKasir,
    pinKitchen,
    pinWaiter,
    pinManager,
    employees,
    screenMode,
    saveSettings, 
    saveEmployees,
    saveLayout, 
    renderLogo 
  };
}

export function RestokuLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      {/* Outer rotating dashed ring */}
      <circle cx="50" cy="50" r="44" stroke="url(#logo-grad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="12 16" />
      {/* Stylized Chef Hat / Cloche Dome */}
      <path d="M32 56C32 44 40 36 50 36C60 36 68 44 68 56" stroke="url(#logo-grad)" strokeWidth="6" strokeLinecap="round" />
      {/* Base line */}
      <path d="M26 66H74" stroke="url(#logo-grad)" strokeWidth="6" strokeLinecap="round" />
      {/* Cloche Base block */}
      <path d="M32 66V70C32 72.76 34.24 75 37 75H63C65.76 75 68 72.76 68 70V66" stroke="url(#logo-grad)" strokeWidth="6" strokeLinecap="round" fill="url(#logo-grad)" fillOpacity="0.1" />
      {/* Cloche Handle dot */}
      <circle cx="50" cy="26" r="4.5" fill="url(#logo-grad)" />
    </svg>
  );
}

export function getOutletTaxConfig() {
  if (typeof window === "undefined") {
    return { taxType: "pbjt", taxRate: 10, serviceCharge: 0, isTaxActive: true };
  }
  const saved = localStorage.getItem("outlet_tax_config");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        taxType: parsed.taxType ?? "pbjt",
        taxRate: parsed.isTaxActive ? (parsed.taxRate ?? 10) : 0,
        serviceCharge: parsed.isTaxActive ? (parsed.serviceCharge ?? 0) : 0,
        isTaxActive: parsed.isTaxActive !== false,
      };
    } catch (e) {}
  }
  return {
    taxType: "pbjt",
    taxRate: 10,
    serviceCharge: 0,
    isTaxActive: true,
  };
}
