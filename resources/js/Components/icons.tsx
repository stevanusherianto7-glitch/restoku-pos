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

export function ClockIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

export function CheckCheckIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M2 12l5 5L17 7" />
            <path d="M12 16l1 1L23 7" />
        </svg>
    );
}

export function VolumeIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M4 9v6h4l5 4V5L8 9H4Z" />
            <path d="M16 9a4 4 0 0 1 0 6" />
        </svg>
    );
}

export function VolumeMuteIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M4 9v6h4l5 4V5L8 9H4Z" />
            <path d="M17 9l4 6M21 9l-4 6" />
        </svg>
    );
}

export function ChefHatIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M6 14a3 3 0 0 1-1-5.8A3 3 0 0 1 9 4a3 3 0 0 1 5 0 3 3 0 0 1 4 1.2A3 3 0 0 1 18 14" />
            <path d="M6 14h12v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4Z" />
        </svg>
    );
}

export function UtensilsIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 2v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2M5 2v20" />
            <path d="M19 2v7a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2V2M17 2v20" />
        </svg>
    );
}

export function FlameIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 0-2-1-3 3 2 5 5 5 9a7 7 0 1 1-14 0c0-5 4-7 8-13Z" />
        </svg>
    );
}

export function ShieldAlertIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" />
            <path d="M12 9v4M12 16h.01" />
        </svg>
    );
}
