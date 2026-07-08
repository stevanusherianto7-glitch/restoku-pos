import { type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { useTenantSettings } from "../Shared";

interface GlassProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

/**
 * Glass card container — frosted glassmorphism style for the dark app shell.
 */
export function Glass({ children, className = "", hover = false }: GlassProps) {
  const { screenMode } = useTenantSettings();
  const isLight = screenMode === "terang";
  const isGlass = screenMode === "glassmorphic";
  const isNanoBanana = screenMode === "nano-banana";

  const baseClasses = isLight
    ? "rounded-3xl border border-slate-200 bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl text-slate-900"
    : isNanoBanana
    ? "rounded-3xl border border-amber-500/25 bg-[#030712]/80 shadow-[0_8px_32px_0_rgba(234,179,8,0.12)] backdrop-blur-3xl ring-1 ring-amber-500/20"
    : isGlass
    ? "rounded-3xl border border-white/[0.15] bg-white/[0.04] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-3xl ring-1 ring-white/10"
    : "rounded-3xl border border-white/[0.06] bg-[#09090b]/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-3xl";

  const hoverClasses = hover
    ? isLight
      ? "hover:border-slate-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.10)] hover:-translate-y-0.5 hover:bg-white"
      : isNanoBanana
      ? "hover:border-amber-500/50 hover:shadow-[0_12px_40px_0_rgba(234,179,8,0.25)] hover:-translate-y-1 hover:bg-[#030712]/95"
      : isGlass
      ? "hover:border-white/[0.25] hover:shadow-[0_12px_40px_0_rgba(6,182,212,0.2)] hover:-translate-y-0.5 hover:bg-white/[0.06]"
      : "hover:border-white/[0.10] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-0.5"
    : "";

  return (
    <div
      className={cn(
        baseClasses,
        "transition-all duration-300",
        hoverClasses,
        className
      )}
    >
      {children}
    </div>
  );
}

