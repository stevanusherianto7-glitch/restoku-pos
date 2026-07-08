# Panduan Kontribusi — Restoku

Terima kasih sudah tertarik untuk berkontribusi pada proyek Restoku! Dokumen ini menjelaskan alur kerja, standar kode, dan prosedur yang wajib diikuti.

---

## 📋 Daftar Isi

1. [Alur Kerja Git](#alur-kerja-git)
2. [Struktur Branch](#struktur-branch)
3. [Standar Kode Frontend](#standar-kode-frontend)
4. [Standar Kode Backend](#standar-kode-backend)
5. [Wajib: Test Sebelum PR](#wajib-test-sebelum-pr)
6. [Konvensi Penamaan](#konvensi-penamaan)
7. [Design System Guidelines](#design-system-guidelines)

---

## Alur Kerja Git

```bash
# 1. Selalu ambil kode terbaru dari main
git checkout main && git pull origin main

# 2. Buat branch baru dari main
git checkout -b feat/nama-fitur-singkat

# 3. Kerjakan perubahan
# ...

# 4. Verifikasi build SEBELUM commit
npm run build

# 5. Jalankan E2E test loop
node scripts/e2e-test-loop.js

# 6. Commit dengan format konvensional
git add -A
git commit -m "feat(pos): tambahkan fitur split bill 3 orang"

# 7. Push dan buat Pull Request
git push origin feat/nama-fitur-singkat
```

---

## Struktur Branch

| Branch | Tujuan |
|--------|--------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feat/<nama>` | Fitur baru |
| `fix/<nama>` | Bug fix |
| `refactor/<nama>` | Refactoring kode |
| `docs/<nama>` | Update dokumentasi |

---

## Standar Kode Frontend

### Import Order (wajib diikuti)

```typescript
// 1. React & hooks
import { useState, useEffect, type ReactNode } from "react";

// 2. Third-party libraries
import { Head } from "@inertiajs/react";
import { ChefHat, ArrowRight } from "lucide-react";

// 3. Types (selalu gunakan dari @/Types)
import type { MenuItem, Order } from "../../Types";

// 4. Layouts
import MainLayout from "../../Layouts/MainLayout";

// 5. Shared design system (dari shared/, BUKAN Shared.tsx)
import { Button, Input, Badge, Glass, Screen } from "../../Components/shared";

// 6. Domain components
import { ReceiptPreview } from "../../Components/POS/ReceiptPreview";

// 7. Lib (constants, formatters, utils)
import { formatRupiah } from "../../lib/formatters";
import { ORDER_STATUS } from "../../lib/constants";
```

### Aturan TypeScript

```typescript
// ✅ BENAR — gunakan Types/ untuk interface domain
import type { Order } from "../../Types";

// ❌ SALAH — jangan definisikan tipe lokal yang duplikasi dengan Types/
interface LocalOrder { id: string; ... }

// ✅ BENAR — gunakan constants dari lib/
import { TAX_RATES } from "../../lib/constants";
const ppn = amount * TAX_RATES.ppn;

// ❌ SALAH — jangan hardcode konstanta
const ppn = amount * 0.11;
```

### Komponen Baru

Setiap komponen baru **wajib**:
1. Ditempatkan di folder domain yang sesuai (`Components/POS/`, `Components/HRD/`, dll.)
2. Menggunakan `Screen` dari `shared/` sebagai page wrapper
3. Menggunakan `Glass` sebagai kartu container utama
4. Menggunakan `Button` dan `Input` dari `shared/` (bukan raw `<button>` atau `<input>`)
5. Memiliki TypeScript props yang eksplisit (tidak ada `any` kecuali terpaksa)

---

## Standar Kode Backend

### Controller Structure

```php
// Gunakan resource controllers untuk CRUD
class MenuItemController extends Controller
{
    public function index(): Response { ... }
    public function store(StoreMenuItemRequest $request): Response { ... }
    public function update(UpdateMenuItemRequest $request, MenuItem $item): Response { ... }
    public function destroy(MenuItem $item): Response { ... }
}
```

### Inertia Response

```php
// Selalu gunakan Inertia::render untuk mengirim data ke frontend
return Inertia::render('POS/Index', [
    'menu' => MenuItemResource::collection($items),
    'tables' => Table::where('status', 'available')->get(),
]);
```

---

## Wajib: Test Sebelum PR

### Checklist Sebelum Membuat PR

- [ ] `npm run build` berhasil tanpa error
- [ ] `node scripts/e2e-test-loop.js` semua route merespons 200
- [ ] Tidak ada `console.error` atau `console.warn` di browser setelah perubahan
- [ ] Semua fitur yang diubah sudah ditest secara manual di browser
- [ ] Tidak ada perubahan yang break backward compatibility pada `Shared.tsx` shim

### Menjalankan E2E Test

```bash
# Pastikan server berjalan terlebih dahulu
php artisan serve &

# Jalankan E2E loop
node scripts/e2e-test-loop.js

# Dengan opsi verbose untuk debugging
node scripts/e2e-test-loop.js --verbose
```

---

## Konvensi Penamaan

### File & Folder

| Jenis | Konvensi | Contoh |
|-------|----------|--------|
| React Component | PascalCase.tsx | `ReceiptPreview.tsx` |
| Hook | camelCase.ts | `useCart.ts` |
| Utility/Lib | camelCase.ts | `formatters.ts` |
| Type file | camelCase.ts | `order.ts` |
| Page (Inertia) | `Pages/<Domain>/Index.tsx` | `Pages/POS/Index.tsx` |
| Component folder | PascalCase | `Components/HRD/` |

### Variabel & Fungsi

```typescript
// Konstanta = SCREAMING_SNAKE_CASE
const MOCK_PLAN = "pro";
const ORDER_STATUS = { pending: "Menunggu" };

// Fungsi utilitas = camelCase
function formatRupiah(amount: number): string { ... }

// React components = PascalCase
function ReceiptPreview({ order }: { order: Order }) { ... }

// Types/Interfaces = PascalCase
interface OrderItem { id: string; quantity: number; }

// Tipe union = PascalCase
type PaymentMethod = "cash" | "qris" | "gopay";
```

---

## Design System Guidelines

Lihat **[AGENTS.md](.agents/AGENTS.md)** untuk aturan lengkap desain UI/UX yang wajib diikuti.

Ringkasan cepat:
- **Spasi generous**: `p-6`, `p-8`, `gap-6` — hindari layout cramped
- **Border halus**: Gunakan `border-white/5` bukan `border-gray-300`
- **Transisi wajib**: Setiap elemen interaktif butuh `transition-all duration-200`
- **Warna nuanced**: Hindari warna default jenuh; gunakan `slate`, `zinc`, atau opacity variants
- **Font hierarchy**: Heading dengan `font-extrabold tracking-tight`, body dengan `leading-relaxed`

---

## 📞 Pertanyaan?

Hubungi tim melalui internal channel atau buat GitHub Issue dengan label `question`.
