import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore } from "firebase/firestore";

// ── Mocks (vi.hoisted to handle vitest hoisting) ─────────────

const {
  mockAddDoc,
  mockUpdateDoc,
  mockDeleteDoc,
  mockGetDoc,
  mockOnSnapshot,
  mockWhere,
  mockOrderBy,
  mockQuery,
  mockGetDocs,
  mockTimestampNow,
} = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockWhere: vi.fn(),
  mockOrderBy: vi.fn(),
  mockQuery: vi.fn(),
  mockGetDocs: vi.fn(),
  mockTimestampNow: vi.fn(() => ({
    seconds: 1719000000,
    nanoseconds: 0,
  })),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "categories-collection"),
  doc: vi.fn((_db: unknown, _path: string, ...pathSegments: string[]) => ({
    id: pathSegments[0] ?? "mock-cat-id",
  })),
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  getDoc: mockGetDoc,
  onSnapshot: mockOnSnapshot,
  where: mockWhere,
  orderBy: mockOrderBy,
  query: mockQuery,
  getDocs: mockGetDocs,
  Timestamp: {
    now: mockTimestampNow,
  },
}));

import {
  listenCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../category-service";

function createMockDb(): Firestore {
  return {} as unknown as Firestore;
}

describe("category-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listenCategories", () => {
    it("subscribes with correct orderBy", () => {
      const unsubscribe = vi.fn();
      mockOnSnapshot.mockReturnValue(unsubscribe);

      const onData = vi.fn();
      const onError = vi.fn();

      const result = listenCategories(createMockDb(), onData, onError);

      expect(mockOrderBy).toHaveBeenCalledWith("name", "asc");
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(result).toBe(unsubscribe);
    });

    it("calls onData with categories on snapshot", () => {
      const onData = vi.fn();
      const onError = vi.fn();

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          snapshotCallback: (snap: any) => void,
        ) => {
          snapshotCallback({
            docs: [
              { id: "cat1", data: () => ({ name: "Insumos" }) },
              { id: "cat2", data: () => ({ name: "Servicios" }) },
            ],
          });
          return vi.fn();
        },
      );

      listenCategories(createMockDb(), onData, onError);

      expect(onData).toHaveBeenCalledTimes(1);
      const categories = onData.mock.calls[0][0];
      expect(categories).toHaveLength(2);
      expect(categories[0].id).toBe("cat1");
      expect(categories[0].name).toBe("Insumos");
    });

    it("calls onData with empty array when no categories", () => {
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

      listenCategories(createMockDb(), onData, onError);
      expect(onData).toHaveBeenCalledWith([]);
    });

    it("calls onError on snapshot error", () => {
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

      listenCategories(createMockDb(), onData, onError);
      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  describe("createCategory", () => {
    it("creates category with name and audit fields", async () => {
      mockAddDoc.mockResolvedValue({ id: "new-cat-1" });
      mockGetDocs.mockResolvedValue({ docs: [], empty: true });

      const result = await createCategory(createMockDb(), " Insumos  ", "user-abc");

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.name).toBe("Insumos");
      expect(docData.createdBy).toBe("user-abc");
      expect(docData.createdAt).toBeDefined();
      expect(docData.updatedAt).toBeDefined();
      expect(result).toBe("new-cat-1");
    });

    it("rejects duplicate name (case-insensitive)", async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ id: "cat1", data: () => ({ name: "insumos" }) }],
        empty: false,
      });

      await expect(
        createCategory(createMockDb(), "Insumos", "user-abc"),
      ).rejects.toThrow("Ya existe una categoría con ese nombre");

      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it("rejects empty name", async () => {
      await expect(
        createCategory(createMockDb(), "  ", "user-abc"),
      ).rejects.toThrow("El nombre de la categoría es obligatorio");

      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it("propagates Firestore errors", async () => {
      mockGetDocs.mockResolvedValue({ docs: [], empty: true });
      mockAddDoc.mockRejectedValue(new Error("permission-denied"));

      await expect(
        createCategory(createMockDb(), "Insumos", "user-abc"),
      ).rejects.toThrow("permission-denied");
    });
  });

  describe("updateCategory", () => {
    it("updates category name with timestamps", async () => {
      mockGetDocs.mockResolvedValue({ docs: [], empty: true });

      await updateCategory(createMockDb(), "cat-1", "Nuevo nombre");

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.name).toBe("Nuevo nombre");
      expect(updateData.updatedAt).toBeDefined();
    });

    it("rejects duplicate name on rename", async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ id: "cat-2", data: () => ({ name: "Servicios" }) }],
        empty: false,
      });

      await expect(
        updateCategory(createMockDb(), "cat-1", "Servicios"),
      ).rejects.toThrow("Ya existe una categoría con ese nombre");
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("allows renaming to same current name (self)", async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ id: "cat-1", data: () => ({ name: "Insumos" }) }],
        empty: false,
      });

      await updateCategory(createMockDb(), "cat-1", "Insumos");

      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  describe("deleteCategory", () => {
    it("deletes category when no expenses reference it", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Insumos" }),
      });
      mockGetDocs.mockResolvedValue({ docs: [], empty: true });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteCategory(createMockDb(), "cat-1", "Insumos");

      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });

    it("prevents deletion when expenses reference the category", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Insumos" }),
      });
      mockGetDocs.mockResolvedValue({
        docs: [{ id: "exp1", data: () => ({ categoria: "Insumos" }) }],
        empty: false,
      });

      await expect(
        deleteCategory(createMockDb(), "cat-1", "Insumos"),
      ).rejects.toThrow(
        "No se puede eliminar: hay gastos que usan esta categoría",
      );
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it("rejects deletion when category does not exist", async () => {
      mockGetDoc.mockResolvedValue({
        exists: false,
        data: () => ({}),
      });

      await expect(
        deleteCategory(createMockDb(), "cat-nonexistent", "Fake"),
      ).rejects.toThrow("Categoría no encontrada");

      expect(mockGetDocs).not.toHaveBeenCalled();
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });
  });
});
