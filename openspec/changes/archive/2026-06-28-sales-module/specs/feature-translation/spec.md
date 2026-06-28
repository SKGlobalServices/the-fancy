# Delta for Feature Translation

## ADDED Requirements

### Requirement: Sales Translation Namespace

A new `sales` namespace MUST exist in both `en.json` and `es.json` with keys covering the sales module UI, forms, tables, filters, catalogs (clients, employees, services), payment methods with fee percentages, and credit flags.

Key groups:

| Group | Purpose |
|-------|---------|
| `sales.title` | Page and section titles |
| `sales.form.*` | Sale creation/edit form labels |
| `sales.table.*` | Table column headers |
| `sales.filters.*` | Filter labels and placeholders |
| `sales.validation.*` | Form validation messages |
| `sales.client.*` | Client catalog UI |
| `sales.employee.*` | Employee catalog UI |
| `sales.service.*` | Service catalog UI |
| `sales.payment.*` | Payment method labels with fee % |
| `sales.actions.*` | Button labels |
| `sales.credit.*` | Credit-related labels |

#### Scenario: Sales keys exist in both locales

- GIVEN the en.json dictionary has `sales` namespace with all required keys
- WHEN checking es.json
- THEN every key from en.json `sales` exists in es.json `sales`
- AND no orphan keys exist in es.json

#### Scenario: Payment method labels include fee

- GIVEN a payment method key `sales.payment.localCard`
- WHEN rendered in the sale form
- THEN it displays as "Local Card (1.5%)" in English and "Tarjeta local (1.5%)" in Spanish
