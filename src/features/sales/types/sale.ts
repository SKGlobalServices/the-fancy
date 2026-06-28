import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ── Payment Methods ──────────────────────────────────────────

export const SalePaymentMethods = [
  "cash",
  "transfer",
  "localCard",
  "creditCard",
  "paymentLink",
] as const;

export type SalePaymentMethod = (typeof SalePaymentMethods)[number];

// ── Payment Fee Map ──────────────────────────────────────────

export const PAYMENT_FEE_MAP: Record<string, number> = {
  cash: 0,
  transfer: 0,
  localCard: 1.5,
  creditCard: 4,
  paymentLink: 4,
};

// ── Interfaces ───────────────────────────────────────────────

export interface Sale {
  id: string;
  date: Timestamp;
  clientId: string;
  clientName: string;
  employeeId: string;
  employeeName: string;
  serviceAreaId: string;
  serviceAreaName: string;
  serviceTypeId: string;
  serviceTypeName: string;
  amount: number;
  paymentMethod: SalePaymentMethod;
  paymentFeePct: number;
  isCredit: boolean;
  isMakeup: boolean;
  observations?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export interface SaleFormData {
  date: Timestamp;
  clientId: string;
  employeeId: string;
  serviceAreaId: string;
  serviceTypeId: string;
  paymentMethod: SalePaymentMethod;
  isCredit: boolean;
  observations?: string;
}

// ── Zod Schemas ──────────────────────────────────────────────

export const saleFormSchema = z.object({
  date: z.instanceof(Timestamp, { message: "La fecha es obligatoria" }),
  clientId: z.string().min(1, "Seleccioná un cliente"),
  employeeId: z.string().min(1, "Seleccioná un empleado"),
  serviceAreaId: z.string().min(1, "Seleccioná un área de servicio"),
  serviceTypeId: z.string().min(1, "Seleccioná un tipo de servicio"),
  paymentMethod: z.enum(SalePaymentMethods),
  isCredit: z.boolean(),
  observations: z.string().optional(),
});
