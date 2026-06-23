import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore, DocumentData } from "firebase/firestore";

// ── Mocks (vi.hoisted to handle vitest hoisting) ─────────────

const {
  mockAddDoc,
  mockUpdateDoc,
  mockGetDoc,
  mockOnSnapshot,
  mockWhere,
  mockOrderBy,
  mockQuery,
  mockTimestampNow,
} = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockWhere: vi.fn(),
  mockOrderBy: vi.fn(),
  mockQuery: vi.fn(),
  mockTimestampNow: vi.fn(() => ({
    seconds: 1719000000,
    nanoseconds: 0,
  })),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "expenses-collection"),
  doc: vi.fn((_db: unknown, _path: string, ...pathSegments: string[]) => ({
    id: pathSegments[0] ?? "mock-doc-id",
  })),
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  getDoc: mockGetDoc,
  onSnapshot: mockOnSnapshot,
  where: mockWhere,
  orderBy: mockOrderBy,
  query: mockQuery,
  Timestamp: {
    now: mockTimestampNow,
  },
}));

// ── Module to test ───────────────────────────────────────────

import {
  listenExpenses,
  createExpense,
  updateExpense,
  softDeleteExpense,
  restoreExpense,
} from "../expense-service";

// ── Helpers ──────────────────────────────────────────────────

function createMockDb(): Firestore {
  return {} as unknown as Firestore;
}

function createValidFormData() {
  return {
    fecha: { seconds: 1700000000, nanoseconds: 0 } as any,
    categoria: "Insumos",
    descripcion: "Shampoo profesional",
    proveedorLugar: "Distribuidora Belleza",
    metodoPago: "Transferencia" as const,
    monto: 15000.5,
    tieneRecibo: "Sí" as const,
    registradoPor: "Ana Paula" as const,
  };
}

describe("expense-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listenExpenses", () => {
    it("subscribes with orderBy fecha desc (no composite index needed)", () => {
      const unsubscribe = vi.fn();
      mockOnSnapshot.mockReturnValue(unsubscribe);

      const onData = vi.fn();
      const onError = vi.fn();

      const result = listenExpenses(createMockDb(), 2025, onData, onError);

      expect(mockOrderBy).toHaveBeenCalledWith("fecha", "desc");
      expect(mockQuery).toHaveBeenCalled();
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(result).toBe(unsubscribe);
    });

    it("calls onData with mapped expenses on snapshot", () => {
      const onData = vi.fn();
      const onError = vi.fn();

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          snapshotCallback: (snap: any) => void,
        ) => {
          snapshotCallback({
            docs: [
              {
                id: "exp1",
                data: () =>
                  ({
                    fecha: { seconds: 1700000000, nanoseconds: 0 },
                    categoria: "Insumos",
                    monto: 5000,
                  }) as DocumentData,
              },
              {
                id: "exp2",
                data: () =>
                  ({
                    fecha: { seconds: 1690000000, nanoseconds: 0 },
                    categoria: "Servicios",
                    monto: 10000,
                  }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenExpenses(createMockDb(), 2025, onData, onError);

      expect(onData).toHaveBeenCalledTimes(1);
      const expenses = onData.mock.calls[0][0];
      expect(expenses).toHaveLength(2);
      expect(expenses[0].id).toBe("exp1");
      expect(expenses[0].categoria).toBe("Insumos");
    });

    it("calls onData with empty array when no docs", () => {
      const onData = vi.fn();
      const onError = vi.fn();

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          snapshotCallback: (snap: any) => void,
        ) => {
          snapshotCallback({ docs: [] });
          return vi.fn();
        },
      );

      listenExpenses(createMockDb(), 2025, onData, onError);
      expect(onData).toHaveBeenCalledWith([]);
    });

    it("calls onError when snapshot errors", () => {
      const onData = vi.fn();
      const onError = vi.fn();
      const testError = new Error("permission-denied");

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          _next: (snap: any) => void,
          errorCallback: (err: Error) => void,
        ) => {
          errorCallback(testError);
          return vi.fn();
        },
      );

      listenExpenses(createMockDb(), 2025, onData, onError);
      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  describe("createExpense", () => {
    it("adds a document with form data + audit fields", async () => {
      mockAddDoc.mockResolvedValue({ id: "new-exp-1" });

      const data = createValidFormData();
      const result = await createExpense(createMockDb(), data, "user-abc");

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.fecha).toEqual(data.fecha);
      expect(docData.categoria).toBe("Insumos");
      expect(docData.monto).toBe(15000.5);
      expect(docData.createdBy).toBe("user-abc");
      expect(docData.createdAt).toBeDefined();
      expect(docData.updatedAt).toBeDefined();
      expect(docData.deletedAt).toBeNull();
      expect(result).toBe("new-exp-1");
    });

    it("includes optional fields when provided", async () => {
      mockAddDoc.mockResolvedValue({ id: "new-exp-2" });

      const data = {
        ...createValidFormData(),
        descripcion: "Nota adicional",
        numeroReciboFoto: "FAC-123",
        observaciones: "Compra mensual",
      };
      await createExpense(createMockDb(), data, "user-abc");

      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.descripcion).toBe("Nota adicional");
      expect(docData.numeroReciboFoto).toBe("FAC-123");
      expect(docData.observaciones).toBe("Compra mensual");
    });

    it("propagates Firestore errors", async () => {
      mockAddDoc.mockRejectedValue(new Error("permission-denied"));

      await expect(
        createExpense(createMockDb(), createValidFormData(), "user-abc"),
      ).rejects.toThrow("permission-denied");
    });
  });

  describe("updateExpense", () => {
    it("updates document with partial data and updatedAt", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ deletedAt: null }),
      });

      await updateExpense(createMockDb(), "exp-1", {
        monto: 20000,
        categoria: "Servicios",
      });

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const docRef = mockUpdateDoc.mock.calls[0][0];
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(docRef.id).toBe("exp-1");
      expect(updateData.monto).toBe(20000);
      expect(updateData.categoria).toBe("Servicios");
      expect(updateData.updatedAt).toBeDefined();
    });

    it("rejects update when expense is soft-deleted", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({
          deletedAt: { seconds: 1719000000, nanoseconds: 0 },
        }),
      });

      await expect(
        updateExpense(createMockDb(), "exp-1", { monto: 20000 }),
      ).rejects.toThrow("No se puede actualizar un gasto eliminado");

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("rejects update when expense does not exist", async () => {
      mockGetDoc.mockResolvedValue({
        exists: false,
        data: () => ({}),
      });

      await expect(
        updateExpense(createMockDb(), "exp-nonexistent", { monto: 20000 }),
      ).rejects.toThrow("Gasto no encontrado");

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("propagates errors", async () => {
      mockUpdateDoc.mockRejectedValue(new Error("not-found"));
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ deletedAt: null }),
      });

      await expect(
        updateExpense(createMockDb(), "exp-1", { monto: 100 }),
      ).rejects.toThrow("not-found");
    });
  });

  describe("softDeleteExpense", () => {
    it("sets deletedAt and updatedAt timestamps", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ deletedAt: null }),
      });

      await softDeleteExpense(createMockDb(), "exp-1");

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.deletedAt).toBeDefined();
      expect(updateData.updatedAt).toBeDefined();
    });

    it("rejects soft delete when expense is already deleted", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({
          deletedAt: { seconds: 1719000000, nanoseconds: 0 },
        }),
      });

      await expect(
        softDeleteExpense(createMockDb(), "exp-1"),
      ).rejects.toThrow("El gasto ya está eliminado");

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("rejects soft delete when expense does not exist", async () => {
      mockGetDoc.mockResolvedValue({
        exists: false,
        data: () => ({}),
      });

      await expect(
        softDeleteExpense(createMockDb(), "exp-nonexistent"),
      ).rejects.toThrow("Gasto no encontrado");

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("propagates errors", async () => {
      mockUpdateDoc.mockRejectedValue(new Error("not-found"));
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ deletedAt: null }),
      });

      await expect(
        softDeleteExpense(createMockDb(), "exp-1"),
      ).rejects.toThrow("not-found");
    });
  });

  describe("restoreExpense", () => {
    it("sets deletedAt to null and updates updatedAt", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await restoreExpense(createMockDb(), "exp-1");

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.deletedAt).toBeNull();
      expect(updateData.updatedAt).toBeDefined();
    });

    it("propagates errors", async () => {
      mockUpdateDoc.mockRejectedValue(new Error("not-found"));

      await expect(
        restoreExpense(createMockDb(), "exp-1"),
      ).rejects.toThrow("not-found");
    });
  });
});
