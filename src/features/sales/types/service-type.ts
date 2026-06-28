import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ── Interface ────────────────────────────────────────────────

export interface ServiceType {
  id: string;
  name: string;
  areaId: string;
  price: number;
  isMakeup: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

// ── Zod Schema ───────────────────────────────────────────────

export const serviceTypeSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  areaId: z.string().min(1, "Seleccioná un área"),
  price: z.number().positive("El precio debe ser mayor a 0"),
  isMakeup: z.boolean().default(false),
});
