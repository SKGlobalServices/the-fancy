import { z } from "zod";
import { Timestamp } from "firebase/firestore";

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
  paymentMethod: string;
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
  paymentMethod: string;
  paymentFeePct: number;
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
  paymentMethod: z.string().min(1, "Seleccioná un método de pago"),
  paymentFeePct: z.number().min(0, "El fee no puede ser negativo"),
  isCredit: z.boolean(),
  observations: z.string().optional(),
});
