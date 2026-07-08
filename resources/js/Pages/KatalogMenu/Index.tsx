import { useState, type ChangeEvent } from "react";
import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { Screen, Glass, Badge, formatRupiah, toneMap, cardToneMap, PlanBadge, MOCK_PLAN, MOCK_OUTLET, planHasFeature, FEATURE_LOCKS } from "../../Components/Shared";
import { ChefHat, Search, Plus, Upload, Pencil, Trash2 } from "lucide-react";
import { ProductImage } from "../../Components/ProductImage";

function convertToWebP(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        // Resize to standard square size (e.g. 500x500) to keep size optimal
        const size = Math.min(img.width, img.height, 500);
        canvas.width = size;
        canvas.height = size;
        
        // Center crop
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        resolve(canvas.toDataURL("image/webp", 0.85));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function KatalogMenu() {
  const [items, setItems] = useState([
    { id: 1, name: "Nasi Goreng Spesial", price: 25000, category: "Makanan", image: "/images/nasi_goreng.webp" },
    { id: 2, name: "Mie Goreng Jawa", price: 25000, category: "Makanan", image: undefined as string | undefined },
    { id: 3, name: "Sate Ayam Madura", price: 35000, category: "Makanan", image: undefined as string | undefined },
    { id: 4, name: "Soto Ayam Lamongan", price: 22000, category: "Makanan", image: undefined as string | undefined },
    { id: 5, name: "Ayam Bakar Taliwang", price: 38000, category: "Makanan", image: undefined as string | undefined },
    { id: 6, name: "Iga Bakar Madu", price: 55000, category: "Makanan", image: undefined as string | undefined },
    { id: 7, name: "Es Teh Manis", price: 5000, category: "Minuman", image: "/images/es_teh.webp" },
    { id: 8, name: "Es Jeruk Peras", price: 8000, category: "Minuman", image: undefined as string | undefined },
    { id: 9, name: "Kopi Susu Aren", price: 18000, category: "Minuman", image: undefined as string | undefined },
    { id: 10, name: "Pisang Goreng Keju", price: 15000, category: "Pelengkap", image: undefined as string | undefined },
  ]);
  const [activeFilter, setActiveFilter] = useState("Makanan");

  const handleDelete = (id: number) => setItems(items.filter(i => i.id !== id));
  const handleAdd = () => setItems([{ id: Date.now(), name: "Menu Baru", price: 0, category: "Makanan", image: undefined }, ...items]);
  
  const handleFileChange = async (id: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webpUrl = await convertToWebP(file);
      setItems(prev => prev.map(item => item.id === id ? { ...item, image: webpUrl } : item));
    } catch (err) {
      console.error("Gagal mengonversi gambar ke WebP", err);
    }
  };

  const filtered = items.filter(i => i.category === activeFilter);

  return (
    <MainLayout>
      <Head title="Katalog Menu" />
      <Screen title="Katalog Menu">
      <div className="flex justify-center">
        <Glass className="w-full max-w-5xl p-6 flex flex-col h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                <ChefHat className="size-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Katalog Menu (Mode Edit)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Kelola daftar menu dan ketersediaan</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <Search className="size-4 text-slate-500" />
                <input placeholder="Cari menu..." className="bg-transparent text-sm outline-none w-32 text-slate-200 placeholder:text-slate-500" />
              </div>
              <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors">
                <Plus className="size-4" /> Tambah Menu
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {["Makanan", "Minuman", "Pelengkap"].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeFilter === f ? "bg-white/10 text-white border border-white/20" : "bg-white/[0.02] border border-white/10 text-slate-300 hover:bg-white/5"}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pb-10">
            {filtered.map(item => (
              <div key={item.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col group hover:border-white/20 transition-all hover:bg-white/[0.04]">
                <div className="aspect-square bg-slate-800/50 relative flex items-center justify-center border-b border-white/5 group/img overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <ProductImage
                    src={item.image || null}
                    alt={item.name}
                    variant="full"
                    className="group-hover/img:scale-105 transition-transform duration-300 absolute inset-0 !rounded-none"
                  />
                  {item.image && (
                    <div className="absolute top-2 left-2 bg-emerald-500/20 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-emerald-400 border border-emerald-500/30 z-20">WEBP</div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-medium text-slate-300 border border-white/10 z-20">{item.category}</div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30 backdrop-blur-sm">
                    <input
                      type="file"
                      id={`file-upload-${item.id}`}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(item.id, e)}
                    />
                    <button 
                      type="button" 
                      onClick={() => document.getElementById(`file-upload-${item.id}`)?.click()}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg border border-white/20 transition-all transform translate-y-2 group-hover/img:translate-y-0"
                    >
                      <Upload className="size-3" /> Upload Foto
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-1 leading-tight">{item.name}</h3>
                    <p className="text-xs font-mono font-medium text-emerald-400">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button className="flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-slate-300 text-xs font-medium transition-colors border border-transparent hover:border-blue-500/30">
                      <Pencil className="size-3" /> Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-xs font-medium transition-colors border border-transparent hover:border-red-500/30">
                      <Trash2 className="size-3" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div onClick={handleAdd} className="bg-white/[0.01] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:bg-white/[0.03] hover:border-white/20 transition-all text-slate-500 hover:text-white group">
              <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="size-6" />
              </div>
              <span className="text-sm font-medium">Tambah Menu Baru</span>
            </div>
          </div>
        </Glass>
      </div>
    </Screen>
    </MainLayout>
  );
}
