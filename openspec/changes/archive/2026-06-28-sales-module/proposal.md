# Proposal: Sales Module

## Intent

Digital daily sales log for a beauty salon — replaces paper/spreadsheet records. Enables tracking services, credit accumulation, and configurable catalogs (employees, services, payment methods).

## Scope

### In Scope
- Sale CRUD + Firestore real-time; fields: date, client, employee, service area+type, amount, payment method+fee%, credit flag, observations
- Client CRUD (name, phone, notes) — structured for future extraction into dedicated module
- Employee CRUD via Firestore collection (not hardcoded)
- Service catalog CRUD: areas + types with prices, `isMakeup` flag for owner services
- Payment methods with bank fee %: cash/transfer 0%, local card 1.5%, credit card 4%, payment link 4%
- Credit flag per sale for "paga a fin de mes" accumulation
- Route `/dashboard/ventas/`, sidebar nav item, i18n keys
- Feature module at `src/features/sales/` mirroring expenses pattern

### Out of Scope
Commissions, discounts, inventory, payment gateway, receipts, cuentas por cobrar dashboard

## Capabilities

### New Capabilities
- `sales-registry`: Sale CRUD + real-time Firestore, Zod validation, credit + payment-fee fields
- `client-catalog`: Basic client CRUD (name, phone, notes) — designed for future extraction
- `employee-catalog`: Configurable employees CRUD via Firestore
- `service-catalog`: Service areas + types CRUD with prices, `isMakeup` flag
- `sales-table`: TanStack Table with date/employee/client/service/payment filters, sort, pagination
- `sales-translations`: New en/es translation namespace for sales UI

### Modified Capabilities
- `sidebar`: Add `/dashboard/ventas/` nav item via new `sidebar.sales` i18n key
- `feature-translation`: Add sales namespace keys to en/es message files
- `dashboard-layout`: Route protection for `/dashboard/ventas/`

## Approach

Mirror expenses pattern: `src/features/sales/{types,services,hooks,components}/`. Zod schemas in `types/`, Firestore `onSnapshot` in `services/`, reactive hooks, TanStack Table for listing, Dialog forms for CRUD. Catalogs nested inside `sales/` feature for now, structured for later extraction. Payment fee % stored on each sale record for historical accuracy.

## Business Rules

- Sale = 1 client + 1 employee + 1 service type + 1 payment method
- Price read from catalog, not per-sale entry
- Credit flag = client pays accumulated end-of-month (future "cuentas por cobrar" module)
- Makeup = `isMakeup` flag on service type, same flow as regular services
- Employees, areas, types are CRUD-managed (user-configurable)

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Credit shape mismatches future module | Med | Store per-sale date+credit flag only; no aggregate assumptions |
| Firestore query perf with growth | Low | Paginated queries, date-range default filter |

## Rollback Plan

Firestore data independent — `git revert` frontend changes. Soft deletes preserve data for recovery.

## Dependencies

- Auth (user UID on `createdBy`)
- Firestore (lazy-init in place)
- `@tanstack/react-table`, `zod`, `date-fns`, `sonner` (already installed)
- shadcn: dialog, select, table, popover, badge (already installed)

## Success Criteria

- [ ] TypeScript strict mode builds pass
- [ ] Vitest tests pass (unit + integration)
- [ ] Sale CRUD works (create/view/edit/soft-delete)
- [ ] Client/employee/service catalog CRUD works
- [ ] Table supports search + date/employee/service/payment filters
- [ ] Credit flag visible and persisted per sale
- [ ] Payment method fees display in form and persist
