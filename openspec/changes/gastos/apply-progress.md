# Apply Progress: Gastos del Negocio

## TDD Cycle Evidence

| Task | Description | 🟥 RED (Test Written) | 🟩 GREEN (Implementation) | 🔷 REFACTOR (Clean) |
|------|-------------|:---:|:---:|:---:|
| **Phase 1: Foundation** |
| 1.1 | Types (`Expense`, `Category`, Zod schemas) | ✅ | ✅ | ✅ |
| 1.2 | Zod schema validation tests | ✅ | ✅ | ✅ |
| 1.3 | Expense service (CRUD, soft delete, listen) | ✅ | ✅ | ✅ |
| 1.4 | Category service (CRUD, duplicate prevention) | ✅ | ✅ | ✅ |
| 1.5 | Service CRUD + guard tests | ✅ | ✅ | ✅ |
| **Phase 2: Hooks** |
| 2.1 | `useExpenses` (listener + mutations) | ✅ | ✅ | ✅ |
| 2.2 | `useCategories` (listener + mutations) | ✅ | ✅ | ✅ |
| 2.3 | Hook tests (loading/error/data + mutations) | ✅ | ✅ | ✅ |
| **Phase 3: Components** |
| 3.1 | `ExpenseForm` (Dialog, Zod inline validation) | ✅ | ✅ | ✅ |
| 3.2 | `ExpenseTable` (TanStack Table, filters, sort, pagination) | ✅ | ✅ | ✅ |
| 3.3 | `CategoryManager` (Sheet, CRUD, usage guard) | ✅ | ✅ | ✅ |
| 3.4 | Component tests (render, filter, form validate, CRUD) | ✅ | ✅ | ✅ |
| **Phase 4: Pages** |
| 4.1 | Dashboard layout (auth guard, sidebar nav) | ✅ | ✅ | ✅ |
| 4.2 | Gastos page (summary, table, FAB) | ✅ | ✅ | ✅ |
| 4.3 | Categorías page (CategoryManager) | ✅ | ✅ | ✅ |
| **Phase 5: Final** |
| 5.1 | Build compiles (`pnpm build`) | ✅ | ✅ | ✅ |
| 5.2 | Full test suite passes (86 → 90 tests) | ✅ | ✅ | ✅ |
| **Verification Fixes** |
| V.1 | Guard: update rejected for deleted expense | 🆕 4e6a6df | `expense-service.ts:getDoc` | ✅ |
| V.2 | Guard: soft delete already deleted expense | 🆕 4e6a6df | `expense-service.ts:getDoc` | ✅ |
| V.3 | Guard: delete non-existent category | 🆕 4e6a6df | `category-service.ts:getDoc` | ✅ |
| V.4 | Show deleted toggle + restore action | 🆕 db9f311 | `use-expenses.ts` + `expense-table.tsx` | ✅ |

## Summary

- **Total tasks**: 21 (17 original + 4 verification fixes)
- **Completed**: 21/21
- **Test count**: 81 → 90 (+9 new tests)
- **Build**: Compiles successfully
