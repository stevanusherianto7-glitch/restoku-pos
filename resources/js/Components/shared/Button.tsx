import { type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { useTenantSettings } from "../Shared";

type ButtonVariant = "default" | "outline" | "ghost" | "danger";
type ButtonSize    = "xs" | "sm" | "default" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  default: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-emerald-500/20",
  outline: "border border-slate-700 text-slate-300 hover:bg-white/[0.05] hover:border-slate-600",
  ghost:   "text-slate-400 hover:text-white hover:bg-white/[0.06]",
  danger:  "bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 hover:border-red-500/40",
};

const VARIANTS_LIGHT: Record<ButtonVariant, string> = {
  default: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-slate-900/10",
  outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400 shadow-xs",
  ghost:   "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
  danger:  "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 shadow-xs",
};

const SIZES: Record<ButtonSize, string> = {
  xs:      "h-7 px-2.5 text-[11px]",
  sm:      "h-8 px-3 text-xs",
  default: "h-10 px-4 text-sm",
  lg:      "h-12 px-6 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

/**
 * Primary Button component — dark-mode & light-mode responsive.
 * Prefer using this over raw <button> tags throughout the app.
 */
export function Button({
  children,
  variant = "default",
  size = "default",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const { screenMode } = useTenantSettings();
  const isLight = screenMode === "terang";

  const base =
    "inline-flex items-center justify-center rounded-xl font-medium " +
    "transition-all duration-200 ease-out select-none " +
    "hover:-translate-y-0.5 active:scale-95 active:translate-y-0 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50 " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  const variantStyle = isLight ? VARIANTS_LIGHT[variant] : VARIANTS[variant];

  return (
    <button
      className={cn(base, variantStyle, SIZES[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="size-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          {children}
        </span>
      ) : children}
    </button>
  );
}
