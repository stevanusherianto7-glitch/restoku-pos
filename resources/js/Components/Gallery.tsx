import { useState } from "react";
import { Image as ImageIcon, Plus, Trash2, ChevronLeft, ChevronRight, X, GripVertical, UploadCloud } from "lucide-react";

// --- Types ---
export interface GalleryPhoto {
  id: string;
  path: string;
  thumbnail?: string;
}

export interface GalleryEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  status: "draft" | "published";
  photos: GalleryPhoto[];
}

// --- Dummy Data ---
export const MOCK_GALLERY_EVENTS: GalleryEvent[] = [
  {
    id: "1",
    title: "Live Music Night",
    description: "Live akustik dari pukul 19:00 - 22:00. Ada promo buy 1 get 1 untuk semua minuman signature.",
    event_date: "20 Juni 2026",
    status: "published",
    photos: [
      { id: "p1", path: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop" },
      { id: "p2", path: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800&auto=format&fit=crop" },
    ]
  },
  {
    id: "2",
    title: "Promo Kemerdekaan",
    description: "Diskon 17% + 8% untuk semua menu makanan khas Nusantara.",
    event_date: "17 Agustus 2026",
    status: "published",
    photos: [
      { id: "p3", path: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop" },
    ]
  },
  {
    id: "3",
    title: "Grand Opening Cabang Baru",
    description: "Pembukaan cabang ketiga di Sudirman. Ramai lancar dan sukses!",
    event_date: "10 Mei 2026",
    status: "published",
    photos: [
      { id: "p4", path: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop" },
      { id: "p5", path: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop" },
    ]
  }
];

// --- Subcomponents ---
function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/5 bg-[#09090b]/80 shadow-sm backdrop-blur-xl ${className}`}>{children}</div>;
}

function Screen({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col font-sans">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#030303]/50 px-6 backdrop-blur-md">
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}

export function CustomerGallery() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<GalleryEvent | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const events = MOCK_GALLERY_EVENTS.filter(e => e.status === "published");

  const openLightbox = (event: GalleryEvent, index: number) => {
    setCurrentEvent(event);
    setPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setCurrentEvent(null);
  };

  return (
    <div className="font-display w-full h-full flex flex-col bg-[#030303] text-slate-200">
      <header className="p-6 text-center border-b border-white/5 pb-8 pt-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">📸 GALERI EVENT</h1>
        <p className="text-slate-400 font-medium">Momen tak terlupakan di Rumah Makan Sedap</p>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <div key={event.id} className="group cursor-pointer rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-white/20 transition-all duration-300" onClick={() => openLightbox(event, 0)}>
              <div className="aspect-square relative overflow-hidden bg-slate-800">
                <img src={event.photos[0]?.path} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                {event.photos.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-semibold">
                    1/{event.photos.length}
                  </div>
                )}
              </div>
              <div className="p-4 bg-white/5 backdrop-blur-sm">
                <h3 className="font-semibold text-slate-100 line-clamp-1">{event.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{event.event_date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightboxOpen && currentEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8">
          <button onClick={closeLightbox} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50">
            <X className="size-6" />
          </button>

          <div className="flex flex-col md:flex-row gap-6 max-w-6xl w-full max-h-[90vh]">
            {/* Image Container */}
            <div className="relative flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/10">
              <img 
                src={currentEvent.photos[photoIndex].path} 
                className="max-w-full max-h-[70vh] object-contain" 
                alt={currentEvent.title}
              />
              
              {currentEvent.photos.length > 1 && (
                <>
                  <button 
                    className="absolute left-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all disabled:opacity-30"
                    onClick={(e) => { e.stopPropagation(); setPhotoIndex(i => Math.max(0, i - 1)) }}
                    disabled={photoIndex === 0}
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button 
                    className="absolute right-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all disabled:opacity-30"
                    onClick={(e) => { e.stopPropagation(); setPhotoIndex(i => Math.min(currentEvent.photos.length - 1, i + 1)) }}
                    disabled={photoIndex === currentEvent.photos.length - 1}
                  >
                    <ChevronRight className="size-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-sm font-mono backdrop-blur-md">
                    {photoIndex + 1} / {currentEvent.photos.length}
                  </div>
                </>
              )}
            </div>

            {/* Info Container */}
            <div className="w-full md:w-80 shrink-0 bg-[#09090b] border border-white/10 p-6 rounded-2xl flex flex-col">
              <h2 className="text-2xl font-bold mb-2">{currentEvent.title}</h2>
              <div className="text-sm font-medium text-blue-400 mb-6 flex items-center gap-2">
                🗓️ {currentEvent.event_date}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-8 flex-1">
                {currentEvent.description}
              </p>
              
              {currentEvent.photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-auto">
                  {currentEvent.photos.map((p, idx) => (
                    <button 
                      key={p.id} 
                      onClick={() => setPhotoIndex(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${idx === photoIndex ? "border-blue-500" : "border-transparent opacity-50 hover:opacity-100"}`}
                    >
                      <img src={p.path} alt={`${currentEvent.title} — foto ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function GalleryManager({ onPreviewCustomer }: { onPreviewCustomer?: () => void }) {
  const [view, setView] = useState<"list" | "form">("list");
  
  if (view === "form") return <GalleryForm onBack={() => setView("list")} />;

  return (
    <Screen 
      title="Manajemen Galeri Event" 
      actions={
        <div className="flex gap-2">
          <button onClick={onPreviewCustomer} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 border border-white/10 transition-colors">
            Preview Customer View
          </button>
          <button onClick={() => setView("form")} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            <Plus className="size-4" /> Tambah Event
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        {MOCK_GALLERY_EVENTS.map(event => (
          <Glass key={event.id} className="p-4 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                {event.photos[0] ? (
                  <img src={event.photos[0].path} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="size-6 text-slate-500" /></div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-200">{event.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{event.event_date} · {event.photos.length} foto</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase ${event.status === "published" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                {event.status}
              </span>
              <button className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/5 hover:bg-white/10">Edit</button>
              <button className="p-2 text-slate-400 hover:text-red-400 bg-white/5 rounded-lg border border-white/5 hover:bg-red-500/10">Hapus</button>
            </div>
          </Glass>
        ))}
      </div>
    </Screen>
  );
}

function GalleryForm({ onBack }: { onBack: () => void }) {
  const [photos, setPhotos] = useState(MOCK_GALLERY_EVENTS[0].photos); // Dummy photos for demo

  return (
    <Screen title="Form Event Baru">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300">
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-lg font-semibold">Kembali ke Galeri</h2>
        </div>

        <Glass className="p-6">
          <h3 className="text-lg font-semibold mb-6">Detail Event</h3>
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Judul Event</label>
                <input type="text" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Contoh: Live Music Night" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tanggal Event</label>
                <input type="date" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Deskripsi</label>
              <textarea className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-blue-500 h-24 resize-none" placeholder="Ceritakan detail event ini..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Status</label>
              <select className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-blue-500 appearance-none text-slate-200">
                <option value="draft" className="text-slate-900">Draft (Sembunyikan)</option>
                <option value="published" className="text-slate-900">Published (Tampilkan)</option>
              </select>
            </div>
          </div>
        </Glass>

        <Glass className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Foto Galeri</h3>
            <span className="text-xs bg-white/10 px-2 py-1 rounded font-mono text-slate-400">{photos.length}/10 Foto</span>
          </div>
          
          <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center bg-black/20 hover:bg-white/5 transition-colors cursor-pointer mb-6 group">
            <div className="size-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="size-6" />
            </div>
            <p className="text-sm font-medium text-slate-200">Klik atau Drag & Drop foto di sini</p>
            <p className="text-xs text-slate-500 mt-1">Format: JPG, PNG (Max. 5MB, Auto-convert WebP)</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Foto Terunggah (Drag untuk mengurutkan)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((p, i) => (
                <div key={p.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-800">
                  <img src={p.path} alt={`Foto terunggah ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 text-white cursor-grab">
                      <GripVertical className="size-4" />
                    </button>
                    <button className="p-2 bg-red-500/80 rounded-lg hover:bg-red-500 text-white">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white">
                    #{i + 1}
                  </div>
                </div>
              ))}
              
              {photos.length < 10 && (
                <div className="aspect-square rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 cursor-pointer transition-colors">
                  <Plus className="size-6 mb-2" />
                  <span className="text-xs font-medium">Tambah</span>
                </div>
              )}
            </div>
          </div>
        </Glass>
        
        <div className="flex justify-end pt-4 pb-12">
          <button className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
            Simpan Event
          </button>
        </div>
      </div>
    </Screen>
  );
}
