# Proposal: Gastos del Negocio

## Intent

Replace paper/spreadsheet expense records with a digital tool so the beauty salon owner and accountant can search, filter, and audit all business expenses.

## Scope

### In Scope
- Expense CRUD + soft delete via Firestore
- Category catalog CRUD (user-managed)
- Gastos page: TanStack Table with global search, column filters, sorting, pagination
- Protected dashboard layout with sidebar nav
- Zod validation on expense forms

### Out of Scope
- Receipt photo upload (text-only receipt number for v1)
- CSV/export, business rules/approvals, owner dashboard analytics

## Capabilities

### New Capabilities
- `expense-registry`: Firestore CRUD with soft delete, Zod validation, timestamps, real-time snapshots
- `category-catalog`: User-managed category CRUD, consumed as expense form dropdown
- `expense-table`: TanStack Table v8 with search, date/category/payment-method filters, sort, pagination

### Modified Capabilities
None

## Approach

Mirror existing `auth` feature pattern: `types/`, `services/` (Firestore via `getFirebaseDb()`), `hooks/`, `components/`. Page at `src/app/dashboard/gastos/`. Toast via sonner, validation via Zod, table via TanStack Table v8.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/expenses/types/` | New | Expense, Category, PaymentMethod types + Zod schemas |
| `src/features/expenses/services/` | New | expense-service (CRUD + soft delete), category-service (CRUD) |
| `src/features/expenses/hooks/` | New | use-expenses, use-categories hooks |
| `src/features/expenses/components/` | New | expense-table, expense-form, category-manager |
| `src/app/dashboard/layout.tsx` | New | Protected layout with sidebar |
| `src/app/dashboard/gastos/` | New | Main page + categorias sub-page |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Firestore perf with many expenses | Low | Paginated queries, default year filter |
| Soft delete bugs | Low | Unit test delete/restore paths |

## Rollback Plan

Firestore data persists independently — rollback is `git revert` of frontend changes. Soft delete preserves data for recovery.

## Dependencies

- Auth (user must be logged in, UID on `createdBy`)
- Firebase Firestore (lazy-init already in place)
- `@tanstack/react-table`, `zod`, `date-fns` (already installed)
- shadcn: dialog, select, table, calendar, popover, badge, sonner (all installed)

## Success Criteria

- [ ] TypeScript strict mode builds pass
- [ ] All vitest tests pass (strict TDD)
- [ ] Users create, view, edit, and soft-delete expenses
- [ ] Users create, rename, and delete categories
- [ ] Table supports search, date/category/payment-method filters, sorting, pagination
- [ ] Expense form validates all fields via Zod before submit
- [ ] Categories shown as dropdown in expense form
