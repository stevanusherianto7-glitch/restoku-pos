import type { Plan } from './outlet';

export interface SharedProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        } | null;
    };
    subscription: {
        plan: Plan;
        status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
        trial_ends_at: string | null;
        days_left: number;
        feature_locks: Record<string, string>; // min plan per feature
        plan_features: string[]; // daftar fitur yang aktif untuk plan saat ini
    } | null;
    outlet: {
        id: number | null;
        name: string | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}
