import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore, DocumentData } from "firebase/firestore";

// ── Mocks (vi.hoisted to handle vitest hoisting) ─────────────

const {
  mockAddDoc,
  mockUpdateDoc,
  mockGetDoc,
  mockOnSnapshot,
  mockOrderBy,
  mockQuery,
  mockTimestampNow,
} = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockOrderBy: vi.fn(),
  mockQuery: vi.fn(),
  mockTimestampNow: vi.fn(() => ({
    seconds: 1719000000,
    nanoseconds: 0,
  })),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "sales-collection"),
  doc: vi.fn((_db: unknown, _path: string, ...pathSegments: string[]) => ({
    id: pathSegments[0] ?? "mock-doc-id",
  })),
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  getDoc: mockGetDoc,
  onSnapshot: mockOnSnapshot,
  orderBy: mockOrderBy,
  query: mockQuery,
  Timestamp: {
    now: mockTimestampNow,
  },
}));

// ── Module to test ───────────────────────────────────────────

import {
  listenSales,
  createSale,
  updateSale,
  softDeleteSale,
  restoreSale,
} from "../sale-service";

// ── Helpers ──────────────────────────────────────────────────

function createMockDb(): Firestore {
  return {} as unknown as Firestore;
}

function createValidFormData() {
  return {
    date: { seconds: 1700000000, nanoseconds: 0 } as any,
    clientId: "client-1",
    employeeId: "emp-1",
    serviceAreaId: "area-1",
    serviceTypeId: "type-1",
    paymentMethod: "cash" as const,
    isCredit: false,
  };
}

function createValidCatalogs() {
  return {
    clientName: "Jane Doe",
    employeeName: "John Smith",
    areaName: "Hair",
    typeName: "Haircut",
    typePrice: 75,
    typeIsMakeup: false,
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe("sale-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listenSales", () => {
    it("subscribes with orderBy date desc", () => {
      const unsubscribe = vi.fn();
      mockOnSnapshot.mockReturnValue(unsubscribe);

      const onData = vi.fn();
      const onError = vi.fn();

      const result = listenSales(createMockDb(), onData, onError);

      expect(mockOrderBy).toHaveBeenCalledWith("date", "desc");
      expect(mockQuery).toHaveBeenCalled();
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(result).toBe(unsubscribe);
    });

    it("calls onData with mapped sales on snapshot (non-deleted)", () => {
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
                id: "sale1",
                data: () =>
                  ({
                    clientName: "Jane Doe",
                    amount: 100,
                    deletedAt: null,
                  }) as DocumentData,
              },
              {
                id: "sale2",
                data: () =>
                  ({
                    clientName: "John Smith",
                    amount: 200,
                    deletedAt: null,
                  }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenSales(createMockDb(), onData, onError);

      expect(onData).toHaveBeenCalledTimes(1);
      const sales = onData.mock.calls[0][0];
      expect(sales).toHaveLength(2);
      expect(sales[0].id).toBe("sale1");
      expect(sales[0].clientName).toBe("Jane Doe");
    });

    it("filters out deleted sales by default", () => {
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
                id: "sale1",
                data: () =>
                  ({
                    clientName: "Active",
                    deletedAt: null,
                  }) as DocumentData,
              },
              {
                id: "sale2",
                data: () =>
                  ({
                    clientName: "Deleted",
                    deletedAt: { seconds: 1719000000, nanoseconds: 0 },
                  }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenSales(createMockDb(), onData, onError);

      const sales = onData.mock.calls[0][0];
      expect(sales).toHaveLength(1);
      expect(sales[0].clientName).toBe("Active");
    });

    it("shows only deleted sales when showDeleted=true", () => {
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
                id: "sale1",
                data: () =>
                  ({
                    clientName: "Active",
                    deletedAt: null,
                  }) as DocumentData,
              },
              {
                id: "sale2",
                data: () =>
                  ({
                    clientName: "Deleted",
                    deletedAt: { seconds: 1719000000, nanoseconds: 0 },
                  }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenSales(createMockDb(), onData, onError, true);

      const sales = onData.mock.calls[0][0];
      expect(sales).toHaveLength(1);
      expect(sales[0].clientName).toBe("Deleted");
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

      listenSales(createMockDb(), onData, onError);
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

      listenSales(createMockDb(), onData, onError);
      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  describe("createSale", () => {
    it("adds a document with form data, derived fields, and audit fields", async () => {
      mockAddDoc.mockResolvedValue({ id: "new-sale-1" });

      const formData = createValidFormData();
      const catalogs = createValidCatalogs();
      const result = await createSale(createMockDb(), formData, "user-abc", catalogs);

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.date).toEqual(formData.date);
      expect(docData.clientId).toBe("client-1");
      expect(docData.clientName).toBe("Jane Doe");
      expect(docData.employeeName).toBe("John Smith");
      expect(docData.serviceAreaName).toBe("Hair");
      expect(docData.serviceTypeName).toBe("Haircut");
      expect(docData.amount).toBe(75);
      expect(docData.paymentFeePct).toBe(0);
      expect(docData.isMakeup).toBe(false);
      expect(docData.createdBy).toBe("user-abc");
      expect(docData.createdAt).toBeDefined();
      expect(docData.updatedAt).toBeDefined();
      expect(docData.deletedAt).toBeNull();
      expect(result).toBe("new-sale-1");
    });

    it("computes payment fee from map", async () => {
      mockAddDoc.mockResolvedValue({ id: "sale-2" });

      const formData = { ...createValidFormData(), paymentMethod: "creditCard" as const };
      const catalogs = createValidCatalogs();

      await createSale(createMockDb(), formData, "user-abc", catalogs);

      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.paymentFeePct).toBe(4);
    });

    it("sets isMakeup from catalog", async () => {
      mockAddDoc.mockResolvedValue({ id: "sale-3" });

      const formData = createValidFormData();
      const catalogs = { ...createValidCatalogs(), typeIsMakeup: true };

      await createSale(createMockDb(), formData, "user-abc", catalogs);

      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.isMakeup).toBe(true);
    });

    it("includes observations when provided", async () => {
      mockAddDoc.mockResolvedValue({ id: "sale-4" });

      const formData = { ...createValidFormData(), observations: "Special request" };
      const catalogs = createValidCatalogs();

      await createSale(createMockDb(), formData, "user-abc", catalogs);

      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.observations).toBe("Special request");
    });

    it("propagates Firestore errors", async () => {
      mockAddDoc.mockRejectedValue(new Error("permission-denied"));

      await expect(
        createSale(createMockDb(), createValidFormData(), "user-abc", createValidCatalogs()),
      ).rejects.toThrow("permission-denied");
    });
  });

  describe("updateSale", () => {
    it("updates document with partial data and updatedAt", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ deletedAt: null }),
      });

      await updateSale(createMockDb(), "sale-1", {
        isCredit: true,
      });

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.isCredit).toBe(true);
      expect(updateData.updatedAt).toBeDefined();
    });

    it("recomputes payment fee when payment method changes", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ deletedAt: null }),
      });

      await updateSale(createMockDb(), "sale-1", {
        paymentMethod: "creditCard",
      });

      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.paymentFeePct).toBe(4);
    });

    it("rejects update when sale is soft-deleted", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({
          deletedAt: { seconds: 1719000000, nanoseconds: 0 },
        }),
      });

      await expect(
        updateSale(createMockDb(), "sale-1", { isCredit: true }),
      ).rejects.toThrow("No se puede actualizar una venta eliminada");

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("rejects update when sale does not exist", async () => {
      mockGetDoc.mockResolvedValue({
        exists: false,
        data: () => ({}),
      });

      await expect(
        updateSale(createMockDb(), "sale-nonexistent", { isCredit: true }),
      ).rejects.toThrow("Venta no encontrada");

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("propagates errors", async () => {
      mockUpdateDoc.mockRejectedValue(new Error("not-found"));
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ deletedAt: null }),
      });

      await expect(
        updateSale(createMockDb(), "sale-1", { isCredit: true }),
      ).rejects.toThrow("not-found");
    });
  });

  describe("softDeleteSale", () => {
    it("sets deletedAt and updatedAt timestamps", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ deletedAt: null }),
      });

      await softDeleteSale(createMockDb(), "sale-1");

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.deletedAt).toBeDefined();
      expect(updateData.updatedAt).toBeDefined();
    });

    it("rejects soft delete when already deleted", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({
          deletedAt: { seconds: 1719000000, nanoseconds: 0 },
        }),
      });

      await expect(
        softDeleteSale(createMockDb(), "sale-1"),
      ).rejects.toThrow("La venta ya está eliminada");

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("rejects soft delete when sale does not exist", async () => {
      mockGetDoc.mockResolvedValue({
        exists: false,
        data: () => ({}),
      });

      await expect(
        softDeleteSale(createMockDb(), "sale-nonexistent"),
      ).rejects.toThrow("Venta no encontrada");

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("propagates errors", async () => {
      mockUpdateDoc.mockRejectedValue(new Error("not-found"));
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ deletedAt: null }),
      });

      await expect(
        softDeleteSale(createMockDb(), "sale-1"),
      ).rejects.toThrow("not-found");
    });
  });

  describe("restoreSale", () => {
    it("sets deletedAt to null and updates updatedAt", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await restoreSale(createMockDb(), "sale-1");

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.deletedAt).toBeNull();
      expect(updateData.updatedAt).toBeDefined();
    });

    it("propagates errors", async () => {
      mockUpdateDoc.mockRejectedValue(new Error("not-found"));

      await expect(
        restoreSale(createMockDb(), "sale-1"),
      ).rejects.toThrow("not-found");
    });
  });
});
