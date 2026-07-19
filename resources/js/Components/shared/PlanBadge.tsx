import { CrownIcon } from '../icons';
import { PLAN_TONES, PLAN_LABELS } from '../../lib/constants';
import type { Plan } from '../../Types';

export function PlanBadge({ plan }: { plan: Plan }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${PLAN_TONES[plan]}`}
        >
            {plan === 'enterprise' && <CrownIcon className="size-3" />}
            {PLAN_LABELS[plan]}
        </span>
    );
}
