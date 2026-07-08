// ─── Staff & HR Types ─────────────────────────────────────────────────────────

export type StaffRole =
  | "owner"
  | "admin"
  | "manager"
  | "cashier"
  | "waiter"
  | "kitchen"
  | "inventory";

export type EmploymentStatus = "active" | "inactive" | "on_leave" | "terminated";

export type AttendanceStatus = "present" | "absent" | "late" | "permission" | "sick";

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
  pin?: string;          // 6-digit PIN for POS login
  outletId: string;
  employmentStatus: EmploymentStatus;
  joinDate: string;      // ISO 8601 date string
  avatarUrl?: string;
  salary?: number;
  address?: string;
}

export interface ShiftSchedule {
  id: string;
  staffId: string;
  staffName: string;
  outletId: string;
  date: string;          // ISO 8601 date string
  startTime: string;     // "HH:mm"
  endTime: string;       // "HH:mm"
  position: StaffRole;
  status: "scheduled" | "confirmed" | "completed" | "absent";
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;          // ISO 8601 date string
  checkIn?: string;      // "HH:mm"
  checkOut?: string;     // "HH:mm"
  status: AttendanceStatus;
  hoursWorked?: number;
  overtimeHours?: number;
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  period: string;        // "YYYY-MM" (e.g., "2026-07")
  baseSalary: number;
  overtimePay: number;
  allowances: number;
  deductions: number;
  totalSalary: number;
  status: "draft" | "approved" | "paid";
  paidAt?: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: "annual" | "sick" | "permission" | "unpaid";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
}
