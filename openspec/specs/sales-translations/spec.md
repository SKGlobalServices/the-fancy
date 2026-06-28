# Sales Translations Specification

## Purpose

Defines the i18n translation keys for the sales module. All keys live under the `sales` namespace in both en.json and es.json.

## Requirements

### Requirement: Sales Namespace Structure

The `sales` namespace MUST contain the following key groups:

| Group | Purpose | Example Key |
|-------|---------|-------------|
| `title` | Page and section titles | `sales.title` |
| `form.*` | Sale creation/edit form labels | `sales.form.client` |
| `table.*` | Table column headers | `sales.table.date` |
| `filters.*` | Filter labels and placeholders | `sales.filters.dateRange` |
| `validation.*` | Form validation messages | `sales.validation.clientRequired` |
| `client.*` | Client catalog UI | `sales.client.create` |
| `employee.*` | Employee catalog UI | `sales.employee.create` |
| `service.*` | Service catalog UI | `sales.service.create` |
| `payment.*` | Payment method labels | `sales.payment.cash` |
| `actions.*` | Button labels | `sales.actions.create` |
| `credit.*` | Credit-related labels | `sales.credit.yes` |

#### Scenario: All sales keys exist in en.json

- GIVEN the en.json dictionary
- WHEN checking the `sales` namespace
- THEN every key from the required groups exists with a non-empty string value

#### Scenario: Matching keys in es.json

- GIVEN the keys defined in en.json `sales` namespace
- WHEN checking es.json
- THEN every key from en.json `sales` exists in es.json `sales`
- AND no es.json `sales` key is an orphan (absent from en.json)

---

### Requirement: Payment Method Translations

Each payment method MUST have a human-readable label in both locales:

| Key | en | es |
|-----|----|----|
| `payment.cash` | Cash | Efectivo |
| `payment.transfer` | Transfer | Transferencia |
| `payment.localCard` | Local Card (1.5%) | Tarjeta local (1.5%) |
| `payment.creditCard` | Credit Card (4%) | Tarjeta crédito (4%) |
| `payment.paymentLink` | Payment Link (4%) | Link de pago (4%) |

#### Scenario: Payment labels include fee percentage

- GIVEN the payment method selector in the sale form
- WHEN the user opens the dropdown
- THEN each card/link option shows its fee percentage inline
