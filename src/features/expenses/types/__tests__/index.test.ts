import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { expenseSchema } from "../index";

function makeValidData() {
  return {
    fecha: new Timestamp(1700000000, 0),
    categoria: "Insumos",
    descripcion: "Compra de shampoo profesional",
    proveedorLugar: "Distribuidora Belleza S.A.",
    metodoPago: "Transferencia" as const,
    monto: 15000.5,
    tieneRecibo: "Sí" as const,
    numeroReciboFoto: "FAC-001",
    registradoPor: "Ana Paula" as const,
    observaciones: "Pago mensual",
  };
}

describe("expenseSchema", () => {
  describe("valid data", () => {
    it("accepts a complete valid expense", () => {
      const data = makeValidData();
      const result = expenseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts expense without descripcion (optional)", () => {
      const data = makeValidData();
      const { descripcion: _, ...rest } = data;
      const result = expenseSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it("accepts expense with empty descripcion", () => {
      const data = { ...makeValidData(), descripcion: "" };
      const result = expenseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts expense without numeroReciboFoto (optional)", () => {
      const data = makeValidData();
      const { numeroReciboFoto: _, ...rest } = data;
      const result = expenseSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it("accepts expense without observaciones (optional)", () => {
      const data = makeValidData();
      const { observaciones: _, ...rest } = data;
      const result = expenseSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it("accepts expense with all payment methods", () => {
      const methods = [
        "Efectivo",
        "Transferencia",
        "Tarjeta",
        "Crédito",
        "Abono",
        "Otro",
      ] as const;
      for (const metodoPago of methods) {
        const result = expenseSchema.safeParse({
          ...makeValidData(),
          metodoPago,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts expense with all registeredBy values", () => {
      const personas = [
        "Ana Paula",
        "Leandro",
        "Mónica",
        "Lizeth",
        "Dueña",
        "Otro",
      ] as const;
      for (const registradoPor of personas) {
        const result = expenseSchema.safeParse({
          ...makeValidData(),
          registradoPor,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts expense with all SiNo values", () => {
      for (const tieneRecibo of ["Sí", "No"] as const) {
        const result = expenseSchema.safeParse({
          ...makeValidData(),
          tieneRecibo,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("invalid data", () => {
    it("rejects empty categoria", () => {
      const result = expenseSchema.safeParse({
        ...makeValidData(),
        categoria: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("categoria");
      }
    });

    it("rejects monto equal to 0", () => {
      const result = expenseSchema.safeParse({
        ...makeValidData(),
        monto: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative monto", () => {
      const result = expenseSchema.safeParse({
        ...makeValidData(),
        monto: -100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty proveedorLugar", () => {
      const result = expenseSchema.safeParse({
        ...makeValidData(),
        proveedorLugar: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid metodoPago", () => {
      const result = expenseSchema.safeParse({
        ...makeValidData(),
        metodoPago: "Cheque",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid registradoPor", () => {
      const result = expenseSchema.safeParse({
        ...makeValidData(),
        registradoPor: "Pedro",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid tieneRecibo", () => {
      const result = expenseSchema.safeParse({
        ...makeValidData(),
        tieneRecibo: "Tal vez",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing fecha", () => {
      const data = makeValidData();
      const { fecha: _, ...rest } = data;
      const result = expenseSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects string monto", () => {
      const result = expenseSchema.safeParse({
        ...makeValidData(),
        monto: "quince mil",
      });
      expect(result.success).toBe(false);
    });
  });
});
