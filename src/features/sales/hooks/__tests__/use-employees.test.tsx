import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";

const {
  mockListenEmployees,
  mockCreateEmployee,
  mockUpdateEmployee,
  mockDeleteEmployee,
} = vi.hoisted(() => ({
  mockListenEmployees: vi.fn(),
  mockCreateEmployee: vi.fn(),
  mockUpdateEmployee: vi.fn(),
  mockDeleteEmployee: vi.fn(),
}));

vi.mock("../../services/employee-service", () => ({
  listenEmployees: mockListenEmployees,
  createEmployee: mockCreateEmployee,
  updateEmployee: mockUpdateEmployee,
  deleteEmployee: mockDeleteEmployee,
}));

const { mockGetFirebaseDb } = vi.hoisted(() => ({
  mockGetFirebaseDb: vi.fn(() => ({})),
}));

vi.mock("@/shared/lib/firebase", () => ({
  getFirebaseDb: mockGetFirebaseDb,
}));

import { useEmployees } from "../use-employees";

const TEST_USER_ID = "test-user-123";

describe("useEmployees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with loading=true and empty data", () => {
    mockListenEmployees.mockImplementation(
      (_db: unknown, _onData: any, _onError: any) => vi.fn(),
    );

    const { result } = renderHook(() => useEmployees(TEST_USER_ID));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.employees).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("sets data when listener emits", async () => {
    const employeesData = [
      { id: "1", name: "Alice", isActive: true },
      { id: "2", name: "Bob", isActive: true },
    ];

    mockListenEmployees.mockImplementation(
      (_db: unknown, onData: (data: any[]) => void, _onError: any) => {
        setTimeout(() => onData(employeesData as any), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useEmployees(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.employees).toEqual(employeesData);
    expect(result.current.error).toBeNull();
  });

  it("sets error when listener errors", async () => {
    mockListenEmployees.mockImplementation(
      (_db: unknown, _onData: any, onError: (err: Error) => void) => {
        setTimeout(() => onError(new Error("permission-denied")), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useEmployees(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("permission-denied");
  });

  it("cleans up listener on unmount", () => {
    const unsubscribe = vi.fn();
    mockListenEmployees.mockImplementation(
      (_db: unknown, _onData: any, _onError: any) => unsubscribe,
    );

    const { unmount } = renderHook(() => useEmployees(TEST_USER_ID));
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe("addEmployee", () => {
    it("calls createEmployee with data and userId", async () => {
      mockListenEmployees.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockCreateEmployee.mockResolvedValue("new-emp-123");

      const { result } = renderHook(() => useEmployees(TEST_USER_ID));

      const id = await act(async () =>
        result.current.addEmployee({ name: "Alice", isActive: true }),
      );

      expect(mockCreateEmployee).toHaveBeenCalledWith(
        expect.anything(),
        { name: "Alice", isActive: true },
        TEST_USER_ID,
      );
      expect(id).toBe("new-emp-123");
    });
  });

  describe("editEmployee", () => {
    it("calls updateEmployee with id and data", async () => {
      mockListenEmployees.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockUpdateEmployee.mockResolvedValue(undefined);

      const { result } = renderHook(() => useEmployees(TEST_USER_ID));

      await act(async () =>
        result.current.editEmployee("emp-1", { name: "Alice Updated" }),
      );

      expect(mockUpdateEmployee).toHaveBeenCalledWith(
        expect.anything(),
        "emp-1",
        { name: "Alice Updated" },
      );
    });
  });

  describe("removeEmployee", () => {
    it("calls deleteEmployee with id", async () => {
      mockListenEmployees.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockDeleteEmployee.mockResolvedValue(undefined);

      const { result } = renderHook(() => useEmployees(TEST_USER_ID));

      await act(async () => result.current.removeEmployee("emp-1"));

      expect(mockDeleteEmployee).toHaveBeenCalledWith(
        expect.anything(),
        "emp-1",
      );
    });
  });
});
