// ─── Order Types ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "processing"
  | "ready_for_pickup"
  | "completed"
  | "cancelled"
  | "void";

export type PaymentMethod =
  | "cash"
  | "qris"
  | "gopay"
  | "ovo"
  | "dana"
  | "shopeepay"
  | "bank_transfer"
  | "credit_card";

export type PaymentStatus = "unpaid" | "paid" | "partial" | "refunded";

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  variantId?: string;
  variantName?: string;
  notes?: string;
}

export interface OrderDiscount {
  type: "percentage" | "fixed";
  value: number;
  reason?: string;
  code?: string;
}

export interface OrderTax {
  type: "pbjt" | "ppn" | "service_charge";
  label: string;
  rate: number;        // 0–1 (e.g., 0.11 for 11%)
  amount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string;
  tableNumber?: number;
  staffId: string;
  staffName: string;
  outletId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  discount?: OrderDiscount;
  taxes: OrderTax[];
  serviceCharge?: number;
  total: number;
  notes?: string;
  createdAt: string;   // ISO 8601
  updatedAt: string;
  completedAt?: string;
}

export interface SplitBillItem {
  orderId: string;
  portion: number;     // 0–1 (fraction of total)
  paymentMethod: PaymentMethod;
  amount: number;
  isPaid: boolean;
}

export interface Receipt {
  order: Order;
  outlet: {
    name: string;
    address: string;
    phone: string;
    taxId?: string;
  };
  cashier: string;
  printedAt: string;
}
