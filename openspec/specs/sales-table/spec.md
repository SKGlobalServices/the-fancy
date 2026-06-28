# Sales Table Specification

## Purpose

Defines the TanStack Table view for browsing, filtering, sorting, and paginating sales records. Default view shows today's sales.

## Requirements

### Requirement: Default Filter — Today

When the sales page loads, the table MUST display only sales from the current date.

#### Scenario: Today filter on initial load

- GIVEN sales exist from today and yesterday
- WHEN the user navigates to /dashboard/ventas
- THEN only today's sales are displayed

---

### Requirement: Date Range Filter

The user MUST be able to filter sales by a custom date range using a date picker.

#### Scenario: Filter by date range

- GIVEN sales on June 1, June 15, and June 30
- WHEN the user sets date range June 10 to June 20
- THEN only the June 15 sale is displayed

---

### Requirement: Filter Controls

The table MUST provide the following independent filters:

| Filter | Type | Default |
|--------|------|---------|
| Date range | Date picker | Today |
| Employee | Select (active employees) | All |
| Client | Searchable select | All |
| Service area | Select | All |
| Payment method | Select | All |
| Credit flag | Toggle (all/credit/non-credit) | All |
| Show deleted | Toggle | Off |

#### Scenario: Multiple filters combine

- GIVEN 50 sales across different employees and dates
- WHEN the user selects employee "Anna" AND date range "June 1-15"
- THEN only Anna's sales from June 1-15 are shown

#### Scenario: Show deleted reveals soft-deleted sales

- GIVEN a soft-deleted sale
- WHEN the user toggles "Show deleted" on
- THEN the deleted sale appears with a visual indicator (e.g. strikethrough)

---

### Requirement: Sort and Pagination

The table MUST sort by date descending by default and paginate with 25 rows per page.

#### Scenario: Default sort by date desc

- GIVEN sales on June 15, June 10, June 20
- WHEN the table loads
- THEN the order is June 20, June 15, June 10

#### Scenario: Pagination with 25 rows

- GIVEN 50 sales match the current filter
- WHEN the table renders
- THEN page 1 shows rows 1-25
- AND page controls show 2 pages

---

### Requirement: Column Visibility

The table MUST show these columns by default:

| Column | Source |
|--------|--------|
| Date | `date` |
| Client | `clientName` (denormalized) |
| Employee | `employeeName` (denormalized) |
| Service | `serviceTypeName` (denormalized) |
| Amount | `amount` formatted as AWG |
| Payment | `paymentMethod` + fee % |
| Credit | `isCredit` badge |
| Actions | Edit / Delete buttons |
