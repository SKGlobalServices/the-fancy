import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";

// ── Mocks ────────────────────────────────────────────────────

const {
  mockListenCategories,
  mockCreateCategory,
  mockUpdateCategory,
  mockDeleteCategory,
} = vi.hoisted(() => ({
  mockListenCategories: vi.fn(),
  mockCreateCategory: vi.fn(),
  mockUpdateCategory: vi.fn(),
  mockDeleteCategory: vi.fn(),
}));

vi.mock("../../services/category-service", () => ({
  listenCategories: mockListenCategories,
  createCategory: mockCreateCategory,
  updateCategory: mockUpdateCategory,
  deleteCategory: mockDeleteCategory,
}));

const { mockGetFirebaseDb } = vi.hoisted(() => ({
  mockGetFirebaseDb: vi.fn(() => ({})),
}));

vi.mock("@/shared/lib/firebase", () => ({
  getFirebaseDb: mockGetFirebaseDb,
}));

import { useCategories } from "../use-categories";

const TEST_USER_ID = "test-user-123";

describe("useCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with loading=true and empty data", () => {
    mockListenCategories.mockImplementation(
      (_db: unknown, _onData: any, _onError: any) => vi.fn(),
    );

    const { result } = renderHook(() => useCategories(TEST_USER_ID));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.categories).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("sets data when listener emits", async () => {
    const categoriesData = [
      { id: "1", name: "Insumos" },
      { id: "2", name: "Servicios" },
    ];

    mockListenCategories.mockImplementation(
      (_db: unknown, onData: (data: any[]) => void, _onError: any) => {
        setTimeout(() => onData(categoriesData as any), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useCategories(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(categoriesData);
    expect(result.current.error).toBeNull();
  });

  it("sets error when listener errors", async () => {
    mockListenCategories.mockImplementation(
      (_db: unknown, _onData: any, onError: (err: Error) => void) => {
        setTimeout(() => onError(new Error("permission-denied")), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useCategories(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("permission-denied");
  });

  it("cleans up listener on unmount", () => {
    const unsubscribe = vi.fn();
    mockListenCategories.mockImplementation(
      (_db: unknown, _onData: any, _onError: any) => unsubscribe,
    );

    const { unmount } = renderHook(() => useCategories(TEST_USER_ID));
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe("addCategory", () => {
    it("calls createCategory with name and userId", async () => {
      mockListenCategories.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockCreateCategory.mockResolvedValue("new-cat-123");

      const { result } = renderHook(() => useCategories(TEST_USER_ID));

      const id = await act(async () => result.current.addCategory("Insumos"));

      expect(mockCreateCategory).toHaveBeenCalledWith(
        expect.anything(),
        "Insumos",
        TEST_USER_ID,
      );
      expect(id).toBe("new-cat-123");
    });
  });

  describe("editCategory", () => {
    it("calls updateCategory with id and new name", async () => {
      mockListenCategories.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockUpdateCategory.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCategories(TEST_USER_ID));

      await act(async () =>
        result.current.editCategory("cat-1", "Nuevo nombre"),
      );

      expect(mockUpdateCategory).toHaveBeenCalledWith(
        expect.anything(),
        "cat-1",
        "Nuevo nombre",
      );
    });
  });

  describe("removeCategory", () => {
    it("calls deleteCategory with id and name", async () => {
      mockListenCategories.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockDeleteCategory.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCategories(TEST_USER_ID));

      await act(async () =>
        result.current.removeCategory("cat-1", "Insumos"),
      );

      expect(mockDeleteCategory).toHaveBeenCalledWith(
        expect.anything(),
        "cat-1",
        "Insumos",
      );
    });
  });
});
