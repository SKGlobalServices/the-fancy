import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  saleFormSchema,
  clientSchema,
  employeeSchema,
  serviceAreaSchema,
  serviceTypeSchema,
} from "../index";

// ── Helpers ──────────────────────────────────────────────────

function validSaleForm() {
  return {
    date: new Timestamp(1700000000, 0),
    clientId: "client-1",
    employeeId: "emp-1",
    serviceAreaId: "area-1",
    serviceTypeId: "type-1",
    paymentMethod: "cash",
    paymentFeePct: 0,
    isCredit: false,
  };
}

function validClient() {
  return { name: "Jane Doe" };
}

function validEmployee() {
  return { name: "John Smith", isActive: true };
}

function validServiceArea() {
  return { name: "Hair", sortOrder: 1 };
}

function validServiceType() {
  return { name: "Haircut", areaId: "area-1", price: 75, isMakeup: false };
}

// ── saleFormSchema ───────────────────────────────────────────

describe("saleFormSchema", () => {
  describe("valid data", () => {
    it("accepts a complete valid sale form", () => {
      const result = saleFormSchema.safeParse(validSaleForm());
      expect(result.success).toBe(true);
    });

    it("accepts sale with observations", () => {
      const result = saleFormSchema.safeParse({
        ...validSaleForm(),
        observations: "Monthly visit",
      });
      expect(result.success).toBe(true);
    });

    it("accepts sale without observations (optional)", () => {
      const { observations: _, ...rest } = validSaleForm();
      const result = saleFormSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it("accepts isCredit true", () => {
      const result = saleFormSchema.safeParse({
        ...validSaleForm(),
        isCredit: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("rejects missing clientId", () => {
      const { clientId: _, ...rest } = validSaleForm();
      const result = saleFormSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects empty clientId", () => {
      const result = saleFormSchema.safeParse({
        ...validSaleForm(),
        clientId: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing employeeId", () => {
      const { employeeId: _, ...rest } = validSaleForm();
      const result = saleFormSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects empty employeeId", () => {
      const result = saleFormSchema.safeParse({
        ...validSaleForm(),
        employeeId: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing serviceAreaId", () => {
      const { serviceAreaId: _, ...rest } = validSaleForm();
      const result = saleFormSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects empty serviceAreaId", () => {
      const result = saleFormSchema.safeParse({
        ...validSaleForm(),
        serviceAreaId: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing serviceTypeId", () => {
      const { serviceTypeId: _, ...rest } = validSaleForm();
      const result = saleFormSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects empty serviceTypeId", () => {
      const result = saleFormSchema.safeParse({
        ...validSaleForm(),
        serviceTypeId: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing date", () => {
      const { date: _, ...rest } = validSaleForm();
      const result = saleFormSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects missing isCredit", () => {
      const { isCredit: _, ...rest } = validSaleForm();
      const result = saleFormSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects non-boolean isCredit", () => {
      const result = saleFormSchema.safeParse({
        ...validSaleForm(),
        isCredit: "yes",
      });
      expect(result.success).toBe(false);
    });
  });
});

// ── clientSchema ─────────────────────────────────────────────

describe("clientSchema", () => {
  describe("valid data", () => {
    it("accepts a valid client with just name", () => {
      const result = clientSchema.safeParse(validClient());
      expect(result.success).toBe(true);
    });

    it("accepts client with phone and notes", () => {
      const result = clientSchema.safeParse({
        name: "Jane Doe",
        phone: "+297 500 1234",
        notes: "Prefers appointments",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("rejects empty name", () => {
      const result = clientSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing name", () => {
      const result = clientSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

// ── employeeSchema ───────────────────────────────────────────

describe("employeeSchema", () => {
  describe("valid data", () => {
    it("accepts a valid employee with just name", () => {
      const result = employeeSchema.safeParse({ name: "John Smith" });
      expect(result.success).toBe(true);
    });

    it("accepts employee with all fields", () => {
      const result = employeeSchema.safeParse(validEmployee());
      expect(result.success).toBe(true);
    });

    it("defaults isActive to true when omitted", () => {
      const result = employeeSchema.safeParse({ name: "John" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });
  });

  describe("invalid data", () => {
    it("rejects empty name", () => {
      const result = employeeSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing name", () => {
      const result = employeeSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

// ── serviceAreaSchema ────────────────────────────────────────

describe("serviceAreaSchema", () => {
  describe("valid data", () => {
    it("accepts a valid area with just name", () => {
      const result = serviceAreaSchema.safeParse({ name: "Hair" });
      expect(result.success).toBe(true);
    });

    it("accepts area with sortOrder", () => {
      const result = serviceAreaSchema.safeParse(validServiceArea());
      expect(result.success).toBe(true);
    });

    it("defaults sortOrder to 0 when omitted", () => {
      const result = serviceAreaSchema.safeParse({ name: "Nails" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortOrder).toBe(0);
      }
    });
  });

  describe("invalid data", () => {
    it("rejects empty name", () => {
      const result = serviceAreaSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing name", () => {
      const result = serviceAreaSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects negative sortOrder", () => {
      const result = serviceAreaSchema.safeParse({
        name: "Hair",
        sortOrder: -1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer sortOrder", () => {
      const result = serviceAreaSchema.safeParse({
        name: "Hair",
        sortOrder: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });
});

// ── serviceTypeSchema ────────────────────────────────────────

describe("serviceTypeSchema", () => {
  describe("valid data", () => {
    it("accepts a valid service type", () => {
      const result = serviceTypeSchema.safeParse(validServiceType());
      expect(result.success).toBe(true);
    });

    it("defaults isMakeup to false when omitted", () => {
      const result = serviceTypeSchema.safeParse({
        name: "Cut",
        areaId: "area-1",
        price: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isMakeup).toBe(false);
      }
    });

    it("accepts isMakeup true", () => {
      const result = serviceTypeSchema.safeParse({
        ...validServiceType(),
        isMakeup: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("rejects empty name", () => {
      const result = serviceTypeSchema.safeParse({
        ...validServiceType(),
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing name", () => {
      const { name: _, ...rest } = validServiceType();
      const result = serviceTypeSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects empty areaId", () => {
      const result = serviceTypeSchema.safeParse({
        ...validServiceType(),
        areaId: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects price of 0", () => {
      const result = serviceTypeSchema.safeParse({
        ...validServiceType(),
        price: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative price", () => {
      const result = serviceTypeSchema.safeParse({
        ...validServiceType(),
        price: -10,
      });
      expect(result.success).toBe(false);
    });
  });
});
