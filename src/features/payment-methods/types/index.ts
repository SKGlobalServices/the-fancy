import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ── Interface ────────────────────────────────────────────────

export interface PaymentMethod {
  id: string;
  name: string;
  feePct: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ── Zod Schema ───────────────────────────────────────────────

export const paymentMethodSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  feePct: z.number().min(0, "El porcentaje no puede ser negativo"),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
