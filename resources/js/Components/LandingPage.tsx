import { 
  ChefHat, 
  CheckCircle2, 
  LayoutTemplate, 
  Smartphone, 
  ChevronRight, 
  BarChart3, 
  Star,
  ArrowRight,
  TrendingUp,
  Clock
} from "lucide-react";

export function LandingPage({ onEnter, onEnterOwner }: { onEnter: () => void, onEnterOwner: () => void }) {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-display selection:bg-emerald-500/20 text-slate-900 overflow-x-hidden">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-[#0a382e] text-white">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-white text-[#0a382e]">
            <ChefHat className="size-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Restoku</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-emerald-50">
          <a href="#features" className="hover:text-white transition-colors">Fitur</a>
          <a href="#pricing" className="hover:text-white transition-colors">Harga</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Testimoni</a>
          <a href="#" className="hover:text-white transition-colors">Integrasi</a>
          <a href="#" className="hover:text-white transition-colors">Kontak</a>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={onEnterOwner} className="hidden md:block text-sm font-semibold text-emerald-50 hover:text-white transition-colors">
            Login Owner
          </button>
          <button onClick={onEnter} className="px-5 py-2 text-sm font-semibold text-[#0a382e] bg-white rounded-full hover:bg-emerald-50 transition-colors">
            Login Staf & Kasir
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white pt-16 md:pt-24 pb-20 px-6 lg:px-12">
          <div className="absolute top-20 left-10 size-64 bg-emerald-300/20 blur-3xl rounded-full mix-blend-multiply pointer-events-none" />
          <div className="absolute top-40 right-20 size-96 bg-blue-300/20 blur-3xl rounded-full mix-blend-multiply pointer-events-none" />

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="flex flex-col items-start z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold mb-6">
                <Star className="size-3 fill-emerald-600" />
                Sistem Restoran All-in-One
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                Sistem Restoran Modern <br className="hidden md:block" />
                Dalam <span className="text-emerald-600">Satu Dasbor.</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
                Kelola penjualan, pesanan, operasional, hingga laporan dalam satu platform yang mudah, cepat, dan akurat.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
                <button onClick={onEnter} className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-base shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                  Login Staf (POS/KDS) <ArrowRight className="size-4" />
                </button>
                <button onClick={onEnterOwner} className="px-6 py-3.5 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-200 rounded-xl font-semibold text-base transition-all flex items-center justify-center">
                  Login Owner (Analitik)
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600 mb-10">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" /> Mudah digunakan</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" /> Data real-time</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" /> Aman & Terpercaya</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="size-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/100?img=11" alt="User" /></div>
                  <div className="size-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/100?img=32" alt="User" /></div>
                  <div className="size-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/100?img=68" alt="User" /></div>
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  +2.000 restoran telah bergabung bersama Restoku
                </p>
              </div>
            </div>

            {/* Right Isometric Mockup */}
            <div className="relative w-full h-[500px] lg:h-[600px] flex justify-center items-center perspective-1000 z-10">
               {/* Decorative Bubbles */}
               <div className="absolute top-10 right-20 size-8 rounded-full bg-emerald-400/80 shadow-lg shadow-emerald-400/50 animate-bounce" style={{animationDuration: '3s'}} />
               <div className="absolute bottom-20 left-10 size-12 rounded-full bg-emerald-300/70 shadow-lg shadow-emerald-300/40 animate-pulse" />
               <div className="absolute top-1/2 -right-4 size-6 rounded-full bg-blue-400/60 shadow-lg shadow-blue-400/40 animate-bounce" style={{animationDuration: '4s'}} />
               
               {/* Mockup Container */}
               <div className="relative w-[110%] max-w-2xl transform rotate-y-[-15deg] rotate-x-[5deg] rotate-z-[2deg] shadow-2xl rounded-2xl bg-[#1e2329] border border-slate-700/50 overflow-hidden"
                    style={{ boxShadow: '-20px 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(16, 185, 129, 0.2)' }}>
                  {/* Fake UI */}
                  <div className="flex flex-col h-full opacity-95">
                     {/* Window Nav */}
                     <div className="flex justify-between items-center px-4 py-3 border-b border-slate-700/50">
                        <div className="flex gap-1.5">
                           <div className="size-3 rounded-full bg-slate-600" />
                           <div className="size-3 rounded-full bg-slate-600" />
                           <div className="size-3 rounded-full bg-slate-600" />
                        </div>
                     </div>
                     {/* Main Split */}
                     <div className="flex flex-1 overflow-hidden h-[450px]">
                        {/* Sidebar */}
                        <div className="w-48 bg-[#181c20] p-4 flex flex-col gap-2 border-r border-slate-700/50">
                           <div className="flex items-center gap-2 mb-6 text-white font-bold"><ChefHat className="size-5"/> Restoku OS</div>
                           {["Dashboard", "Kasir (POS)", "Dapur (KDS)", "Laporan", "Pengaturan"].map((item, i) => (
                             <div key={i} className={`px-3 py-2 rounded-md text-xs font-medium ${i===0 ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>
                               {item}
                             </div>
                           ))}
                        </div>
                        {/* Content */}
                        <div className="flex-1 bg-[#1e2329] p-6">
                           <div className="flex justify-between items-center mb-6">
                              <div>
                                 <div className="text-white font-bold text-lg">Ringkasan Hari Ini</div>
                                 <div className="text-slate-400 text-[10px]">Selasa, 14 Nov 2026</div>
                              </div>
                              <div className="px-3 py-1.5 bg-blue-600 rounded text-white text-xs font-semibold">Buka Kasir</div>
                           </div>
                           <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-[#2a3038] p-4 rounded-xl border border-slate-600/30">
                                 <div className="text-slate-400 text-xs mb-1">Total Penjualan</div>
                                 <div className="text-white font-bold text-xl mb-1">Rp 12.4M</div>
                                 <div className="text-emerald-400 text-[10px]">+14.5% dari kemarin</div>
                              </div>
                              <div className="bg-[#2a3038] p-4 rounded-xl border border-slate-600/30">
                                 <div className="text-slate-400 text-xs mb-1">Pesanan Aktif</div>
                                 <div className="text-white font-bold text-xl mb-1">24</div>
                                 <div className="text-blue-400 text-[10px]">5 Siap Diambil!</div>
                              </div>
                           </div>
                           <div className="bg-[#2a3038] p-4 rounded-xl border border-slate-600/30 h-32 flex items-end gap-1.5 justify-between">
                              {[30,50,40,70,90,60,80,45,55,100,75,85].map((val, i) => (
                                 <div key={i} className="w-full bg-gradient-to-t from-emerald-500 to-blue-400 rounded-t-sm" style={{height: `${val}%`}} />
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Brands Section */}
        <section className="w-full border-y border-slate-100 bg-white py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">Dipercaya oleh ribuan bisnis kuliner di Indonesia</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Text placeholders for brands */}
               <span className="font-black text-xl text-slate-800">WAROENG STEAK</span>
               <span className="font-serif text-xl italic text-slate-800">Kopi Kenangan</span>
               <span className="font-bold text-xl text-pink-600">SOLARIA</span>
               <span className="font-black text-xl text-red-600 tracking-tighter">HokBen</span>
               <span className="font-bold text-xl text-amber-600">BAKMI GM</span>
               <span className="font-extrabold text-xl text-red-700 italic">Richeese Factory</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="w-full bg-slate-50 py-24 px-6">
          <div className="max-w-6xl mx-auto">
             <div className="text-center mb-16">
               <div className="text-emerald-600 font-bold text-xs tracking-widest uppercase mb-3">Semua Fitur Dalam Satu Platform</div>
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Operasional Lebih Ringkas & Efisien</h2>
             </div>

             <div className="grid md:grid-cols-3 gap-6 mb-20">
               {[
                 { icon: LayoutTemplate, title: "POS Kasir Pintar", desc: "Proses transaksi cepat, multi payment, dan terintegrasi dengan stok.", color: "text-emerald-600", bg: "bg-emerald-100" },
                 { icon: ChefHat, title: "KDS (Kitchen Display)", desc: "Pesanan langsung ke dapur, mengurangi kesalahan & waktu tunggu.", color: "text-blue-600", bg: "bg-blue-100" },
                 { icon: Smartphone, title: "Buku Menu Digital", desc: "Menu digital interaktif untuk pengalaman pelanggan yang lebih modern.", color: "text-amber-600", bg: "bg-amber-100" }
               ].map((feat, i) => (
                 <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className={`size-12 rounded-xl ${feat.bg} flex items-center justify-center mb-6`}>
                      <feat.icon className={`size-6 ${feat.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">{feat.title}</h3>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">{feat.desc}</p>
                    <a href="#" className="text-emerald-600 font-semibold text-sm flex items-center gap-1 hover:text-emerald-700">Pelajari lebih lanjut <ChevronRight className="size-4"/></a>
                 </div>
               ))}
             </div>

             {/* Analytics Split Section */}
             <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                   <div className="text-emerald-600 font-bold text-xs tracking-widest uppercase mb-3">Analitik Real-Time</div>
                   <h2 className="text-3xl font-bold text-slate-900 mb-5 leading-tight">Keputusan Lebih Cepat dengan Data Akurat</h2>
                   <p className="text-slate-600 mb-8 leading-relaxed">
                     Pantau penjualan, menu terlaris, stok, dan performa outlet secara real-time dari mana saja.
                   </p>
                   <ul className="space-y-4 mb-10">
                     {["Laporan penjualan detail", "Analisa menu terlaris", "Performa outlet multi-cabang", "Ekspor data mudah"].map((item, i) => (
                       <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                         <div className="size-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                           <CheckCircle2 className="size-3 text-emerald-600" />
                         </div>
                         {item}
                       </li>
                     ))}
                   </ul>
                   <button className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition-transform hover:-translate-y-0.5">
                     Lihat Analitik <ArrowRight className="size-4" />
                   </button>
                </div>
                {/* Chart Mockup */}
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                   <div className="flex justify-between items-center mb-6">
                      <div className="font-bold text-slate-900">Grafik Penjualan</div>
                      <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-medium outline-none">
                         <option>7 Hari Terakhir</option>
                      </select>
                   </div>
                   <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                         <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Total Penjualan</div>
                         <div className="text-slate-900 font-bold text-lg mb-1">Rp 86.2M</div>
                         <div className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><TrendingUp className="size-3"/> 18.6%</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                         <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Total Pesanan</div>
                         <div className="text-slate-900 font-bold text-lg mb-1">1.429</div>
                         <div className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><TrendingUp className="size-3"/> 12.3%</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                         <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Rata-rata Order</div>
                         <div className="text-slate-900 font-bold text-lg mb-1">Rp 60.3K</div>
                         <div className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><TrendingUp className="size-3"/> 8.7%</div>
                      </div>
                   </div>
                   {/* Fake Line Chart */}
                   <div className="relative h-48 w-full border-b border-slate-100 flex items-end justify-between px-2 pb-6">
                      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                         <path d="M0,80 C20,60 30,90 50,40 C70,-10 80,70 100,20" fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                         <path d="M0,80 C20,60 30,90 50,40 C70,-10 80,70 100,20 L100,100 L0,100 Z" fill="url(#grad)" opacity="0.2" />
                         <defs>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                               <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                               <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                            </linearGradient>
                         </defs>
                      </svg>
                      {["8 Mei", "9 Mei", "10 Mei", "11 Mei", "12 Mei", "13 Mei"].map(day => (
                         <div key={day} className="text-[10px] text-slate-400 font-medium z-10 translate-y-8">{day}</div>
                      ))}
                      {/* Tooltip mockup */}
                      <div className="absolute top-[30%] left-[48%] bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg">
                         12 Mei<br/><span className="font-bold">Rp 14.2M</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full bg-[#072f24] py-24 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 size-96 bg-emerald-600/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 size-96 bg-blue-600/10 blur-[100px] rounded-full" />
          
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="text-emerald-400 font-bold text-xs tracking-widest uppercase mb-3">Paket Harga</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Pilih Paket yang Sesuai Kebutuhan Anda</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-center">
              {/* Basic */}
              <div className="bg-white rounded-3xl p-8 flex flex-col shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                   <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center"><LayoutTemplate className="size-5 text-emerald-600"/></div>
                   <div>
                     <h3 className="font-bold text-slate-900">Basic</h3>
                     <p className="text-[10px] text-slate-500">Untuk bisnis kuliner pemula</p>
                   </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-6">Rp 149rb<span className="text-sm font-normal text-slate-500">/bln</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  {["1 Outlet", "Fitur POS Inti", "QRIS & Pembayaran Tunai", "Buku Menu Digital", "Laporan Standar"].map(ft => (
                    <li key={ft} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> {ft}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:border-emerald-600 hover:text-emerald-700 transition-colors">
                  Mulai Basic
                </button>
              </div>

              {/* Pro */}
              <div className="bg-white rounded-3xl p-8 flex flex-col shadow-2xl relative md:-translate-y-4 border-2 border-emerald-500">
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Paling Populer</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                   <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center"><BarChart3 className="size-5 text-blue-600"/></div>
                   <div>
                     <h3 className="font-bold text-slate-900">Pro</h3>
                     <p className="text-[10px] text-slate-500">Untuk restoran menengah ke atas</p>
                   </div>
                </div>
                <div className="text-4xl font-black text-slate-900 mb-6">Rp 399rb<span className="text-sm font-normal text-slate-500">/bln</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  {["Hingga 3 Outlet", "Integrasi GoFood & Grab", "Notifikasi WhatsApp API", "Laporan Keuangan Ekspor", "Manajemen Karyawan"].map(ft => (
                    <li key={ft} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> {ft}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors shadow-lg shadow-emerald-500/20">
                  Coba Pro Gratis
                </button>
              </div>

              {/* Enterprise */}
              <div className="bg-white rounded-3xl p-8 flex flex-col shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                   <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center"><Star className="size-5 text-amber-600"/></div>
                   <div>
                     <h3 className="font-bold text-slate-900">Enterprise</h3>
                     <p className="text-[10px] text-slate-500">Untuk franchise & bisnis besar</p>
                   </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-6">Rp 999rb<span className="text-sm font-normal text-slate-500">/bln</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  {["Outlet Tidak Terbatas", "Kitchen Display System (KDS)", "Multi-Outlet Branding", "Dedicated Account Manager", "Custom API Integration"].map(ft => (
                    <li key={ft} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> {ft}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:border-emerald-600 hover:text-emerald-700 transition-colors">
                  Hubungi Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="w-full bg-slate-50 py-24 px-6">
           <div className="max-w-6xl mx-auto">
             <div className="text-center mb-16">
               <div className="text-emerald-600 font-bold text-xs tracking-widest uppercase mb-3">Testimoni</div>
               <h2 className="text-3xl font-bold text-slate-900">Apa Kata Mereka?</h2>
             </div>
             
             <div className="grid md:grid-cols-3 gap-6">
                {[
                  { text: "Restoku sangat membantu operasional restoran kami jadi lebih efisien dan terkontrol.", name: "Andi Wijaya", role: "Owner Waroeng Steak", img: "https://i.pravatar.cc/150?img=11" },
                  { text: "Fitur laporan real-time sangat akurat, membantu kami ambil keputusan lebih cepat.", name: "Sari Mulyani", role: "Manager Operasional Solaria", img: "https://i.pravatar.cc/150?img=5" },
                  { text: "Integrasi dengan GoFood & Grab memudahkan kami kelola semua pesanan.", name: "Budi Santoso", role: "CEO Bakmi GM", img: "https://i.pravatar.cc/150?img=12" }
                ].map((review, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                     <div className="flex gap-1 mb-4">
                        {[1,2,3,4,5].map(s => <Star key={s} className="size-4 fill-amber-400 text-amber-400" />)}
                     </div>
                     <p className="text-slate-700 font-medium mb-8 flex-1">"{review.text}"</p>
                     <div className="flex items-center gap-3">
                        <img src={review.img} className="size-10 rounded-full object-cover bg-slate-200" alt={review.name} />
                        <div>
                           <div className="text-sm font-bold text-slate-900">{review.name}</div>
                           <div className="text-[10px] text-slate-500">{review.role}</div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        </section>

        {/* CTA Banner */}
        <section className="w-full bg-white pb-24 px-6 pt-12">
           <div className="max-w-5xl mx-auto bg-emerald-700 rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
              <div className="relative z-10 flex-1 text-center md:text-left">
                 <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Siap Tingkatkan Efisiensi Restoran Anda?</h2>
                 <p className="text-emerald-100 text-sm">Bergabunglah dengan ribuan bisnis kuliner yang sudah sukses bersama Restoku.</p>
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                 <button onClick={onEnter} className="px-6 py-3 bg-white text-emerald-800 font-bold rounded-xl hover:bg-emerald-50 transition-colors whitespace-nowrap">
                   Login Staf & Kasir
                 </button>
                 <button onClick={onEnterOwner} className="px-6 py-3 bg-transparent border border-emerald-400 text-white font-bold rounded-xl hover:bg-emerald-600/50 transition-colors whitespace-nowrap">
                   Login Owner
                 </button>
              </div>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#041d16] pt-16 pb-8 px-6 text-emerald-50">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
             <div className="flex items-center gap-2 mb-6">
                <div className="size-8 rounded-lg bg-white text-[#041d16] flex items-center justify-center"><ChefHat className="size-5" /></div>
                <span className="font-bold text-white text-lg">Restoku</span>
             </div>
             <p className="text-xs text-emerald-200/60 leading-relaxed max-w-xs mb-6">
               Sistem manajemen restoran all-in-one untuk bisnis kuliner modern di Indonesia.
             </p>
             <div className="flex gap-4">
                <div className="size-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-emerald-500 transition-colors"><Star className="size-4" /></div>
                <div className="size-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-emerald-500 transition-colors"><Star className="size-4" /></div>
                <div className="size-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-emerald-500 transition-colors"><Star className="size-4" /></div>
             </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-6">Produk</h4>
            <ul className="space-y-3 text-xs text-emerald-200/70">
              <li><a href="#" className="hover:text-white transition-colors">Fitur</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Harga</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrasi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Update</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-6">Perusahaan</h4>
            <ul className="space-y-3 text-xs text-emerald-200/70">
              <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Karir</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-6">Butuh Bantuan?</h4>
            <ul className="space-y-3 text-xs text-emerald-200/70">
              <li className="flex items-center gap-2"><Smartphone className="size-3"/> 0812-3456-7890</li>
              <li className="flex items-center gap-2"><Star className="size-3"/> hello@restoku.com</li>
              <li className="flex items-center gap-2"><Clock className="size-3"/> Senin - Jumat (09:00 - 18:00)</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-8 border-t border-emerald-800/50 text-center text-[10px] text-emerald-200/50">
          <p>© 2026 Restoku. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
