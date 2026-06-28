import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ── Interface ────────────────────────────────────────────────

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

// ── Zod Schema ───────────────────────────────────────────────

export const employeeSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
});
