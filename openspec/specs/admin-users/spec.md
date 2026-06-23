# Admin Users Specification

## Purpose

User management: Firestore data model, create-user API, administration page, and dashboard layout with sidebar navigation.

## Requirements

### Requirement: Firestore User Collection

Users MUST be stored in Firestore collection `users` with document ID equal to Firebase Auth UID. Each document MUST contain: `uid`, `email`, `displayName`, `role`, `createdAt` (server timestamp), and `createdBy` (UID of the creator).

#### Scenario: User document created

- GIVEN a successful user creation via API
- WHEN the Firestore write completes
- THEN a document exists at `/users/{uid}` with all required fields and a valid timestamp

### Requirement: Create User API

`POST /api/admin/users` MUST authenticate via `Authorization: Bearer {Firebase ID token}`, validate the requester's role per hierarchy rules, validate the request body with Zod, create the user in Firebase Auth, persist the user document in Firestore, and return `{ uid, email, displayName, role }` with status 200.

| Request Field | Type | Rules |
|---------------|------|-------|
| `email` | string | Required, valid email |
| `password` | string | Required, min 6 chars |
| `displayName` | string | Required, non-empty |
| `role` | string | One of `super-admin`, `admin`, `user` |

#### Scenario: Successful creation

- GIVEN a valid Firebase Auth token from a `super-admin` or `admin`
- WHEN POSTing valid `{ email, password, displayName, role }` to `/api/admin/users`
- THEN Firebase Auth user is created, Firestore doc is saved, and 200 returned with user data

#### Scenario: Unauthenticated request

- GIVEN no Authorization header or an invalid token
- WHEN POSTing to `/api/admin/users`
- THEN 401 is returned

#### Scenario: Validation failure

- GIVEN a valid token but invalid body (e.g., missing email, weak password)
- WHEN POSTing to `/api/admin/users`
- THEN 400 is returned with validation error details

#### Scenario: Duplicate email

- GIVEN a valid token and an email already registered in Firebase Auth
- WHEN POSTing to `/api/admin/users`
- THEN 409 is returned

### Requirement: Admin Users Page

`/admin/users` MUST render a user creation form. Fields: email, password, displayName, and role selector. The role selector MUST only show options the current user is allowed to create (`super-admin`: all three roles; `admin`: `user` only). On submit, the form MUST POST to `/api/admin/users` and display success or error feedback.

#### Scenario: Render form

- GIVEN an authenticated `super-admin` or `admin`
- WHEN navigating to `/admin/users`
- THEN a user creation form is displayed with the correct role options

#### Scenario: Submit form successfully

- GIVEN a filled form with valid data
- WHEN the user clicks submit
- THEN `POST /api/admin/users` is called and a success message is displayed

#### Scenario: Submit form with error

- GIVEN a filled form with a duplicate email
- WHEN the user clicks submit
- THEN the API error is displayed as inline feedback

### Requirement: Dashboard Layout

Authenticated routes MUST render within a dashboard layout that includes a sidebar navigation. The sidebar MUST show links: **Dashboard** (`/`) and **Usuarios** (`/admin/users`). The **Usuarios** link MUST be hidden for `user` role users.

#### Scenario: Sidebar visible

- GIVEN any authenticated user
- WHEN viewing any route under `/(dashboard)/*`
- THEN the sidebar is visible with navigation links

#### Scenario: Role-based link visibility

- GIVEN a user with role `user`
- WHEN viewing the dashboard layout
- THEN the **Usuarios** link is not rendered
