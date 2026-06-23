# Expense Table Specification

## Purpose

This specification defines the TanStack Table v8 implementation for displaying expenses with global search, column filtering, sorting, and pagination. The table consumes the real-time expense stream from the expense-registry and provides a complete data grid experience for the Gastos page.

## Requirements

### Requirement: Global Search

The system MUST filter the displayed expenses by a global search string matching across multiple text fields.

#### Scenario: Search matches descripcion

- GIVEN the table displays expenses
- AND the user types "proveedor" in the global search input
- WHEN the search is applied
- THEN only expenses where descripcion contains "proveedor" (case-insensitive) are shown
- AND the row count updates accordingly

#### Scenario: Search matches proveedorLugar

- GIVEN the table displays expenses
- AND the user types "farmacia" in the global search input
- WHEN the search is applied
- THEN only expenses where proveedorLugar contains "farmacia" (case-insensitive) are shown

#### Scenario: Search matches categoria

- GIVEN the table displays expenses
- AND the user types "insumos" in the global search input
- WHEN the search is applied
- THEN only expenses where categoria contains "insumos" (case-insensitive) are shown

#### Scenario: Search matches observaciones

- GIVEN the table displays expenses
- AND the user types "urgente" in the global search input
- WHEN the search is applied
- THEN only expenses where observaciones contains "urgente" (case-insensitive) are shown

#### Scenario: Search combines with other filters

- GIVEN the user has applied a date range filter
- AND the user types in global search
- WHEN both filters are active
- THEN results match BOTH the date range AND the search term (AND logic)

#### Scenario: Clear search

- GIVEN the user has entered a search term
- WHEN the user clears the search input
- THEN all expenses matching other active filters are shown

### Requirement: Column Sorting

The system MUST support sorting by fecha, categoria, and monto columns with three states: ascending, descending, none.

#### Scenario: Sort by fecha ascending

- GIVEN the table displays expenses
- WHEN the user clicks the fecha column header once
- THEN expenses sort by fecha ascending (oldest first)
- AND the sort indicator shows ascending arrow

#### Scenario: Sort by fecha descending

- GIVEN the table is sorted by fecha ascending
- WHEN the user clicks the fecha column header again
- THEN expenses sort by fecha descending (newest first)
- AND the sort indicator shows descending arrow

#### Scenario: Sort by categoria

- GIVEN the table displays expenses
- WHEN the user clicks the categoria column header
- THEN expenses sort by categoria alphabetically
- AND clicking again reverses the order

#### Scenario: Sort by monto

- GIVEN the table displays expenses
- WHEN the user clicks the monto column header
- THEN expenses sort by monto numerically
- AND clicking again reverses the order

#### Scenario: Sort resets to none

- GIVEN the table is sorted by a column
- WHEN the user clicks the same column header a third time
- THEN sorting resets to default (fecha descending)
- AND no sort indicator is shown

#### Scenario: Sort persists with filters

- GIVEN the user has applied a category filter
- AND the user sorts by monto
- WHEN both are active
- THEN results are filtered by category THEN sorted by monto

### Requirement: Date Range Filter

The system MUST filter expenses by a from/to date range using date pickers.

#### Scenario: Filter by from date only

- GIVEN the table displays expenses
- WHEN the user selects a "from" date (e.g., 2025-01-01) and leaves "to" empty
- THEN only expenses with fecha >= from date are shown

#### Scenario: Filter by to date only

- GIVEN the table displays expenses
- WHEN the user selects a "to" date (e.g., 2025-12-31) and leaves "from" empty
- THEN only expenses with fecha <= to date are shown

#### Scenario: Filter by from and to dates

- GIVEN the table displays expenses
- WHEN the user selects both from (2025-01-01) and to (2025-06-30) dates
- THEN only expenses with fecha between from and to (inclusive) are shown

#### Scenario: Clear date range filter

- GIVEN a date range filter is active
- WHEN the user clicks "Limpiar" on the date filter
- THEN the date range filter is removed
- AND all expenses matching other active filters are shown

#### Scenario: Date filter combines with search and category

- GIVEN the user has active search term and category filter
- WHEN the user applies a date range
- THEN results match ALL three filters (AND logic)

### Requirement: Category Filter

The system MUST filter expenses by selected category via dropdown.

#### Scenario: Filter by single category

- GIVEN the table displays expenses
- WHEN the user selects "Insumos" from the category dropdown
- THEN only expenses with categoria === "Insumos" are shown

#### Scenario: Clear category filter

- GIVEN a category filter is active
- WHEN the user selects "Todas" or clears the dropdown
- THEN the category filter is removed
- AND all expenses matching other active filters are shown

#### Scenario: Category filter updates with catalog changes

- GIVEN the category catalog is updated (new category added)
- WHEN the user opens the category dropdown
- THEN the new category appears as an option
- AND if the new category was assigned to expenses, those expenses can be filtered

### Requirement: Payment Method Filter

The system MUST filter expenses by selected payment method via dropdown.

#### Scenario: Filter by payment method

- GIVEN the table displays expenses
- WHEN the user selects "Efectivo" from the payment method dropdown
- THEN only expenses with metodoPago === "Efectivo" are shown

#### Scenario: Clear payment method filter

- GIVEN a payment method filter is active
- WHEN the user selects "Todos" or clears the dropdown
- THEN the payment method filter is removed
- AND all expenses matching other active filters are shown

### Requirement: Pagination

The system MUST paginate results with configurable page size (10, 20, 50) and page navigation.

#### Scenario: Default page size

- GIVEN the table loads
- WHEN no page size is explicitly set
- THEN page size defaults to 10
- AND the page size selector shows 10 as selected

#### Scenario: Change page size

- GIVEN the table displays expenses
- WHEN the user selects 20 from the page size selector
- THEN the table shows 20 rows per page
- AND the current page resets to page 1
- AND the total page count recalculates

#### Scenario: Navigate to next page

- GIVEN the table has more than one page
- WHEN the user clicks "Siguiente" (next page)
- THEN the table displays the next page of results
- AND the page indicator updates

#### Scenario: Navigate to previous page

- GIVEN the table is on page 2 or later
- WHEN the user clicks "Anterior" (previous page)
- THEN the table displays the previous page of results

#### Scenario: Jump to specific page

- GIVEN the table has multiple pages
- WHEN the user enters a page number and presses Enter
- THEN the table navigates to that page (clamped to valid range)

#### Scenario: Pagination resets on filter change

- GIVEN the user is on page 3
- WHEN any filter (search, date, category, payment method) changes
- THEN the table resets to page 1
- AND results reflect the new filter state

### Requirement: Empty State

The system MUST display a helpful empty state when no expenses match the current filters.

#### Scenario: No expenses in database

- GIVEN the user has no expenses in Firestore
- WHEN the table loads
- THEN the table body shows "No hay gastos registrados"
- AND a CTA button "Crear primer gasto" navigates to the expense form

#### Scenario: No expenses match filters

- GIVEN expenses exist in the database
- AND the user applies filters that match zero expenses
- THEN the table body shows "No se encontraron gastos con los filtros actuales"
- AND a "Limpiar filtros" button resets all filters

### Requirement: Loading State

The system MUST display a loading indicator while the initial Firestore snapshot loads.

#### Scenario: Initial load skeleton

- GIVEN the user navigates to the Gastos page
- AND the Firestore subscription has not yet emitted data
- WHEN the table is rendering
- THEN the table shows skeleton rows (3-5 placeholder rows with shimmer animation)
- AND filter controls are disabled until first data arrives

#### Scenario: Loading after filter change

- GIVEN the user changes a filter
- AND the new query is being evaluated
- WHEN the results are pending
- THEN the table shows a subtle loading overlay on the current rows
- AND the previous results remain visible until new data arrives

### Requirement: Row Actions

The system MUST provide edit and delete actions per row via a dropdown menu.

#### Scenario: Edit action opens form with data

- GIVEN the table displays expenses
- WHEN the user clicks the row menu and selects "Editar"
- THEN the expense form opens in a dialog pre-filled with that expense's data
- AND submitting updates the expense via expense-registry

#### Scenario: Delete action soft deletes

- GIVEN the table displays expenses
- WHEN the user clicks the row menu, selects "Eliminar", and confirms
- THEN the expense is soft-deleted via expense-registry
- AND the row disappears from the table (real-time update)
- AND a toast confirms: "Gasto eliminado"

#### Scenario: Restore action for deleted expense

- GIVEN the user views deleted expenses (separate view)
- WHEN the user clicks "Restaurar" on a deleted expense
- THEN the expense is restored via expense-registry
- AND the expense reappears in the main table