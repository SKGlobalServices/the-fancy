# Employee Catalog Specification

## Purpose

Defines the Employee entity CRUD with Firestore persistence. Replaces the current hardcoded `RegisteredByValues` in the expenses module.

## Requirements

### Requirement: Employee Entity Fields

An Employee record MUST contain:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Firestore document ID |
| `name` | string | Yes | Employee full name |
| `phone` | string | No | Contact phone |
| `isActive` | boolean | Yes | Whether currently employed |
| `createdAt` | Timestamp | Yes | Server timestamp |
| `updatedAt` | Timestamp | Yes | Server timestamp |
| `deletedAt` | Timestamp | No | Soft delete timestamp |

#### Scenario: Employee created

- GIVEN a user fills name and phone for a new employee
- WHEN the form is submitted
- THEN the employee is created with `isActive: true`

#### Scenario: Employee deactivated

- GIVEN an active employee
- WHEN the user sets `isActive` to false
- THEN the employee is excluded from active employee selectors
- AND existing sales still show their historical employee name

#### Scenario: Employee soft deleted

- GIVEN an existing employee
- WHEN the user deletes the employee
- THEN `deletedAt` is set
- AND the employee is excluded from all active queries

---

### Requirement: Active Employee List

The system MUST provide a real-time list of active employees (`isActive == true && deletedAt == null`), ordered by name.

#### Scenario: Active employees ordered alphabetically

- GIVEN employees "Zara" and "Anna", both active
- WHEN the active employee selector loads
- THEN "Anna" appears before "Zara"

---

### Requirement: Employee Reference Denormalization

When a sale references an employee, the employee's `name` MUST be copied into the sale record at creation time to preserve historical display even if the employee is later deactivated or renamed.

#### Scenario: Historical name preserved after rename

- GIVEN a sale references employee "Anna" (name copied at creation)
- WHEN the employee is renamed to "Anna Smith"
- THEN the sale still shows "Anna" in its denormalized `employeeName` field
