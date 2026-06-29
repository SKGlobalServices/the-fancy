import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";

const { mockListenClients, mockCreateClient, mockUpdateClient, mockDeleteClient } =
  vi.hoisted(() => ({
    mockListenClients: vi.fn(),
    mockCreateClient: vi.fn(),
    mockUpdateClient: vi.fn(),
    mockDeleteClient: vi.fn(),
  }));

vi.mock("../../services/client-service", () => ({
  listenClients: mockListenClients,
  createClient: mockCreateClient,
  updateClient: mockUpdateClient,
  deleteClient: mockDeleteClient,
}));

const { mockGetFirebaseDb } = vi.hoisted(() => ({
  mockGetFirebaseDb: vi.fn(() => ({})),
}));

vi.mock("@/shared/lib/firebase", () => ({
  getFirebaseDb: mockGetFirebaseDb,
}));

import { useClients } from "../use-clients";

const TEST_USER_ID = "test-user-123";

describe("useClients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with loading=true and empty data", () => {
    mockListenClients.mockImplementation(
      (_db: unknown, _onData: any, _onError: any) => vi.fn(),
    );

    const { result } = renderHook(() => useClients(TEST_USER_ID));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.clients).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("sets data when listener emits", async () => {
    const clientsData = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ];

    mockListenClients.mockImplementation(
      (_db: unknown, onData: (data: any[]) => void, _onError: any) => {
        setTimeout(() => onData(clientsData as any), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useClients(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.clients).toEqual(clientsData);
    expect(result.current.error).toBeNull();
  });

  it("sets error when listener errors", async () => {
    mockListenClients.mockImplementation(
      (_db: unknown, _onData: any, onError: (err: Error) => void) => {
        setTimeout(() => onError(new Error("permission-denied")), 0);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useClients(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("permission-denied");
  });

  it("cleans up listener on unmount", () => {
    const unsubscribe = vi.fn();
    mockListenClients.mockImplementation(
      (_db: unknown, _onData: any, _onError: any) => unsubscribe,
    );

    const { unmount } = renderHook(() => useClients(TEST_USER_ID));
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe("addClient", () => {
    it("calls createClient with data and userId", async () => {
      mockListenClients.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockCreateClient.mockResolvedValue("new-client-123");

      const { result } = renderHook(() => useClients(TEST_USER_ID));

      const id = await act(async () =>
        result.current.addClient({ name: "Alice", phone: "+297 500 1234" }),
      );

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.anything(),
        { name: "Alice", phone: "+297 500 1234" },
        TEST_USER_ID,
      );
      expect(id).toBe("new-client-123");
    });
  });

  describe("editClient", () => {
    it("calls updateClient with id and data", async () => {
      mockListenClients.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockUpdateClient.mockResolvedValue(undefined);

      const { result } = renderHook(() => useClients(TEST_USER_ID));

      await act(async () =>
        result.current.editClient("client-1", { name: "Alice Updated" }),
      );

      expect(mockUpdateClient).toHaveBeenCalledWith(
        expect.anything(),
        "client-1",
        { name: "Alice Updated" },
      );
    });
  });

  describe("removeClient", () => {
    it("calls deleteClient with id", async () => {
      mockListenClients.mockImplementation(
        (_db: unknown, _onData: any, _onError: any) => vi.fn(),
      );
      mockDeleteClient.mockResolvedValue(undefined);

      const { result } = renderHook(() => useClients(TEST_USER_ID));

      await act(async () => result.current.removeClient("client-1"));

      expect(mockDeleteClient).toHaveBeenCalledWith(
        expect.anything(),
        "client-1",
      );
    });
  });
});
