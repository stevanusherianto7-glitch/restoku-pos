// ─── Types Barrel Export ──────────────────────────────────────────────────────
// Single entry point for all shared TypeScript interfaces.
// Usage: import { MenuItem, Order, Staff, Outlet } from '@/Types';

export type { MenuItem, MenuCategory, MenuVariant, MenuIngredient, MenuCatalog } from "./menu";
export type { Order, OrderItem, OrderStatus, OrderDiscount, OrderTax, PaymentMethod, PaymentStatus, SplitBillItem, Receipt } from "./order";
export type { Staff, StaffRole, ShiftSchedule, AttendanceRecord, PayrollRecord, LeaveRequest, EmploymentStatus, AttendanceStatus } from "./staff";
export type { Outlet, Table, InventoryItem, DailySummary, Plan } from "./outlet";
export type { SharedProps } from "./inertia";
