# Expense Registry Specification

## Purpose

This specification defines the Firestore-backed expense CRUD capability with soft delete, Zod validation, real-time snapshots, and audit timestamps. It serves as the data layer for all expense operations in the Gastos feature.

## Requirements

### Requirement: Create Expense

The system MUST create a new expense document in Firestore with validated fields, audit timestamps, and the authenticated user's UID.

#### Scenario: Valid expense creation

- GIVEN the user is authenticated
- AND the form contains valid data: descripcion (non-empty string), monto (positive number), fecha (valid date), categoria (existing category name), metodoPago (valid payment method), proveedorLugar (non-empty string)
- WHEN the user submits the expense form
- THEN the system creates a Firestore document in `expenses` collection with fields: descripcion, monto, fecha, categoria, metodoPago, proveedorLugar, observaciones (optional), createdAt (server timestamp), updatedAt (server timestamp), deletedAt (null), createdBy (user UID)
- AND the system returns the created expense with its document ID

#### Scenario: Invalid expense data rejected

- GIVEN the user is authenticated
- AND the form contains invalid data: monto <= 0, OR descripcion is empty, OR fecha is missing, OR categoria is not in catalog
- WHEN the user submits the expense form
- THEN the system rejects the submission
- AND the system returns Zod validation errors for each invalid field
- AND the form displays inline error messages per field
- AND no Firestore document is created

### Requirement: Read Expense List (Real-time)

The system MUST provide a real-time stream of non-deleted expenses ordered by fecha descending.

#### Scenario: List expenses with data

- GIVEN the user is authenticated
- AND there are expenses in Firestore with deletedAt == null
- WHEN the system subscribes to the expenses collection with where(deletedAt, '==', null) ordered by fecha desc
- THEN the system emits an array of expense objects matching the query
- AND each expense includes all fields plus document ID
- AND updates are pushed in real-time via onSnapshot

#### Scenario: List expenses empty state

- GIVEN the user is authenticated
- AND no expenses exist with deletedAt == null
- WHEN the system subscribes to the expenses query
- THEN the system emits an empty array
- AND the UI shows "No hay gastos registrados"

### Requirement: Update Expense

The system MUST update an existing non-deleted expense with validated fields and update the updatedAt timestamp.

#### Scenario: Valid expense update

- GIVEN the user is authenticated
- AND an expense exists with deletedAt == null
- AND the form contains valid updated data
- WHEN the user submits the update
- THEN the system updates the Firestore document with new field values
- AND updatedAt is set to server timestamp
- AND deletedAt remains null
- AND the real-time stream emits the updated expense

#### Scenario: Update rejected for invalid data

- GIVEN the user is authenticated
- AND an expense exists with deletedAt == null
- AND the form contains invalid data (monto <= 0, empty required fields)
- WHEN the user submits the update
- THEN the system rejects the update
- AND Zod validation errors are returned and displayed inline
- AND the original expense remains unchanged in Firestore

#### Scenario: Update rejected for deleted expense

- GIVEN the user is authenticated
- AND an expense exists with deletedAt != null
- WHEN the user attempts to update it
- THEN the system rejects the update
- AND returns an error indicating the expense was deleted

### Requirement: Soft Delete Expense

The system MUST soft delete an expense by setting deletedAt to server timestamp without removing the document.

#### Scenario: Soft delete expense

- GIVEN the user is authenticated
- AND an expense exists with deletedAt == null
- WHEN the user confirms deletion
- THEN the system sets deletedAt to server timestamp on the document
- AND updatedAt is set to server timestamp
- AND the expense no longer appears in the real-time stream (filtered by deletedAt == null)
- AND the document remains in Firestore for audit/restore

#### Scenario: Soft delete already deleted expense

- GIVEN the user is authenticated
- AND an expense exists with deletedAt != null
- WHEN the user attempts to delete it again
- THEN the system returns an error indicating already deleted
- AND the document remains unchanged

### Requirement: Restore Deleted Expense

The system MUST restore a soft-deleted expense by setting deletedAt back to null.

#### Scenario: Restore deleted expense

- GIVEN the user is authenticated
- AND an expense exists with deletedAt != null
- WHEN the user restores the expense
- THEN the system sets deletedAt to null
- AND updatedAt is set to server timestamp
- AND the expense reappears in the real-time stream
- AND all original field values are preserved

### Requirement: Error Handling and Propagation

The system MUST propagate Firestore errors to the UI layer with user-friendly messages.

#### Scenario: Firestore permission denied

- GIVEN the user is authenticated
- AND a Firestore operation fails with permission-denied
- WHEN the operation completes
- THEN the system catches the error
- AND returns a user-friendly message: "No tienes permisos para realizar esta acción"
- AND the error is displayed via toast notification

#### Scenario: Firestore network error

- GIVEN the user is authenticated
- AND a Firestore operation fails with unavailable/deadline-exceeded
- WHEN the operation completes
- THEN the system catches the error
- AND returns a user-friendly message: "Error de conexión. Intenta de nuevo."
- AND the error is displayed via toast notification

#### Scenario: Validation error propagation

- GIVEN the user submits invalid form data
- WHEN Zod validation fails
- THEN the system returns structured field-level errors
- AND the form displays each error inline below its field
- AND submit button remains enabled for correction