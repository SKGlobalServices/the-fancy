import type { Timestamp } from "firebase/firestore";

export type PaymentMethod = "Efectivo" | "Transferencia" | "Tarjeta" | "Crédito" | "Abono" | "Otro";

export type HasReceipt = "Sí" | "No";

export type RegisteredBy =
  | "Ana Paula"
  | "Leandro"
  | "Mónica"
  | "Lizeth"
  | "Dueña"
  | "Otro";

export interface Expense {
  id: string;
  fecha: Timestamp;
  categoria: string;
  descripcion: string;
  proveedorLugar: string;
  metodoPago: PaymentMethod;
  monto: number;
  tieneRecibo: HasReceipt;
  numeroReciboFoto: string;
  registradoPor: RegisteredBy;
  observaciones: string;
  createdAt: Timestamp;
  createdBy: string;
}

export type ExpenseFormData = Omit<
  Expense,
  "id" | "createdAt" | "createdBy"
>;

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Efectivo",
  "Transferencia",
  "Tarjeta",
  "Crédito",
  "Abono",
  "Otro",
];

export const REGISTERED_BY: RegisteredBy[] = [
  "Ana Paula",
  "Leandro",
  "Mónica",
  "Lizeth",
  "Dueña",
  "Otro",
];
