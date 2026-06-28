# Client Catalog Specification

## Purpose

Defines the Client entity CRUD for basic client registration. Designed for future extraction into a dedicated client module with full history tracking.

## Requirements

### Requirement: Client Entity Fields

A Client record MUST contain the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Firestore document ID |
| `name` | string | Yes | Client full name |
| `phone` | string | No | Contact phone number |
| `notes` | string | No | Free text observations |
| `createdAt` | Timestamp | Yes | Server timestamp |
| `updatedAt` | Timestamp | Yes | Server timestamp |
| `deletedAt` | Timestamp | No | Soft delete timestamp |

#### Scenario: Client created with required fields

- GIVEN a user fills the client form with name only
- WHEN the form is submitted
- THEN a Client document is created in Firestore
- AND `name` is saved as provided
- AND `phone` and `notes` are null

#### Scenario: Client created with all fields

- GIVEN a user fills name, phone, and notes
- WHEN the form is submitted
- THEN all fields are persisted

#### Scenario: Client soft deleted

- GIVEN an existing client
- WHEN the user deletes the client
- THEN `deletedAt` is set to current server timestamp
- AND the client is excluded from default selectors

#### Scenario: Duplicate client name allowed

- GIVEN a client "Maria" already exists
- WHEN a new client "Maria" is created
- THEN the creation succeeds (no unique constraint on name)

---

### Requirement: Client List and Search

The system MUST provide a searchable list of active clients (`deletedAt == null`).

#### Scenario: Search by name fragment

- GIVEN clients "Maria", "Marta", and "Juan"
- WHEN the user searches for "Mar"
- THEN "Maria" and "Marta" appear in results
- AND "Juan" does not appear

---

### Requirement: Modular Structure for Future Extraction

Client types, services, and components MUST be structured within `src/features/sales/` but organized so they can be extracted to `src/features/clients/` without rewriting.

#### Scenario: Client types in dedicated file

- GIVEN the sales feature module
- WHEN a developer inspects the types
- THEN client types are in `types/client.ts` (not mixed with sale types)

#### Scenario: Client components importable independently

- GIVEN the client list component
- WHEN another module needs it
- THEN it can be imported from `src/features/sales/components/client-list.tsx` without importing sale components
