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

// --- AUTO-GENERATED from lucide-react (Phase 5) — single source ---

export function ActivityIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
                key="169zse"
            />
        </svg>
    );
}

export function AlertCircleIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="10" key="1mglay" />
            <line x1="12" x2="12" y1="8" y2="12" key="1pkeuh" />
            <line x1="12" x2="12.01" y1="16" y2="16" key="4dfq90" />
        </svg>
    );
}

export function AlertTriangleIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" key="wmoenq" />
            <path d="M12 9v4" key="juzpu7" />
            <path d="M12 17h.01" key="p32p05" />
        </svg>
    );
}

export function ArrowDownLeftIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M17 7 7 17" key="15tmo1" />
            <path d="M17 17H7V7" key="1org7z" />
        </svg>
    );
}

export function ArrowDownRightIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m7 7 10 10" key="1fmybs" />
            <path d="M17 7v10H7" key="6fjiku" />
        </svg>
    );
}

export function ArrowLeftRightIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M8 3 4 7l4 4" key="9rb6wj" />
            <path d="M4 7h16" key="6tx8e3" />
            <path d="m16 21 4-4-4-4" key="siv7j2" />
            <path d="M20 17H4" key="h6l3hr" />
        </svg>
    );
}

export function ArrowRightIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M5 12h14" key="1ays0h" />
            <path d="m12 5 7 7-7 7" key="xquz4c" />
        </svg>
    );
}

export function ArrowRightLeftIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m16 3 4 4-4 4" key="1x1c3m" />
            <path d="M20 7H4" key="zbl0bi" />
            <path d="m8 21-4-4 4-4" key="h9nckh" />
            <path d="M4 17h16" key="g4d7ey" />
        </svg>
    );
}

export function ArrowUpRightIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M7 7h10v10" key="1tivn9" />
            <path d="M7 17 17 7" key="1vkiza" />
        </svg>
    );
}

export function AwardIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"
                key="1yiouv"
            />
            <circle cx="12" cy="8" r="6" key="1vp47v" />
        </svg>
    );
}

export function BanknoteIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="20" height="12" x="2" y="6" rx="2" key="9lu3g6" />
            <circle cx="12" cy="12" r="2" key="1c9p78" />
            <path d="M6 12h.01M18 12h.01" key="113zkx" />
        </svg>
    );
}

export function BarChart3Icon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 3v16a2 2 0 0 0 2 2h16" key="c24i48" />
            <path d="M18 17V9" key="2bz60n" />
            <path d="M13 17V5" key="1frdt8" />
            <path d="M8 17v-3" key="17ska0" />
        </svg>
    );
}

export function BellRingIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M10.268 21a2 2 0 0 0 3.464 0" key="vwvbt9" />
            <path d="M22 8c0-2.3-.8-4.3-2-6" key="5bb3ad" />
            <path
                d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
                key="11g9vi"
            />
            <path d="M4 2C2.8 3.7 2 5.7 2 8" key="tap9e0" />
        </svg>
    );
}

export function BluetoothIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m7 7 10 10-5 5V2l5 5L7 17" key="1q5490" />
        </svg>
    );
}

export function Building2Icon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" key="1b4qmf" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" key="i71pzd" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" key="10jefs" />
            <path d="M10 6h4" key="1itunk" />
            <path d="M10 10h4" key="tcdvrf" />
            <path d="M10 14h4" key="kelpxr" />
            <path d="M10 18h4" key="1ulq68" />
        </svg>
    );
}

export function CakeIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" key="1w3rig" />
            <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" key="n2jgmb" />
            <path d="M2 21h20" key="1nyx9w" />
            <path d="M7 8v3" key="1qtyvj" />
            <path d="M12 8v3" key="hwp4zt" />
            <path d="M17 8v3" key="1i6e5u" />
            <path d="M7 4h.01" key="1bh4kh" />
            <path d="M12 4h.01" key="1ujb9j" />
            <path d="M17 4h.01" key="1upcoc" />
        </svg>
    );
}

export function CalculatorIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="16" height="20" x="4" y="2" rx="2" key="1nb95v" />
            <line x1="8" x2="16" y1="6" y2="6" key="x4nwl0" />
            <line x1="16" x2="16" y1="14" y2="18" key="wjye3r" />
            <path d="M16 10h.01" key="1m94wz" />
            <path d="M12 10h.01" key="1nrarc" />
            <path d="M8 10h.01" key="19clt8" />
            <path d="M12 14h.01" key="1etili" />
            <path d="M8 14h.01" key="6423bh" />
            <path d="M12 18h.01" key="mhygvu" />
            <path d="M8 18h.01" key="lrp35t" />
        </svg>
    );
}

export function CalendarClockIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" key="1osxxc" />
            <path d="M16 2v4" key="4m81vk" />
            <path d="M8 2v4" key="1cmpym" />
            <path d="M3 10h5" key="r794hk" />
            <path d="M17.5 17.5 16 16.3V14" key="akvzfd" />
            <circle cx="16" cy="16" r="6" key="qoo3c4" />
        </svg>
    );
}

export function CalendarDaysIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M8 2v4" key="1cmpym" />
            <path d="M16 2v4" key="4m81vk" />
            <rect width="18" height="18" x="3" y="4" rx="2" key="1hopcy" />
            <path d="M3 10h18" key="8toen8" />
            <path d="M8 14h.01" key="6423bh" />
            <path d="M12 14h.01" key="1etili" />
            <path d="M16 14h.01" key="1gbofw" />
            <path d="M8 18h.01" key="lrp35t" />
            <path d="M12 18h.01" key="mhygvu" />
            <path d="M16 18h.01" key="kzsmim" />
        </svg>
    );
}

export function CalendarIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M8 2v4" key="1cmpym" />
            <path d="M16 2v4" key="4m81vk" />
            <rect width="18" height="18" x="3" y="4" rx="2" key="1hopcy" />
            <path d="M3 10h18" key="8toen8" />
        </svg>
    );
}

export function CalendarOffIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.82-1.18" key="16swn3" />
            <path d="M21 15.5V6a2 2 0 0 0-2-2H9.5" key="yhw86o" />
            <path d="M16 2v4" key="4m81vk" />
            <path d="M3 10h7" key="1wap6i" />
            <path d="M21 10h-5.5" key="quycpq" />
            <path d="m2 2 20 20" key="1ooewy" />
        </svg>
    );
}

export function CameraIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
                key="1tc9qg"
            />
            <circle cx="12" cy="13" r="3" key="1vg3eu" />
        </svg>
    );
}

export function CheckCircle2Icon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="10" key="1mglay" />
            <path d="m9 12 2 2 4-4" key="dzmm74" />
        </svg>
    );
}

export function CheckIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M20 6 9 17l-5-5" key="1gmf2c" />
        </svg>
    );
}

export function CheckSquareIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5" key="1uzm8b" />
            <path d="m9 11 3 3L22 4" key="1pflzl" />
        </svg>
    );
}

export function ChevronLeftIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m15 18-6-6 6-6" key="1wnfg3" />
        </svg>
    );
}

export function ChevronUpIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m18 15-6-6-6 6" key="153udz" />
        </svg>
    );
}

export function CircleIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="10" key="1mglay" />
        </svg>
    );
}

export function ClipboardListIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" key="tgr4d6" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" key="116196" />
            <path d="M12 11h4" key="1jrz19" />
            <path d="M12 16h4" key="n85exb" />
            <path d="M8 11h.01" key="1dfujw" />
            <path d="M8 16h.01" key="18s6g9" />
        </svg>
    );
}

export function Clock3Icon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="10" key="1mglay" />
            <polyline points="12 6 12 12 16.5 12" key="1aq6pp" />
        </svg>
    );
}

export function CoffeeIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M10 2v2" key="7u0qdc" />
            <path d="M14 2v2" key="6buw04" />
            <path
                d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"
                key="pwadti"
            />
            <path d="M6 2v2" key="colzsn" />
        </svg>
    );
}

export function CopyIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" key="17jyea" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" key="zix9uf" />
        </svg>
    );
}

export function CreditCardIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="20" height="14" x="2" y="5" rx="2" key="ynyp8z" />
            <line x1="2" x2="22" y1="10" y2="10" key="1b3vmo" />
        </svg>
    );
}

export function CrownIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"
                key="1vdc57"
            />
            <path d="M5 21h14" key="11awu3" />
        </svg>
    );
}

export function DeleteIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
                key="1yo7s0"
            />
            <path d="m12 9 6 6" key="anjzzh" />
            <path d="m18 9-6 6" key="1fp51s" />
        </svg>
    );
}

export function DollarSignIcon(p: P) {
    return (
        <svg {...base(p)}>
            <line x1="12" x2="12" y1="2" y2="22" key="7eqyqh" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" key="1b0p4s" />
        </svg>
    );
}

export function DownloadIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" key="ih7n3h" />
            <polyline points="7 10 12 15 17 10" key="2ggqvy" />
            <line x1="12" x2="12" y1="15" y2="3" key="1vk2je" />
        </svg>
    );
}

export function ExternalLinkIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" key="ext1" />
            <polyline points="15 3 21 3 21 9" key="ext2" />
            <line x1="10" x2="21" y1="14" y2="3" key="ext3" />
        </svg>
    );
}

export function Edit2Icon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
                key="1a8usu"
            />
        </svg>
    );
}

export function EyeIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                key="1nclc0"
            />
            <circle cx="12" cy="12" r="3" key="1v7zrd" />
        </svg>
    );
}

export function EyeOffIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
                key="ct8e1f"
            />
            <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" key="151rxh" />
            <path
                d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
                key="13bj9a"
            />
            <path d="m2 2 20 20" key="1ooewy" />
        </svg>
    );
}

export function FileBadgeIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" key="12ixgl" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" key="tnqrlb" />
            <path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" key="u0c8gj" />
            <path d="M7 16.5 8 22l-3-1-3 1 1-5.5" key="5gm2nr" />
        </svg>
    );
}

export function FileDownIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" key="1rqfz7" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" key="tnqrlb" />
            <path d="M12 18v-6" key="17g6i2" />
            <path d="m9 15 3 3 3-3" key="1npd3o" />
        </svg>
    );
}

export function FileJsonIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" key="1rqfz7" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" key="tnqrlb" />
            <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" key="1oajmo" />
            <path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" key="mpwhp6" />
        </svg>
    );
}

export function FileSpreadsheetIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" key="1rqfz7" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" key="tnqrlb" />
            <path d="M8 13h2" key="yr2amv" />
            <path d="M14 13h2" key="un5t4a" />
            <path d="M8 17h2" key="2yhykz" />
            <path d="M14 17h2" key="10kma7" />
        </svg>
    );
}

export function FileTextIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" key="1rqfz7" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" key="tnqrlb" />
            <path d="M10 9H8" key="b1mrlr" />
            <path d="M16 13H8" key="t4e002" />
            <path d="M16 17H8" key="z1uh3a" />
        </svg>
    );
}

export function FileUpIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" key="1rqfz7" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" key="tnqrlb" />
            <path d="M12 12v6" key="3ahymv" />
            <path d="m15 15-3-3-3 3" key="15xj92" />
        </svg>
    );
}

export function FileXIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" key="1rqfz7" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" key="tnqrlb" />
            <path d="m14.5 12.5-5 5" key="b62r18" />
            <path d="m9.5 12.5 5 5" key="1rk7el" />
        </svg>
    );
}

export function FilterIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"
                key="sc7q7i"
            />
        </svg>
    );
}

export function GlassWaterIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z"
                key="p55z4y"
            />
            <path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" key="mjntcy" />
        </svg>
    );
}

export function GlobeIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="10" key="1mglay" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" key="13o1zl" />
            <path d="M2 12h20" key="9i4pu4" />
        </svg>
    );
}

export function GripVerticalIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="9" cy="12" r="1" key="1vctgf" />
            <circle cx="9" cy="5" r="1" key="hp0tcf" />
            <circle cx="9" cy="19" r="1" key="fkjjf6" />
            <circle cx="15" cy="12" r="1" key="1tmaij" />
            <circle cx="15" cy="5" r="1" key="19l28e" />
            <circle cx="15" cy="19" r="1" key="f4zoj3" />
        </svg>
    );
}

export function HelpCircleIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="10" key="1mglay" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" key="1u773s" />
            <path d="M12 17h.01" key="p32p05" />
        </svg>
    );
}

export function InfoIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="10" key="1mglay" />
            <path d="M12 16v-4" key="1dtifu" />
            <path d="M12 8h.01" key="e9boi3" />
        </svg>
    );
}

export function KeyIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" key="g0fldk" />
            <path d="m21 2-9.6 9.6" key="1j0ho8" />
            <circle cx="7.5" cy="15.5" r="5.5" key="yqb3hr" />
        </svg>
    );
}

export function LayersIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"
                key="zw3jo"
            />
            <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" key="1wduqc" />
            <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" key="kqbvx6" />
        </svg>
    );
}

export function LayoutGridIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="7" height="7" x="3" y="3" rx="1" key="1g98yp" />
            <rect width="7" height="7" x="14" y="3" rx="1" key="6d4xhi" />
            <rect width="7" height="7" x="14" y="14" rx="1" key="nxv5o0" />
            <rect width="7" height="7" x="3" y="14" rx="1" key="1bb6yr" />
        </svg>
    );
}

export function LayoutListIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="7" height="7" x="3" y="3" rx="1" key="1g98yp" />
            <rect width="7" height="7" x="3" y="14" rx="1" key="1bb6yr" />
            <path d="M14 4h7" key="3xa0d5" />
            <path d="M14 9h7" key="1icrd9" />
            <path d="M14 15h7" key="1mj8o2" />
            <path d="M14 20h7" key="11slyb" />
        </svg>
    );
}

export function LayoutTemplateIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="18" height="7" x="3" y="3" rx="1" key="f1a2em" />
            <rect width="9" height="7" x="3" y="14" rx="1" key="jqznyg" />
            <rect width="5" height="7" x="16" y="14" rx="1" key="q5h2i8" />
        </svg>
    );
}

export function Link2Icon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" key="1cjeqo" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" key="19qd67" />
        </svg>
    );
}

export function LocateFixedIcon(p: P) {
    return (
        <svg {...base(p)}>
            <line x1="2" x2="5" y1="12" y2="12" key="bvdh0s" />
            <line x1="19" x2="22" y1="12" y2="12" key="1tbv5k" />
            <line x1="12" x2="12" y1="2" y2="5" key="11lu5j" />
            <line x1="12" x2="12" y1="19" y2="22" key="x3vr5v" />
            <circle cx="12" cy="12" r="7" key="fim9np" />
            <circle cx="12" cy="12" r="3" key="1v7zrd" />
        </svg>
    );
}

export function MailIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="20" height="16" x="2" y="4" rx="2" key="18n3k1" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" key="1ocrg3" />
        </svg>
    );
}

export function MapPinIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
                key="1r0f0z"
            />
            <circle cx="12" cy="10" r="3" key="ilqhr7" />
        </svg>
    );
}

export function MessageCircleIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" key="vv11sd" />
        </svg>
    );
}

export function MessageSquareIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" key="1lielz" />
        </svg>
    );
}

export function MicIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" key="131961" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" key="1vc78b" />
            <line x1="12" x2="12" y1="19" y2="22" key="x3vr5v" />
        </svg>
    );
}

export function MinusIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M5 12h14" key="1ays0h" />
        </svg>
    );
}

export function MoreHorizontalIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="1" key="41hilf" />
            <circle cx="19" cy="12" r="1" key="1wjl8i" />
            <circle cx="5" cy="12" r="1" key="1pcz8c" />
        </svg>
    );
}

export function PackageSearchIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
                key="e7tb2h"
            />
            <path d="m7.5 4.27 9 5.15" key="1c824w" />
            <polyline points="3.29 7 12 12 20.71 7" key="ousv84" />
            <line x1="12" x2="12" y1="22" y2="12" key="a4e8g8" />
            <circle cx="18.5" cy="15.5" r="2.5" key="b5zd12" />
            <path d="M20.27 17.27 22 19" key="1l4muz" />
        </svg>
    );
}

export function PackageXIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
                key="e7tb2h"
            />
            <path d="m7.5 4.27 9 5.15" key="1c824w" />
            <polyline points="3.29 7 12 12 20.71 7" key="ousv84" />
            <line x1="12" x2="12" y1="22" y2="12" key="a4e8g8" />
            <path d="m17 13 5 5m-5 0 5-5" key="im3w4b" />
        </svg>
    );
}

export function PaletteIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" key="1okk4w" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" key="f64h9f" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" key="fotxhn" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" key="qy21gx" />
            <path
                d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"
                key="12rzf8"
            />
        </svg>
    );
}

export function PartyPopperIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M5.8 11.3 2 22l10.7-3.79" key="gwxi1d" />
            <path d="M4 3h.01" key="1vcuye" />
            <path d="M22 8h.01" key="1mrtc2" />
            <path d="M15 2h.01" key="1cjtqr" />
            <path d="M22 20h.01" key="1mrys2" />
            <path
                d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"
                key="hbicv8"
            />
            <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" key="1i94pl" />
            <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" key="1cofks" />
            <path
                d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"
                key="4kbmks"
            />
        </svg>
    );
}

export function PercentIcon(p: P) {
    return (
        <svg {...base(p)}>
            <line x1="19" x2="5" y1="5" y2="19" key="1x9vlm" />
            <circle cx="6.5" cy="6.5" r="2.5" key="4mh3h7" />
            <circle cx="17.5" cy="17.5" r="2.5" key="1mdrzq" />
        </svg>
    );
}

export function PhoneCallIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                key="foiqr5"
            />
            <path d="M14.05 2a9 9 0 0 1 8 7.94" key="vmijpz" />
            <path d="M14.05 6A5 5 0 0 1 18 10" key="13nbpp" />
        </svg>
    );
}

export function PhoneIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                key="foiqr5"
            />
        </svg>
    );
}

export function PieChartIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"
                key="pzmjnu"
            />
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" key="k2fpak" />
        </svg>
    );
}

export function PizzaIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m12 14-1 1" key="11onhr" />
            <path d="m13.75 18.25-1.25 1.42" key="1yisr3" />
            <path d="M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12" key="1qtqk6" />
            <path d="M18.8 9.3a1 1 0 0 0 2.1 7.7" key="fbbbr2" />
            <path
                d="M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z"
                key="1hyfdd"
            />
        </svg>
    );
}

export function PlaneIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
                key="1v9wt8"
            />
        </svg>
    );
}

export function PlayIcon(p: P) {
    return (
        <svg {...base(p)}>
            <polygon points="6 3 20 12 6 21 6 3" key="1oa8hb" />
        </svg>
    );
}

export function PrinterIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" key="143wyd" />
            <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" key="1itne7" />
            <rect x="6" y="14" width="12" height="8" rx="1" key="1ue0tg" />
        </svg>
    );
}

export function QrCodeIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="5" height="5" x="3" y="3" rx="1" key="1tu5fj" />
            <rect width="5" height="5" x="16" y="3" rx="1" key="1v8r4q" />
            <rect width="5" height="5" x="3" y="16" rx="1" key="1x03jg" />
            <path d="M21 16h-3a2 2 0 0 0-2 2v3" key="177gqh" />
            <path d="M21 21v.01" key="ents32" />
            <path d="M12 7v3a2 2 0 0 1-2 2H7" key="8crl2c" />
            <path d="M3 12h.01" key="nlz23k" />
            <path d="M12 3h.01" key="n36tog" />
            <path d="M12 16v.01" key="133mhm" />
            <path d="M16 12h1" key="1slzba" />
            <path d="M21 12v.01" key="1lwtk9" />
            <path d="M12 21v-1" key="1880an" />
        </svg>
    );
}

export function QuoteIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"
                key="rib7q0"
            />
            <path
                d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"
                key="1ymkrd"
            />
        </svg>
    );
}

export function ReceiptIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" key="q3az6g" />
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" key="1h4pet" />
            <path d="M12 17.5v-11" key="1jc1ny" />
        </svg>
    );
}

export function RefreshCwIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" key="v9h5vc" />
            <path d="M21 3v5h-5" key="1q7to0" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" key="3uifl3" />
            <path d="M8 16H3v5" key="1cv678" />
        </svg>
    );
}

export function RotateCcwIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" key="1357e3" />
            <path d="M3 3v5h5" key="1xhq8a" />
        </svg>
    );
}

export function SaveIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
                key="1c8476"
            />
            <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" key="1ydtos" />
            <path d="M7 3v4a1 1 0 0 0 1 1h7" key="t51u73" />
        </svg>
    );
}

export function ScanLineIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 7V5a2 2 0 0 1 2-2h2" key="aa7l1z" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" key="4qcy5o" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" key="6vwrx8" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" key="ioqczr" />
            <path d="M7 12h10" key="b7w52i" />
        </svg>
    );
}

export function SendIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
                key="1ffxy3"
            />
            <path d="m21.854 2.147-10.94 10.939" key="12cjpa" />
        </svg>
    );
}

export function Settings2Icon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                key="1qme2f"
            />
            <circle cx="12" cy="12" r="3" key="1v7zrd" />
        </svg>
    );
}

export function Share2Icon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" key="1b2hhj" />
            <polyline points="16 6 12 2 8 6" key="m901s6" />
            <line x1="12" x2="12" y1="2" y2="15" key="1p0rca" />
        </svg>
    );
}

export function ShoppingBagIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" key="hou9p0" />
            <path d="M3 6h18" key="d0wm0j" />
            <path d="M16 10a4 4 0 0 1-8 0" key="1ltviw" />
        </svg>
    );
}

export function ShoppingCartIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="8" cy="21" r="1" key="jimo8o" />
            <circle cx="19" cy="21" r="1" key="13723u" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" key="9zh506" />
        </svg>
    );
}

export function SlidersHorizontalIcon(p: P) {
    return (
        <svg {...base(p)}>
            <line x1="21" x2="14" y1="4" y2="4" key="obuewd" />
            <line x1="10" x2="3" y1="4" y2="4" key="1q6298" />
            <line x1="21" x2="12" y1="12" y2="12" key="1iu8h1" />
            <line x1="8" x2="3" y1="12" y2="12" key="ntss68" />
            <line x1="21" x2="16" y1="20" y2="20" key="14d8ph" />
            <line x1="12" x2="3" y1="20" y2="20" key="m0wm8r" />
            <line x1="14" x2="14" y1="2" y2="6" key="14e1ph" />
            <line x1="8" x2="8" y1="10" y2="14" key="1i6ji0" />
            <line x1="16" x2="16" y1="18" y2="22" key="1lctlv" />
        </svg>
    );
}

export function SparklesIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                key="4pj2yx"
            />
            <path d="M20 3v4" key="1olli1" />
            <path d="M22 5h-4" key="1gvqau" />
            <path d="M4 17v2" key="vumght" />
            <path d="M5 18H3" key="zchphs" />
        </svg>
    );
}

export function SquareIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="18" height="18" x="3" y="3" rx="2" key="afitv7" />
        </svg>
    );
}

export function StarIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
                key="r04s7s"
            />
        </svg>
    );
}

export function TerminalSquareIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="m7 11 2-2-2-2" key="1lz0vl" />
            <path d="M11 13h4" key="1p7l4v" />
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" key="1m3agn" />
        </svg>
    );
}

export function Trash2Icon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M3 6h18" key="d0wm0j" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" key="4alrt4" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" key="v07s0e" />
        </svg>
    );
}

export function TrendingDownIcon(p: P) {
    return (
        <svg {...base(p)}>
            <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" key="1r2t7k" />
            <polyline points="16 17 22 17 22 11" key="11uiuu" />
        </svg>
    );
}

export function TrophyIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" key="17hqa7" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" key="lmptdp" />
            <path d="M4 22h16" key="57wxv0" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" key="1nw9bq" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" key="1np0yb" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" key="u46fv3" />
        </svg>
    );
}

export function TruckIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" key="wrbu53" />
            <path d="M15 18H9" key="1lyqi6" />
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" key="lysw3i" />
            <circle cx="17" cy="18" r="2" key="332jqn" />
            <circle cx="7" cy="18" r="2" key="19iecd" />
        </svg>
    );
}

export function UploadCloudIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M12 13v8" key="1l5pq0" />
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" key="1pljnt" />
            <path d="m8 17 4-4 4 4" key="1quai1" />
        </svg>
    );
}

export function UsbIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="10" cy="7" r="1" key="dypaad" />
            <circle cx="4" cy="20" r="1" key="22iqad" />
            <path d="M4.7 19.3 19 5" key="1enqfc" />
            <path d="m21 3-3 1 2 2Z" key="d3ov82" />
            <path d="M9.26 7.68 5 12l2 5" key="1esawj" />
            <path d="m10 14 5 2 3.5-3.5" key="v8oal5" />
            <path d="m18 12 1-1 1 1-1 1Z" key="1bh22v" />
        </svg>
    );
}

export function UserCheckIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" key="1yyitq" />
            <circle cx="9" cy="7" r="4" key="nufk8" />
            <polyline points="16 11 18 13 22 9" key="1pwet4" />
        </svg>
    );
}

export function UserIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" key="975kel" />
            <circle cx="12" cy="7" r="4" key="17ys0d" />
        </svg>
    );
}

export function UserPlusIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" key="1yyitq" />
            <circle cx="9" cy="7" r="4" key="nufk8" />
            <line x1="19" x2="19" y1="8" y2="14" key="1bvyxn" />
            <line x1="22" x2="16" y1="11" y2="11" key="1shjgl" />
        </svg>
    );
}

export function Volume2Icon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
                key="uqj9uw"
            />
            <path d="M16 9a5 5 0 0 1 0 6" key="1q6k2b" />
            <path d="M19.364 18.364a9 9 0 0 0 0-12.728" key="ijwkga" />
        </svg>
    );
}

export function VolumeXIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
                key="uqj9uw"
            />
            <line x1="22" x2="16" y1="9" y2="15" key="1ewh16" />
            <line x1="16" x2="22" y1="9" y2="15" key="5ykzw1" />
        </svg>
    );
}

export function WalletIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path
                d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"
                key="18etb6"
            />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" key="xoc0q4" />
        </svg>
    );
}

export function WifiIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M12 20h.01" key="zekei9" />
            <path d="M2 8.82a15 15 0 0 1 20 0" key="dnpr2z" />
            <path d="M5 12.859a10 10 0 0 1 14 0" key="1x1e6c" />
            <path d="M8.5 16.429a5 5 0 0 1 7 0" key="1bycff" />
        </svg>
    );
}

export function WineIcon(p: P) {
    return (
        <svg {...base(p)}>
            <path d="M8 22h8" key="rmew8v" />
            <path d="M7 10h10" key="1101jm" />
            <path d="M12 15v7" key="t2xh3l" />
            <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" key="10ffi3" />
        </svg>
    );
}

export function XCircleIcon(p: P) {
    return (
        <svg {...base(p)}>
            <circle cx="12" cy="12" r="10" key="1mglay" />
            <path d="m15 9-6 6" key="1uzhvr" />
            <path d="m9 9 6 6" key="z0biqf" />
        </svg>
    );
}

export function ImageIcon(p: P) {
    return (
        <svg {...base(p)}>
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" key="1m3agn" />
            <circle cx="9" cy="9" r="2" key="af1f0g" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" key="1xmnt7" />
        </svg>
    );
}
