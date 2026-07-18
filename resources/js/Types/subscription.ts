export interface PlanTier {
    key: 'basic' | 'pro' | 'enterprise';
    name: string;
    price_idr: number;
    tagline: string;
    features: string[];
    extra_features: string[];
    inherits: 'basic' | 'pro' | null;
    popular: boolean;
}
