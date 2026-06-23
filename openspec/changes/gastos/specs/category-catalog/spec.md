# Category Catalog Specification

## Purpose

This specification defines the user-managed category catalog stored in Firestore. Categories are created, listed, updated, and deleted by the salon owner, and consumed as a dropdown in the expense form. Categories are referenced by name in expense documents.

## Requirements

### Requirement: Create Category

The system MUST create a new category document in Firestore with a unique name, audit timestamps, and the authenticated user's UID.

#### Scenario: Valid category creation

- GIVEN the user is authenticated
- AND the form contains a non-empty category name (string, max 50 chars)
- AND no category with the same name exists (case-insensitive)
- WHEN the user submits the category form
- THEN the system creates a Firestore document in `categories` collection with fields: name (trimmed), createdAt (server timestamp), updatedAt (server timestamp), createdBy (user UID)
- AND the system returns the created category with its document ID

#### Scenario: Duplicate category name rejected

- GIVEN the user is authenticated
- AND a category with the same name (case-insensitive) already exists
- WHEN the user attempts to create a category with that name
- THEN the system rejects the creation
- AND returns an error: "Ya existe una categoría con ese nombre"
- AND no new document is created

#### Scenario: Empty category name rejected

- GIVEN the user is authenticated
- AND the category name is empty or whitespace only
- WHEN the user submits the category form
- THEN the system rejects the creation
- AND returns a validation error: "El nombre de la categoría es obligatorio"

### Requirement: List Categories

The system MUST provide a real-time stream of all categories ordered by name ascending.

#### Scenario: List categories with data

- GIVEN the user is authenticated
- AND categories exist in Firestore
- WHEN the system subscribes to the categories collection ordered by name asc
- THEN the system emits an array of category objects with all fields plus document ID
- AND updates are pushed in real-time via onSnapshot

#### Scenario: List categories empty state

- GIVEN the user is authenticated
- AND no categories exist in Firestore
- WHEN the system subscribes to the categories query
- THEN the system emits an empty array
- AND the UI shows "No hay categorías creadas" with a CTA to create the first category

### Requirement: Update Category Name

The system MUST update an existing category's name with validation and update the updatedAt timestamp.

#### Scenario: Valid category name update

- GIVEN the user is authenticated
- AND a category exists
- AND the new name is non-empty, max 50 chars, and not a duplicate (case-insensitive)
- WHEN the user submits the update
- THEN the system updates the category document with the new name
- AND updatedAt is set to server timestamp
- AND the real-time stream emits the updated category

#### Scenario: Update to duplicate name rejected

- GIVEN the user is authenticated
- AND a category exists
- AND another category with the target name already exists
- WHEN the user attempts to rename to that name
- THEN the system rejects the update
- AND returns error: "Ya existe una categoría con ese nombre"
- AND the original category remains unchanged

### Requirement: Delete Category

The system MUST delete a category only if no expenses reference it by name.

#### Scenario: Delete unused category

- GIVEN the user is authenticated
- AND a category exists
- AND no expense documents have categoria equal to this category's name (case-sensitive match)
- WHEN the user confirms deletion
- THEN the system deletes the category document from Firestore
- AND the real-time stream no longer emits this category

#### Scenario: Prevent deletion of category in use

- GIVEN the user is authenticated
- AND a category exists
- AND at least one expense document (including soft-deleted) has categoria equal to this category's name
- WHEN the user attempts to delete the category
- THEN the system rejects the deletion
- AND returns error: "No se puede eliminar: hay gastos que usan esta categoría"
- AND the category document remains in Firestore

#### Scenario: Delete non-existent category

- GIVEN the user is authenticated
- AND a category ID does not exist in Firestore
- WHEN the user attempts to delete it
- THEN the system returns error: "Categoría no encontrada"

### Requirement: Categories as Expense Form Dropdown

The system MUST provide categories as a dropdown data source for the expense form.

#### Scenario: Categories loaded for expense form

- GIVEN the user opens the expense create/edit form
- WHEN the form loads
- THEN the system fetches the current list of categories (real-time)
- AND the categoria field renders as a shadcn Select dropdown
- AND each option displays the category name
- AND the dropdown updates in real-time when categories are added/removed

#### Scenario: Empty categories in expense form

- GIVEN no categories exist
- WHEN the user opens the expense form
- THEN the categoria dropdown shows placeholder: "Primero crea una categoría"
- AND the dropdown is disabled
- AND a link/button to navigate to category management is shown