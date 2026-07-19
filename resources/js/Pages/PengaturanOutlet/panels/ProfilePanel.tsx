import { Glass } from '../../../Components/Shared';
import type { PanelProps } from '../types';

export default function ProfilePanel(props: PanelProps) {
    const {
        h2Class,
        labelClass,
        inputClass,
        isLight,
        isFetchingGeo,
        namaOutletInput,
        setNamaOutletInput,
        teleponInput,
        setTeleponInput,
        npwpInput,
        setNpwpInput,
        nibInput,
        setNibInput,
        alamatInput,
        setAlamatInput,
        handleGeocodeAddress,
    } = props;

    return (
        <Glass className="p-6">
            <h2 className={h2Class}>Profil Outlet</h2>
            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className={labelClass}>Cabang Outlet</label>
                    <input
                        value={namaOutletInput}
                        onChange={(e) => setNamaOutletInput(e.target.value)}
                        placeholder="e.g. Bandung / Cabang Utama"
                        className={inputClass}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Telepon</label>
                    <input
                        value={teleponInput}
                        onChange={(e) => setTeleponInput(e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>NPWP</label>
                    <input value={npwpInput} onChange={(e) => setNpwpInput(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>NIB</label>
                    <input value={nibInput} onChange={(e) => setNibInput(e.target.value)} className={inputClass} />
                </div>
                <div className="col-span-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label className={labelClass}>Alamat Lengkap</label>
                        {isFetchingGeo && (
                            <span className="text-[10px] text-emerald-500 animate-pulse font-medium">
                                🔄 Auto-fetching Google Maps...
                            </span>
                        )}
                    </div>
                    <input
                        value={alamatInput}
                        onChange={(e) => setAlamatInput(e.target.value)}
                        onBlur={() => handleGeocodeAddress(alamatInput)}
                        placeholder="Masukkan alamat lengkap restoran Anda..."
                        className={inputClass}
                    />
                </div>
            </div>
        </Glass>
    );
}
