import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";

const {
  mockListenAreas,
  mockCreateArea,
  mockUpdateArea,
  mockDeleteArea,
} = vi.hoisted(() => ({
  mockListenAreas: vi.fn(),
  mockCreateArea: vi.fn(),
  mockUpdateArea: vi.fn(),
  mockDeleteArea: vi.fn(),
}));

vi.mock("../../services/service-area-service", () => ({
  listenServiceAreas: mockListenAreas,
  createServiceArea: mockCreateArea,
  updateServiceArea: mockUpdateArea,
  deleteServiceArea: mockDeleteArea,
}));

const { mockGetFirebaseDb } = vi.hoisted(() => ({
  mockGetFirebaseDb: vi.fn(() => ({})),
}));

vi.mock("@/shared/lib/firebase", () => ({
  getFirebaseDb: mockGetFirebaseDb,
}));

import { useServiceAreas } from "../use-service-areas";

const TEST_USER_ID = "test-user-123";

describe("useServiceAreas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with loading=true and empty data", () => {
    mockListenAreas.mockImplementation(
      (_db: unknown, _onData: any, _onError: any) => vi.fn(),
    );

    const { result } = renderHook(() => useServiceAreas(TEST_USER_ID));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.areas).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("sets data when listener emits", async () => {
    const areasData = [
      { id: "1", name: "Hair", sortOrder: 1 },
      { id: "2", name: "Nails", sortOrder: 2 },
    ];

    mockListenAreas.mockImplementation(
      (_db: unknown, onData: (data: any[]) => void, _onError: any) => {
        setTimeout(() => onData(areasData as any), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useServiceAreas(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.areas).toEqual(areasData);
    expect(result.current.error).toBeNull();
  });

  it("sets error when listener errors", async () => {
    mockListenAreas.mockImplementation(
      (_db: unknown, _onData: any, onError: (err: Error) => void) => {
        setTimeout(() => onError(new Error("permission-denied")), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useServiceAreas(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("permission-denied");
  });

  it("cleans up listener on unmount", () => {
    const unsubscribe = vi.fn();
    mockListenAreas.mockImplementation(
      (_db: unknown, _onData: any, _onError: any) => unsubscribe,
    );

    const { unmount } = renderHook(() => useServiceAreas(TEST_USER_ID));
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe("addArea", () => {
    it("calls createServiceArea with data and userId", async () => {
      mockListenAreas.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockCreateArea.mockResolvedValue("new-area-123");

      const { result } = renderHook(() => useServiceAreas(TEST_USER_ID));

      const id = await act(async () =>
        result.current.addArea({ name: "Hair", sortOrder: 1 }),
      );

      expect(mockCreateArea).toHaveBeenCalledWith(
        expect.anything(),
        { name: "Hair", sortOrder: 1 },
        TEST_USER_ID,
      );
      expect(id).toBe("new-area-123");
    });
  });

  describe("editArea", () => {
    it("calls updateServiceArea with id and data", async () => {
      mockListenAreas.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockUpdateArea.mockResolvedValue(undefined);

      const { result } = renderHook(() => useServiceAreas(TEST_USER_ID));

      await act(async () =>
        result.current.editArea("area-1", { name: "Hair Updated" }),
      );

      expect(mockUpdateArea).toHaveBeenCalledWith(
        expect.anything(),
        "area-1",
        { name: "Hair Updated" },
      );
    });
  });

  describe("removeArea", () => {
    it("calls deleteServiceArea with id", async () => {
      mockListenAreas.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockDeleteArea.mockResolvedValue(undefined);

      const { result } = renderHook(() => useServiceAreas(TEST_USER_ID));

      await act(async () => result.current.removeArea("area-1"));

      expect(mockDeleteArea).toHaveBeenCalledWith(
        expect.anything(),
        "area-1",
      );
    });
  });
});
