# Design: Gastos del Negocio

## Technical Approach

Mirror the existing `auth` feature pattern: `types/` → `services/` (Firestore via `getFirebaseDb()`) → `hooks/` → `components/` → pages. All expense and category data stored in Firestore with real-time sync via `onSnapshot`. Client-side Zod validation before writes. TanStack Table v8 for client-side search/filter/sort/pagination with a default year filter to bound data volume.

UI labels and user-facing strings in Spanish per project convention (`ui_language: es`). Code, types, and technical artifacts in English.

## Architecture Decisions

### Decision: Firestore Collection Design

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Subcollections per user/month | Complex queries, harder to maintain | ❌ |
| Flat `expenses/` + `categories/` collections | Simple queries, `deletedAt` handles soft delete cleanly | ✅ |

**Rationale**: Flat collections keep queries simple. Soft delete via `deletedAt: Timestamp \| null`. Query: `where("deletedAt", "==", null)`. Categories are a separate collection, referenced by name in expense documents.

### Decision: Real-time via onSnapshot

| Option | Tradeoff | Decision |
|--------|----------|----------|
| REST reads + manual refresh | Lower cost, stale data between refreshes | ❌ |
| `onSnapshot` real-time listener | Higher read cost, instant UI, no refresh logic | ✅ |

**Rationale**: Expense data changes infrequently (reads vastly exceed writes). Real-time means the table always reflects current state without polling or manual refresh. Acceptable Firestore read cost at salon scale.

### Decision: Client-side Pagination via TanStack Table

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Firestore pagination (`limit`/`startAfter`) | Complex with real-time + filters, cursor management | ❌ |
| Client-side with year filter | Loads all non-deleted expenses for current year, paginates in-memory | ✅ |

**Rationale**: `onSnapshot` already loads all matching docs. TanStack Table handles search/filter/sort/pagination client-side with zero additional reads. Default year filter limits initial payload to ~500-2000 docs — negligible at this scale.

### Decision: Zod Validation Client-side Only

**Choice**: Run Zod validation in the form/hook layer before every Firestore write.
**Alternatives considered**: Firestore security rules for validation.
**Rationale**: Zod gives instant field-level error feedback. Firestore security rules are the server-side safety net (auth, structural constraints). Zod handles business validation (monto > 0, categoria exists in catalog). No separate server validation layer needed for v1.

### Decision: Soft Delete Pattern

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Hard delete (`doc.delete()`) | Data loss, no audit trail | ❌ |
| Soft delete (`deletedAt` timestamp) | Auditable, restorable, slightly larger collection | ✅ |

**Rationale**: `deletedAt: Timestamp \| null`. Real-time query filters out deleted docs. Future restore capability. No cascade effects.

### Decision: Category Reference by Name

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Reference by document ID | Must resolve IDs → names for display and filtering | ❌ |
| Reference by name (string) | Renaming a category doesn't update historical expenses | ✅ |

**Rationale**: Names are human-readable in Firestore directly. Renaming is rare and historical values remain meaningful ("this was categorized as Insumos at the time"). Simpler queries, no joins or manual resolution.

## Data Flow

### Read path (real-time)
```
Page → useExpenses() / useCategories() hook
  → expenseService.listen() / categoryService.listen()
    → onSnapshot("expenses", where("deletedAt","==",null), orderBy("fecha","desc"))
    → getFirebaseDb() from shared/lib/firebase.ts
  ← snapshot emits array
  ← hook sets state (data, loading, error)
  ← component re-renders (table / form dropdown)
```

### Write path (mutations)
```
ExpenseForm / CategoryManager → handleSubmit
  → Zod schema.parse(formData) → throws structured errors on invalid
  → expenseService.create() / categoryService.update()
    → addDoc / updateDoc / setDoc → Firestore
  ← onSnapshot fires → hook re-emits → table / list updates
```

```
 User → Page → Hook → Service → Firestore
        ↑         ↑        ↓
        └────────── ← snapshot ──┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/expenses/types/index.ts` | Create | `Expense`, `ExpenseFormData`, `Category`, `PaymentMethod`, `RegisteredBy` types + Zod schemas |
| `src/features/expenses/services/expense-service.ts` | Create | Firestore CRUD: `create`, `update`, `softDelete`, `restore`, `listen` (onSnapshot), `getById` |
| `src/features/expenses/services/category-service.ts` | Create | Firestore CRUD: `create`, `listen`, `update`, `delete` (with usage check) |
| `src/features/expenses/hooks/use-expenses.ts` | Create | Hook wrapping expense listener + mutations, loading/error states, default year filter |
| `src/features/expenses/hooks/use-categories.ts` | Create | Hook wrapping category listener + mutations, loading/error states, sorted list |
| `src/features/expenses/components/expense-table.tsx` | Create | TanStack Table: columns (fecha, descripcion, monto, categoria, metodoPago), global search, column filters, sort, pagination, skeleton loading, empty states |
| `src/features/expenses/components/expense-form.tsx` | Create | Shadcn Dialog form: all fields, Zod validation, create/edit modes, AlertDialog for delete confirmation |
| `src/features/expenses/components/category-manager.tsx` | Create | Sheet/Dialog: category list, add, rename, delete with protection check |
| `src/app/dashboard/layout.tsx` | Create | Protected layout: auth guard check, sidebar nav (Gastos, Categorías), user info, mobile toggle |
| `src/app/dashboard/gastos/page.tsx` | Create | Main page: summary bar (total month), table, FAB to open form |
| `src/app/dashboard/gastos/categorias/page.tsx` | Create | Category management page |

## Interfaces / Contracts

```typescript
// src/features/expenses/types/index.ts

export type PaymentMethod = "Efectivo" | "Transferencia" | "Tarjeta" | "Crédito" | "Abono" | "Otro";
export type RegisteredBy = "Ana Paula" | "Leandro" | "Mónica" | "Lizeth" | "Dueña" | "Otro";
export type SiNo = "Sí" | "No";

export interface Expense {
  id: string;
  fecha: Timestamp;
  categoria: string;         // category name (not ID)
  descripcion?: string;
  proveedorLugar: string;
  metodoPago: PaymentMethod;
  monto: number;
  tieneRecibo: SiNo;
  numeroReciboFoto?: string; // receipt number only (no photo upload for v1)
  registradoPor: RegisteredBy;
  observaciones?: string;
  createdBy: string;         // user UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export interface ExpenseFormData {
  fecha: Timestamp;
  categoria: string;
  descripcion?: string;
  proveedorLugar: string;
  metodoPago: PaymentMethod;
  monto: number;
  tieneRecibo: SiNo;
  numeroReciboFoto?: string;
  registradoPor: RegisteredBy;
  observaciones?: string;
}

export const expenseSchema = z.object({
  fecha: z.instanceof(Timestamp, { message: "La fecha es obligatoria" }),
  categoria: z.string().min(1, "Seleccioná una categoría"),
  descripcion: z.string().optional().default(""),
  proveedorLugar: z.string().min(1, "El proveedor/lugar es obligatorio"),
  metodoPago: z.enum(["Efectivo", "Transferencia", "Tarjeta", "Crédito", "Abono", "Otro"]),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  tieneRecibo: z.enum(["Sí", "No"]),
  numeroReciboFoto: z.string().optional(),
  registradoPor: z.enum(["Ana Paula", "Leandro", "Mónica", "Lizeth", "Dueña", "Otro"]),
  observaciones: z.string().optional(),
});

export interface Category {
  id: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

```typescript
// Service function signatures (expense-service.ts)

export function listenExpenses(
  db: Firestore,
  year: number,
  onData: (expenses: Expense[]) => void,
  onError: (err: Error) => void,
): () => void;  // unsubscribe

export async function createExpense(
  db: Firestore,
  data: ExpenseFormData,
  userId: string,
): Promise<string>;  // returns doc ID

export async function updateExpense(
  db: Firestore,
  id: string,
  data: Partial<ExpenseFormData>,
): Promise<void>;

export async function softDeleteExpense(
  db: Firestore,
  id: string,
): Promise<void>;

export async function restoreExpense(
  db: Firestore,
  id: string,
): Promise<void>;
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Zod schemas | Validate valid/invalid inputs for `expenseSchema` and category name rules |
| Unit | Service functions | Mock Firestore (`addDoc`, `updateDoc`, `onSnapshot`) — test CRUD logic, error handling, soft delete guard |
| Component | ExpenseTable | Render with mock data, test global search, date/category/payment-method filters, sort, pagination, empty/loading states, row actions |
| Component | ExpenseForm | Test create/edit modes, field validation errors inline, submit with valid/invalid data, delete confirmation dialog |
| Component | CategoryManager | Test add category, rename, delete with usage check (mock expenses query), duplicate name rejection |

Do NOT test Firebase real-time behavior directly — mock `onSnapshot` calls and assert the hook's data/error/loading states.

## Migration / Rollout

No migration required — fresh Firestore collections (`expenses/`, `categories/`). The user starts entering data from scratch. Backend changes are git-revertible independently; Firestore data persists.

## Open Questions

None — all architecture decisions resolved with the user in the proposal phase.
