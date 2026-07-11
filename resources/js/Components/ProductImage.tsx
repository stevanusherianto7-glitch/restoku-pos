import { useState, type SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function UtensilsIcon({ size = 24, ...p }: P) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...p}
        >
            <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M5 2v20M19 2v7c0 1.1-.9 2-2 2h0a2 2 0 0 1-2-2V2M17 2v20" />
            <path d="M18 22a3 3 0 0 0-3-3h-1v-2h4v5Z" />
        </svg>
    );
}

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
                <UtensilsIcon className="size-6 text-slate-600" />
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
