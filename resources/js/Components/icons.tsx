// Restoku inline SVG icons — no lucide-react (anti-AI-look mandate).
// All use currentColor + configurable size via className (size-4 / size-5).
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...p }: P) {
    return {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        ...p,
    };
}

export function BowlIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 11h18a9 9 0 0 1-18 0Z" />
            <path d="M7 7c0-1.5 1-2 2-2M12 6V4M17 7c0-1.5-1-2-2-2" />
        </svg>
    );
}

export function PlusIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

export function SearchIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}

export function PencilIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
    );
}

export function TrashIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
    );
}

export function UploadIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M17 8l-5-5-5 5M12 3v12" />
        </svg>
    );
}

export function XIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    );
}
