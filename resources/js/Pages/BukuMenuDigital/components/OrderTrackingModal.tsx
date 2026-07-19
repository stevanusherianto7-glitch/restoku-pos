import { CheckIcon } from '../../../Components/icons';

interface OrderTrackingModalProps {
    orderStatus: string;
    orderTone: 'amber' | 'blue' | 'emerald';
    tableNumber: string | null;
    activeOrderId: string | null;
    onClose: () => void;
}

export function OrderTrackingModal({
    orderStatus,
    orderTone,
    tableNumber,
    activeOrderId,
    onClose,
}: OrderTrackingModalProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden max-w-md mx-auto">
            <div className="bg-[#FAF5EE] border border-amber-900/10 rounded-3xl p-6 w-[92%] max-w-sm flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#1A1410]">
                <div
                    className={`size-16 rounded-full flex items-center justify-center mb-4 shadow-md transition-all ${
                        orderTone === 'amber'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/5'
                            : orderTone === 'blue'
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-blue-500/5'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/5'
                    }`}
                >
                    {orderStatus === 'Siap Sajikan' || orderStatus === 'Selesai' ? (
                        <CheckIcon className="size-8 stroke-[3]" />
                    ) : (
                        <span className="size-6 rounded-full border-4 border-t-transparent animate-spin border-current" />
                    )}
                </div>
                <h3 className="text-base font-extrabold text-[#1A1410] mb-1">
                    {orderStatus === 'Antrian Masuk'
                        ? 'Menunggu Konfirmasi'
                        : orderStatus === 'Sedang Dimasak'
                          ? 'Sedang Dimasak'
                          : orderStatus === 'Siap Sajikan'
                            ? 'Pesanan Siap Sajikan!'
                            : 'Pesanan Selesai!'}
                </h3>
                <p className="text-xs text-[#7A6F63] leading-relaxed mb-4">
                    {orderStatus === 'Antrian Masuk'
                        ? 'Dapur sedang meninjau pesanan Anda.'
                        : orderStatus === 'Sedang Dimasak'
                          ? 'Koki sedang meracik hidangan lezat Anda.'
                          : orderStatus === 'Siap Sajikan'
                            ? 'Pelayan kami sedang mengantarkan hidangan ke meja Anda.'
                            : 'Terima kasih! Silakan nikmati hidangan lezat Anda.'}
                </p>

                {/* Real-time Status Tracker */}
                <div className="w-full bg-[#FFF3EC] border border-[#FF5B35]/10 p-4 rounded-2xl mb-4 text-left space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold text-[#7A6F63] tracking-wider">
                            Status Pesanan
                        </span>
                        <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                orderTone === 'amber'
                                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                    : orderTone === 'blue'
                                      ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                      : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            }`}
                        >
                            {orderStatus}
                        </span>
                    </div>

                    {/* Progress Bar Visualizer */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                            className={`h-full transition-all duration-500 ${
                                orderStatus === 'Antrian Masuk'
                                    ? 'w-1/3 bg-amber-500'
                                    : orderStatus === 'Sedang Dimasak'
                                      ? 'w-2/3 bg-blue-500'
                                      : 'w-full bg-emerald-500'
                            }`}
                        />
                    </div>

                    <div className="flex justify-between text-[8px] font-bold text-[#8A7D70] uppercase tracking-wider">
                        <span className={orderStatus === 'Antrian Masuk' ? 'text-amber-600 font-extrabold' : ''}>
                            Antrian
                        </span>
                        <span className={orderStatus === 'Sedang Dimasak' ? 'text-blue-600 font-extrabold' : ''}>
                            Dimasak
                        </span>
                        <span
                            className={
                                orderStatus === 'Siap Sajikan' || orderStatus === 'Selesai'
                                    ? 'text-emerald-600 font-extrabold'
                                    : ''
                            }
                        >
                            Saji
                        </span>
                    </div>
                </div>

                <div className="w-full bg-white border border-amber-900/10 p-3 rounded-2xl mb-4 text-left">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-[9px] uppercase font-bold text-[#7A6F63] tracking-wider">Nomor Meja</p>
                            <p className="text-sm font-extrabold text-[#FF5B35] mt-0.5">
                                {tableNumber ? `Meja ${tableNumber}` : 'Meja 1'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] uppercase font-bold text-[#7A6F63] tracking-wider text-right">
                                Order ID
                            </p>
                            <p className="text-xs font-bold text-[#1A1410] mt-0.5 text-right">{activeOrderId}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3.5 bg-[#FF5B35] hover:bg-[#E04E2B] text-white rounded-xl text-xs font-black cursor-pointer border-none shadow-md shadow-[#FF5B35]/25"
                >
                    Pesan Menu Lainnya
                </button>
            </div>
        </div>
    );
}
