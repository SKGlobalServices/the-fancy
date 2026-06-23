# Tasks: Gastos del Negocio

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1200–1500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation+Services) → PR 2 (Hooks+Components) → PR 3 (Pages+Layout) |
| Delivery strategy | single-pr-default |
| Chain strategy | pending |

Decision needed before apply: No (size:exception approved by maintainer)
Chained PRs recommended: Yes (overridden — single PR with size:exception)
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types + Firestore services + tests | PR 1 | Foundation layer, no UI |
| 2 | Hooks + Core components + component tests | PR 2 | Depends on PR 1 |
| 3 | Dashboard layout + pages | PR 3 | Depends on PR 2 |

## Phase 1: Foundation — Types & Services

- [x] 1.1 Create `src/features/expenses/types/index.ts` — Expense, ExpenseFormData, Category, PaymentMethod, RegisteredBy, SiNo, Zod schemas (descripcion optional)
- [x] 1.2 Write tests: Zod schema validation for valid/invalid inputs (TDD)
- [x] 1.3 Create `src/features/expenses/services/expense-service.ts` — create, update, softDelete, restore, listen (onSnapshot filtered by deletedAt==null + year), getById
- [x] 1.4 Create `src/features/expenses/services/category-service.ts` — create, listen, update, delete (query expenses before delete to check usage), duplicate prevention
- [x] 1.5 Write tests: service CRUD + soft delete guard + error propagation (mock Firestore)

## Phase 2: Hooks

- [x] 2.1 Create `src/features/expenses/hooks/use-expenses.ts` — wraps expenseService.listen, exposes data/loading/error/mutations (create, update, softDelete, restore)
- [x] 2.2 Create `src/features/expenses/hooks/use-categories.ts` — wraps categoryService.listen, sorted list, exposes data/loading/error/mutations
- [x] 2.3 Write tests: hook loading/error/data states + mutation integration (mock onSnapshot)

## Phase 3: Core Components

- [x] 3.1 Create `src/features/expenses/components/expense-form.tsx` — shadcn Dialog, Zod inline validation, all fields (categoria dropdown from useCategories), create/edit modes, submit error via sonner toast, descripcion optional
- [x] 3.2 Create `src/features/expenses/components/expense-table.tsx` — TanStack Table v8, global search (descripcion/proveedor/categoria/observaciones), date range filter (shadcn calendar popover), category/payment-method dropdown filters, sort (fecha/categoria/monto), pagination (10/20/50), empty/skeleton loading states, row edit/delete actions via AlertDialog
- [x] 3.3 Create `src/features/expenses/components/category-manager.tsx` — shadcn Sheet/Dialog, list categories, add (with duplicate check), rename, delete (with usage guard), empty state with CTA
- [x] 3.4 Write component tests: table renders/filters/sorts, form validates/submits, category manager CRUD + delete guard

## Phase 4: Pages & Layout

- [x] 4.1 Create `src/app/dashboard/layout.tsx` — auth guard (redirect to login if not authenticated), sidebar nav (Gastos, Categorías), user info display, responsive mobile toggle
- [x] 4.2 Create `src/app/dashboard/gastos/page.tsx` — main page: month summary bar, expense table, FAB to open create form
- [x] 4.3 Create `src/app/dashboard/gastos/categorias/page.tsx` — category management page with CategoryManager

## Phase 5: Final Verification

- [x] 5.1 Run `pnpm build` — fix any TypeScript/lint errors
- [x] 5.2 Run full test suite — all ZOD, service, hook, and component tests pass
