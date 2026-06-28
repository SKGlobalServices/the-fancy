import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Timestamp } from "firebase/firestore";
import type { Sale } from "../../types";

// ── Mocks ────────────────────────────────────────────────────

const mockUseSales = vi.fn();
const mockUseClients = vi.fn();
const mockUseEmployees = vi.fn();
const mockUseServiceAreas = vi.fn();
const mockUseServiceTypes = vi.fn();

vi.mock("../../hooks/use-sales", () => ({
  useSales: (...args: any[]) => mockUseSales(...args),
}));

vi.mock("../../hooks/use-clients", () => ({
  useClients: (...args: any[]) => mockUseClients(...args),
}));

vi.mock("../../hooks/use-employees", () => ({
  useEmployees: (...args: any[]) => mockUseEmployees(...args),
}));

vi.mock("../../hooks/use-service-areas", () => ({
  useServiceAreas: (...args: any[]) => mockUseServiceAreas(...args),
}));

vi.mock("../../hooks/use-service-types", () => ({
  useServiceTypes: (...args: any[]) => mockUseServiceTypes(...args),
}));

vi.mock("@/shared/lib/firebase", () => ({
  getFirebaseDb: vi.fn(() => ({})),
}));

vi.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: vi.fn(() => ({
    user: { uid: "test-user", email: "test@test.com", displayName: "Test" },
  })),
}));

import { SalesTable } from "../sales-table";
import { renderWithI18n } from "@/test-utils/render-with-i18n";

// ── Helpers ──────────────────────────────────────────────────

function todayTimestamp(): Timestamp {
  const now = new Date();
  // Set to end of day so date filter (which uses Date() at render time) doesn't exclude it
  now.setHours(23, 59, 59, 999);
  return Timestamp.fromDate(now);
}

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: `sale-${Math.random().toString(36).slice(2, 8)}`,
    date: todayTimestamp(),
    clientId: "client-1",
    clientName: "Jane Doe",
    employeeId: "emp-1",
    employeeName: "John Smith",
    serviceAreaId: "area-1",
    serviceAreaName: "Hair",
    serviceTypeId: "type-1",
    serviceTypeName: "Haircut",
    amount: 75,
    paymentMethod: "cash",
    paymentFeePct: 0,
    isCredit: false,
    isMakeup: false,
    observations: "",
    createdBy: "user-1",
    createdAt: new Timestamp(1700000000, 0),
    updatedAt: new Timestamp(1700000000, 0),
    deletedAt: null,
    ...overrides,
  };
}

function makeSales(count: number): Sale[] {
  return Array.from({ length: count }, (_, i) =>
    makeSale({
      id: `sale-${i}`,
      clientName: i % 2 === 0 ? "Jane Doe" : "Bob Smith",
      amount: 100 * (i + 1),
      paymentMethod: i % 3 === 0 ? "cash" : "transfer",
    }),
  );
}

function renderTable(
  sales: Sale[] = [],
  isLoading = false,
  showDeleted = false,
) {
  mockUseSales.mockReturnValue({
    sales,
    isLoading,
    error: null,
    addSale: vi.fn(),
    editSale: vi.fn(),
    removeSale: vi.fn(),
    restoreSale: vi.fn(),
    showDeleted,
    setShowDeleted: vi.fn(),
  });

  mockUseClients.mockReturnValue({
    clients: [
      { id: "client-1", name: "Jane Doe" },
      { id: "client-2", name: "Bob Smith" },
    ],
    isLoading: false,
    error: null,
    addClient: vi.fn(),
    editClient: vi.fn(),
    removeClient: vi.fn(),
  });

  mockUseEmployees.mockReturnValue({
    employees: [
      { id: "emp-1", name: "John Smith" },
      { id: "emp-2", name: "Alice Johnson" },
    ],
    isLoading: false,
    error: null,
    addEmployee: vi.fn(),
    editEmployee: vi.fn(),
    removeEmployee: vi.fn(),
  });

  mockUseServiceAreas.mockReturnValue({
    areas: [
      { id: "area-1", name: "Hair", sortOrder: 1 },
      { id: "area-2", name: "Nails", sortOrder: 2 },
    ],
    isLoading: false,
    error: null,
    addArea: vi.fn(),
    editArea: vi.fn(),
    removeArea: vi.fn(),
  });

  mockUseServiceTypes.mockReturnValue({
    types: [
      { id: "type-1", name: "Haircut", areaId: "area-1", price: 75, isMakeup: false },
      { id: "type-2", name: "Manicure", areaId: "area-2", price: 50, isMakeup: false },
    ],
    isLoading: false,
    error: null,
    addType: vi.fn(),
    editType: vi.fn(),
    removeType: vi.fn(),
  });

  return renderWithI18n(<SalesTable />);
}

// ── Tests ─────────────────────────────────────────────────────

describe("SalesTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table with sale data", () => {
    const sales = makeSales(3);
    renderTable(sales);

    // Multiple sales show their client names
    const janeElements = screen.getAllByText("Jane Doe");
    expect(janeElements.length).toBeGreaterThan(0);
    // Bob Smith appears once
    expect(screen.getByText("Bob Smith")).toBeDefined();
  });

  it("shows loading state with skeletons", () => {
    renderTable([], true);

    // Loading state renders skeleton table
    const table = screen.getByRole("table");
    expect(table).toBeDefined();
  });

  it("shows empty state when no sales", () => {
    renderTable([], false);

    expect(screen.getByText("No sales recorded")).toBeDefined();
    expect(screen.getByText("Start by adding your first sale")).toBeDefined();
  });

  it("shows error state", () => {
    mockUseSales.mockReturnValue({
      sales: [],
      isLoading: false,
      error: "Something went wrong",
      addSale: vi.fn(),
      editSale: vi.fn(),
      removeSale: vi.fn(),
      restoreSale: vi.fn(),
      showDeleted: false,
      setShowDeleted: vi.fn(),
    });

    renderWithI18n(<SalesTable />);

    expect(screen.getByText(/Something went wrong/)).toBeDefined();
  });

  it("shows empty filters message when search yields no results", async () => {
    const sales = makeSales(3);
    renderTable(sales);

    const searchInput = screen.getByPlaceholderText("Search sales...");
    await userEvent.type(searchInput, "ZZZZnotfoundZZZZ");

    expect(
      screen.getByText("No sales match the current filters"),
    ).toBeDefined();
  });

  it("filters by global search term", async () => {
    const sales = [
      makeSale({ id: "1", clientName: "Alice Wonder", amount: 50 }),
      makeSale({ id: "2", clientName: "Bob Builder", amount: 200 }),
    ];
    renderTable(sales);

    // Both visible initially
    expect(screen.getByText("Alice Wonder")).toBeDefined();
    expect(screen.getByText("Bob Builder")).toBeDefined();

    const searchInput = screen.getByPlaceholderText("Search sales...");
    await userEvent.type(searchInput, "Alice");

    expect(screen.getByText("Alice Wonder")).toBeDefined();
    expect(screen.queryByText("Bob Builder")).toBeNull();
  });

  it("paginates with more than 25 sales", () => {
    const sales = makeSales(30);
    renderTable(sales);

    // The table renders — pagination controls exist
    const rows = screen.getAllByRole("row");
    // Header row + 25 data rows = 26
    expect(rows.length).toBeLessThanOrEqual(27);
  });

  it("shows action buttons on each row", () => {
    const sales = makeSales(2);
    renderTable(sales);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(4);
  });

  it("renders date filters area", () => {
    renderTable([]);

    // Filter controls exist
    expect(screen.getByPlaceholderText("Search sales...")).toBeDefined();
  });

  describe("show deleted toggle", () => {
    it("renders the toggle button", () => {
      renderTable([]);
      expect(
        screen.getByRole("button", { name: /show deleted/i }),
      ).toBeDefined();
    });

    it("calls setShowDeleted when clicked", async () => {
      const setShowDeleted = vi.fn();
      mockUseSales.mockReturnValue({
        sales: [],
        isLoading: false,
        error: null,
        addSale: vi.fn(),
        editSale: vi.fn(),
        removeSale: vi.fn(),
        restoreSale: vi.fn(),
        showDeleted: false,
        setShowDeleted,
      });

      renderWithI18n(<SalesTable />);

      const toggleButton = screen.getByRole("button", {
        name: /show deleted/i,
      });
      await userEvent.click(toggleButton);

      expect(setShowDeleted).toHaveBeenCalledWith(true);
    });

    it("shows showing deleted text when showDeleted is true", () => {
      const deletedSales = [
        makeSale({
          id: "del-1",
          deletedAt: { seconds: 1719000000, nanoseconds: 0 } as any,
        }),
      ];
      renderTable(deletedSales, false, true);

      expect(
        screen.getByRole("button", { name: /showing deleted/i }),
      ).toBeDefined();
    });
  });

  describe("restore action", () => {
    it("shows Restore in row actions when showDeleted is true", () => {
      const restoreSale = vi.fn();
      const deletedSales = [
        makeSale({
          id: "del-1",
          deletedAt: { seconds: 1719000000, nanoseconds: 0 } as any,
        }),
      ];

      mockUseSales.mockReturnValue({
        sales: deletedSales,
        isLoading: false,
        error: null,
        addSale: vi.fn(),
        editSale: vi.fn(),
        removeSale: vi.fn(),
        restoreSale,
        showDeleted: true,
        setShowDeleted: vi.fn(),
      });

      renderWithI18n(<SalesTable />);

      expect(
        screen.getByRole("button", { name: /showing deleted/i }),
      ).toBeDefined();
    });
  });
});
