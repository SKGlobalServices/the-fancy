import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ── Interface ────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

// ── Zod Schema ───────────────────────────────────────────────

export const clientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
