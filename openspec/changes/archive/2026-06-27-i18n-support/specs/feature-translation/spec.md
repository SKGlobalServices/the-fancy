# Delta for Feature Translation

## Purpose

Translate all user-facing text in feature components: Dashboard home page, Expenses (list, table, form, filters, dialogs, toasts), Categories management, and Admin Users (list + create form). All payment methods, category names, yes/no options, and currency formatting must be translatable. Currency is AWG (Aruban Florin) via configurable constant.

---

## ADDED Requirements

### Requirement: Dashboard Home Page Translations

The dashboard home page (`src/app/[locale]/page.tsx`) MUST use `getTranslations('dashboard')` for all static text.

| Text | Translation Key |
|------|-----------------|
| "Dashboard" (heading) | `dashboard.title` |
| "Welcome to The Fancy Faces administration panel. You deserve a fancy life!" | `dashboard.welcome` |
| "Coming soon" | `dashboard.comingSoon` |
| "Modules" | `dashboard.modules` |

Brand name "The Fancy Faces" and tagline "You deserve a fancy life!" are part of the welcome message but the brand name remains visually identical.

#### Scenario: Dashboard home renders in English

- GIVEN locale is `en`
- WHEN the dashboard home page loads
- THEN heading shows "Dashboard"
- AND welcome text shows "Welcome to The Fancy Faces administration panel. You deserve a fancy life!"

#### Scenario: Dashboard home renders in Spanish

- GIVEN locale is `es`
- WHEN the dashboard home page loads
- THEN heading shows "Panel de control" (or equivalent)
- AND welcome text shows "Bienvenido al panel de administración de The Fancy Faces. ¡Te mereces una vida fancy!"

---

### Requirement: Expenses List Page Translations

The expenses page (`src/app/[locale]/dashboard/gastos/page.tsx`) and `ExpenseTable` component MUST use `useTranslations('expenses')` and `useTranslations('common')`.

All column headers, filter labels, button labels, empty states, pagination, and action menu items MUST be translated.

| UI Element | Translation Key |
|------------|-----------------|
| Page title | `expenses.title` |
| "Add Expense" button | `expenses.add` |
| Table: Date column | `expenses.columns.date` |
| Table: Category column | `expenses.columns.category` |
| Table: Description column | `expenses.columns.description` |
| Table: Provider/Place column | `expenses.columns.provider` |
| Table: Payment Method column | `expenses.columns.paymentMethod` |
| Table: Amount column | `expenses.columns.amount` |
| Table: Receipt column | `expenses.columns.receipt` |
| Table: Registered By column | `expenses.columns.registeredBy` |
| Filter: Search placeholder | `expenses.filters.search` |
| Filter: From date label | `expenses.filters.dateFrom` |
| Filter: To date label | `expenses.filters.dateTo` |
| Filter: Category select placeholder | `expenses.filters.category` |
| Filter: Payment method select placeholder | `expenses.filters.paymentMethod` |
| Filter: "All" option | `common.all` |
| "Show deleted" toggle | `expenses.showDeleted` / `expenses.hideDeleted` |
| Empty: "No expenses recorded" | `expenses.empty.noExpenses` |
| Empty: "Start by adding your first expense" | `expenses.empty.addFirst` |
| Empty: "No expenses match filters" | `expenses.empty.noMatch` |
| "Clear filters" button | `common.clearFilters` |
| Pagination: "Page X of Y" | `common.pageOf` |
| "Rows per page" | `common.rowsPerPage` |
| "Previous" / "Next" | `common.previous` / `common.next` |
| Action: "Edit" | `common.edit` |
| Action: "Delete" | `common.delete` |
| Action: "Restore" | `common.restore` |
| Delete dialog title | `expenses.delete.title` |
| Delete dialog description | `expenses.delete.description` |
| Delete button (confirm) | `expenses.delete.confirm` |
| "Cancel" | `common.cancel` |

#### Scenario: Expenses table headers translate

- GIVEN locale is `en`
- WHEN the expenses table renders
- THEN columns show "Date", "Category", "Description", "Provider / Place", "Payment Method", "Amount", "Receipt", "Registered By"
- GIVEN locale is `es`
- WHEN the expenses table renders
- THEN columns show "Fecha", "Categoría", "Descripción", "Proveedor / Lugar", "Método de pago", "Monto", "Recibo", "Registrado por"

#### Scenario: Filter placeholders translate

- GIVEN locale is `en`
- WHEN the filter row renders
- THEN search placeholder shows "Search expenses...", category shows "Category", payment shows "Payment Method"
- GIVEN locale is `es`
- WHEN the filter row renders
- THEN search placeholder shows "Buscar gastos...", category shows "Categoría", payment shows "Método de pago"

#### Scenario: Empty states translate

- GIVEN no expenses exist and locale is `en`
- WHEN the empty state renders
- THEN it shows "No expenses recorded" and "Start by adding your first expense"
- GIVEN locale is `es`
- THEN it shows "No hay gastos registrados" and "Comenzá agregando tu primer gasto"

---

### Requirement: Expense Form Translations

The `ExpenseForm` component MUST use `useTranslations('expenses')` and `useTranslations('common')`.

All form labels, placeholders, validation messages, dialog titles, and toast messages MUST be translated.

| UI Element | Translation Key |
|------------|-----------------|
| Dialog title (new) | `expenses.form.titleNew` |
| Dialog title (edit) | `expenses.form.titleEdit` |
| Dialog description (new) | `expenses.form.descNew` |
| Dialog description (edit) | `expenses.form.descEdit` |
| Date label | `expenses.form.date` |
| Date placeholder | `expenses.form.datePlaceholder` |
| Category label | `expenses.form.category` |
| Category placeholder (none) | `expenses.form.categoryEmpty` |
| Category placeholder (select) | `expenses.form.categoryPlaceholder` |
| "Add new category" button | `expenses.form.addCategory` |
| Description label | `expenses.form.description` |
| Description placeholder | `expenses.form.descriptionPlaceholder` |
| Provider/Place label | `expenses.form.provider` |
| Provider/Place placeholder | `expenses.form.providerPlaceholder` |
| Amount label | `expenses.form.amount` |
| Amount placeholder | `expenses.form.amountPlaceholder` |
| Payment Method label | `expenses.form.paymentMethod` |
| Payment Method placeholder | `expenses.form.paymentMethodPlaceholder` |
| Has Receipt label | `expenses.form.hasReceipt` |
| Has Receipt placeholder | `expenses.form.hasReceiptPlaceholder` |
| Receipt Number label | `expenses.form.receiptNumber` |
| Receipt Number placeholder | `expenses.form.receiptNumberPlaceholder` |
| Registered By label | `expenses.form.registeredBy` |
| Registered By placeholder | `expenses.form.registeredByPlaceholder` |
| Observations label | `expenses.form.observations` |
| Observations placeholder | `expenses.form.observationsPlaceholder` |
| Submit button (new) | `expenses.form.submitNew` |
| Submit button (edit) | `expenses.form.submitEdit` |
| Submitting state | `common.saving` |
| Toast: "Expense created" | `expenses.toast.created` |
| Toast: "Expense updated" | `expenses.toast.updated` |
| Validation: date required | `expenses.validation.dateRequired` |
| Validation: category required | `expenses.validation.categoryRequired` |
| Validation: provider required | `expenses.validation.providerRequired` |
| Validation: amount positive | `expenses.validation.amountPositive` |

Quick Category Dialog:
| UI Element | Translation Key |
|------------|-----------------|
| Dialog title | `categories.form.title` |
| Dialog description | `categories.form.desc` |
| Name label | `categories.form.name` |
| Name placeholder | `categories.form.namePlaceholder` |
| Create button | `categories.form.submit` |
| Creating state | `common.creating` |
| Toast: "Category created" | `categories.toast.created` |

#### Scenario: Expense form labels translate

- GIVEN locale is `en`
- WHEN the "New Expense" dialog opens
- THEN labels show "Date", "Category", "Description", "Provider / Place", "Amount ($)", "Payment Method", "Has Receipt", "Receipt #", "Recorded By", "Observations"
- GIVEN locale is `es`
- THEN labels show "Fecha", "Categoría", "Descripción", "Proveedor / Lugar", "Monto ($)", "Método de pago", "Tiene recibo", "N° de recibo", "Registrado por", "Observaciones"

#### Scenario: Payment method options translate

- GIVEN locale is `en`
- WHEN the payment method select opens
- THEN options show "Cash", "Transfer", "Card", "Credit", "Credit Note", "Other"
- GIVEN locale is `es`
- THEN options show "Efectivo", "Transferencia", "Tarjeta", "Crédito", "Abono", "Otro"

#### Scenario: Has Receipt options translate

- GIVEN locale is `en`
- WHEN the "Has Receipt" select opens
- THEN options show "Yes", "No"
- GIVEN locale is `es`
- THEN options show "Sí", "No"

#### Scenario: Registered By options translate

- GIVEN locale is `en`
- WHEN the "Registered By" select opens
- THEN options show "Ana Paula", "Leandro", "Mónica", "Lizeth", "Owner", "Other"
- GIVEN locale is `es`
- THEN options show "Ana Paula", "Leandro", "Mónica", "Lizeth", "Dueña", "Otro"

#### Scenario: Toast messages translate

- GIVEN an expense is created in `en`
- WHEN the toast appears
- THEN it shows "Expense created"
- GIVEN locale is `es`
- THEN it shows "Gasto creado"

---

### Requirement: Categories Management Translations

The `CategoryManager` component MUST use `useTranslations('categories')` and `useTranslations('common')`.

| UI Element | Translation Key |
|------------|-----------------|
| Dialog title | `categories.title` |
| Dialog description | `categories.description` |
| "New Category" label | `categories.form.newLabel` |
| Input placeholder | `categories.form.namePlaceholder` |
| Add button (icon) | `common.add` |
| Loading state | `common.loading` |
| Empty: "No categories created" | `categories.empty.none` |
| Empty: "Create your first category..." | `categories.empty.createFirst` |
| List item edit button | `common.edit` |
| List item delete button | `common.delete` |
| Rename save button | `common.save` |
| Rename cancel button | `common.cancel` |
| Delete dialog title | `categories.delete.title` |
| Delete dialog description | `categories.delete.description` |
| Delete confirm button | `categories.delete.confirm` |
| Toast: "Category created" | `categories.toast.created` |
| Toast: "Category renamed" | `categories.toast.renamed` |
| Toast: "Category deleted" | `categories.toast.deleted` |
| Error: "Failed to create" | `categories.error.create` |
| Error: "Failed to rename" | `categories.error.rename` |
| Error: "Failed to delete" | `categories.error.delete` |

Quick Category Dialog (from ExpenseForm):
| UI Element | Translation Key |
|------------|-----------------|
| Dialog title | `categories.quick.title` |
| Dialog description | `categories.quick.description` |
| Name label | `categories.quick.name` |
| Name placeholder | `categories.quick.namePlaceholder` |
| Create button | `categories.quick.submit` |
| Creating state | `common.creating` |

#### Scenario: Categories dialog translates

- GIVEN locale is `en`
- WHEN the Categories dialog opens
- THEN title shows "Manage Categories", description "Create, rename, and delete expense categories"
- GIVEN locale is `es`
- THEN title shows "Administrar categorías", description "Creá, renombrá y eliminá categorías de gastos"

#### Scenario: Category list empty state translates

- GIVEN no categories exist and locale is `en`
- WHEN the category list renders
- THEN it shows "No categories created" and "Create your first category to start organizing expenses"
- GIVEN locale is `es`
- THEN it shows "No hay categorías creadas" and "Creá tu primera categoría para empezar a organizar los gastos"

---

### Requirement: Admin Users Page Translations

The Admin Users page (`src/app/[locale]/admin/users/page.tsx`) and `CreateUserForm` component MUST use `useTranslations('users')` and `useTranslations('common')`.

**CRITICAL**: The current `CreateUserForm` is entirely in English (hardcoded). This inconsistency MUST be fixed — all text must be translatable.

| UI Element | Translation Key |
|------------|-----------------|
| Page title (h1) | `users.page.title` |
| Page subtitle | `users.page.subtitle` |
| Card title | `users.form.cardTitle` |
| Card description | `users.form.cardDescription` |
| Email label | `users.form.email` |
| Email placeholder | `users.form.emailPlaceholder` |
| Password label | `users.form.password` |
| Password placeholder | `users.form.passwordPlaceholder` |
| Display Name label | `users.form.displayName` |
| Display Name placeholder | `users.form.displayNamePlaceholder` |
| Role label | `users.form.role` |
| Role placeholder | `users.form.rolePlaceholder` |
| Role options: Super Admin | `users.roles.superAdmin` |
| Role options: Admin | `users.roles.admin` |
| Role options: User | `users.roles.user` |
| Submit button | `users.form.submit` |
| Submitting state | `common.creating` |
| Access denied title | `users.accessDenied.title` |
| Access denied description | `users.accessDenied.description` |
| Success message title | `users.toast.created` |
| Success message description | `users.toast.createdDesc` |
| Error: "Failed to create user" | `users.toast.createError` |
| Validation: Email required | `users.validation.emailRequired` |
| Validation: Invalid email | `users.validation.emailInvalid` |
| Validation: Password required | `users.validation.passwordRequired` |
| Validation: Password min 6 | `users.validation.passwordMin` |
| Validation: Display name required | `users.validation.displayNameRequired` |
| Validation: No permission for role | `users.validation.rolePermission` |

#### Scenario: Admin users form translates (fixes English-only bug)

- GIVEN locale is `en`
- WHEN the Create User form renders
- THEN all labels, placeholders, buttons show in English
- GIVEN locale is `es`
- WHEN the Create User form renders
- THEN all labels, placeholders, buttons show in Spanish (e.g., "Correo electrónico", "Contraseña", "Nombre visible", "Rol", "Crear usuario")

#### Scenario: Role options translate

- GIVEN locale is `en`
- WHEN the role select opens
- THEN options show "Super Admin", "Admin", "User"
- GIVEN locale is `es`
- THEN options show "Super Admin", "Admin", "Usuario" (or localized equivalents)

#### Scenario: Access denied message translates

- GIVEN a `user` role accesses `/admin/users` in `en`
- WHEN the access denied card renders
- THEN it shows "Access Denied" and "You do not have permission to create users."
- GIVEN locale is `es`
- THEN it shows "Acceso denegado" and "No tenés permiso para crear usuarios."

#### Scenario: Validation messages translate

- GIVEN locale is `en` and user submits empty form
- WHEN validation runs
- THEN errors show "Email is required", "Password is required", etc.
- GIVEN locale is `es`
- THEN errors show "El correo es obligatorio", "La contraseña es obligatoria", etc.

---

### Requirement: Currency Formatting via AWG Constant

All currency formatting MUST use the `CURRENCY` constant from `src/shared/lib/currency.ts` (value: `'AWG'`).

The `formatMonto` function (currently in `expense-table.tsx` using hardcoded `ARS` and `es-AR` locale) MUST be replaced with a shared utility that:
- Uses `Intl.NumberFormat` with the current locale (`en` → `en-AW`, `es` → `es-AW` or appropriate)
- Uses `CURRENCY` constant for currency code
- Supports `minimumFractionDigits: 2`

```ts
// src/shared/lib/currency.ts
export const CURRENCY = 'AWG' as const;

export function formatCurrency(amount: number, locale: string): string {
  const localeMap: Record<string, string> = {
    en: 'en-AW',
    es: 'es-AW',
  };
  return new Intl.NumberFormat(localeMap[locale] ?? locale, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
  }).format(amount);
}
```

(Previously: Hardcoded `ARS` and `es-AR` locale in `formatMonto`)

#### Scenario: Currency formats as AWG in English

- GIVEN amount is 1500.50 and locale is `en`
- WHEN `formatCurrency(amount, 'en')` is called
- THEN output is "AWG 1,500.50" (or equivalent en-AW format)

#### Scenario: Currency formats as AWG in Spanish

- GIVEN amount is 1500.50 and locale is `es`
- WHEN `formatCurrency(amount, 'es')` is called
- THEN output is "1.500,50 AWG" (or equivalent es-AW format)

#### Scenario: Changing CURRENCY constant updates all formatting

- GIVEN `CURRENCY` is changed from `'AWG'` to `'USD'`
- WHEN the app recompiles
- THEN all currency displays update to USD without code changes elsewhere

---

### Requirement: Date Formatting Locale-Aware

Date formatting MUST use the current locale instead of hardcoded `es` locale.

```ts
// Before: format(fecha, "dd/MM/yyyy", { locale: es })
// After: format(fecha, "PP", { locale: currentLocale }) // or locale-specific pattern
```

#### Scenario: Date formats per locale

- GIVEN a date of 2026-06-15 and locale is `en`
- WHEN formatted
- THEN output is "Jun 15, 2026" (or similar en-US/en-AW format)
- GIVEN locale is `es`
- THEN output is "15/06/2026" (or similar es-AR/es-AW format)

---

### Requirement: Common Translation Keys

The following common keys MUST exist in both locales for reuse across features:

| Key | English | Spanish |
|-----|---------|---------|
| `common.save` | Save | Guardar |
| `common.cancel` | Cancel | Cancelar |
| `common.delete` | Delete | Eliminar |
| `common.edit` | Edit | Editar |
| `common.add` | Add | Agregar |
| `common.create` | Create | Crear |
| `common.update` | Update | Actualizar |
| `common.search` | Search | Buscar |
| `common.filter` | Filter | Filtrar |
| `common.clearFilters` | Clear filters | Limpiar filtros |
| `common.all` | All | Todas / Todos |
| `common.loading` | Loading... | Cargando... |
| `common.saving` | Saving... | Guardando... |
| `common.creating` | Creating... | Creando... |
| `common.previous` | Previous | Anterior |
| `common.next` | Next | Siguiente |
| `common.pageOf` | Page {page} of {total} | Página {page} de {total} |
| `common.rowsPerPage` | Rows per page | Filas por página |
| `common.signOut` | Sign out | Cerrar sesión |
| `common.openMenu` | Open menu | Abrir menú |
| `common.yes` | Yes | Sí |
| `common.no` | No | No |

#### Scenario: Common keys used across features

- GIVEN the expenses table uses `common.delete`
- AND the categories dialog uses `common.delete`
- AND the user menu uses `common.signOut`
- WHEN locale changes
- THEN all three update consistently from the same source

---

## MODIFIED Requirements

### Requirement: Expense Table Currency Column

The "Monto" column in `ExpenseTable` MUST use the new `formatCurrency` utility with the `CURRENCY` constant instead of the hardcoded `formatMonto` using ARS.

(Previously: `formatMonto` used `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`)

#### Scenario: Amount column shows AWG

- GIVEN an expense with monto 2500.75
- WHEN the table renders in any locale
- THEN the amount column shows the value formatted in AWG
- AND the format respects the current locale (decimal/thousand separators)

---

### Requirement: Payment Methods Array as Translatable Keys

The `PaymentMethods` array in `src/features/expenses/types/index.ts` MUST be updated so each method has a translation key, OR the array values become translation keys resolved at render time.

Option A (preferred): Keep array as keys, resolve via `t('expenses.paymentMethods.' + method)`
Option B: Store translation keys in the type definition.

```ts
// Option A approach:
export const PaymentMethods = [
  'cash',
  'transfer',
  'card',
  'credit',
  'creditNote',
  'other',
] as const;

// Dictionary:
expenses: {
  paymentMethods: {
    cash: 'Cash',
    transfer: 'Transfer',
    card: 'Card',
    credit: 'Credit',
    creditNote: 'Credit Note',
    other: 'Other',
  }
}
```

(Previously: Array contained Spanish display strings: "Efectivo", "Transferencia", etc.)

#### Scenario: Payment method select shows translated options

- GIVEN locale is `en`
- WHEN the payment method select renders
- THEN each option is rendered via `t('expenses.paymentMethods.cash')`, etc.
- GIVEN locale is `es`
- THEN each option shows Spanish translation

---

### Requirement: Registered By Values as Translatable Keys

The `RegisteredByValues` array MUST follow the same pattern as Payment Methods — use keys resolved at render time.

```ts
export const RegisteredByValues = [
  'anaPaula',
  'leandro',
  'monica',
  'lizeth',
  'owner',
  'other',
] as const;
```

(Previously: Array contained mixed Spanish/English display strings)

---

### Requirement: Si/No Values as Translatable Keys

The `SiNoValues` array MUST use keys resolved at render time.

```ts
export const SiNoValues = ['yes', 'no'] as const;
```

(Previously: `['Sí', 'No']` — Spanish only)

---

## REMOVED Requirements

### Requirement: Hardcoded Spanish-Only Expense Table

(Reason: All UI text moved to translation dictionaries)
(Migration: `formatMonto` → `formatCurrency`; column headers → `t('expenses.columns.*')`; filters → `t('expenses.filters.*')`; actions → `t('common.*')`; dialogs → `t('expenses.delete.*')`; toasts → `t('expenses.toast.*')`)

### Requirement: Hardcoded Spanish-Only Expense Form

(Reason: All labels, placeholders, validation, toasts moved to dictionaries)
(Migration: Every string literal in `ExpenseForm` and `QuickCategoryDialog` replaced with `t()` calls)

### Requirement: Hardcoded Spanish-Only Category Manager

(Reason: All UI text moved to `categories` namespace)
(Migration: Every string literal replaced with `t()` calls)

### Requirement: Hardcoded English-Only Admin Users Form

(Reason: All UI text moved to `users` namespace — fixes inconsistency)
(Migration: Every string literal in `CreateUserForm` replaced with `t()` calls)

### Requirement: Hardcoded ARS Currency and es-AR Locale

(Reason: Replaced by configurable `CURRENCY = 'AWG'` constant and locale-aware formatting)
(Migration: `formatMonto` → `formatCurrency(amount, locale)`; `currency: 'ARS'` → `currency: CURRENCY`)

### Requirement: Hardcoded Spanish Date Locale

(Reason: Date formatting now uses current locale)
(Migration: `format(fecha, 'dd/MM/yyyy', { locale: es })` → `format(fecha, 'PP', { locale: currentLocale })`)