import type { VoidPolicy } from '../../../Types/outlet';
import type { Staff } from '../../../Types/staff';

export type ReceiptMode = 'transaksi' | 'dapur' | 'closing';

interface ReceiptPreviewProps {
    mode: ReceiptMode;
    strukHeader: string;
    strukFooter: string;
    strukPaperWidth: string;
    voidPolicy: VoidPolicy;
    nameInput: string;
    tenantName: string;
    alamatInput: string;
    teleponInput: string;
    employeesList: Staff[];
    ownerInput: string;
}

export default function ReceiptPreview(props: ReceiptPreviewProps) {
    const {
        mode,
        strukHeader,
        strukFooter,
        strukPaperWidth,
        voidPolicy,
        nameInput,
        tenantName,
        alamatInput,
        teleponInput,
        employeesList,
        ownerInput,
    } = props;

    if (mode === 'dapur') {
        return (
            <div className="bg-[#fafafa] text-slate-950 p-5 rounded-2xl border border-slate-200 font-mono text-[11px] space-y-2 shadow-xl animate-fadeIn leading-relaxed select-none">
                <div className="text-center">
                    <div className="font-bold text-sm tracking-wider uppercase">*** STRUK DAPUR ***</div>
                </div>
                <div className="border-b border-dashed border-slate-400 my-1" />

                {/* Kitchen Metadata */}
                <div className="text-[11px] space-y-0.5 font-bold">
                    <div className="flex">
                        <span className="w-16">TIPE</span>
                        <span>: DINE-IN</span>
                    </div>
                    <div className="flex">
                        <span className="w-16">Meja</span>
                        <span>: Meja 5 (A3)</span>
                    </div>
                    <div className="flex">
                        <span className="w-16">Jam</span>
                        <span>
                            :{' '}
                            {new Date().toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}
                        </span>
                    </div>
                    <div className="flex">
                        <span className="w-16">Order</span>
                        <span>: #MP9S13Z4</span>
                    </div>
                </div>
                <div className="border-b border-dashed border-slate-400 my-1" />

                {/* Kitchen Items & Chef Notes */}
                <div className="space-y-3 font-bold text-[11px]">
                    <div>
                        <div className="text-xs">1x BAKMI GORENG JAWA</div>
                        <div className="text-[10px] bg-amber-100 text-amber-950 p-1.5 rounded border border-amber-300 font-semibold mt-1 flex items-start gap-1">
                            <span>👨‍🍳</span>
                            <span>Pesan Chef: Pedas Level 3, No Timun, Jangan Terlalu Berminyak</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs">2x ES TEH MANIS</div>
                        <div className="text-[10px] bg-slate-200 text-slate-900 p-1.5 rounded border border-slate-300 font-semibold mt-1 flex items-start gap-1">
                            <span>📝</span>
                            <span>Pesan: Es Dipisah, Gula Sedikit Saja</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs">1x AYAM BAKAR MADU</div>
                        <div className="text-[10px] bg-amber-100 text-amber-950 p-1.5 rounded border border-amber-300 font-semibold mt-1 flex items-start gap-1">
                            <span>👨‍🍳</span>
                            <span>Pesan Chef: Bagian Dada, Sambal Dipisah</span>
                        </div>
                    </div>

                    {voidPolicy === 'audit_full' && (
                        <div className="border-t border-dashed border-slate-400 pt-2 mt-2">
                            <div className="flex items-center justify-between text-slate-900 line-through text-[10px] bg-rose-100 p-1.5 rounded border border-rose-300 font-normal">
                                <span className="font-bold text-rose-800">[VOID / BATAL] 1x Es Jeruk Nipis</span>
                                <span className="text-[8px] uppercase font-bold text-rose-900">
                                    (POS Auth: SITI MANAGER)
                                </span>
                            </div>
                        </div>
                    )}
                    {voidPolicy === 'zero_out' && (
                        <div className="border-t border-dashed border-slate-400 pt-2 mt-2">
                            <div className="flex items-center justify-between text-slate-900 line-through text-[10px] bg-[var(--color-primary)]/10 p-1.5 rounded border border-[var(--color-primary)] font-normal">
                                <span className="font-bold text-[var(--color-primary)]">
                                    [VOID ZERO-OUT] 1x Es Jeruk Nipis
                                </span>
                                <span className="text-[8px] uppercase font-bold text-[var(--color-primary)]">
                                    (Stop Masak - Disembunyikan di Tamu)
                                </span>
                            </div>
                        </div>
                    )}
                    {voidPolicy === 'manager_only' && (
                        <div className="border-t border-dashed border-slate-400 pt-2 mt-2">
                            <div className="flex items-center justify-between text-slate-900 line-through text-[10px] bg-amber-100 p-1.5 rounded border border-amber-300 font-normal">
                                <span className="font-bold text-amber-900">[VOID BY MANAGER] 1x Es Jeruk Nipis</span>
                                <span className="text-[8px] uppercase font-bold text-amber-900">
                                    (Otorisasi Dasbor Pusat)
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="border-b border-dashed border-slate-400 my-1.5" />

                {/* Global Chef Order Message */}
                <div className="bg-slate-900 text-white p-3 rounded-lg border-2 border-slate-900 font-mono shadow-md">
                    <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span>🔔 PESAN UTAMA UNTUK CHEF / DAPUR:</span>
                    </div>
                    <div className="text-[11px] font-bold leading-snug uppercase tracking-wide">
                        *** TOLONG HIDANGAN ANAK DIKELUARKAN DULUAN, PASTIKAN TIDAK PEDAS & TIDAK ASIN ***
                    </div>
                </div>
                <div className="border-b border-dashed border-slate-400 my-1" />

                <div className="text-center text-[9px] text-slate-700 space-y-0.5 pt-0.5">
                    <div className="font-bold">
                        Server:{' '}
                        {(employeesList || []).find(
                            (e) => e.role?.toLowerCase() === 'pelayan' || e.role?.toLowerCase() === 'waiter',
                        )?.name || 'Budi (Waiters)'}
                    </div>
                    <div className="italic text-[8px] text-slate-500">
                        Struk tercetak otomatis dari sistem POS ke Printer Dapur
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'closing') {
        return (
            <div className="bg-[#fafafa] text-slate-950 p-5 rounded-2xl border border-slate-200 font-mono text-[10px] space-y-2.5 shadow-xl leading-relaxed animate-fadeIn">
                <div className="text-center space-y-0.5">
                    <div className="font-bold text-sm">{nameInput || tenantName || 'Pawon Salam'}</div>
                    <div className="text-[9px] text-slate-600 px-2 leading-tight">
                        {alamatInput || 'Ruko Beryl Commercial, Summarecon, Jl. Bulevar Selatan No.78, Bandung'}
                    </div>
                </div>

                <div className="pt-2 space-y-1 text-center">
                    <div className="font-bold tracking-wider text-[11px]">LAPORAN SHIFT</div>
                    <div className="text-slate-600 text-[9px]">status: ditutup / rekap selesai</div>
                    <div className="bg-slate-200/80 p-1.5 rounded-lg border border-slate-300 text-slate-800 font-medium text-[9px] mt-1 flex justify-between items-center shadow-sm">
                        <span className="text-slate-600">Waktu Cetak:</span>
                        <span className="font-bold">
                            {new Date().toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}{' '}
                            ·{' '}
                            {new Date().toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}{' '}
                            WIB
                        </span>
                    </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-dashed border-slate-300">
                    <div className="flex justify-between items-center">
                        <span>Kasir Bertugas</span>
                        <span className="font-bold uppercase bg-slate-200 px-1.5 py-0.5 rounded text-[9px]">
                            {(employeesList || []).find(
                                (e) => e.role?.toLowerCase() === 'kasir' || e.role?.toLowerCase() === 'manager',
                            )?.name ||
                                ownerInput ||
                                'MARIO'}
                        </span>
                    </div>
                    <div className="flex justify-between items-start">
                        <span className="text-slate-600">Mulai Shift</span>
                        <span className="text-right font-medium">
                            {new Date().toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                            <br />
                            <span className="text-slate-600 font-normal">Jam 09:18:00 WIB</span>
                        </span>
                    </div>
                    <div className="flex justify-between items-start">
                        <span className="text-slate-600">Selesai Shift</span>
                        <span className="text-right font-medium">
                            {new Date().toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                            <br />
                            <span className="text-slate-600 font-normal">Jam 18:30:00 WIB</span>
                        </span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-slate-200">
                        <span>Jumlah Pengunjung</span>
                        <span>6 Orang</span>
                    </div>
                </div>

                <div className="space-y-0.5 pt-1 border-t border-dashed border-slate-300">
                    <div className="flex justify-between">
                        <span>Terjual item</span>
                        <span>15 item</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Terjual porsi</span>
                        <span>43 porsi</span>
                    </div>
                </div>

                <div className="space-y-0.5 pt-1 border-t border-dashed border-slate-300">
                    <div className="flex justify-between font-semibold">
                        <span>Total Penjualan (Gross)</span>
                        <span>Rp 835.000</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Diskon Promo / Voucher (5 trx)</span>
                        <span>-Rp 51.750</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-medium">
                        <span>Transaksi Void (2 bill / 3 item)</span>
                        <span>-Rp 45.000</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-300 text-[11px]">
                        <span>Penjualan Bersih (Net)</span>
                        <span>Rp 738.250</span>
                    </div>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-dashed border-slate-300">
                    <div className="font-bold text-[9px] uppercase text-slate-900 flex items-center justify-between">
                        <span>🛡️ Audit Keamanan Void</span>
                        <span className="bg-emerald-200 text-emerald-950 px-1 py-0.5 rounded text-[8px] font-bold">
                            100% AUTHORIZED
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px]">
                        <span className="text-slate-600">Otorisasi Manager:</span>
                        <span className="font-semibold text-slate-900">SITI MANAGER (#8821)</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px]">
                        <span className="text-slate-600">Kebijakan Struk:</span>
                        <span className="font-semibold text-slate-900">
                            {voidPolicy === 'zero_out'
                                ? 'Zero-Out Struk Pelanggan'
                                : voidPolicy === 'manager_only'
                                  ? 'Strict Lockout POS'
                                  : 'Audit Full (Tampil)'}
                        </span>
                    </div>
                    <div className="bg-amber-100/90 border border-amber-400 p-1 rounded text-[8px] text-amber-950 mt-1 font-semibold">
                        ⚠️ [SECURITY ALERT]: 1x Void dilakukan pasca cetak Pre-Bill (Meja 5 - Rp 15.000). Telah
                        diverifikasi Manager.
                    </div>
                </div>

                <div className="border-b-2 border-double border-slate-400 pt-1" />
                <div className="font-bold text-[9px] tracking-widest text-center uppercase py-0.5">
                    DETAIL TRANSAKSI
                </div>
                <div className="border-b-2 border-double border-slate-400" />

                <div className="space-y-1 pt-1 text-[9px] max-h-48 overflow-y-auto pr-1">
                    <div className="flex justify-between">
                        <span>Air Mineral</span>
                        <span>x 3</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Jeruk Peras Hangat</span>
                        <span>x 1</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Kerupuk Udang</span>
                        <span>x 1</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Mie Godog</span>
                        <span>x 4</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Mie Goreng Jawa</span>
                        <span>x 6</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Nasi Goreng Kampung</span>
                        <span>x 2</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Nasi Putih</span>
                        <span>x 2</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Nasi Soto Ayam</span>
                        <span>x 3</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Pisgor Cheese Milk Crunchy</span>
                        <span>x 2</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Pisgor Cheese Tiramisu Chru</span>
                        <span>x 1</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Rawon tanpa nasi</span>
                        <span>x 1</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Sate Telur Puyuh</span>
                        <span>x 2</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Soto Ayam</span>
                        <span>x 4</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Teh Tawar</span>
                        <span>x 5</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tempe Goreng</span>
                        <span>x 4</span>
                    </div>
                </div>

                <div className="border-b-2 border-double border-slate-400 pt-1" />
                <div className="font-bold text-[9px] tracking-widest text-center uppercase py-0.5">
                    DETAIL PEMASUKAN
                </div>
                <div className="border-b-2 border-double border-slate-400" />

                <div className="space-y-1 pt-1">
                    <div className="flex justify-between">
                        <span>QRIS</span>
                        <span>Rp 420.100</span>
                    </div>
                    <div className="flex justify-between">
                        <span>TUNAI</span>
                        <span>Rp 338.150</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-300">
                        <span>TOTAL PEMASUKAN</span>
                        <span>Rp 758.250</span>
                    </div>
                </div>

                <div className="border-b-2 border-double border-slate-400 pt-1" />
                <div className="font-bold text-[9px] tracking-widest text-center uppercase py-0.5">
                    TRANSAKSI KAS KECIL
                </div>
                <div className="border-b-2 border-double border-slate-400" />

                <div className="space-y-1 pt-1">
                    <div className="flex justify-between font-semibold">
                        <span>KAS AWAL</span>
                        <span>Rp 560.400</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>gula x3</span>
                        <span>(Rp 52.500)</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>kecap x2</span>
                        <span>(Rp 40.100)</span>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span>SALDO</span>
                        <span>Rp 467.800</span>
                    </div>
                    <div className="flex justify-between font-bold text-[11px] pt-1 border-t border-slate-300">
                        <span>TOTAL KAS</span>
                        <span>Rp 805.950</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-slate-400 py-2" />
                <div className="text-center text-[9px] pt-1 space-y-0.5">
                    <div className="font-semibold">Diterbitkan oleh</div>
                    <div className="font-bold">Restoku OS - Self Order &amp; POS App</div>
                    <div className="text-slate-400">Powered by Restoku OS · {strukPaperWidth}</div>
                </div>
            </div>
        );
    }

    // mode === 'transaksi'
    return (
        <div className="bg-[#fafafa] text-slate-950 p-5 rounded-2xl border border-slate-200 font-mono text-[11px] space-y-2 shadow-xl animate-fadeIn leading-relaxed select-none">
            {/* Header */}
            <div className="text-center space-y-0.5">
                <div className="font-bold text-sm">{nameInput || tenantName || 'Pawon Salam'}</div>
                <div className="text-[10px] text-slate-700 px-2 leading-tight">
                    {alamatInput || 'Jl. Pertanian No. 57, Lebak Bulus, Jak-Sel'}
                </div>
                {teleponInput && <div className="text-[10px] text-slate-700">WA: {teleponInput}</div>}
            </div>
            <div className="border-b border-dashed border-slate-400 my-1" />

            {/* Metadata */}
            <div className="text-[10px] space-y-0.5">
                <div className="flex">
                    <span className="w-14">Tgl</span>
                    <span>
                        :{' '}
                        {new Date().toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'numeric',
                            year: 'numeric',
                        })}
                    </span>
                </div>
                <div className="flex">
                    <span className="w-14">Jam</span>
                    <span>
                        :{' '}
                        {new Date().toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}{' '}
                        WIB
                    </span>
                </div>
                <div className="flex">
                    <span className="w-14">No</span>
                    <span>: #MP9S13Z4</span>
                </div>
                <div className="flex">
                    <span className="w-14">Kasir</span>
                    <span>
                        :{' '}
                        {(employeesList || []).find(
                            (e) => e.role?.toLowerCase() === 'kasir' || e.role?.toLowerCase() === 'manager',
                        )?.name ||
                            ownerInput ||
                            'Verena'}
                    </span>
                </div>
                <div className="flex">
                    <span className="w-14">Meja</span>
                    <span>: Meja 5 (DINE-IN)</span>
                </div>
            </div>
            <div className="border-b border-dashed border-slate-400 my-1" />

            {/* Column Header */}
            <div className="flex justify-between font-bold text-[10px] uppercase">
                <span className="flex-1">Item</span>
                <span className="w-8 text-center">Qty</span>
                <span className="w-16 text-right">Harga</span>
                <span className="w-16 text-right">Total</span>
            </div>
            <div className="border-b border-dashed border-slate-400 my-1" />

            {/* Items */}
            <div className="space-y-1.5 text-[10px]">
                <div>
                    <div className="flex justify-between font-bold">
                        <span className="flex-1 truncate">BAKMI GORENG JAWA</span>
                        <span className="w-8 text-center">1</span>
                        <span className="w-16 text-right">24.000</span>
                        <span className="w-16 text-right">24.000</span>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between font-bold">
                        <span className="flex-1 truncate">NASI GORENG KAMPUNG</span>
                        <span className="w-8 text-center">1</span>
                        <span className="w-16 text-right">31.000</span>
                        <span className="w-16 text-right">31.000</span>
                    </div>
                </div>
                {voidPolicy === 'audit_full' ? (
                    <div className="bg-rose-50/90 p-1 rounded border border-rose-300 mt-1 space-y-0.5 animate-fadeIn">
                        <div className="flex justify-between text-rose-600 line-through text-[9px] font-bold">
                            <span className="flex-1 truncate">[VOID] ES JERUK NIPIS</span>
                            <span className="w-8 text-center">1</span>
                            <span className="w-16 text-right">15.000</span>
                            <span className="w-16 text-right">-15.000</span>
                        </div>
                        <div className="text-[8px] bg-white text-slate-700 px-1 py-0.5 rounded font-mono border border-slate-300 w-fit font-bold">
                            🔒 Auth: SITI MANAGER (PIN Verified)
                        </div>
                    </div>
                ) : null}
            </div>
            <div className="border-b border-dashed border-slate-400 my-1" />

            {/* Totals */}
            <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{voidPolicy === 'audit_full' ? '70.000' : '55.000'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Diskon (20%):</span>
                    <span>-10.000</span>
                </div>
                {voidPolicy === 'audit_full' && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                        <span>Potongan Item Void:</span>
                        <span>-15.000</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-[11px] pt-0.5">
                    <span>TOTAL:</span>
                    <span>{voidPolicy === 'audit_full' ? '45.000' : '45.000'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Metode:</span>
                    <span>QRIS</span>
                </div>
                <div className="flex justify-between">
                    <span>Bayar:</span>
                    <span>{voidPolicy === 'audit_full' ? '45.000' : '45.000'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Kembali:</span>
                    <span>0</span>
                </div>
            </div>
            <div className="border-b border-dashed border-slate-400 my-1" />

            {/* Dynamic Security Policy Badge Banner */}
            {voidPolicy === 'audit_full' && (
                <div className="bg-rose-50 border border-rose-300 p-1.5 rounded text-[8px] text-rose-900 space-y-0.5 leading-tight font-sans shadow-sm animate-fadeIn">
                    <div className="font-bold flex items-center gap-1 text-rose-700 text-[9px]">
                        <span>🛡️ MODE VOID: AUDIT FULL (TAMPIL)</span>
                    </div>
                    <div>
                        Item pembatalan/void tetap dicantumkan dengan coretan merah pada struk pelanggan beserta bukti
                        otorisasi Manager untuk transparansi total.
                    </div>
                </div>
            )}
            {voidPolicy === 'zero_out' && (
                <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)] p-1.5 rounded text-[8px] text-[var(--color-primary)] space-y-0.5 leading-tight font-sans shadow-sm animate-fadeIn">
                    <div className="font-bold flex items-center gap-1 text-[var(--color-primary)] text-[9px]">
                        <span>📑 MODE VOID: ZERO-OUT (NOL-KAN)</span>
                    </div>
                    <div>
                        Item yang dibatalkan disembunyikan total (dinolkan) dari cetakan struk pelanggan agar struk
                        tetap bersih, rapi, dan tanpa jejak pembatalan.
                    </div>
                </div>
            )}
            {voidPolicy === 'manager_only' && (
                <div className="bg-amber-50 border border-amber-300 p-1.5 rounded text-[8px] text-amber-900 space-y-0.5 leading-tight font-sans shadow-sm animate-fadeIn">
                    <div className="font-bold flex items-center gap-1 text-amber-800 text-[9px]">
                        <span>🔒 MODE VOID: KUNCI POS (MANAGER ONLY)</span>
                    </div>
                    <div>
                        Tombol void dikunci total di layar Kasir POS. Pembatalan pesanan hanya dapat dieksekusi oleh
                        Manager atau Owner melalui Dasbor Pusat.
                    </div>
                </div>
            )}
            <div className="border-b border-dashed border-slate-400 my-1" />

            {/* Footer */}
            <div className="text-center text-[10px] space-y-0.5 pt-1">
                {strukHeader && <div className="font-semibold mb-1">{strukHeader}</div>}
                <div className="font-bold leading-tight whitespace-pre-line">
                    {strukFooter || 'Dukung UMKM Indonesia\nTulang Punggung Ekonomi Nasional'}
                </div>
                <div className="text-[8px] text-slate-400 mt-1">Powered by Restoku OS · {strukPaperWidth}</div>
            </div>
        </div>
    );
}
