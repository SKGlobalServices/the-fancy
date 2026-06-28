# Service Catalog Specification

## Purpose

Defines configurable service areas and service types with prices. Areas group related services. The `isMakeup` flag distinguishes owner makeup services.

## Requirements

### Requirement: Service Area Fields

A Service Area record MUST contain:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Firestore document ID |
| `name` | string | Yes | Area name (e.g. "Hair", "Nails", "Makeup") |
| `sortOrder` | number | Yes | Display order |
| `deletedAt` | Timestamp | No | Soft delete |

#### Scenario: Service area created

- GIVEN a user enters a new area name "Hair"
- WHEN the form is submitted
- THEN the area is created with default `sortOrder`

#### Scenario: Areas ordered by sortOrder

- GIVEN areas "Nails" (order 2) and "Hair" (order 1)
- WHEN the area selector loads
- THEN "Hair" appears before "Nails"

---

### Requirement: Service Type Fields

A Service Type record MUST contain:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Firestore document ID |
| `name` | string | Yes | Service name (e.g. "Manicure", "Blowout") |
| `areaId` | string | Yes | Reference to parent Service Area |
| `price` | number | Yes | Current service price in AWG |
| `isMakeup` | boolean | Yes | True if this is an owner makeup service |
| `deletedAt` | Timestamp | No | Soft delete |

#### Scenario: Service type created under area

- GIVEN area "Hair" exists
- WHEN a user creates "Blowout" with price 7500 under "Hair"
- THEN the service type is created with `areaId` pointing to "Hair"
- AND `isMakeup` defaults to false

#### Scenario: Makeup service type flagged

- GIVEN a user creates a service type "Full Face Makeup"
- WHEN `isMakeup` is set to true
- THEN the service type is marked as makeup

#### Scenario: Service type price updated

- GIVEN a service type "Blowout" with price 7500
- WHEN the price is changed to 8000
- THEN the service type's price is updated
- AND historical sales keep their original amount

#### Scenario: Service type soft deleted

- GIVEN a service type with existing sales
- WHEN the service type is deleted
- THEN historical sales retain their `serviceTypeId` reference
- AND the service type is excluded from new sale forms

---

### Requirement: Service Types by Area

The system MUST provide a query for all active types within a specific area, ordered by name.

#### Scenario: Types filtered by area

- GIVEN area "Nails" has types "Manicure" and "Pedicure"
- GIVEN area "Hair" has type "Blowout"
- WHEN the user selects area "Nails"
- THEN only "Manicure" and "Pedicure" appear in the type selector
