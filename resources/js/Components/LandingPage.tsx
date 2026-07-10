import React from 'react';
import { Head, Link } from '@inertiajs/react';

/* ── Inline icons (no lucide — avoids AI-template look) ── */
function FlameIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
            <path d="M12 2c1.2 3-1 4.2-1 4.2S8 7.8 8 11a4 4 0 008 0c0-1.6-1-2.7-1-2.7s.6 3-2 3c0-3.2-1-5.5-1-9.3Z" />
        </svg>
    );
}
function BowlIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 11h18a9 9 0 0 1-18 0Z" />
            <path d="M7 7c0-1.5 1-2 2-2M12 6V4M17 7c0-1.5-1-2-2-2" />
        </svg>
    );
}
function ArrowIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}
function CheckIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}

/* ── Feature illustrations: real photos with SVG fallback ── */
function POSIllustration() {
    return (
        <img
            src="/images/landing/feat_pos.jpg"
            alt="Kasir cepat: mesin kasir, koin, dan struk"
            className="w-full h-40 rounded-3xl object-cover"
            onError={(e: any) => {
                e.currentTarget.outerHTML = `<svg viewBox="0 0 200 130" class="w-full h-40 rounded-3xl" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="78" width="160" height="34" rx="10" fill="#FF5B35"/><rect x="20" y="70" width="160" height="14" rx="7" fill="#E04825"/><g transform="translate(34 30)"><ellipse cx="20" cy="40" rx="26" ry="11" fill="#D97706"/><ellipse cx="20" cy="34" rx="26" ry="11" fill="#F59E0B"/><ellipse cx="20" cy="28" rx="26" ry="11" fill="#FBBF24"/><ellipse cx="20" cy="22" rx="26" ry="11" fill="#FCD34D"/><text x="20" y="30" font-size="16" font-weight="900" fill="#92400E" text-anchor="middle">Rp</text></g><g transform="translate(118 18)"><path d="M0 0h50v78l-8-6-9 6-8-6-8 6-9-6z" fill="#FFF" stroke="#E5E7EB" stroke-width="2"/><rect x="10" y="12" width="30" height="4" rx="2" fill="#FF5B35"/><rect x="10" y="24" width="22" height="3" rx="1.5" fill="#D1D5DB"/><rect x="10" y="34" width="26" height="3" rx="1.5" fill="#D1D5DB"/><rect x="10" y="56" width="30" height="6" rx="3" fill="#10B981"/></g></svg>`;
            }}
        />
    );
}
function TabletIllustration() {
    return (
        <img
            src="/images/landing/feat_dapur.jpg"
            alt="Dapur: layar KDS menampilkan antrian pesanan"
            className="w-full h-40 rounded-3xl object-cover"
            onError={(e: any) => {
                e.currentTarget.outerHTML = `<svg viewBox="0 0 200 130" class="w-full h-40 rounded-3xl" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M95 122l10 0 4 8h-18z" fill="#7C4A2D"/><rect x="38" y="14" width="124" height="92" rx="14" fill="#2B2523"/><rect x="46" y="22" width="108" height="76" rx="8" fill="#FFFBF5"/><rect x="54" y="30" width="60" height="8" rx="4" fill="#FF5B35"/><rect x="54" y="46" width="44" height="22" rx="5" fill="#FF5B35"/><rect x="54" y="74" width="44" height="18" rx="5" fill="#F59E0B"/><rect x="104" y="46" width="44" height="22" rx="5" fill="#10B981"/><rect x="104" y="74" width="44" height="18" rx="5" fill="#D97706"/><circle cx="150" cy="30" r="9" fill="#FF5B35"/><path d="M146 30l3 3 5-6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            }}
        />
    );
}
function FoodPlateIllustration() {
    return (
        <img
            src="/images/landing/feat_menu.jpg"
            alt="Buku menu digital: piring makanan dan QR code"
            className="w-full h-40 rounded-3xl object-cover"
            onError={(e: any) => {
                e.currentTarget.outerHTML = `<svg viewBox="0 0 200 130" class="w-full h-40 rounded-3xl" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="78" cy="70" r="50" fill="#FFF" stroke="#E5C9B0" stroke-width="3"/><circle cx="78" cy="70" r="40" fill="#FFF7F0" stroke="#E5C9B0" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M55 58c6-9 24-9 30-2s2 20-6 24-20 2-24-6c-4-6 0-16 0-16Z" fill="#B45309"/><path d="M60 64c4-5 14-5 18-1s1 12-5 14-12 1-14-5Z" fill="#D97706"/><circle cx="98" cy="56" r="9" fill="#10B981"/><circle cx="106" cy="64" r="7" fill="#34D399"/><circle cx="92" cy="66" r="6" fill="#6EE7B7"/><circle cx="78" cy="86" r="9" fill="#EF4444"/><path d="M132 44c5 7 5 17 0 24l-12-12z" fill="#FBBF24"/><g transform="translate(140 84)"><rect x="0" y="0" width="28" height="28" rx="4" fill="#2B2523"/><rect x="5" y="5" width="7" height="7" fill="#fff"/><rect x="16" y="5" width="7" height="7" fill="#fff"/><rect x="5" y="16" width="7" height="7" fill="#fff"/><rect x="16" y="16" width="4" height="4" fill="#fff"/><rect x="22" y="16" width="3" height="3" fill="#fff"/></g></svg>`;
            }}
        />
    );
}
function ChartIllustration() {
    return (
        <img
            src="/images/landing/feat_laporan.jpg"
            alt="Laporan keuangan otomatis: grafik omset"
            className="w-full h-40 rounded-3xl object-cover"
            onError={(e: any) => {
                e.currentTarget.outerHTML = `<svg viewBox="0 0 200 130" class="w-full h-40 rounded-3xl" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="24" y="20" width="120" height="90" rx="12" fill="#FFF" stroke="#E5C9B0" stroke-width="2.5"/><rect x="36" y="32" width="50" height="7" rx="3.5" fill="#FF5B35"/><rect x="38" y="78" width="16" height="24" rx="3" fill="#F59E0B"/><rect x="62" y="66" width="16" height="36" rx="3" fill="#FF5B35"/><rect x="86" y="54" width="16" height="48" rx="3" fill="#D97706"/><rect x="110" y="44" width="16" height="58" rx="3" fill="#10B981"/><path d="M40 70l20-16 16-12" stroke="#FF5B35" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(152 24)"><circle cx="16" cy="16" r="16" fill="#2B2523"/><path d="M13 8a8 8 0 0 0 8 14 8 8 0 1 1-8-14Z" fill="#FBBF24"/></g></svg>`;
            }}
        />
    );
}
function EmployeeIllustration() {
    return (
        <img
            src="/images/landing/feat_karyawan.jpg"
            alt="Kelola karyawan: jadwal dan performa staf"
            className="w-full h-40 rounded-3xl object-cover"
            onError={(e: any) => {
                e.currentTarget.outerHTML = `<svg viewBox="0 0 200 130" class="w-full h-40 rounded-3xl" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(28 38)"><circle cx="16" cy="16" r="13" fill="#F59E0B"/><path d="M2 54c0-8 6-14 14-14s14 6 14 14v6H2z" fill="#F59E0B" opacity="0.55"/></g><g transform="translate(150 38)"><circle cx="16" cy="16" r="13" fill="#10B981"/><path d="M2 54c0-8 6-14 14-14s14 6 14 14v6H2z" fill="#10B981" opacity="0.55"/></g><g transform="translate(82 24)"><circle cx="20" cy="20" r="17" fill="#FF5B35"/><path d="M0 66c0-10 9-18 20-18s20 8 20 18v8H0z" fill="#FF5B35" opacity="0.75"/><circle cx="20" cy="20" r="17" fill="none" stroke="#fff" stroke-width="2"/></g><g transform="translate(150 18)"><circle cx="14" cy="14" r="14" fill="#FFF" stroke="#FF5B35" stroke-width="2.5"/><path d="M14 8v6l4 3" stroke="#FF5B35" stroke-width="2.4" stroke-linecap="round" fill="none"/></g></svg>`;
            }}
        />
    );
}
function MapPinsIllustration() {
    return (
        <img
            src="/images/landing/feat_multioutlet.jpg"
            alt="Multi-outlet: kelola cabang dari satu dashboard"
            className="w-full h-40 rounded-3xl object-cover"
            onError={(e: any) => {
                e.currentTarget.outerHTML = `<svg viewBox="0 0 200 130" class="w-full h-40 rounded-3xl" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 60l40-26 50 18 50-20v56l-40 22-50-18-50 24z" fill="#F6E4D4" stroke="#E0C2A8" stroke-width="2.5"/><path d="M56 34v56M106 52v56" stroke="#E0C2A8" stroke-width="2" stroke-dasharray="4 4"/><path d="M28 54l34-16 40 14 44-18" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M50 78l52 22" stroke="#fff" stroke-width="5" stroke-linecap="round"/><g transform="translate(56 36)"><path d="M0 0c-7 0-12 5-12 12 0 9 12 22 12 22s12-13 12-22c0-7-5-12-12-12Z" fill="#FF5B35"/><circle cx="0" cy="11" r="4" fill="#fff"/></g><g transform="translate(120 58)"><path d="M0 0c-6 0-11 4-11 11 0 8 11 20 11 20s11-12 11-20c0-7-5-11-11-11Z" fill="#D97706"/><circle cx="0" cy="10" r="3.5" fill="#fff"/></g><g transform="translate(150 40)"><path d="M0 0c-6 0-11 4-11 11 0 8 11 20 11 20s11-12 11-20c0-7-5-11-11-11Z" fill="#EF4444"/><circle cx="0" cy="10" r="3.5" fill="#fff"/></g></svg>`;
            }}
        />
    );
}

/* ── Step illustrations: user-supplied transparent vector art ── */
function Step1Illustration() {
    return (
        <img
            src="/images/landing/step_step1.png"
            alt="Instal-login: buka Restoku di browser atau tablet kasir"
            className="w-full h-44 object-contain"
            onError={(e: any) => {
                e.currentTarget.outerHTML = `<svg viewBox="0 0 140 100" class="w-full h-44" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="80" width="108" height="6" rx="3" fill="#7C4A2D"/><path d="M48 58h44l8 22H40z" fill="#374151"/><rect x="52" y="52" width="36" height="9" rx="2" fill="#1F2937"/><rect x="55" y="54" width="30" height="5" rx="1.5" fill="#10B981"/><rect x="58" y="28" width="34" height="20" rx="4" fill="#FF5B35"/><path d="M66 42l5 5 10-10" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="30" cy="40" r="11" fill="#F59E0B"/><path d="M18 66c0-9 5-15 12-15s12 6 12 15v14H18z" fill="#FF5B35" opacity="0.85"/></svg>`;
            }}
        />
    );
}
function Step2Illustration() {
    return (
        <img
            src="/images/landing/step_step2.png"
            alt="Taruh QR di meja: tamu scan langsung dari meja"
            className="w-full h-44 object-contain"
            onError={(e: any) => {
                e.currentTarget.outerHTML = `<svg viewBox="0 0 140 100" class="w-full h-44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 86h112v5H14z" fill="#7C4A2D"/><g transform="translate(18 52)"><rect x="0" y="0" width="34" height="34" rx="5" fill="#fff" stroke="#2B2523" stroke-width="2.5"/><rect x="6" y="6" width="9" height="9" fill="#2B2523"/><rect x="19" y="6" width="9" height="9" fill="#2B2523"/><rect x="6" y="19" width="9" height="9" fill="#2B2523"/><rect x="19" y="19" width="6" height="6" fill="#2B2523"/><rect x="27" y="19" width="3" height="3" fill="#2B2523"/></g><path d="M62 56l24-18" stroke="#FF5B35" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="4 3"/><g transform="translate(94 24)"><rect x="0" y="6" width="18" height="34" rx="5" fill="#374151"/><rect x="3" y="10" width="12" height="26" rx="2" fill="#10B981"/><circle cx="9" cy="46" r="2.5" fill="#fff"/></g><path d="M80 46c9-4 19-1 23 7l-5 8c-8-4-15-4-21-10z" fill="#F59E0B"/><circle cx="106" cy="74" r="9" fill="#D97706"/><path d="M97 92c0-8 4-13 11-13s11 5 11 13v8H97z" fill="#FF5B35" opacity="0.85"/></svg>`;
            }}
        />
    );
}
function Step3Illustration() {
    return (
        <img
            src="/images/landing/step_step3.png"
            alt="Lihat laporan: rekap omset di dashboard owner"
            className="w-full h-44 object-contain"
            onError={(e: any) => {
                e.currentTarget.outerHTML = `<svg viewBox="0 0 140 100" class="w-full h-44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="34" cy="40" r="11" fill="#D97706"/><path d="M20 66c0-10 6-16 14-16s14 6 14 16v16H20z" fill="#FF5B35" opacity="0.85"/><rect x="70" y="30" width="52" height="40" rx="6" fill="#2B2523"/><rect x="75" y="35" width="42" height="30" rx="3" fill="#FFFBF5"/><rect x="82" y="52" width="6" height="9" rx="1.5" fill="#F59E0B"/><rect x="92" y="46" width="6" height="15" rx="1.5" fill="#FF5B35"/><rect x="102" y="40" width="6" height="21" rx="1.5" fill="#10B981"/><path d="M82 48l7-6 7-5" stroke="#FF5B35" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
            }}
        />
    );
}

export function LandingPage({ onEnter, onEnterOwner }: { onEnter: () => void; onEnterOwner: () => void }) {
    return (
        <div
            className="min-h-screen w-full bg-[#FAF5EE] flex flex-col selection:bg-[#FF5B35]/20 text-[#2B2523] overflow-x-hidden"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
            {/* Google Fonts */}
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* ─── Header ─── */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-[#FAF5EE] border-b border-[#F2EAE0]">
                <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-[#FF5B35] text-white">
                        <BowlIcon className="size-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-[#2B2523]">Restoku</span>
                </div>
                <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#2B2523]/70">
                    <a href="#features" className="hover:text-[#FF5B35] transition-colors">
                        Fitur
                    </a>
                    <a href="#steps" className="hover:text-[#FF5B35] transition-colors">
                        Cara Kerja
                    </a>
                    <a href="#pricing" className="hover:text-[#FF5B35] transition-colors">
                        Harga
                    </a>
                    <a href="#testimoni" className="hover:text-[#FF5B35] transition-colors">
                        Testimoni
                    </a>
                </nav>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onEnterOwner}
                        className="hidden md:block text-sm font-bold text-[#2B2523]/80 hover:text-[#FF5B35] transition-colors"
                    >
                        Login Owner
                    </button>
                    <button
                        onClick={onEnter}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-[#FF5B35] hover:bg-[#E04825] rounded-xl transition-all shadow-md shadow-[#FF5B35]/15"
                    >
                        Login Staf
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center">
                {/* Hero */}
                <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#F3ECE3]/30 to-[#FAF5EE] pt-16 md:pt-24 pb-20 px-6 lg:px-12">
                    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        {/* Left Content */}
                        <div className="flex flex-col items-start z-10">
                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#FF5B35]/20 bg-[#FF5B35]/5 text-[#FF5B35] text-xs font-bold mb-6">
                                <FlameIcon className="size-3 fill-[#FF5B35] text-[#FF5B35]" />
                                Untuk owner yang mau besarin bisnis kuliner
                            </div>
                            <h1
                                className="text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight text-[#2B2523] mb-6 leading-[1.12]"
                                style={{ fontFamily: '"Playfair Display", serif' }}
                            >
                                Dapur jalan,
                                <br />
                                kasir tenang,
                                <br />
                                <span className="text-[#FF5B35]">tamu puas.</span>
                            </h1>
                            <p className="text-base md:text-lg text-[#2B2523]/80 mb-8 max-w-lg leading-relaxed">
                                Restoku bantu kamu — owner — naikkan omset, layani lebih banyak tamu, dan siap buka
                                cabang baru. Satu sistem untuk kasir, dapur (KDS), dan buku menu digital dari QR di
                                meja.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
                                <button
                                    onClick={onEnter}
                                    className="px-8 py-4 bg-[#FF5B35] hover:bg-[#E04825] text-white rounded-xl font-bold text-base shadow-lg shadow-[#FF5B35]/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    Masuk sebagai Staf / Kasir <ArrowIcon className="size-5" />
                                </button>
                                <button
                                    onClick={onEnterOwner}
                                    className="px-8 py-4 bg-white hover:bg-slate-50 text-[#2B2523] border-2 border-[#F2EAE0] rounded-xl font-bold text-base transition-all flex items-center justify-center"
                                >
                                    Masuk sebagai Owner
                                </button>
                            </div>
                        </div>

                        {/* Right: composited device shot (customer phone + owner dashboard) */}
                        <div className="relative w-full flex items-center justify-center z-10">
                            <img
                                src="/images/landing/hero_devices.png"
                                alt="Tampilan Buku Menu Digital untuk tamu (kiri) dan Owner Dashboard real-time (kanan)"
                                className="w-full max-w-[560px] h-auto object-contain drop-shadow-2xl"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </section>

                {/* Statistics Banner */}
                <section className="w-full bg-[#1F1A17] py-12 px-6 border-y border-[#FAF5EE]/5 relative overflow-hidden">
                    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center mb-10">
                        {[
                            { value: '2.000+', label: 'Warung & Restoran' },
                            { value: '12,4 jt', label: 'Pesanan per bulan' },
                            { value: '98%', label: 'Retensi Pelanggan' },
                            { value: '<3 dtk', label: 'Kirim ke KDS' },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <span className="text-3xl md:text-4xl font-extrabold text-[#FF5B35] font-serif tracking-tight">
                                    {stat.value}
                                </span>
                                <span className="text-xs md:text-sm text-[#FAF5EE]/70 font-semibold mt-2">
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="max-w-6xl mx-auto border-t border-[#FAF5EE]/10 pt-8 mb-4 text-center">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#FAF5EE]/40">
                            Dipercaya oleh Ribuan Kuliner Terkenal
                        </span>
                    </div>

                    <div className="w-full overflow-hidden relative select-none">
                        <div className="flex w-max animate-marquee items-center gap-12 px-6">
                            {[
                                { src: '/images/landing/brands/waroeng.png', alt: 'Waroeng Steak' },
                                { src: '/images/landing/brands/kopi_kenangan.png', alt: 'Kopi Kenangan' },
                                { src: '/images/landing/brands/solaria.png', alt: 'Solaria' },
                                { src: '/images/landing/brands/hokben.png', alt: 'HokBen' },
                                { src: '/images/landing/brands/bakmi_gm.png', alt: 'Bakmi GM' },
                                { src: '/images/landing/brands/richeese.png', alt: 'Richeese Factory' },
                                { src: '/images/landing/brands/waroeng.png', alt: 'Waroeng Steak' },
                                { src: '/images/landing/brands/kopi_kenangan.png', alt: 'Kopi Kenangan' },
                                { src: '/images/landing/brands/solaria.png', alt: 'Solaria' },
                                { src: '/images/landing/brands/hokben.png', alt: 'HokBen' },
                                { src: '/images/landing/brands/bakmi_gm.png', alt: 'Bakmi GM' },
                                { src: '/images/landing/brands/richeese.png', alt: 'Richeese Factory' },
                            ].map((brand, i) => (
                                <img
                                    key={i}
                                    src={brand.src}
                                    alt={brand.alt}
                                    className="h-[60px] w-auto object-contain opacity-90 brightness-110 saturate-110"
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    </div>
                    <style>{`
                        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
                        .animate-marquee { display: flex; width: max-content; animation: marquee 25s linear infinite; }
                    `}</style>
                </section>

                {/* Features */}
                <section id="features" className="w-full bg-[#FAF5EE] py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2
                                className="text-3xl md:text-4xl font-black text-[#2B2523] mb-4"
                                style={{ fontFamily: '"Playfair Display", serif' }}
                            >
                                Operasional rapi, bisnis siap tumbuh
                            </h2>
                            <p className="text-sm md:text-base text-[#2B2523]/70 max-w-xl mx-auto font-medium">
                                Dari kasir sampai laporan malam — semua sistem yang bantu kamu fokus besarin bisnis,
                                bukan cuma kejar operasional harian.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                {
                                    title: 'Kasir Cepat',
                                    desc: 'Transaksi cepat, split bill, dan order dari tamu langsung masuk ke kasir.',
                                    illustration: POSIllustration,
                                },
                                {
                                    title: 'Dapur',
                                    desc: 'Atur antrian pesanan, komunikasi pesanan ke dapur dengan cepat, dan optimalkan waktu pelayanan Anda.',
                                    illustration: TabletIllustration,
                                },
                                {
                                    title: 'Buku Menu Digital',
                                    desc: 'Tamu scan QR per meja, lihat foto menu, lalu pesan sendiri. Tanpa install app.',
                                    illustration: FoodPlateIllustration,
                                },
                                {
                                    title: 'Laporan Keuangan Otomatis',
                                    desc: 'Rekap harian makan & inventori, lihat omset hari ini gampang.',
                                    illustration: ChartIllustration,
                                },
                                {
                                    title: 'Kelola Karyawan',
                                    desc: 'Atur jadwal kerja & performa staf, absensi gampang – rapi dari satu aplikasi.',
                                    illustration: EmployeeIllustration,
                                },
                                {
                                    title: 'Multi-Outlet',
                                    desc: 'Kelola semua outlet dalam satu dashboard, lihat performa masing-masing tanpa harus datangi satu per satu.',
                                    illustration: MapPinsIllustration,
                                },
                            ].map((feat, i) => {
                                const Illustration = feat.illustration;
                                return (
                                    <div
                                        key={i}
                                        className="rounded-3xl text-[#2B2523] hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
                                    >
                                        <Illustration />
                                        <h3 className="text-xl font-bold mb-4 mt-6">{feat.title}</h3>
                                        <p className="text-sm leading-relaxed text-[#2B2523]/70 font-medium flex-1">
                                            {feat.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Steps */}
                <section id="steps" className="w-full bg-[#FAF5EE] py-24 px-6 border-t border-[#F2EAE0]">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2
                                className="text-3xl md:text-4xl font-black text-[#2B2523] mb-4"
                                style={{ fontFamily: '"Playfair Display", serif' }}
                            >
                                Tiga langkah, bisnis kuliner langsung online
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12 relative">
                            {[
                                {
                                    step: '1',
                                    title: 'Instal-login',
                                    desc: 'Buka Restoku di browser atau tablet kasir, login staf dalam hitungan menit.',
                                    illustration: Step1Illustration,
                                },
                                {
                                    step: '2',
                                    title: 'Taruh QR di meja',
                                    desc: 'Cetak QR code meja otomatis dari dashboard untuk langsung melayani.',
                                    illustration: Step2Illustration,
                                },
                                {
                                    step: '3',
                                    title: 'Lihat laporan',
                                    desc: 'Rekap omset, performa menu, dan closing otomatis masuk ke dashboard owner.',
                                    illustration: Step3Illustration,
                                },
                            ].map((step, i) => {
                                const Illustration = step.illustration;
                                return (
                                    <div key={i} className="flex flex-col items-center text-center relative z-10">
                                        <div className="relative mb-6 w-full">
                                            <Illustration />
                                            <span className="absolute -top-3 -right-3 size-8 rounded-full bg-[#FF5B35] text-white text-sm font-black flex items-center justify-center shadow-md shadow-[#FF5B35]/30">
                                                {step.step}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#2B2523] mb-3">{step.title}</h3>
                                        <p className="text-sm text-[#2B2523]/70 leading-relaxed max-w-xs font-medium">
                                            {step.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section id="pricing" className="w-full bg-[#FAF5EE] py-24 px-6 border-b border-[#F2EAE0]">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2
                                className="text-3xl md:text-4xl font-black text-[#2B2523] mb-4"
                                style={{ fontFamily: '"Playfair Display", serif' }}
                            >
                                Harga jujur, ikut tumbuh bareng bisnis kamu
                            </h2>
                            <p className="text-sm text-[#2B2523]/70 font-semibold">
                                Mulai gratis 14 hari. Tanpa kartu kredit. Upgrade kapan saja.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 items-stretch">
                            {/* Basic */}
                            <div className="bg-white rounded-3xl p-8 border border-[#F2EAE0] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow text-center">
                                <div>
                                    <h3 className="text-lg font-extrabold text-[#2B2523] mb-2">Basic</h3>
                                    <div className="text-3xl font-black text-[#2B2523] mb-6">
                                        Rp 149rb<span className="text-sm font-normal text-[#2B2523]/60">/bln</span>
                                    </div>
                                    <ul className="space-y-3 mb-8 text-center">
                                        {[
                                            '1 Outlet',
                                            'Kasir & Order Tamu',
                                            'Buku Menu Digital (QR)',
                                            'Laporan Penjualan',
                                        ].map((f, i) => (
                                            <li key={i} className="text-center text-sm text-[#2B2523]/80 font-semibold">
                                                <CheckIcon className="size-4 text-[#FF5B35] shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={onEnter}
                                    className="w-full py-3.5 rounded-xl border border-[#F2EAE0] hover:border-[#FF5B35] hover:text-[#FF5B35] text-[#2B2523] font-bold transition-all text-sm mt-8"
                                >
                                    Mulai Basic
                                </button>
                            </div>

                            {/* Pro (Highlighted) */}
                            <div className="bg-[#FF5B35] text-white rounded-3xl p-8 border border-[#FF5B35] flex flex-col justify-between shadow-xl shadow-[#FF5B35]/15 relative transform md:-translate-y-4 text-center">
                                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                                    <span className="bg-[#1F1A17] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10">
                                        Paling Laris
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold mb-2">Pro</h3>
                                    <div className="text-4xl font-black mb-6">
                                        Rp 399rb<span className="text-sm font-normal text-white/80">/bln</span>
                                    </div>
                                    <ul className="space-y-3 mb-8 text-center">
                                        {[
                                            'Hingga 3 Outlet',
                                            'Laporan Stok & Keuangan',
                                            'Kelola Karyawan & Shift',
                                            'Reservasi & Antrean',
                                        ].map((f, i) => (
                                            <li key={i} className="text-center text-sm text-white/95 font-semibold">
                                                <CheckIcon className="size-4 text-white fill-white/10 shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={onEnterOwner}
                                    className="w-full py-4 rounded-xl bg-white text-[#FF5B35] hover:bg-[#FAF5EE] font-extrabold transition-all text-sm mt-8 shadow-md"
                                >
                                    Coba Pro Gratis
                                </button>
                            </div>

                            {/* Enterprise */}
                            <div className="bg-white rounded-3xl p-8 border border-[#F2EAE0] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow text-center">
                                <div>
                                    <h3 className="text-lg font-extrabold text-[#2B2523] mb-2">Enterprise</h3>
                                    <div className="text-3xl font-black text-[#2B2523] mb-6">
                                        Rp 999rb<span className="text-sm font-normal text-[#2B2523]/60">/bln</span>
                                    </div>
                                    <ul className="space-y-3 mb-8 text-center">
                                        {[
                                            'Multi-Outlet Unlimited',
                                            'Pengaturan Outlet Lanjutan',
                                            'Reservasi & Google Review',
                                            'Support Prioritas 24/7',
                                        ].map((f, i) => (
                                            <li key={i} className="text-center text-sm text-[#2B2523]/80 font-semibold">
                                                <CheckIcon className="size-4 text-[#FF5B35] shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={onEnterOwner}
                                    className="w-full py-3.5 rounded-xl border border-[#F2EAE0] hover:border-[#FF5B35] hover:text-[#FF5B35] text-[#2B2523] font-bold transition-all text-sm mt-8"
                                >
                                    Hubungi Sales
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="w-full bg-[#FF5B35] py-20 px-6 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-[460px_1fr] gap-8 items-center">
                        {/* Left: multi-outlet route map */}
                        <div className="order-2 lg:order-1 flex justify-center lg:justify-start lg:-ml-10">
                            <img
                                src="/images/landing/cta_map_pins.png"
                                alt="Peta rute banyak cabang Restoku"
                                className="w-full max-w-[520px] h-auto select-none drop-shadow-xl"
                                onError={(e: any) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>

                        {/* Right: copy */}
                        <div className="order-1 lg:order-2 text-center lg:text-left">
                            <h2
                                className="text-3xl md:text-4xl lg:text-4xl font-black text-white mb-4 whitespace-nowrap"
                                style={{ fontFamily: '"Playfair Display", serif' }}
                            >
                                Siap bikin bisnis kuliner kamu tumbuh pesat?
                            </h2>
                            <p className="text-white/90 mb-8 font-medium">
                                Mulai gratis 14 hari. Tanpa kartu kredit. Upgrade kapan saja.
                            </p>
                            <button
                                onClick={onEnter}
                                className="px-8 py-4 bg-white text-[#FF5B35] hover:bg-[#FAF5EE] rounded-xl font-extrabold text-base shadow-lg transition-all hover:-translate-y-0.5"
                            >
                                Coba Gratis Sekarang ↗
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full bg-[#1F1A17] text-[#FAF5EE]/70 py-12 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="grid size-10 place-items-center rounded-xl bg-[#FF5B35] text-white">
                                <BowlIcon className="size-6" />
                            </div>
                            <span className="text-xl font-bold text-white">Restoku</span>
                        </div>
                        <p className="text-sm max-w-sm leading-relaxed">
                            Sistem manajemen restoran all-in-one untuk pemilik kuliner di Indonesia yang mau ekspansi
                            usaha.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 text-sm">Produk</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#features" className="hover:text-[#FF5B35] transition-colors">
                                    Fitur
                                </a>
                            </li>
                            <li>
                                <a href="#features" className="hover:text-[#FF5B35] transition-colors">
                                    Integrasi
                                </a>
                            </li>
                            <li>
                                <a href="#features" className="hover:text-[#FF5B35] transition-colors">
                                    Buku Menu Digital
                                </a>
                            </li>
                            <li>
                                <a href="#features" className="hover:text-[#FF5B35] transition-colors">
                                    KDS
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 text-sm">Perusahaan</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="hover:text-[#FF5B35] transition-colors">
                                    Tentang Kami
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5B35] transition-colors">
                                    Karir
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5B35] transition-colors">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5B35] transition-colors">
                                    Hubungi Kami
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto border-t border-white/10 mt-10 pt-6 text-xs text-[#FAF5EE]/40">
                    © {new Date().getFullYear()} Restoku. Seluruh hak cipta dilindungi.
                </div>
            </footer>
        </div>
    );
}
