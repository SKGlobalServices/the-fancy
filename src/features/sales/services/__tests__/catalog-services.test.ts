import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore, DocumentData } from "firebase/firestore";

// ── Shared Firestore mocks ───────────────────────────────────

const {
  mockAddDoc,
  mockUpdateDoc,
  mockGetDoc,
  mockGetDocs,
  mockOnSnapshot,
  mockWhere,
  mockOrderBy,
  mockQuery,
  mockTimestampNow,
} = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockGetDocs: vi.fn(),
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
  collection: vi.fn((_db: unknown, path: string) => path),
  doc: vi.fn((_db: unknown, _path: string, ...segments: string[]) => ({
    id: segments[0] ?? "mock-id",
  })),
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  onSnapshot: mockOnSnapshot,
  where: mockWhere,
  orderBy: mockOrderBy,
  query: mockQuery,
  Timestamp: {
    now: mockTimestampNow,
  },
}));

// ── Modules to test ──────────────────────────────────────────

import {
  listenClients,
  createClient,
  updateClient,
  deleteClient,
} from "../client-service";

import {
  listenEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../employee-service";

import {
  listenServiceAreas,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
} from "../service-area-service";

import {
  listenServiceTypes,
  listenServiceTypesByArea,
  createServiceType,
  updateServiceType,
  deleteServiceType,
} from "../service-type-service";

// ── Helpers ──────────────────────────────────────────────────

function createMockDb(): Firestore {
  return {} as unknown as Firestore;
}

// ── Client Service ───────────────────────────────────────────

describe("client-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listenClients", () => {
    it("subscribes ordered by name asc and filters deleted", () => {
      const onData = vi.fn();
      const onError = vi.fn();

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          cb: (snap: any) => void,
        ) => {
          cb({
            docs: [
              {
                id: "c1",
                data: () => ({ name: "Alice", deletedAt: null }) as DocumentData,
              },
              {
                id: "c2",
                data: () => ({ name: "Bob", deletedAt: null }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenClients(createMockDb(), onData, onError);

      expect(mockOrderBy).toHaveBeenCalledWith("name", "asc");
      expect(onData).toHaveBeenCalledWith([
        expect.objectContaining({ name: "Alice" }),
        expect.objectContaining({ name: "Bob" }),
      ]);
    });

    it("excludes deleted clients", () => {
      const onData = vi.fn();
      const onError = vi.fn();

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          cb: (snap: any) => void,
        ) => {
          cb({
            docs: [
              {
                id: "c1",
                data: () =>
                  ({ name: "Alice", deletedAt: null }) as DocumentData,
              },
              {
                id: "c2",
                data: () =>
                  ({
                    name: "Bob",
                    deletedAt: { seconds: 1719000000, nanoseconds: 0 },
                  }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenClients(createMockDb(), onData, onError);
      const clients = onData.mock.calls[0][0];
      expect(clients).toHaveLength(1);
      expect(clients[0].name).toBe("Alice");
    });
  });

  describe("createClient", () => {
    it("creates a client with trimmed name and audit fields", async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockAddDoc.mockResolvedValue({ id: "new-c1" });

      const id = await createClient(createMockDb(), { name: "  Alice  " }, "user-1");

      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.name).toBe("Alice");
      expect(docData.createdBy).toBe("user-1");
      expect(docData.createdAt).toBeDefined();
      expect(docData.deletedAt).toBeNull();
      expect(id).toBe("new-c1");
    });

    it("rejects empty name after trim", async () => {
      await expect(
        createClient(createMockDb(), { name: "   " }, "user-1"),
      ).rejects.toThrow("El nombre del cliente es obligatorio");
    });

    it("rejects duplicate name", async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: "existing",
            data: () => ({ name: "Alice" }),
          },
        ],
      });

      await expect(
        createClient(createMockDb(), { name: "alice" }, "user-1"),
      ).rejects.toThrow("Ya existe un cliente con ese nombre");
    });
  });

  describe("updateClient", () => {
    it("updates client with trimmed name and updatedAt", async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateClient(createMockDb(), "c1", { name: "  Alice Updated  " });

      const data = mockUpdateDoc.mock.calls[0][1];
      expect(data.name).toBe("Alice Updated");
      expect(data.updatedAt).toBeDefined();
    });

    it("rejects empty name", async () => {
      await expect(
        updateClient(createMockDb(), "c1", { name: "   " }),
      ).rejects.toThrow("El nombre del cliente es obligatorio");
    });
  });

  describe("deleteClient", () => {
    it("soft-deletes a client with no sales", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Alice" }),
      });
      mockGetDocs
        .mockResolvedValueOnce({ docs: [] }); // sales check — no sales

      await deleteClient(createMockDb(), "c1");

      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.deletedAt).toBeDefined();
      expect(updateData.updatedAt).toBeDefined();
    });

    it("refuses to delete a client with sales", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Alice" }),
      });
      mockGetDocs
        .mockResolvedValueOnce({
          docs: [{ id: "s1", data: () => ({ clientId: "c1" }) }],
        });

      await expect(
        deleteClient(createMockDb(), "c1"),
      ).rejects.toThrow("No se puede eliminar: hay ventas que usan este cliente");
    });

    it("rejects delete when client does not exist", async () => {
      mockGetDoc.mockResolvedValue({
        exists: false,
        data: () => ({}),
      });

      await expect(
        deleteClient(createMockDb(), "c-nonexistent"),
      ).rejects.toThrow("Cliente no encontrado");
    });
  });
});

// ── Employee Service ─────────────────────────────────────────

describe("employee-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listenEmployees", () => {
    it("subscribes ordered by name and filters active+non-deleted", () => {
      const onData = vi.fn();
      const onError = vi.fn();

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          cb: (snap: any) => void,
        ) => {
          cb({
            docs: [
              {
                id: "e1",
                data: () =>
                  ({
                    name: "Alice",
                    isActive: true,
                    deletedAt: null,
                  }) as DocumentData,
              },
              {
                id: "e2",
                data: () =>
                  ({
                    name: "Bob",
                    isActive: false,
                    deletedAt: null,
                  }) as DocumentData,
              },
              {
                id: "e3",
                data: () =>
                  ({
                    name: "Charlie",
                    isActive: true,
                    deletedAt: { seconds: 1719000000, nanoseconds: 0 },
                  }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenEmployees(createMockDb(), onData, onError);

      const employees = onData.mock.calls[0][0];
      expect(employees).toHaveLength(1);
      expect(employees[0].name).toBe("Alice");
    });
  });

  describe("createEmployee", () => {
    it("creates an employee with trimmed name and default isActive", async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockAddDoc.mockResolvedValue({ id: "new-e1" });

      const id = await createEmployee(createMockDb(), { name: "  Alice  " }, "user-1");

      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.name).toBe("Alice");
      expect(docData.isActive).toBe(true);
      expect(docData.createdBy).toBe("user-1");
      expect(id).toBe("new-e1");
    });

    it("rejects empty name", async () => {
      await expect(
        createEmployee(createMockDb(), { name: "" }, "user-1"),
      ).rejects.toThrow("El nombre del empleado es obligatorio");
    });
  });

  describe("deleteEmployee", () => {
    it("soft-deletes an employee with no sales", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Alice" }),
      });
      mockGetDocs.mockResolvedValueOnce({ docs: [] });

      await deleteEmployee(createMockDb(), "e1");

      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.deletedAt).toBeDefined();
    });

    it("refuses to delete an employee with sales", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Alice" }),
      });
      mockGetDocs.mockResolvedValueOnce({
        docs: [{ id: "s1", data: () => ({ employeeId: "e1" }) }],
      });

      await expect(
        deleteEmployee(createMockDb(), "e1"),
      ).rejects.toThrow("No se puede eliminar: hay ventas que usan este empleado");
    });
  });
});

// ── Service Area Service ─────────────────────────────────────

describe("service-area-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listenServiceAreas", () => {
    it("subscribes ordered by sortOrder and filters deleted", () => {
      const onData = vi.fn();
      const onError = vi.fn();

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          cb: (snap: any) => void,
        ) => {
          cb({
            docs: [
              {
                id: "a1",
                data: () =>
                  ({
                    name: "Nails",
                    sortOrder: 2,
                    deletedAt: null,
                  }) as DocumentData,
              },
              {
                id: "a2",
                data: () =>
                  ({
                    name: "Hair",
                    sortOrder: 1,
                    deletedAt: null,
                  }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenServiceAreas(createMockDb(), onData, onError);

      expect(mockOrderBy).toHaveBeenCalledWith("sortOrder", "asc");
      const areas = onData.mock.calls[0][0];
      expect(areas).toHaveLength(2);
    });
  });

  describe("createServiceArea", () => {
    it("creates with trimmed name and default sortOrder", async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockAddDoc.mockResolvedValue({ id: "new-a1" });

      await createServiceArea(createMockDb(), { name: "  Hair  " }, "user-1");

      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.name).toBe("Hair");
      expect(docData.sortOrder).toBe(0);
    });

    it("creates with explicit sortOrder", async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockAddDoc.mockResolvedValue({ id: "new-a2" });

      await createServiceArea(createMockDb(), { name: "Nails", sortOrder: 3 }, "user-1");

      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.sortOrder).toBe(3);
    });
  });

  describe("deleteServiceArea", () => {
    it("soft-deletes an area with no types or sales", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Hair" }),
      });
      mockGetDocs
        .mockResolvedValueOnce({ docs: [] })   // no types
        .mockResolvedValueOnce({ docs: [] })   // no sales

      await deleteServiceArea(createMockDb(), "a1");

      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.deletedAt).toBeDefined();
    });

    it("refuses to delete an area with active types", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Hair" }),
      });
      mockGetDocs
        .mockResolvedValueOnce({
          docs: [
            { id: "t1", data: () => ({ areaId: "a1", deletedAt: null }) },
          ],
        });

      await expect(
        deleteServiceArea(createMockDb(), "a1"),
      ).rejects.toThrow("No se puede eliminar: hay tipos de servicio que usan esta área");
    });

    it("refuses to delete an area with sales", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Hair" }),
      });
      mockGetDocs
        .mockResolvedValueOnce({ docs: [] }) // no types
        .mockResolvedValueOnce({
          docs: [{ id: "s1", data: () => ({ serviceAreaId: "a1" }) }],
        });

      await expect(
        deleteServiceArea(createMockDb(), "a1"),
      ).rejects.toThrow("No se puede eliminar: hay ventas que usan esta área");
    });
  });
});

// ── Service Type Service ─────────────────────────────────────

describe("service-type-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listenServiceTypes", () => {
    it("subscribes ordered by name and filters deleted", () => {
      const onData = vi.fn();
      const onError = vi.fn();

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          cb: (snap: any) => void,
        ) => {
          cb({
            docs: [
              {
                id: "t1",
                data: () =>
                  ({
                    name: "Cut",
                    areaId: "a1",
                    price: 50,
                    deletedAt: null,
                  }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenServiceTypes(createMockDb(), onData, onError);

      expect(mockOrderBy).toHaveBeenCalledWith("name", "asc");
      const types = onData.mock.calls[0][0];
      expect(types).toHaveLength(1);
      expect(types[0].name).toBe("Cut");
    });
  });

  describe("listenServiceTypesByArea", () => {
    it("filters by areaId with where clause", () => {
      const onData = vi.fn();
      const onError = vi.fn();

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          cb: (snap: any) => void,
        ) => {
          cb({
            docs: [
              {
                id: "t1",
                data: () =>
                  ({
                    name: "Cut",
                    areaId: "a1",
                    price: 50,
                    deletedAt: null,
                  }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenServiceTypesByArea(createMockDb(), "a1", onData, onError);

      expect(mockWhere).toHaveBeenCalledWith("areaId", "==", "a1");
      expect(mockOrderBy).toHaveBeenCalledWith("name", "asc");
    });

    it("excludes deleted types even when filtering by area", () => {
      const onData = vi.fn();
      const onError = vi.fn();

      mockOnSnapshot.mockImplementation(
        (
          _query: unknown,
          cb: (snap: any) => void,
        ) => {
          cb({
            docs: [
              {
                id: "t1",
                data: () =>
                  ({
                    name: "Cut",
                    areaId: "a1",
                    deletedAt: null,
                  }) as DocumentData,
              },
              {
                id: "t2",
                data: () =>
                  ({
                    name: "Color",
                    areaId: "a1",
                    deletedAt: { seconds: 1719000000, nanoseconds: 0 },
                  }) as DocumentData,
              },
            ],
          });
          return vi.fn();
        },
      );

      listenServiceTypesByArea(createMockDb(), "a1", onData, onError);

      const types = onData.mock.calls[0][0];
      expect(types).toHaveLength(1);
      expect(types[0].name).toBe("Cut");
    });
  });

  describe("createServiceType", () => {
    it("creates a service type with all fields", async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockAddDoc.mockResolvedValue({ id: "new-t1" });

      await createServiceType(
        createMockDb(),
        { name: "  Premium Cut  ", areaId: "a1", price: 100, isMakeup: true },
        "user-1",
      );

      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.name).toBe("Premium Cut");
      expect(docData.areaId).toBe("a1");
      expect(docData.price).toBe(100);
      expect(docData.isMakeup).toBe(true);
      expect(docData.createdBy).toBe("user-1");
    });

    it("defaults isMakeup to false", async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockAddDoc.mockResolvedValue({ id: "new-t2" });

      await createServiceType(
        createMockDb(),
        { name: "Cut", areaId: "a1", price: 50 },
        "user-1",
      );

      const docData = mockAddDoc.mock.calls[0][1];
      expect(docData.isMakeup).toBe(false);
    });
  });

  describe("updateServiceType", () => {
    it("updates with partial data and updatedAt", async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateServiceType(createMockDb(), "t1", { price: 80 });

      const data = mockUpdateDoc.mock.calls[0][1];
      expect(data.price).toBe(80);
      expect(data.updatedAt).toBeDefined();
    });

    it("trims name when provided", async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateServiceType(createMockDb(), "t1", { name: "  New Name  " });

      const data = mockUpdateDoc.mock.calls[0][1];
      expect(data.name).toBe("New Name");
    });

    it("rejects empty name when updating name", async () => {
      await expect(
        updateServiceType(createMockDb(), "t1", { name: "   " }),
      ).rejects.toThrow("El nombre del tipo de servicio es obligatorio");
    });
  });

  describe("deleteServiceType", () => {
    it("soft-deletes a type with no sales", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Cut" }),
      });
      mockGetDocs.mockResolvedValueOnce({ docs: [] });

      await deleteServiceType(createMockDb(), "t1");

      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.deletedAt).toBeDefined();
    });

    it("refuses to delete a type with sales", async () => {
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => ({ name: "Cut" }),
      });
      mockGetDocs.mockResolvedValueOnce({
        docs: [{ id: "s1", data: () => ({ serviceTypeId: "t1" }) }],
      });

      await expect(
        deleteServiceType(createMockDb(), "t1"),
      ).rejects.toThrow("No se puede eliminar: hay ventas que usan este tipo de servicio");
    });
  });
});
