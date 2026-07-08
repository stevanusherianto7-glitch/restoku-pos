import { useState, useEffect } from "react";
import { Screen, Glass, Button } from "../Shared";
import { ScanLine, CheckCircle2, XCircle, Camera, MapPin, AlertTriangle } from "lucide-react";

export function QrScanner() {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "taking-selfie" | "verifying-location" | "success" | "flagged" | "error">("idle");
  const [selfieTaken, setSelfieTaken] = useState(false);

  // Simulate scanning process
  useEffect(() => {
    if (scanState === "scanning") {
      const timer = setTimeout(() => {
        // Mock a success scan -> prompt for selfie
        setScanState("taking-selfie");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [scanState]);

  // Simulate Location verification
  useEffect(() => {
    if (scanState === "verifying-location") {
      const timer = setTimeout(() => {
        // Mock random geo-verify success vs fail
        const isVerified = Math.random() > 0.3; // 70% success, 30% flagged
        setScanState(isVerified ? "success" : "flagged");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [scanState]);

  // Auto reset after result
  useEffect(() => {
    if (scanState === "success" || scanState === "flagged") {
      const timer = setTimeout(() => {
        setScanState("idle");
        setSelfieTaken(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [scanState]);

  return (
    <Screen title="Scan Absensi QR">
      <div className="max-w-md mx-auto h-full flex flex-col justify-center py-12">
        <Glass className="p-8 flex flex-col items-center relative overflow-hidden">
          
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Pindai QR Karyawan</h2>
            <p className="text-sm text-slate-400">
              Arahkan kamera ke QR Code milik karyawan. Sesuai revisi keamanan, selfie dan verifikasi lokasi wajib dilakukan.
            </p>
          </div>

          {/* Scanner Viewport */}
          <div className="relative w-64 h-64 bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl mb-8 flex items-center justify-center">
            
            {scanState === "idle" && (
              <Button onClick={() => setScanState("scanning")} className="bg-emerald-600 hover:bg-emerald-700">
                Mulai Scan QR
              </Button>
            )}

            {scanState === "scanning" && (
              <>
                <div className="absolute inset-0 bg-emerald-900/20 backdrop-blur-sm animate-pulse" />
                {/* Scanning line animation */}
                <div className="absolute w-full h-1 bg-emerald-500 shadow-[0_0_15px_3px_rgba(16,185,129,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
                {/* Frame corners */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
                <div className="z-10 text-emerald-400 font-mono text-sm flex items-center gap-2">
                  <ScanLine className="size-4 animate-bounce" /> Memindai QR...
                </div>
              </>
            )}

            {scanState === "taking-selfie" && (
              <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center p-4 text-center z-20">
                <Camera className="size-12 text-slate-400 mb-4" />
                <h3 className="text-white font-medium text-sm mb-4">Verifikasi Wajah (Selfie)</h3>
                {!selfieTaken ? (
                  <Button 
                    onClick={() => {
                      setSelfieTaken(true);
                      setTimeout(() => setScanState("verifying-location"), 1000);
                    }} 
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                  >
                    Ambil Foto
                  </Button>
                ) : (
                  <div className="text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> Tersimpan
                  </div>
                )}
              </div>
            )}

            {scanState === "verifying-location" && (
              <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center p-4 text-center z-20">
                <MapPin className="size-12 text-blue-400 mb-4 animate-bounce" />
                <h3 className="text-white font-medium text-sm">Memverifikasi Lokasi...</h3>
                <p className="text-slate-400 text-xs mt-2">Mengecek jarak ke outlet</p>
              </div>
            )}

            {scanState === "success" && (
              <div className="absolute inset-0 bg-emerald-600 flex flex-col items-center justify-center p-4 text-center z-20 animate-in fade-in duration-300">
                <CheckCircle2 className="size-16 text-white mb-4" />
                <h3 className="text-white font-bold text-lg">Clock In Berhasil!</h3>
                <p className="text-emerald-100 text-sm mt-1">Budi (Waiter) — 14:55</p>
                <div className="bg-emerald-800/50 text-white text-xs px-3 py-1 rounded-full mt-3">
                  Geo-Verified: OK
                </div>
              </div>
            )}

            {scanState === "flagged" && (
              <div className="absolute inset-0 bg-amber-600 flex flex-col items-center justify-center p-4 text-center z-20 animate-in fade-in duration-300">
                <AlertTriangle className="size-16 text-white mb-4" />
                <h3 className="text-white font-bold text-lg">Clock In Tercatat!</h3>
                <p className="text-amber-100 text-sm mt-1">Budi (Waiter) — 14:55</p>
                <div className="bg-amber-900/50 text-white text-xs px-3 py-1 rounded-lg mt-3 leading-relaxed">
                  Lokasi di luar radius outlet (150m).<br/>Tercatat untuk review admin.
                </div>
              </div>
            )}
            
          </div>

          <style>{`
            @keyframes scan {
              0%, 100% { top: 10%; }
              50% { top: 90%; }
            }
          `}</style>
          
        </Glass>
      </div>
    </Screen>
  );
}
