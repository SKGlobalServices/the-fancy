import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ── Interface ────────────────────────────────────────────────

export interface ServiceArea {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

// ── Zod Schema ───────────────────────────────────────────────

export const serviceAreaSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  sortOrder: z.number().int().min(0).default(0),
});
