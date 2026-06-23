import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks ────────────────────────────────────────────────────

const mockUseCategories = vi.fn();

vi.mock("../../hooks/use-categories", () => ({
  useCategories: (...args: any[]) => mockUseCategories(...args),
}));

vi.mock("@/shared/lib/firebase", () => ({
  getFirebaseDb: vi.fn(() => ({})),
}));

vi.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: vi.fn(() => ({
    user: { uid: "test-user", email: "test@test.com", displayName: "Test" },
  })),
}));

import { CategoryManager } from "../category-manager";

function setupMocks({
  categories = [
    { id: "cat1", name: "Insumos" },
    { id: "cat2", name: "Servicios" },
  ],
  addCategory = vi.fn(),
  editCategory = vi.fn(),
  removeCategory = vi.fn(),
}: {
  categories?: { id: string; name: string }[];
  addCategory?: any;
  editCategory?: any;
  removeCategory?: any;
} = {}) {
  mockUseCategories.mockReturnValue({
    categories,
    isLoading: false,
    error: null,
    addCategory,
    editCategory,
    removeCategory,
  });
}

describe("CategoryManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders list of categories", () => {
    setupMocks();
    render(<CategoryManager open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Insumos")).toBeDefined();
    expect(screen.getByText("Servicios")).toBeDefined();
  });

  it("shows empty state when no categories exist", () => {
    setupMocks({ categories: [] });
    render(<CategoryManager open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText(/no hay categorías creadas/i)).toBeDefined();
  });

  it("adds a new category", async () => {
    const addCategory = vi.fn().mockResolvedValue("new-cat-3");
    setupMocks({ addCategory });
    render(<CategoryManager open={true} onOpenChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/nombre/i);
    await userEvent.type(input, "Gastos Varios");

    const addBtn = screen.getByRole("button", { name: /agregar categoría/i });
    await userEvent.click(addBtn);

    await waitFor(() => {
      expect(addCategory).toHaveBeenCalledWith("Gastos Varios");
    });
  });

  it("shows error when addCategory fails", async () => {
    const addCategory = vi
      .fn()
      .mockRejectedValue(new Error("Ya existe una categoría con ese nombre"));
    setupMocks({ addCategory });
    render(<CategoryManager open={true} onOpenChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/nombre/i);
    await userEvent.type(input, "Insumos");

    const addBtn = screen.getByRole("button", { name: /agregar categoría/i });
    await userEvent.click(addBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/ya existe una categoría/i),
      ).toBeDefined();
    });
  });

  it("renames a category", async () => {
    const editCategory = vi.fn().mockResolvedValue(undefined);
    setupMocks({ editCategory });
    render(<CategoryManager open={true} onOpenChange={vi.fn()} />);

    // Find rename button for first category
    const renameBtns = screen.getAllByRole("button", { name: /renombrar/i });
    await userEvent.click(renameBtns[0]);

    // Now there should be an input with the current name
    const renameInput = screen.getByDisplayValue("Insumos");
    await userEvent.clear(renameInput);
    await userEvent.type(renameInput, "Insumos Premium");

    // Click save (Check icon button with aria-label "Guardar")
    const saveBtn = screen.getByRole("button", { name: /guardar/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(editCategory).toHaveBeenCalledWith("cat1", "Insumos Premium");
    });
  });

  it("prevents deletion of category in use", async () => {
    const removeCategory = vi
      .fn()
      .mockRejectedValue(
        new Error("No se puede eliminar: hay gastos que usan esta categoría"),
      );
    setupMocks({ removeCategory });
    render(<CategoryManager open={true} onOpenChange={vi.fn()} />);

    // Click the first delete button in the category list
    const deleteBtns = screen.getAllByRole("button", { name: /eliminar/i });
    await userEvent.click(deleteBtns[0]);

    // Verify removeCategory was called with correct args
    const confirmBtn = screen.getByRole("button", { name: /^eliminar$/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(removeCategory).toHaveBeenCalledWith("cat1", "Insumos");
    });
  });
});
