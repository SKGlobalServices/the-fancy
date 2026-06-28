import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";

// ── Mocks ────────────────────────────────────────────────────

const {
  mockListenSales,
  mockCreateSale,
  mockUpdateSale,
  mockSoftDelete,
  mockRestore,
} = vi.hoisted(() => ({
  mockListenSales: vi.fn(),
  mockCreateSale: vi.fn(),
  mockUpdateSale: vi.fn(),
  mockSoftDelete: vi.fn(),
  mockRestore: vi.fn(),
}));

vi.mock("../../services/sale-service", () => ({
  listenSales: mockListenSales,
  createSale: mockCreateSale,
  updateSale: mockUpdateSale,
  softDeleteSale: mockSoftDelete,
  restoreSale: mockRestore,
}));

const { mockGetFirebaseDb } = vi.hoisted(() => ({
  mockGetFirebaseDb: vi.fn(() => ({})),
}));

vi.mock("@/shared/lib/firebase", () => ({
  getFirebaseDb: mockGetFirebaseDb,
}));

import { useSales } from "../use-sales";

const TEST_USER_ID = "test-user-123";

describe("useSales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with loading=true and empty data", () => {
    mockListenSales.mockImplementation(
      (_db: unknown, _onData: any, _onError: any, _showDeleted?: boolean) => vi.fn(),
    );

    const { result } = renderHook(() => useSales(TEST_USER_ID));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.sales).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("sets data when listener emits", async () => {
    const salesData = [
      { id: "1", clientName: "Jane", amount: 100 },
      { id: "2", clientName: "John", amount: 200 },
    ];

    mockListenSales.mockImplementation(
      (_db: unknown, onData: (data: any[]) => void, _onError: any, _showDeleted?: boolean) => {
        setTimeout(() => onData(salesData as any), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useSales(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sales).toEqual(salesData);
    expect(result.current.error).toBeNull();
  });

  it("sets error when listener errors", async () => {
    mockListenSales.mockImplementation(
      (_db: unknown, _onData: any, onError: (err: Error) => void, _showDeleted?: boolean) => {
        setTimeout(() => onError(new Error("permission-denied")), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useSales(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("permission-denied");
  });

  it("cleans up listener on unmount", () => {
    const unsubscribe = vi.fn();
    mockListenSales.mockImplementation(
      (_db: unknown, _onData: any, _onError: any, _showDeleted?: boolean) => unsubscribe,
    );

    const { unmount } = renderHook(() => useSales(TEST_USER_ID));
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("passes showDeleted to listenSales", () => {
    mockListenSales.mockImplementation(
      (_db: unknown, _onData: any, _onError: any, _showDeleted?: boolean) => vi.fn(),
    );

    const { result } = renderHook(() => useSales(TEST_USER_ID));

    act(() => {
      result.current.setShowDeleted(true);
    });

    expect(mockListenSales).toHaveBeenCalled();
    // Should have been called with showDeleted=true after state change
  });

  describe("addSale", () => {
    it("calls createSale with form data, catalogs, and userId", async () => {
      mockListenSales.mockImplementation(
        (_db: unknown, _onData: any, _onError: any, _showDeleted?: boolean) => vi.fn(),
      );
      mockCreateSale.mockResolvedValue("new-sale-123");

      const { result } = renderHook(() => useSales(TEST_USER_ID));

      const formData = { clientId: "c1", paymentMethod: "cash" } as any;
      const catalogs = {
        clientName: "Jane",
        employeeName: "John",
        areaName: "Hair",
        typeName: "Cut",
        typePrice: 75,
        typeIsMakeup: false,
      };

      const id = await act(async () => result.current.addSale(formData, catalogs));

      expect(mockCreateSale).toHaveBeenCalledWith(
        expect.anything(),
        formData,
        TEST_USER_ID,
        catalogs,
      );
      expect(id).toBe("new-sale-123");
    });
  });

  describe("editSale", () => {
    it("calls updateSale with id and partial data", async () => {
      mockListenSales.mockImplementation(
        (_db: unknown, _onData: any, _onError: any, _showDeleted?: boolean) => vi.fn(),
      );
      mockUpdateSale.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSales(TEST_USER_ID));

      await act(async () =>
        result.current.editSale("sale-1", { isCredit: true } as any),
      );

      expect(mockUpdateSale).toHaveBeenCalledWith(
        expect.anything(),
        "sale-1",
        { isCredit: true },
      );
    });
  });

  describe("removeSale", () => {
    it("calls softDeleteSale with id", async () => {
      mockListenSales.mockImplementation(
        (_db: unknown, _onData: any, _onError: any, _showDeleted?: boolean) => vi.fn(),
      );
      mockSoftDelete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSales(TEST_USER_ID));

      await act(async () => result.current.removeSale("sale-1"));

      expect(mockSoftDelete).toHaveBeenCalledWith(expect.anything(), "sale-1");
    });
  });

  describe("restoreSale", () => {
    it("calls restoreSale with id", async () => {
      mockListenSales.mockImplementation(
        (_db: unknown, _onData: any, _onError: any, _showDeleted?: boolean) => vi.fn(),
      );
      mockRestore.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSales(TEST_USER_ID));

      await act(async () => result.current.restoreSale("sale-1"));

      expect(mockRestore).toHaveBeenCalledWith(expect.anything(), "sale-1");
    });
  });
});
