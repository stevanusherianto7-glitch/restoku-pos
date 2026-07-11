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

export function StoreIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 9l1.5-5h15L21 9" />
            <path d="M4 9v11h16V9" />
            <path d="M9 20v-6h6v6" />
        </svg>
    );
}

export function PackageIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
            <path d="M3 8l9 5 9-5M12 13v8" />
        </svg>
    );
}

export function BoxesIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M21 8 12 3 3 8l9 5 9-5Z" />
            <path d="M3 8v8l9 5 9-5V8M12 13v8" />
            <path d="M21 8l-9 5-9-5" />
        </svg>
    );
}

export function BriefcaseIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
        </svg>
    );
}

export function BarChartIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
    );
}

export function SettingsIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M5 5l2 2M17 17l2 2M2 12h3M19 12h3M5 19l2-2M17 7l2-2" />
        </svg>
    );
}

export function SmartphoneIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect x="6" y="2" width="12" height="20" rx="2" />
            <path d="M11 18h2" />
        </svg>
    );
}

export function ChevronDownIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

export function ChevronRightIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m9 6 6 6-6 6" />
        </svg>
    );
}

export function LockIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
    );
}

export function ArrowLeftIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    );
}

export function MenuIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
    );
}

export function BellIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
    );
}

export function LogOutIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
    );
}

export function PanelLeftIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
        </svg>
    );
}

export function TrendingUpIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 17l6-6 4 4 7-7" />
            <path d="M17 8h4v4" />
        </svg>
    );
}

export function UsersIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
        </svg>
    );
}
