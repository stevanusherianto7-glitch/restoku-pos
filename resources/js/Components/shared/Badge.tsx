import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useTenantSettings } from '../Shared';

// ─── Tone System ──────────────────────────────────────────────────────────────
export type Tone = 'blue' | 'emerald' | 'amber' | 'red' | 'violet' | 'orange' | 'slate' | 'pink' | 'cyan';

export const toneMap: Record<Tone, string> = {
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    red: 'border-red-500/20 bg-red-500/10 text-red-300',
    violet: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
    orange: 'border-orange-500/20 bg-orange-500/10 text-orange-300',
    slate: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
    pink: 'border-pink-500/20 bg-pink-500/10 text-pink-300',
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
};

export const toneMapLight: Record<Tone, string> = {
    blue: 'border-blue-200 bg-blue-100 text-blue-800',
    emerald: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    amber: 'border-amber-200 bg-amber-100 text-amber-800',
    red: 'border-red-200 bg-red-100 text-red-800',
    violet: 'border-violet-200 bg-violet-100 text-violet-800',
    orange: 'border-orange-200 bg-orange-100 text-orange-800',
    slate: 'border-slate-200 bg-slate-100 text-slate-800',
    pink: 'border-pink-200 bg-pink-100 text-pink-800',
    cyan: 'border-cyan-200 bg-cyan-100 text-cyan-800',
};

export const cardToneMap: Record<Tone, string> = {
    blue: 'border-blue-500/30 bg-blue-500/15 text-blue-200',
    emerald: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
    amber: 'border-amber-500/30 bg-amber-500/15 text-amber-200',
    red: 'border-red-500/30 bg-red-500/15 text-red-200',
    violet: 'border-violet-500/30 bg-violet-500/15 text-violet-200',
    orange: 'border-orange-500/30 bg-orange-500/15 text-orange-200',
    slate: 'border-slate-500/30 bg-slate-500/15 text-slate-200',
    pink: 'border-pink-500/30 bg-pink-500/15 text-pink-200',
    cyan: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-200',
};

export const cardToneMapLight: Record<Tone, string> = {
    blue: 'border-blue-300 bg-blue-50 text-blue-900 shadow-xs',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-900 shadow-xs',
    amber: 'border-amber-300 bg-amber-50 text-amber-900 shadow-xs',
    red: 'border-red-300 bg-red-50 text-red-900 shadow-xs',
    violet: 'border-violet-300 bg-violet-50 text-violet-900 shadow-xs',
    orange: 'border-orange-300 bg-orange-50 text-orange-900 shadow-xs',
    slate: 'border-slate-300 bg-slate-50 text-slate-900 shadow-xs',
    pink: 'border-pink-300 bg-pink-50 text-pink-900 shadow-xs',
    cyan: 'border-cyan-300 bg-cyan-50 text-cyan-900 shadow-xs',
};

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
    children: ReactNode;
    tone?: Tone;
    className?: string;
    dot?: boolean;
}

/**
 * Small inline badge with tone-based coloring.
 */
export function Badge({ children, tone = 'emerald', className = '', dot = false }: BadgeProps) {
    const { screenMode } = useTenantSettings();
    const isLight = screenMode === 'terang';
    const toneClass = isLight ? toneMapLight[tone] : toneMap[tone];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                toneClass,
                className,
            )}
        >
            {dot && <span className={cn('size-1.5 rounded-full bg-current animate-pulse')} />}
            {children}
        </span>
    );
}
