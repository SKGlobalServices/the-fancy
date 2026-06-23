# Authorization Specification

## Purpose

Role-based access control for the admin system. Defines roles, creation hierarchy, and route protection via Next.js middleware.

## Requirements

### Requirement: Role Model

The system MUST define exactly three roles: `super-admin`, `admin`, and `user`. Every user document in Firestore MUST store a `role` field. When absent, the effective role defaults to `user`.

| Role | Permissions |
|------|-------------|
| `super-admin` | Full access. Creates admins and super-admins. |
| `admin` | Creates users. Accesses operational modules. |
| `user` | Own profile and daily work registration only. |

#### Scenario: Default role

- GIVEN a Firestore user document without a `role` field
- WHEN the system performs an authorization check
- THEN the effective role is `user`

#### Scenario: Explicit role

- GIVEN a Firestore user document with `role: "admin"`
- WHEN the system performs an authorization check
- THEN the effective role is `admin`

### Requirement: Role Hierarchy

Role hierarchy MUST enforce creation boundaries: `super-admin` MAY create `admin` or `super-admin`; `admin` MAY create `user` only; `user` MUST NOT create any users.

#### Scenario: Super-admin creates admin

- GIVEN an authenticated user with role `super-admin`
- WHEN they POST to `/api/admin/users` with `role: "admin"`
- THEN the user is created successfully

#### Scenario: Admin creates user

- GIVEN an authenticated user with role `admin`
- WHEN they POST to `/api/admin/users` with `role: "user"`
- THEN the user is created successfully

#### Scenario: Admin cannot escalate role

- GIVEN an authenticated user with role `admin`
- WHEN they POST to `/api/admin/users` with `role: "admin"` or `"super-admin"`
- THEN the request is rejected with status 403

#### Scenario: User unauthorized

- GIVEN an authenticated user with role `user`
- WHEN they POST to `/api/admin/users`
- THEN the request is rejected with status 403

### Requirement: Middleware Route Protection

Next.js middleware MUST validate the Firebase auth session and user role for all routes in `/(dashboard)/*`. Unauthenticated requests MUST redirect to `/login`. Requests from unauthorized roles MUST return 403 or redirect to an error page.

#### Scenario: Unauthenticated redirect

- GIVEN no valid Firebase session
- WHEN requesting `/admin/users`
- THEN redirected to `/login`

#### Scenario: Unauthorized role blocked

- GIVEN a user with role `user` is authenticated
- WHEN requesting `/admin/users`
- THEN returned 403 or redirected to an error page

#### Scenario: Authorized access allowed

- GIVEN a user with role `super-admin` or `admin` is authenticated
- WHEN requesting `/admin/users`
- THEN the request proceeds normally
