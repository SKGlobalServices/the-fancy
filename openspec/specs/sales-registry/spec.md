# Sales Registry Specification

## Purpose

Defines the Sale entity CRUD operations with real-time Firestore synchronization, Zod validation, credit flag, and payment fee percentage fields. Mirrors the expenses module pattern for consistency.

---

## Requirements

### Requirement: Sale Entity Fields

A Sale record MUST contain the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Firestore document ID |
| `date` | Timestamp | Yes | Service date |
| `clientId` | string | Yes | Reference to client |
| `employeeId` | string | Yes | Reference to employee |
| `serviceAreaId` | string | Yes | Reference to service area |
| `serviceTypeId` | string | Yes | Reference to service type |
| `amount` | number | Yes | Price read from service type catalog |
| `paymentMethod` | string | Yes | One of: cash, transfer, localCard, creditCard, paymentLink |
| `paymentFeePct` | number | Yes | Fee % based on payment method (0, 1.5, 4, 4) |
| `isCredit` | boolean | Yes | True if client pays end-of-month |
| `isMakeup` | boolean | Yes | Derived from service type `isMakeup` flag |
| `observations` | string | No | Free text notes |
| `createdBy` | string | Yes | User UID |
| `createdAt` | Timestamp | Yes | Server timestamp |
| `updatedAt` | Timestamp | Yes | Server timestamp |
| `deletedAt` | Timestamp | No | Soft delete timestamp |

#### Scenario: Sale created with all required fields

- GIVEN a user fills the sale form with valid data
- WHEN the form is submitted
- THEN a Sale document is created in Firestore with all fields populated
- AND `amount` is auto-filled from the selected service type
- AND `paymentFeePct` is auto-filled based on payment method
- AND `isMakeup` is derived from the service type's `isMakeup` flag
- AND `createdBy` is set to current user UID
- AND `createdAt`/`updatedAt` are server timestamps

#### Scenario: Sale created with credit flag

- GIVEN a user creates a sale with `isCredit` = true
- WHEN the sale is saved
- THEN `isCredit` persists as true
- AND the sale is included in future "cuentas por cobrar" queries (out of scope)

#### Scenario: Sale soft deleted

- GIVEN a user deletes a sale
- WHEN the delete action confirms
- THEN `deletedAt` is set to current server timestamp
- AND the sale is excluded from default queries
- AND the sale data remains in Firestore for recovery

---

### Requirement: Zod Validation Schema

A Zod schema MUST validate all Sale fields at the API/form boundary:

```ts
export const SaleSchema = z.object({
  date: z.date({ required_error: 'sales.validation.dateRequired' }),
  clientId: z.string().min(1, { message: 'sales.validation.clientRequired' }),
  employeeId: z.string().min(1, { message: 'sales.validation.employeeRequired' }),
  serviceAreaId: z.string().min(1, { message: 'sales.validation.serviceAreaRequired' }),
  serviceTypeId: z.string().min(1, { message: 'sales.validation.serviceTypeRequired' }),
  paymentMethod: z.enum(['cash', 'transfer', 'localCard', 'creditCard', 'paymentLink']),
  isCredit: z.boolean(),
  observations: z.string().optional(),
});
```

The schema MUST NOT include `amount`, `paymentFeePct`, `isMakeup` — these are derived server-side.

#### Scenario: Valid sale passes validation

- GIVEN a sale object with all required fields
- WHEN `SaleSchema.safeParse()` is called
- THEN `success` is true

#### Scenario: Missing clientId fails validation

- GIVEN a sale object without `clientId`
- WHEN `SaleSchema.safeParse()` is called
- THEN `success` is false
- AND error message key is `sales.validation.clientRequired`

#### Scenario: Invalid payment method fails validation

- GIVEN a sale object with `paymentMethod: 'crypto'`
- WHEN `SaleSchema.safeParse()` is called
- THEN `success` is false
- AND error contains the invalid enum value

---

### Requirement: Payment Fee Percentage Mapping

The system MUST assign `paymentFeePct` automatically based on `paymentMethod`:

| Payment Method | Fee % |
|----------------|-------|
| `cash` | 0 |
| `transfer` | 0 |
| `localCard` | 1.5 |
| `creditCard` | 4 |
| `paymentLink` | 4 |

This mapping MUST be defined in a single constant and used both client-side (form preview) and server-side (write).

#### Scenario: Cash payment has zero fee

- GIVEN a sale with `paymentMethod: 'cash'`
- WHEN the sale is created
- THEN `paymentFeePct` is 0

#### Scenario: Credit card payment has 4% fee

- GIVEN a sale with `paymentMethod: 'creditCard'`
- WHEN the sale is created
- THEN `paymentFeePct` is 4

#### Scenario: Fee mapping change only affects new sales

- GIVEN the fee for `localCard` changes from 1.5 to 2.0
- WHEN existing sales are read
- THEN their original `paymentFeePct` (1.5) is preserved
- AND new sales get the updated fee (2.0)

---

### Requirement: Real-time Firestore Sync

Sale CRUD operations MUST use Firestore `onSnapshot` listeners for real-time updates across clients.

- Create: `addDoc` to `sales` collection
- Read: `onSnapshot` with `where('deletedAt', '==', null)` and date range filter
- Update: `updateDoc` with `updatedAt: serverTimestamp()`
- Soft Delete: `updateDoc` with `deletedAt: serverTimestamp()`

#### Scenario: Real-time update reflects across tabs

- GIVEN two browser tabs open to the sales table
- WHEN a sale is created in tab A
- THEN tab B receives the new sale within 500ms without refresh

#### Scenario: Soft delete removes from live view

- GIVEN a sale is visible in the table
- WHEN the sale is soft-deleted
- THEN the sale disappears from the table within 500ms
- AND `showDeleted` toggle can restore visibility

---

### Requirement: Sale Amount Derived from Catalog

The `amount` field MUST be read from the selected service type's `price` field at creation time. Users MUST NOT enter the amount manually.

#### Scenario: Amount auto-filled from service type

- GIVEN a user selects a service type with price 5000
- WHEN the service type selection changes
- THEN the amount field displays 5000 (read-only)
- AND the saved sale has `amount: 5000`

#### Scenario: Price change does not affect historical sales

- GIVEN a service type price changes from 5000 to 5500
- WHEN existing sales are viewed
- THEN their `amount` remains 5000
- AND new sales use the new price 5500

---

### Requirement: isMakeup Flag Derived from Service Type

The `isMakeup` field on a sale MUST be copied from the service type's `isMakeup` boolean at creation time.

#### Scenario: Makeup service type creates makeup sale

- GIVEN a service type has `isMakeup: true`
- WHEN a sale is created with that service type
- THEN the sale has `isMakeup: true`

#### Scenario: Regular service type creates non-makeup sale

- GIVEN a service type has `isMakeup: false`
- WHEN a sale is created with that service type
- THEN the sale has `isMakeup: false`

---

### Requirement: Created By User Tracking

Every sale MUST have `createdBy` set to the authenticated user's UID at creation time. This field MUST NOT be editable.

#### Scenario: Sale records creating user

- GIVEN user with UID `abc123` creates a sale
- WHEN the sale is saved
- THEN `createdBy` equals `abc123`

#### Scenario: Created by not editable

- GIVEN an existing sale
- WHEN a different user edits the sale
- THEN `createdBy` remains the original creator's UID