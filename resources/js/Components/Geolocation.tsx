import { useState } from "react";
import { Glass, Screen } from "./Shared";
import { MapPin, CheckCircle2, XCircle, QrCode, ShieldAlert } from "lucide-react";

// Haversine formula
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const toRad = (x: number) => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Location Logs (Admin) ──────────────────────────────────────────────────
export function LocationLogs() {
  const logs = [
    { date: "06/07 14:30", table: "5", dist: "3.2", acc: "8", within: true, method: "GPS", session: "abc1234" },
    { date: "06/07 14:35", table: "5", dist: "2.8", acc: "5", within: true, method: "GPS", session: "abc1234" },
    { date: "06/07 15:00", table: "7", dist: "120.5", acc: "15", within: false, method: "Waiver", session: "def4567" },
    { date: "06/07 15:01", table: "7", dist: "-", acc: "-", within: true, method: "Waiter (Aldi)", session: "def4567" },
    { date: "06/07 15:30", table: "2", dist: "85.0", acc: "12", within: false, method: "GPS", session: "ghi8901" },
  ];

  return (
    <Screen title="Log Lokasi (Geolokasi)">
      <Glass className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/5 bg-white/5 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Meja</th>
                <th className="px-4 py-3 font-medium">Jarak (m)</th>
                <th className="px-4 py-3 font-medium">Akurasi</th>
                <th className="px-4 py-3 font-medium">Dalam Radius</th>
                <th className="px-4 py-3 font-medium">Metode</th>
                <th className="px-4 py-3 font-medium">Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">{log.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">Meja {log.table}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{log.dist}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{log.acc}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.within ? <CheckCircle2 className="size-4 text-emerald-400" /> : <XCircle className="size-4 text-rose-400" />}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      log.method.includes('GPS') ? 'bg-blue-500/10 text-blue-400' :
                      log.method.includes('Waiter') ? 'bg-purple-500/10 text-purple-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs opacity-50">{log.session}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Glass>
    </Screen>
  );
}

// ─── Customer QR Scan (Simulasi) ──────────────────────────────────────────
export function CustomerQRScan() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "waiver">("idle");
  const [testMode, setTestMode] = useState<"near" | "far" | "real">("near");
  const [distance, setDistance] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState("");

  const outletLat = -6.200000;
  const outletLng = 106.816666;
  const radius = 50;

  const handleScan = () => {
    setStatus("loading");
    
    // Simulate API delay
    setTimeout(() => {
      if (testMode === "near") {
        // Mock success (10m away)
        setDistance(10);
        setStatus("success");
      } else if (testMode === "far") {
        // Mock error (120m away)
        setDistance(120);
        setErrorMsg("Anda berada di luar area restoran.");
        setStatus("error");
      } else {
        // Real geolocation
        if (!navigator.geolocation) {
          setErrorMsg("Browser tidak mendukung Geolokasi.");
          setStatus("error");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const dist = haversine(pos.coords.latitude, pos.coords.longitude, outletLat, outletLng);
            setDistance(dist);
            
            // Allow +50% if accuracy is > 20m
            const adjustedRadius = pos.coords.accuracy > 20 ? radius * 1.5 : radius;
            
            if (dist <= adjustedRadius) {
              setStatus("success");
            } else {
              setErrorMsg(`Anda berada di luar area restoran (${Math.round(dist)}m).`);
              setStatus("error");
            }
          },
          (err: GeolocationPositionError) => {
            if (err.code === err.PERMISSION_DENIED) setErrorMsg("Izin lokasi ditolak.");
            else setErrorMsg("Gagal mendapatkan lokasi.");
            setStatus("error");
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }, 1000);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-[#030303] text-slate-200">
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2 backdrop-blur-md">
        <label className="text-xs font-medium text-slate-400">Test Mode:</label>
        <select 
          value={testMode} 
          onChange={(e) => setTestMode(e.target.value as "near" | "far" | "real")}
          className="bg-transparent text-sm text-white outline-none"
        >
          <option value="near">Di dalam restoran (10m)</option>
          <option value="far">Di luar restoran (120m)</option>
          <option value="real">Gunakan GPS Asli</option>
        </select>
      </div>

      <div className="w-full max-w-sm">
        {status === "idle" && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-400">
              <QrCode className="size-16" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white">Scan QR Meja</h1>
              <p className="mt-2 text-sm text-slate-400">Kami perlu memverifikasi lokasi Anda untuk memastikan Anda berada di dalam restoran.</p>
            </div>
            <button 
              onClick={handleScan}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-colors"
            >
              Scan QR & Verifikasi
            </button>
          </div>
        )}

        {status === "loading" && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-3xl bg-white/5">
              <div className="size-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
            </div>
            <h1 className="text-xl font-bold font-display text-white">Memverifikasi Lokasi...</h1>
            <p className="text-sm text-slate-400">Mengambil koordinat GPS Anda.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="size-16" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white">Lokasi Terverifikasi</h1>
              <p className="mt-2 text-sm text-slate-400">Jarak Anda: {Math.round(distance)} meter dari restoran.</p>
            </div>
            <button 
              onClick={() => setStatus("idle")}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-colors"
            >
              Lanjutkan ke Menu
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-400 relative">
              <MapPin className="size-16" />
              <ShieldAlert className="absolute -bottom-2 -right-2 size-10 text-rose-500 drop-shadow-md bg-[#030303] rounded-full p-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white">Lokasi Ditolak</h1>
              <p className="mt-2 text-sm text-slate-400">{errorMsg}</p>
            </div>
            
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-left">
              <p className="text-sm font-medium text-rose-200">Scan QR meja dari luar restoran?</p>
              <p className="mt-1 text-xs text-rose-200/70">Silakan minta waiter untuk melakukan verifikasi manual (Waiver).</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setStatus("loading");
                  setTimeout(() => setStatus("waiver"), 1500); // simulate waiter approval
                }}
                className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                Minta Bantuan Waiter
              </button>
              <button 
                onClick={handleScan}
                className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {status === "waiver" && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-3xl bg-purple-500/10 text-purple-400">
              <CheckCircle2 className="size-16" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white">Waiver Diberikan</h1>
              <p className="mt-2 text-sm text-slate-400">Lokasi telah diverifikasi secara manual oleh Waiter.</p>
            </div>
            <button 
              onClick={() => setStatus("idle")}
              className="w-full rounded-xl bg-purple-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-colors"
            >
              Lanjutkan ke Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
