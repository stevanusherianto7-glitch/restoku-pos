import { QRDisplay } from './QRDisplay';

interface QRTableCardProps {
    tableNumber: string;
    url: string;
    brandName?: string;
}

export function QRTableCard({ tableNumber, url, brandName = 'RUMAH MAKAN SEDAP' }: QRTableCardProps) {
    return (
        <div className="w-[300px] h-[300px] bg-white text-slate-800 rounded-xl overflow-hidden shadow-lg border-4 border-emerald-500 flex flex-col relative shrink-0">
            {/* Decorative top pattern */}
            <div className="h-4 bg-emerald-500 w-full" />

            <div className="flex-1 flex flex-col items-center justify-between p-4">
                {/* Header */}
                <div className="text-center w-full">
                    <h3 className="font-bold text-lg tracking-tight uppercase leading-tight mb-0.5">{brandName}</h3>
                    <div className="text-[10px] text-slate-500 font-medium">Scan untuk pesan dari meja</div>
                </div>

                {/* QR Code */}
                <div className="my-2 p-1 border-2 border-slate-100 rounded-xl">
                    <QRDisplay content={url} size={140} includeLogo={true} />
                </div>

                {/* Footer */}
                <div className="w-full text-center relative z-10">
                    <div className="bg-emerald-500 text-white font-black text-2xl py-1 px-4 rounded-lg inline-block shadow-md">
                        MEJA {tableNumber}
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium mt-2">{url.replace('https://', '')}</p>
                </div>
            </div>
        </div>
    );
}
