# Aesthetic and UX Guidelines

## Core Philosophy
Design UI that feels organic, premium, and human-crafted. Break away from standard, rigid, boxy AI-generated admin templates. The UI must feel fluid, tactile, and highly polished.

## Rules

### 1. Generous Whitespace & Breathing Room
Avoid cramped layouts. Use generous padding and margins (e.g., `p-6`, `p-8`, `gap-6`). Let elements breathe. Use asymmetric padding or grid layouts occasionally to break visual monotony.

### 2. Softness & Depth over Hard Borders
Minimize the use of harsh, solid borders (e.g., avoid `border-gray-300`). Instead, separate elements using subtle background color differences (e.g., `bg-slate-50` vs `bg-white`) and soft, layered drop-shadows (e.g., `shadow-sm`, `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`). Use softer border radii like `rounded-xl`, `rounded-2xl`, or even fully rounded buttons where appropriate.

### 3. Nuanced Color Palette
Never use default, highly saturated primary colors unless strictly requested. Use sophisticated neutral scales (like `zinc`, `slate`, or `stone`) for backgrounds and text. For secondary text, use `text-muted-foreground` or `text-slate-500` to create clear visual hierarchy without relying only on font size. Incorporate subtle gradients or glassmorphism (`backdrop-blur-md`, `bg-white/70`) for overlays, headers, or floating cards.

### 4. Typography Hierarchy
Create extreme contrast in typography to make it look professional. Use tight tracking (letter-spacing) for large bold headings (`tracking-tight`, `font-extrabold`) and relaxed leading (line-height) for body text (`leading-relaxed`).

### 5. Fluid Micro-interactions (The "Not Stiff" Rule)
Every interactive element (buttons, cards, inputs, table rows) MUST have smooth transitions. Always use `transition-all duration-300 ease-out`. Add subtle hover effects like a slight scale-up (`hover:scale-[1.02]`), gentle lift (`hover:-translate-y-1`), or soft shadow expansion (`hover:shadow-md`). Inputs should have smooth focus rings (`focus:ring-2 focus:ring-offset-2 focus:ring-primary/50`).

### 6. Organic Component Styling
When using shadcn/ui, do not just accept the default brutalist look if it doesn't fit. Soften the UI by tweaking the `radius` in the global CSS or adding utility classes. Use overlapping elements occasionally (e.g., an avatar slightly overlapping a card border) to make it feel custom-designed.

---

# Standard Operating Procedures (SOP)

## 1. Test After Implementation (WAJIB via TDR Suite)

Setelah menambah fitur baru atau melakukan *refactoring* kode, agen WAJIB langsung mengujinya menggunakan **TDR Automation Suite** sebelum melaporkan ke user. 

> 📖 **Baca panduan lengkapnya di:** `TDR_WORKFLOW_GUIDE.md` di root proyek.

Urutan eksekusi wajib:
```bash
# Jalankan seluruh 4 tahap verifikasi TDR (Linter Arsitektur, php artisan test, vitest, & vite build)
npm run tdr
```

Jika terjadi perubahan rute HTTP atau halaman baru, lanjutkan dengan E2E loop:
```bash
node scripts/e2e-test-loop.js
```

## 2. Import Pattern yang Benar

```typescript
// Types — selalu dari @/Types
import type { MenuItem, Order } from "../../Types";

// Lib — constants & formatters
import { MOCK_PLAN, ORDER_STATUS } from "../../lib/constants";
import { formatRupiah, formatDate } from "../../lib/formatters";

// Design system — dari shared/ (BUKAN Shared.tsx)
import { Button, Input, Badge, Glass, Screen } from "../../Components/shared";

// Layouts
import MainLayout  from "../../Layouts/MainLayout";   // Admin/Staff
import OwnerLayout from "../../Layouts/OwnerLayout";  // Owner (read-only)
import AuthLayout  from "../../Layouts/AuthLayout";   // Login pages
```

## 3. Struktur Halaman Baru

Setiap halaman baru di `Pages/` harus mengikuti template ini:

```tsx
import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { Screen, Glass } from "../../Components/shared";

export default function NamaHalaman() {
  return (
    <MainLayout>
      <Head title="Nama Halaman" />
      <Screen title="Nama Halaman" subtitle="Deskripsi singkat halaman">
        <Glass className="p-6">
          {/* konten halaman */}
        </Glass>
      </Screen>
    </MainLayout>
  );
}
```

## 4. Arsitektur Reference

- **Diagram lengkap**: `FRONTEND_ARCHITECTURE.md` di root proyek
- **Changelog**: `CHANGELOG.md` — update setiap kali ada perubahan signifikan
- **Panduan kontribusi**: `CONTRIBUTING.md`
