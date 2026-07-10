import { useState } from 'react';
import { Utensils } from 'lucide-react';

type Variant = 'small' | 'medium' | 'large' | 'full';

const VARIANT_SIZES: Record<Variant, string> = {
    small: 'size-16',
    medium: 'size-28',
    large: 'h-40 w-full',
    full: 'h-full w-full',
};

type ProductImageProps = {
    src?: string | null;
    alt: string;
    variant?: Variant;
    className?: string;
};

export function ProductImage({ src, alt, variant = 'medium', className = '' }: ProductImageProps) {
    const [error, setError] = useState(false);
    const sizeClass = VARIANT_SIZES[variant];

    if (!src || error) {
        return (
            <div
                className={`flex items-center justify-center bg-slate-800/50 rounded-lg ${sizeClass} ${className}`}
                data-testid="fallback-icon"
                aria-label={alt}
            >
                <Utensils className="size-6 text-slate-600" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={`object-cover rounded-lg ${sizeClass} ${className}`}
            onError={() => setError(true)}
        />
    );
}
