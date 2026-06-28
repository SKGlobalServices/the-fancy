# Design: Sales Module

## Technical Approach

Mirror the expenses module pattern exactly — `src/features/sales/{types,services,hooks,components}/` — with 5 Firestore collections (sales, clients, employees, serviceAreas, serviceTypes). Four new catalog hooks/services mirror `useCategories`/`category-service`. Sale creation derives `amount` (from serviceType price), `paymentFeePct` (from payment method map), and `isMakeup` (from serviceType) instead of user entry. Denormalize catalog names at write time for historical accuracy. Soft delete via `deletedAt` per expenses.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Catalog files in sales/ vs. separate features/ | Cohesion vs. future extraction | `src/features/sales/types/client.ts` etc. — modular files for later extraction |
| Composite Firestore indexes vs. client-side filter | Query perf vs. zero-config deploy | Client-side filter on `deletedAt` + date range (expenses pattern), define indexes in design but skip for MVP |
| Denormalized names vs. joins at read | Storage vs. query complexity | Denormalize `clientName`, `employeeName`, `serviceAreaName`, `serviceTypeName` + `amount` + `paymentFeePct` + `isMakeup` at write time |
| Derived fields in schema vs. in service | Zod purity vs. convenience | Derived fields created in `sale-service.ts` after Zod validation; form schema excludes them |

### Firestore Collections

| Collection | Documents | Key Fields |
|------------|-----------|------------|
| `sales` | Sale records | date, clientId, employeeId, serviceAreaId, serviceTypeId, clientName, employeeName, serviceAreaName, serviceTypeName, amount, paymentMethod, paymentFeePct, isCredit, isMakeup, observations, createdBy, createdAt, updatedAt, deletedAt |
| `clients` | Client catalog | name, phone, notes, createdAt, updatedAt, deletedAt |
| `employees` | Employee catalog | name, phone, isActive, createdAt, updatedAt, deletedAt |
| `serviceAreas` | Service areas | name, sortOrder, deletedAt |
| `serviceTypes` | Service types | name, areaId, price, isMakeup, deletedAt |

### Derived Values at Creation

```
paymentMethod → paymentFeePct map:
  cash/transfer: 0, localCard: 1.5, creditCard: 4, paymentLink: 4

serviceType.price → sale.amount          (copied at write)
serviceType.isMakeup → sale.isMakeup     (copied at write)
```

## Data Flow

```
[Sale Form]
  │ user selects client, employee, area, type, payment
  │ amount + fee + isMakeup auto-filled from catalogs
  ▼
[Zod validation] → saleSchema (no derived fields)
  │
  ▼
[sale-service.ts createSale()]
  │ reads serviceType.price, serviceType.isMakeup
  │ reads client.name, employee.name, area.name, type.name
  │ computes paymentFeePct from payment method map
  │ writes to Firestore `sales` collection
  ▼
[onSnapshot listener] → [useSales hook] → [SalesTable (TanStack)]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/sales/types/sale.ts` | Create | Sale interface, `SaleFormSchema` Zod (excludes derived fields), `PaymentMethods` constant with fee map |
| `src/features/sales/types/client.ts` | Create | Client interface + Zod schema |
| `src/features/sales/types/employee.ts` | Create | Employee interface + Zod schema |
| `src/features/sales/types/service-area.ts` | Create | ServiceArea interface + Zod schema |
| `src/features/sales/types/service-type.ts` | Create | ServiceType interface + Zod schema |
| `src/features/sales/types/index.ts` | Create | Re-exports all types |
| `src/features/sales/services/sale-service.ts` | Create | `listenSales`, `createSale`, `updateSale`, `softDeleteSale`, `restoreSale` — with denormalization |
| `src/features/sales/services/client-service.ts` | Create | CRUD per `category-service` pattern |
| `src/features/sales/services/employee-service.ts` | Create | CRUD with `isActive` filter, order by name |
| `src/features/sales/services/service-area-service.ts` | Create | CRUD ordered by `sortOrder` |
| `src/features/sales/services/service-type-service.ts` | Create | CRUD by area, ordered by name |
| `src/features/sales/hooks/use-sales.ts` | Create | Per `useExpenses` pattern |
| `src/features/sales/hooks/use-clients.ts` | Create | Per `useCategories` pattern |
| `src/features/sales/hooks/use-employees.ts` | Create | Per `useCategories` pattern |
| `src/features/sales/hooks/use-service-areas.ts` | Create | Per `useCategories` pattern |
| `src/features/sales/hooks/use-service-types.ts` | Create | Per `useCategories` pattern |
| `src/features/sales/components/sales-table.tsx` | Create | TanStack Table with date range, employee, client, area, payment, credit filters; default to today; 25 rows/page |
| `src/features/sales/components/sale-form.tsx` | Create | Dialog form with catalog selects, auto-filled amount/fee/isMakeup display |
| `src/features/sales/components/client-manager.tsx` | Create | Client CRUD manager dialog |
| `src/features/sales/components/client-form-dialog.tsx` | Create | Client create/edit dialog |
| `src/features/sales/components/employee-manager.tsx` | Create | Employee CRUD manager dialog |
| `src/features/sales/components/employee-form-dialog.tsx` | Create | Employee create/edit dialog |
| `src/features/sales/components/service-manager.tsx` | Create | Service area + type CRUD manager |
| `src/features/sales/components/service-area-form-dialog.tsx` | Create | Area create/edit dialog |
| `src/features/sales/components/service-type-form-dialog.tsx` | Create | Type create/edit dialog |
| `src/app/[locale]/dashboard/ventas/page.tsx` | Create | Sales page per gastos/page.tsx pattern |
| `src/features/auth/components/sidebar.tsx` | Modify | Add `/dashboard/ventas` nav item with `ShoppingCart` icon, `sidebar.sales` key |
| `src/i18n/locales/en.json` | Modify | Add `sidebar.sales` key + full `sales` namespace |
| `src/i18n/locales/es.json` | Modify | Add `sidebar.sales` key + full `sales` namespace |

## Interfaces / Contracts

### SaleFormSchema (Zod — form input only)

```ts
export const SalePaymentMethods = [
  "cash", "transfer", "localCard", "creditCard", "paymentLink",
] as const;

export const PAYMENT_FEE_MAP: Record<string, number> = {
  cash: 0, transfer: 0, localCard: 1.5, creditCard: 4, paymentLink: 4,
};

export const saleFormSchema = z.object({
  date: z.instanceof(Timestamp),
  clientId: z.string().min(1),
  employeeId: z.string().min(1),
  serviceAreaId: z.string().min(1),
  serviceTypeId: z.string().min(1),
  paymentMethod: z.enum(SalePaymentMethods),
  isCredit: z.boolean(),
  observations: z.string().optional(),
});
```

### Sale interface (Firestore document shape)

```ts
export interface Sale {
  id: string;
  date: Timestamp;
  clientId: string; clientName: string;
  employeeId: string; employeeName: string;
  serviceAreaId: string; serviceAreaName: string;
  serviceTypeId: string; serviceTypeName: string;
  amount: number;
  paymentMethod: string;
  paymentFeePct: number;
  isCredit: boolean;
  isMakeup: boolean;
  observations?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Zod schemas (sale, client, employee, area, type) | `safeParse` valid/invalid per `expenses/types/__tests__/index.test.ts` pattern |
| Unit | Sale service: create derives amount+isMakeup+fee, denormalizes names, soft delete guards | `vi.hoisted` Firestore mocks per `expense-service.test.ts` |
| Unit | Catalog services: CRUD, duplicate checks, isActive filter | `vi.hoisted` Firestore mocks |
| Integration | Hooks: listener subscription, data flow, cleanup on unmount | `renderHook` with mocked services per `use-expenses.test.tsx` |
| Integration | Components: table renders, form validation, catalog selects | `render` with mocked hooks per `expense-table.test.tsx` |

## Firestore Indexes

**For MVP (client-side filtering, zero-config):** No composite indexes needed — follow expenses pattern: `orderBy("date", "desc")` listener, filter `deletedAt` and date range client-side.

**For production scale, add these composite indexes in Firebase Console:**

| Collection | Fields |
|------------|--------|
| `sales` | `deletedAt` ASC, `date` DESC |
| `sales` | `deletedAt` ASC, `employeeId` ASC, `date` DESC |
| `sales` | `deletedAt` ASC, `clientId` ASC, `date` DESC |
| `serviceTypes` | `areaId` ASC, `name` ASC |

## Migration / Rollout

No data migration required — Firestore collections are empty at creation. Existing sales records (none yet) are unaffected. Sidebar nav and route are additive — no risk to existing navigation.

## Open Questions

- [ ] Should the "Today" default filter use Firestore `where` clause or client-side filter? Decision: client-side for MVP (no composite indexes needed), Firestore where for scale.
- [ ] `Sales` icon: using `ShoppingCart` from lucide-react — confirm or prefer `Receipt`/`DollarSign`?
- [ ] Confirm 25 rows/page default (spec) vs. 10 (expenses pattern). Spec says 25.
