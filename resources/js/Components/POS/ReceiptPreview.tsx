import { Printer, Share2, XCircle, FileText } from 'lucide-react';
import { Glass, Button, formatRupiah, useTenantSettings } from '../Shared';

interface ReceiptItem {
    id: number;
    name: string;
    qty: number;
    price: number;
    note?: string;
}

interface ReceiptPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    orderData?: {
        orderId: string;
        cashierName: string;
        table: string;
        date: string;
        items: ReceiptItem[];
        subtotal: number;
        tax: number;
        total: number;
        paymentMethod: string;
    };
}

export function ReceiptPreview({ isOpen, onClose, orderData }: ReceiptPreviewProps) {
    if (!isOpen || !orderData) return null;

    const { tenantName } = useTenantSettings();

    const padRight = (str: string, len: number) => {
        return str.length >= len ? str.substring(0, len) : str.padEnd(len, ' ');
    };
    const padLeft = (str: string, len: number) => {
        return str.length >= len ? str.substring(0, len) : str.padStart(len, ' ');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <Glass className="p-0 w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900/50 p-4 border-b border-white/10 flex justify-between items-center shrink-0">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <FileText className="size-4 text-blue-400" /> Preview Struk
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <XCircle className="size-5" />
                    </button>
                </div>

                {/* Thermal Receipt Paper Effect */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center">
                    <div className="w-full max-w-[280px] bg-white text-black p-4 font-mono text-[10px] sm:text-[11px] leading-relaxed shadow-md border-t-4 border-t-slate-300 border-b-4 border-b-slate-300 filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.1)] select-none">
                        {/* Header */}
                        <div className="text-center space-y-0.5 mb-2">
                            <div className="font-bold text-sm">{tenantName || 'Pawon Salam'}</div>
                            <div className="text-[10px] leading-tight">Jl. Pertanian No. 57, Lebak Bulus, Jak-Sel</div>
                            <div className="text-[10px]">WA: 0895-3763-48626</div>
                        </div>

                        <div className="border-b border-black/40 border-dashed my-1.5"></div>

                        {/* Metadata */}
                        <div className="text-[10px] space-y-0.5">
                            <div className="flex">
                                <span className="w-14">Tgl</span>
                                <span>: {orderData.date?.split(' ')[0] || new Date().toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="flex">
                                <span className="w-14">Jam</span>
                                <span>
                                    :{' '}
                                    {orderData.date?.split(' ')[1] ||
                                        new Date().toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}{' '}
                                    WIB
                                </span>
                            </div>
                            <div className="flex">
                                <span className="w-14">No</span>
                                <span>: #{orderData.orderId}</span>
                            </div>
                            <div className="flex">
                                <span className="w-14">Kasir</span>
                                <span>: {orderData.cashierName || 'Verena'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-14">Meja</span>
                                <span>: {orderData.table || 'Meja 1'} (DINE-IN)</span>
                            </div>
                        </div>

                        <div className="border-b border-black/40 border-dashed my-1.5"></div>

                        {/* Column Header */}
                        <div className="flex justify-between font-bold text-[10px] uppercase">
                            <span className="flex-1">Item</span>
                            <span className="w-8 text-center">Qty</span>
                            <span className="w-16 text-right">Harga</span>
                            <span className="w-16 text-right">Total</span>
                        </div>
                        <div className="border-b border-black/40 border-dashed my-1.5"></div>

                        {/* Items */}
                        <div className="space-y-1.5 text-[10px]">
                            {orderData.items.map((item) => (
                                <div key={item.id}>
                                    <div className="flex justify-between font-bold">
                                        <span className="flex-1 truncate pr-1">{item.name.toUpperCase()}</span>
                                        <span className="w-8 text-center">{item.qty}</span>
                                        <span className="w-16 text-right">
                                            {formatRupiah(item.price).replace('Rp', '').trim()}
                                        </span>
                                        <span className="w-16 text-right">
                                            {formatRupiah(item.price * item.qty)
                                                .replace('Rp', '')
                                                .trim()}
                                        </span>
                                    </div>
                                    {item.note && (
                                        <div className="text-[9px] text-slate-700 font-normal italic pl-2">
                                            ({item.note})
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="border-b border-black/40 border-dashed my-1.5"></div>

                        {/* Totals */}
                        <div className="space-y-1 text-[10px]">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{formatRupiah(orderData.subtotal).replace('Rp', '').trim()}</span>
                            </div>
                            {orderData.tax > 0 && (
                                <div className="flex justify-between">
                                    <span>PBJT / Pajak:</span>
                                    <span>{formatRupiah(orderData.tax).replace('Rp', '').trim()}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-[11px] pt-0.5">
                                <span>TOTAL:</span>
                                <span>{formatRupiah(orderData.total).replace('Rp', '').trim()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Metode:</span>
                                <span>{orderData.paymentMethod.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bayar:</span>
                                <span>{formatRupiah(orderData.total).replace('Rp', '').trim()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kembali:</span>
                                <span>0</span>
                            </div>
                        </div>

                        <div className="border-b border-black/40 border-dashed my-1.5"></div>

                        {/* Footer */}
                        <div className="text-center text-[10px] space-y-0.5 pt-1 font-bold leading-tight">
                            <div>Dukung UMKM Indonesia</div>
                            <div>Tulang Punggung</div>
                            <div>Ekonomi Nasional</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 p-4 border-t border-white/10 flex gap-2 shrink-0">
                    <Button variant="ghost" onClick={onClose} className="flex-1">
                        Tutup
                    </Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500 border-none text-white">
                        <Share2 className="size-4 mr-2" /> WA
                    </Button>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-500 border-none text-white">
                        <Printer className="size-4 mr-2" /> Cetak
                    </Button>
                </div>
            </Glass>
        </div>
    );
}
