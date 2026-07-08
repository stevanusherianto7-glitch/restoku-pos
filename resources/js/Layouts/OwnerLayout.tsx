import { type ReactNode } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  ChefHat, BarChart3, Users, Package, Settings,
  TrendingUp, LogOut, Bell, Store
} from "lucide-react";
import { PlanBadge, useTenantSettings } from "../Components/Shared";
import GeminiCopilotWidget from "../Components/POS/GeminiCopilotWidget";
import { useSubscription } from "../Hooks/useSubscription";
import type { SharedProps } from "../Types";

type OwnerNavItem = { name: string; href: string; Icon: React.ElementType };

const ownerNav: OwnerNavItem[] = [
  { name: "Dasbor Keuangan",  href: "/laporan-keuangan",      Icon: TrendingUp  },
  { name: "Analitik Owner",   href: "/owner/dashboard",       Icon: BarChart3   },
  { name: "Data Karyawan",    href: "/owner/employees",       Icon: Users       },
  { name: "Stok & Inventaris",href: "/owner/inventory/alerts",Icon: Package     },
  { name: "Multi Outlet",     href: "/perbandingan-outlet",   Icon: Store       },
  { name: "Pengaturan",       href: "/owner/settings",        Icon: Settings    },
];

/**
 * App shell for the Owner role.
 * Read-only — no operational actions are shown in this layout.
 * Features a clean, professional sidebar with executive Cyber Gold / Emerald styling.
 */
export default function OwnerLayout({ children }: { children: ReactNode }) {
  const { plan } = useSubscription();
  const { outlet } = usePage<SharedProps>().props;
  const { screenMode, renderLogo, tenantName } = useTenantSettings();
  const outletName = outlet?.name ?? "Senopati";

  const isNanoBanana = screenMode === "nano-banana";

  return (
    <div className={`flex h-screen w-full text-slate-200 overflow-hidden font-sans transition-all duration-500 ${isNanoBanana ? "bg-[#030712] selection:bg-amber-500/30 dark nano-banana" : "bg-[#030b06] selection:bg-emerald-500/20 dark"}`}>
      {/* Sidebar */}
      <aside className={`flex h-full w-64 shrink-0 flex-col border-r p-4 transition-all duration-500 ${isNanoBanana ? "border-amber-500/20 bg-[#030712]/95 backdrop-blur-3xl shadow-[0_0_50px_0_rgba(234,179,8,0.1)]" : "border-emerald-900/30 bg-[#020905]"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className={`grid size-9 place-items-center rounded-xl border overflow-hidden ${isNanoBanana ? "bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(234,179,8,0.25)]" : "bg-emerald-500/10 border-emerald-500/20"}`}>
            {renderLogo(`size-5 ${isNanoBanana ? "text-amber-400" : "text-emerald-400"}`)}
          </div>
          <div>
            <div className="font-semibold text-slate-100 tracking-tight truncate">{tenantName || "Restoku"}</div>
            <div className={`text-[10px] uppercase tracking-wider ${isNanoBanana ? "text-amber-500 font-bold" : "text-emerald-600"}`}>Owner · {outletName}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {ownerNav.map(({ name, href, Icon }) => (
            <Link
              key={name}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 group ${
                isNanoBanana
                  ? "text-slate-400 hover:text-amber-300 hover:bg-amber-500/[0.08] hover:translate-x-1 hover:border-l-2 hover:border-amber-400"
                  : "text-slate-400 hover:text-slate-100 hover:bg-emerald-500/[0.06]"
              }`}
            >
              <Icon className={`size-4 shrink-0 transition-colors ${isNanoBanana ? "group-hover:text-amber-400" : "group-hover:text-emerald-400"}`} />
              <span className="font-medium">{name}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom user card */}
        <div className={`mt-4 rounded-xl border p-3 ${isNanoBanana ? "border-amber-500/30 bg-amber-500/[0.04] shadow-[0_0_20px_rgba(234,179,8,0.1)]" : "border-emerald-900/30 bg-emerald-900/10"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`grid size-8 place-items-center rounded-full font-medium text-xs ${isNanoBanana ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-300"}`}>
              O
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">Owner Executive</div>
              <div className="mt-0.5"><PlanBadge plan={plan} /></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="size-3" /> Notif
            </button>
            <Link href="/" className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <LogOut className="size-3" /> Keluar
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
        {isNanoBanana ? (
          <>
            <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
            <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.08),transparent_70%)] pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.04),transparent_60%)] pointer-events-none" />
        )}
        <div className="relative z-10">{children}</div>
        <GeminiCopilotWidget />
      </main>
    </div>
  );
}
