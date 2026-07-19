import { type ReactNode } from 'react';
import { LockIcon } from '../icons';
import { PlanBadge } from './PlanBadge';
import type { Plan } from '../../Types';

export function FeatureLock({ requiredPlan, children }: { requiredPlan: Plan; children: ReactNode }) {
    return (
        <div className="relative">
            <div className="opacity-40 pointer-events-none select-none">{children}</div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 rounded-2xl backdrop-blur-sm">
                <LockIcon className="size-6 text-slate-400" />
                <p className="text-xs text-slate-400">
                    Fitur <PlanBadge plan={requiredPlan} />
                </p>
                <button className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 transition-colors">
                    Upgrade Paket
                </button>
            </div>
        </div>
    );
}
