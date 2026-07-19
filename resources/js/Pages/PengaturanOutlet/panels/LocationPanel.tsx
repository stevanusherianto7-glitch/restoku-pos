import { Glass } from '../../../Components/Shared';
import { MapPinIcon, LocateFixedIcon } from '../../../Components/icons';
import type { PanelProps } from '../types';

export default function LocationPanel(props: PanelProps) {
    const {
        h2Class,
        labelClass,
        inputClass,
        descClass,
        isLight,
        alamatInput,
        setAlamatInput,
        latitudeInput,
        setLatitudeInput,
        longitudeInput,
        setLongitudeInput,
        isFetchingGeo,
        handleGeocodeAddress,
    } = props;

    return (
        <Glass className="p-6">
            <h2 className={h2Class}>
                <MapPinIcon className="size-4 text-emerald-500" /> Lokasi Restoran (Geolokasi)
            </h2>
            <div className="space-y-4">
                <p className={descClass}>
                    Tentukan koordinat GPS restoran untuk mencegah order fiktif dari luar area restoran (misalnya
                    pesanan dine-in palsu dari jarak jauh).
                </p>
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className={labelClass}>Latitude</label>
                            <span className="text-[9px] text-slate-500 font-semibold">(Auto-filled)</span>
                        </div>
                        <input
                            id="geo-lat"
                            value={latitudeInput}
                            onChange={(e) => setLatitudeInput(e.target.value)}
                            className={`font-mono ${inputClass}`}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className={labelClass}>Longitude</label>
                            <span className="text-[9px] text-slate-500 font-semibold">(Auto-filled)</span>
                        </div>
                        <input
                            id="geo-lng"
                            value={longitudeInput}
                            onChange={(e) => setLongitudeInput(e.target.value)}
                            className={`font-mono ${inputClass}`}
                        />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                        <label className={labelClass}>Radius Toleransi (Meter)</label>
                        <input type="number" defaultValue="50" className={inputClass} />
                        <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                            Radius 50 meter disarankan untuk restoran di dalam mall.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (pos) => {
                                        setLatitudeInput(pos.coords.latitude.toString());
                                        setLongitudeInput(pos.coords.longitude.toString());
                                    },
                                    () => alert('Gagal mengambil lokasi.'),
                                );
                            }
                        }}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
                    >
                        <LocateFixedIcon className="size-4" /> Deteksi Otomatis
                    </button>
                    <button
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isLight ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm' : 'bg-slate-100 hover:bg-white text-slate-900'}`}
                    >
                        Simpan Lokasi
                    </button>
                </div>
            </div>
        </Glass>
    );
}
