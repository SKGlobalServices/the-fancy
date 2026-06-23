import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";

// ── Mocks ────────────────────────────────────────────────────

const {
  mockListenExpenses,
  mockCreateExpense,
  mockUpdateExpense,
  mockSoftDelete,
  mockRestore,
} = vi.hoisted(() => ({
  mockListenExpenses: vi.fn(),
  mockCreateExpense: vi.fn(),
  mockUpdateExpense: vi.fn(),
  mockSoftDelete: vi.fn(),
  mockRestore: vi.fn(),
}));

vi.mock("../../services/expense-service", () => ({
  listenExpenses: mockListenExpenses,
  createExpense: mockCreateExpense,
  updateExpense: mockUpdateExpense,
  softDeleteExpense: mockSoftDelete,
  restoreExpense: mockRestore,
}));

const { mockGetFirebaseDb } = vi.hoisted(() => ({
  mockGetFirebaseDb: vi.fn(() => ({})),
}));

vi.mock("@/shared/lib/firebase", () => ({
  getFirebaseDb: mockGetFirebaseDb,
}));

import { useExpenses } from "../use-expenses";

const TEST_USER_ID = "test-user-123";

describe("useExpenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with loading=true and empty data", () => {
    mockListenExpenses.mockImplementation(
      (_db: unknown, _year: number, _onData: any, _onError: any) => vi.fn(),
    );

    const { result } = renderHook(() => useExpenses(2025, TEST_USER_ID));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.expenses).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("sets data when listener emits", async () => {
    const expensesData = [
      { id: "1", categoria: "Insumos", monto: 5000 },
      { id: "2", categoria: "Servicios", monto: 10000 },
    ];

    mockListenExpenses.mockImplementation(
      (_db: unknown, _year: number, onData: (data: any[]) => void, _onError: any) => {
        setTimeout(() => onData(expensesData as any), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useExpenses(2025, TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.expenses).toEqual(expensesData);
    expect(result.current.error).toBeNull();
  });

  it("sets error when listener errors", async () => {
    mockListenExpenses.mockImplementation(
      (_db: unknown, _year: number, _onData: any, onError: (err: Error) => void) => {
        setTimeout(() => onError(new Error("permission-denied")), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useExpenses(2025, TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("permission-denied");
  });

  it("cleans up listener on unmount", () => {
    const unsubscribe = vi.fn();
    mockListenExpenses.mockImplementation(
      (_db: unknown, _year: number, _onData: any, _onError: any) => unsubscribe,
    );

    const { unmount } = renderHook(() => useExpenses(2025, TEST_USER_ID));
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe("addExpense", () => {
    it("calls createExpense with form data, userId and returns id", async () => {
      mockListenExpenses.mockImplementation(
        (_db: unknown, _year: number, _onData: any, _onError: any) => vi.fn(),
      );
      mockCreateExpense.mockResolvedValue("new-id-123");

      const { result } = renderHook(() => useExpenses(2025, TEST_USER_ID));

      const formData = { categoria: "Test", monto: 100 } as any;
      const id = await act(async () => result.current.addExpense(formData));

      expect(mockCreateExpense).toHaveBeenCalledWith(
        expect.anything(),
        formData,
        TEST_USER_ID,
      );
      expect(id).toBe("new-id-123");
    });
  });

  describe("editExpense", () => {
    it("calls updateExpense with id and partial data", async () => {
      mockListenExpenses.mockImplementation(
        (_db: unknown, _year: number, _onData: any, _onError: any) => vi.fn(),
      );
      mockUpdateExpense.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses(2025, TEST_USER_ID));

      await act(async () =>
        result.current.editExpense("exp-1", { monto: 500 } as any),
      );

      expect(mockUpdateExpense).toHaveBeenCalledWith(
        expect.anything(),
        "exp-1",
        { monto: 500 },
      );
    });
  });

  describe("removeExpense", () => {
    it("calls softDeleteExpense with id", async () => {
      mockListenExpenses.mockImplementation(
        (_db: unknown, _year: number, _onData: any, _onError: any) => vi.fn(),
      );
      mockSoftDelete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses(2025, TEST_USER_ID));

      await act(async () => result.current.removeExpense("exp-1"));

      expect(mockSoftDelete).toHaveBeenCalledWith(expect.anything(), "exp-1");
    });
  });

  describe("restoreExpense", () => {
    it("calls restoreExpense with id", async () => {
      mockListenExpenses.mockImplementation(
        (_db: unknown, _year: number, _onData: any, _onError: any) => vi.fn(),
      );
      mockRestore.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses(2025, TEST_USER_ID));

      await act(async () => result.current.restoreExpense("exp-1"));

      expect(mockRestore).toHaveBeenCalledWith(expect.anything(), "exp-1");
    });
  });

  it("passes year filter to listenExpenses", () => {
    mockListenExpenses.mockImplementation(
      (_db: unknown, _year: number, _onData: any, _onError: any) => vi.fn(),
    );

    renderHook(() => useExpenses(2025, TEST_USER_ID));
    expect(mockListenExpenses.mock.calls[0][1]).toBe(2025);
  });
});
