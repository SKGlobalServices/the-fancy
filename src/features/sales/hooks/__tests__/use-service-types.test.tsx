import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";

const {
  mockListenTypes,
  mockCreateType,
  mockUpdateType,
  mockDeleteType,
} = vi.hoisted(() => ({
  mockListenTypes: vi.fn(),
  mockCreateType: vi.fn(),
  mockUpdateType: vi.fn(),
  mockDeleteType: vi.fn(),
}));

vi.mock("../../services/service-type-service", () => ({
  listenServiceTypes: mockListenTypes,
  createServiceType: mockCreateType,
  updateServiceType: mockUpdateType,
  deleteServiceType: mockDeleteType,
}));

const { mockGetFirebaseDb } = vi.hoisted(() => ({
  mockGetFirebaseDb: vi.fn(() => ({})),
}));

vi.mock("@/shared/lib/firebase", () => ({
  getFirebaseDb: mockGetFirebaseDb,
}));

import { useServiceTypes } from "../use-service-types";

const TEST_USER_ID = "test-user-123";

describe("useServiceTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with loading=true and empty data", () => {
    mockListenTypes.mockImplementation(
      (_db: unknown, _onData: any, _onError: any) => vi.fn(),
    );

    const { result } = renderHook(() => useServiceTypes(TEST_USER_ID));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.types).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("sets data when listener emits", async () => {
    const typesData = [
      { id: "1", name: "Cut", areaId: "a1", price: 50 },
      { id: "2", name: "Color", areaId: "a1", price: 100 },
    ];

    mockListenTypes.mockImplementation(
      (_db: unknown, onData: (data: any[]) => void, _onError: any) => {
        setTimeout(() => onData(typesData as any), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useServiceTypes(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.types).toEqual(typesData);
    expect(result.current.error).toBeNull();
  });

  it("sets error when listener errors", async () => {
    mockListenTypes.mockImplementation(
      (_db: unknown, _onData: any, onError: (err: Error) => void) => {
        setTimeout(() => onError(new Error("permission-denied")), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useServiceTypes(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("permission-denied");
  });

  it("cleans up listener on unmount", () => {
    const unsubscribe = vi.fn();
    mockListenTypes.mockImplementation(
      (_db: unknown, _onData: any, _onError: any) => unsubscribe,
    );

    const { unmount } = renderHook(() => useServiceTypes(TEST_USER_ID));
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe("addType", () => {
    it("calls createServiceType with data and userId", async () => {
      mockListenTypes.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockCreateType.mockResolvedValue("new-type-123");

      const { result } = renderHook(() => useServiceTypes(TEST_USER_ID));

      const id = await act(async () =>
        result.current.addType({ name: "Cut", areaId: "a1", price: 50 }),
      );

      expect(mockCreateType).toHaveBeenCalledWith(
        expect.anything(),
        { name: "Cut", areaId: "a1", price: 50 },
        TEST_USER_ID,
      );
      expect(id).toBe("new-type-123");
    });
  });

  describe("editType", () => {
    it("calls updateServiceType with id and partial data", async () => {
      mockListenTypes.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockUpdateType.mockResolvedValue(undefined);

      const { result } = renderHook(() => useServiceTypes(TEST_USER_ID));

      await act(async () =>
        result.current.editType("type-1", { price: 80 }),
      );

      expect(mockUpdateType).toHaveBeenCalledWith(
        expect.anything(),
        "type-1",
        { price: 80 },
      );
    });
  });

  describe("removeType", () => {
    it("calls deleteServiceType with id", async () => {
      mockListenTypes.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockDeleteType.mockResolvedValue(undefined);

      const { result } = renderHook(() => useServiceTypes(TEST_USER_ID));

      await act(async () => result.current.removeType("type-1"));

      expect(mockDeleteType).toHaveBeenCalledWith(
        expect.anything(),
        "type-1",
      );
    });
  });
});
