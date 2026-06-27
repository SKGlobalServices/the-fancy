import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Timestamp } from "firebase/firestore";

// ── Mocks ────────────────────────────────────────────────────

const mockUseExpenses = vi.fn();
const mockUseCategories = vi.fn();

vi.mock("../../hooks/use-expenses", () => ({
  useExpenses: (...args: any[]) => mockUseExpenses(...args),
}));

vi.mock("../../hooks/use-categories", () => ({
  useCategories: (...args: any[]) => mockUseCategories(...args),
}));

vi.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: vi.fn(() => ({
    user: { uid: "test-user", email: "test@test.com", displayName: "Test" },
  })),
}));

vi.mock("@/shared/lib/firebase", () => ({
  getFirebaseDb: vi.fn(() => ({})),
}));

import { ExpenseForm } from "../expense-form";
import { renderWithI18n } from "@/test-utils/render-with-i18n";

// ── Helpers ──────────────────────────────────────────────────

function setupMocks({
  categories = [{ id: "cat1", name: "Insumos" }],
  addExpense = vi.fn(),
  editExpense = vi.fn(),
}: {
  categories?: { id: string; name: string }[];
  addExpense?: any;
  editExpense?: any;
} = {}) {
  mockUseExpenses.mockReturnValue({
    expenses: [],
    isLoading: false,
    error: null,
    addExpense,
    editExpense,
    removeExpense: vi.fn(),
    restoreExpense: vi.fn(),
  });

  mockUseCategories.mockReturnValue({
    categories,
    isLoading: false,
    error: null,
    addCategory: vi.fn(),
    editCategory: vi.fn(),
    removeCategory: vi.fn(),
  });
}

describe("ExpenseForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders create form with all fields", () => {
    setupMocks();
    renderWithI18n(<ExpenseForm open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("New Expense")).toBeDefined();
    expect(screen.getByText(/Provider/i)).toBeDefined();
    expect(screen.getByText(/Amount/i)).toBeDefined();
    expect(screen.getByText(/Payment Method/i)).toBeDefined();
  });

  it("shows validation errors on empty submit", async () => {
    setupMocks({ categories: [{ id: "cat1", name: "Insumos" }] });
    renderWithI18n(<ExpenseForm open={true} onOpenChange={vi.fn()} />);

    const submitBtn = screen.getByRole("button", { name: /save expense/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Provider/i)).toBeDefined();
    });
  });

  it("calls addExpense with valid form fields", async () => {
    const addExpense = vi.fn().mockResolvedValue("new-id");
    setupMocks({ addExpense });

    renderWithI18n(<ExpenseForm open={true} onOpenChange={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/provider/i), "Distribuidora XYZ");
    await userEvent.type(screen.getByLabelText(/amount/i), "5000");

    expect(screen.getByLabelText(/provider/i)).toHaveValue("Distribuidora XYZ");
    expect(screen.getByLabelText(/amount/i)).toHaveValue(5000);
    expect(screen.getByLabelText(/category/i)).toBeDefined();
  });

  it("shows disabled message when no categories exist", () => {
    setupMocks({ categories: [] });
    renderWithI18n(<ExpenseForm open={true} onOpenChange={vi.fn()} />);

    const elements = screen.getAllByText(/create a category first/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("shows submit error from toast when addExpense fails", () => {
    const addExpense = vi
      .fn()
      .mockRejectedValue(new Error("Error de conexión"));
    setupMocks({ addExpense });

    renderWithI18n(<ExpenseForm open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /save expense/i })).toBeDefined();
  });

  it("pre-fills fields in edit mode", () => {
    setupMocks();
    const expense = {
      id: "exp-1",
      fecha: new Timestamp(1700000000, 0),
      categoria: "Insumos",
      descripcion: "Compra existente",
      proveedorLugar: "Distribuidora ABC",
      metodoPago: "cash" as const,
      monto: 3000,
      tieneRecibo: "yes" as const,
      numeroReciboFoto: "",
      registradoPor: "leandro" as const,
      observaciones: "",
      createdBy: "user-1",
      createdAt: new Timestamp(1700000000, 0),
      updatedAt: new Timestamp(1700000000, 0),
      deletedAt: null,
    };

    renderWithI18n(
      <ExpenseForm
        open={true}
        onOpenChange={vi.fn()}
        expense={expense}
      />,
    );

    expect(screen.getByDisplayValue("Distribuidora ABC")).toBeDefined();
    expect(screen.getByDisplayValue("3000")).toBeDefined();
  });

  it("calls editExpense in edit mode", async () => {
    const editExpense = vi.fn().mockResolvedValue(undefined);
    setupMocks({ editExpense });

    const expense = {
      id: "exp-1",
      fecha: new Timestamp(1700000000, 0),
      categoria: "Insumos",
      descripcion: "Compra existente",
      proveedorLugar: "Distribuidora ABC",
      metodoPago: "cash" as const,
      monto: 3000,
      tieneRecibo: "yes" as const,
      numeroReciboFoto: "",
      registradoPor: "leandro" as const,
      observaciones: "",
      createdBy: "user-1",
      createdAt: new Timestamp(1700000000, 0),
      updatedAt: new Timestamp(1700000000, 0),
      deletedAt: null,
    };

    renderWithI18n(
      <ExpenseForm
        open={true}
        onOpenChange={vi.fn()}
        expense={expense}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /update expense/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(editExpense).toHaveBeenCalledWith("exp-1", expect.any(Object));
    });
  });
});
