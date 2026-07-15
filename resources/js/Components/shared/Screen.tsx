import { type ReactNode } from 'react';
import { WifiIcon, BellIcon } from '../icons';
import { Badge } from './Badge';
import { formatDate } from '../../lib/formatters';
import { usePage } from '@inertiajs/react';
import { useTenantSettings } from '../Shared';
import CashierPins from '../CashierPins';
import type { SharedProps } from '../../Types';

interface ScreenProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    /** Single action button/element in the header. */
    action?: ReactNode;
    /** Multiple action buttons/elements in the header. */
    actions?: ReactNode;
    /** If true, removes the default padding — useful for full-bleed pages. */
    noPadding?: boolean;
    /** If true, locks outer height to 100% and prevents vertical scrolling of the wrapper (`overflow-hidden`). Ideal for fixed desk views like POS. */
    noScroll?: boolean;
}

/**
 * Page wrapper with standardized header (title, date, outlet, actions).
 * Use this as the root element of every admin/staff screen.
 */
export function Screen({
    title,
    subtitle,
    children,
    action,
    actions,
    noPadding = false,
    noScroll = false,
}: ScreenProps) {
    const { screenMode } = useTenantSettings();
    const { outlet } = usePage<SharedProps>().props;
    const outletName = outlet?.name ?? 'Pawon Salam';
    const isLight = screenMode === 'terang';

    return (
        <div
            className={`animate-in fade-in duration-500 max-w-[1280px] mx-auto w-full ${noScroll ? 'flex-1 min-h-0 flex flex-col h-full overflow-hidden' : ''}`}
        >
            {/* Page Header */}
            <div className={`${noScroll ? 'mb-3 shrink-0' : 'mb-8'} flex items-start justify-between gap-4`}>
                <div className="min-w-0">
                    <h1
                        className={`text-2xl font-extrabold tracking-tight truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}
                    >
                        {title}
                    </h1>
                    <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                        {subtitle ?? `${formatDate()} · Outlet ${outletName}`}
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <CashierPins />
                    {actions || action}
                    <Badge tone="emerald" dot>
                        <WifiIcon className="size-3" /> Live
                    </Badge>
                    <button
                        className={`transition-all duration-200 p-2.5 rounded-xl border ${isLight ? 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border-slate-200 shadow-sm' : 'text-slate-400 hover:text-slate-100 bg-white/[0.03] hover:bg-white/[0.08] border-transparent hover:border-white/10'}`}
                        aria-label="Notifikasi"
                    >
                        <BellIcon className="size-4" />
                    </button>
                </div>
            </div>

            {/* Page Content */}
            <div
                className={
                    noPadding ? '' : noScroll ? 'flex-1 min-h-0 flex flex-col h-full overflow-hidden' : 'space-y-6'
                }
            >
                {children}
            </div>
        </div>
    );
}
