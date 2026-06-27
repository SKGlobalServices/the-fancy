import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ── Union Types (key-based for translation) ────────────────────

export const PaymentMethods = [
  "cash",
  "transfer",
  "card",
  "credit",
  "creditNote",
  "other",
] as const;

export type PaymentMethod = (typeof PaymentMethods)[number];

export const RegisteredByValues = [
  "anaPaula",
  "leandro",
  "monica",
  "lizeth",
  "owner",
  "other",
] as const;

export type RegisteredBy = (typeof RegisteredByValues)[number];

export const SiNoValues = ["yes", "no"] as const;

export type SiNo = (typeof SiNoValues)[number];

// ── Interfaces ───────────────────────────────────────────────

export interface Expense {
  id: string;
  fecha: Timestamp;
  categoria: string;
  descripcion?: string;
  proveedorLugar: string;
  metodoPago: PaymentMethod;
  monto: number;
  tieneRecibo: SiNo;
  numeroReciboFoto?: string;
  registradoPor: RegisteredBy;
  observaciones?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export interface ExpenseFormData {
  fecha: Timestamp;
  categoria: string;
  descripcion?: string;
  proveedorLugar: string;
  metodoPago: PaymentMethod;
  monto: number;
  tieneRecibo: SiNo;
  numeroReciboFoto?: string;
  registradoPor: RegisteredBy;
  observaciones?: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ── Zod Schemas ──────────────────────────────────────────────

export const expenseSchema = z.object({
  fecha: z.instanceof(Timestamp, { message: "La fecha es obligatoria" }),
  categoria: z.string().min(1, "Seleccioná una categoría"),
  descripcion: z.string().optional().default(""),
  proveedorLugar: z.string().min(1, "El proveedor/lugar es obligatorio"),
  metodoPago: z.enum(PaymentMethods),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  tieneRecibo: z.enum(SiNoValues),
  numeroReciboFoto: z.string().optional(),
  registradoPor: z.enum(RegisteredByValues),
  observaciones: z.string().optional(),
});
