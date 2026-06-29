# Tasks: Sales Module

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1800-2500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Foundation → Components → Routes/Nav/i18n → Tests |
| Delivery strategy | single-pr |
| Chain strategy | size:exception |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size:exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types, services, hooks (16 files) | PR 1 | Base for all other work |
| 2 | Table, form, catalog managers (8 files) | PR 2 | Depends on Unit 1 |
| 3 | Route page, sidebar nav, i18n (5 files) | PR 3 | Depends on Unit 1 |
| 4 | Unit + integration tests (6 files) | PR 4 | Depends on Units 1-3 |

## Phase 1: Foundation — Types, Services, Hooks

- [x] 1.1 Create `types/sale.ts` — `Sale` interface, `SaleFormSchema` Zod (excludes derived fields), `SalePaymentMethods`, `PAYMENT_FEE_MAP`
- [x] 1.2 Create `types/client.ts` — `Client` interface + Zod schema
- [x] 1.3 Create `types/employee.ts` — `Employee` interface + Zod schema
- [x] 1.4 Create `types/service-area.ts` — `ServiceArea` interface + Zod schema
- [x] 1.5 Create `types/service-type.ts` — `ServiceType` interface + Zod schema
- [x] 1.6 Create `types/index.ts` — Re-export all types
- [x] 1.7 Create `services/sale-service.ts` — `listenSales`, `createSale` (denormalization + derived fields), `updateSale`, `softDeleteSale`, `restoreSale`
- [x] 1.8 Create `services/client-service.ts` — CRUD per `category-service` pattern
- [x] 1.9 Create `services/employee-service.ts` — CRUD with `isActive` filter, `orderBy("name")`
- [x] 1.10 Create `services/service-area-service.ts` — CRUD ordered by `sortOrder`
- [x] 1.11 Create `services/service-type-service.ts` — CRUD by area, ordered by name
- [x] 1.12 Create `hooks/use-sales.ts` — Real-time listener per `useExpenses` pattern
- [x] 1.13 Create `hooks/use-clients.ts` — Per `useCategories` pattern
- [x] 1.14 Create `hooks/use-employees.ts` — Per `useCategories` pattern
- [x] 1.15 Create `hooks/use-service-areas.ts` — Per `useCategories` pattern
- [x] 1.16 Create `hooks/use-service-types.ts` — Per `useCategories` pattern

## Phase 2: Components

- [x] 2.1 Create `components/sales-table.tsx` — TanStack Table with date/employee/client/area/payment/credit filters, default today, 25 rows/page
- [x] 2.2 Create `components/sale-form.tsx` — Dialog form with catalog selects, auto-filled amount/fee/isMakeup
- [x] 2.3 Create `components/client-manager.tsx` + `client-form-dialog.tsx` — Client CRUD manager + dialog
- [x] 2.4 Create `components/employee-manager.tsx` + `employee-form-dialog.tsx` — Employee CRUD manager + dialog
- [x] 2.5 Create `components/service-manager.tsx` + `service-area-form-dialog.tsx` + `service-type-form-dialog.tsx` — Service catalog CRUD manager

## Phase 3: Routes, Nav, i18n

- [x] 3.1 Create `src/app/[locale]/dashboard/ventas/page.tsx` — Sales page per `/gastos/page.tsx` pattern
- [x] 3.2 Modify `sidebar.tsx` — Add `/dashboard/ventas` nav item with `ShoppingCart` icon, `sidebar.sales` key (all roles)
- [x] 3.3 Modify `en.json` — Add `sidebar.sales` key + full `sales` namespace (form, table, filters, payment, validation, client, employee, service, credit, actions)
- [x] 3.4 Modify `es.json` — Add matching `sidebar.sales` + `sales` namespace translations

## Phase 4: Tests

- [ ] 4.1 Unit tests — Zod schemas: `safeParse` valid + invalid for sale, client, employee, area, type
- [ ] 4.2 Unit tests — `sale-service`: create derives amount+isMakeup+fee, denormalizes names, soft-delete guards (vi.hoisted Firestore mocks)
- [ ] 4.3 Unit tests — Catalog services: CRUD, `isActive` filter, area-to-type filtering (vi.hoisted mocks)
- [ ] 4.4 Integration tests — Hooks: listener subscription, data flow, cleanup on unmount (`renderHook` + mocked services)
- [ ] 4.5 Integration tests — Components: table renders, form validation, catalog selects (`render` + mocked hooks)
