// ─── Menu & Product Types ─────────────────────────────────────────────────────

export type MenuCategory =
  | "Makanan"
  | "Minuman"
  | "Dessert"
  | "Snack"
  | "Paket"
  | "Signature"
  | "Main Course"
  | "Appetizer"
  | string;

export interface MenuVariant {
  id: string;
  name: string;          // e.g., "Ukuran S", "Pedas Level 2"
  additionalPrice: number;
}

export interface MenuIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;         // "gram", "ml", "pcs"
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  isAvailable: boolean;
  isSignature?: boolean;
  variants?: MenuVariant[];
  ingredients?: MenuIngredient[];
  allergens?: string[];
  prepTimeMinutes?: number;
  calories?: number;
  tags?: string[];
}

export interface MenuCatalog {
  id: string;
  name: string;         // e.g., "Menu Makan Siang"
  description?: string;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  items: MenuItem[];
}
