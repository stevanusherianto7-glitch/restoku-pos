import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  note: string;
  category: string;
};

type CartStore = {
  items: CartItem[];
  discountType: "percentage" | "nominal" | "none";
  discountValue: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "restoku_cart";

// ─── Storage helpers ──────────────────────────────────────────────────────────
function loadCart(): CartStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [], discountType: "none", discountValue: 0 };
    const parsed: CartStore = JSON.parse(stored);
    return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        discountType: parsed.discountType || "none",
        discountValue: parsed.discountValue || 0,
    };
  } catch {
    return { items: [], discountType: "none", discountValue: 0 };
  }
}

function saveCart(store: CartStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable (private mode, storage full) — fail silently
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export type CartProduct = {
  id: number;
  name: string;
  price: number;
  category: string;
};

export function useCart() {
  const [store, setStore] = useState<CartStore>(() => loadCart());
  const items = store.items;

  useEffect(() => {
    saveCart(store);
  }, [store]);

  const setItems = (action: React.SetStateAction<CartItem[]>) => {
    setStore(prev => ({
        ...prev,
        items: typeof action === "function" ? action(prev.items) : action
    }));
  };

  const addItem = (product: CartProduct): void => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1, note: "" }];
    });
  };

  const removeItem = (id: number): void => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, quantity: number): void => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const updateNote = (id: number, note: string): void => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, note } : i))
    );
  };

  const clearCart = (): void => setStore({ items: [], discountType: "none", discountValue: 0 });

  const loadCartItems = (newItems: CartItem[]): void => {
    setStore({ items: newItems, discountType: "none", discountValue: 0 });
  };

  const setDiscount = (type: "percentage" | "nominal" | "none", value: number): void => {
      setStore(prev => ({ ...prev, discountType: type, discountValue: value }));
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  
  const discountAmount = store.discountType === "percentage" 
    ? (subtotal * store.discountValue) / 100 
    : store.discountType === "nominal" 
    ? store.discountValue 
    : 0;

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    discountType: store.discountType,
    discountValue: store.discountValue,
    itemCount,
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    addItem,
    removeItem,
    updateQuantity,
    updateNote,
    setDiscount,
    clearCart,
    loadCartItems,
  };
}
