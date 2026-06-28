# Delta for Dashboard Layout

## ADDED Requirements

### Requirement: Sales Route Protection

The `/dashboard/ventas/*` routes MUST be protected by the same auth guard as other dashboard routes. Unauthenticated users MUST be redirected to `/login`.

#### Scenario: Authenticated user accesses sales

- GIVEN an authenticated user
- WHEN navigating to `/dashboard/ventas`
- THEN the sales page renders normally

#### Scenario: Unauthenticated user redirected

- GIVEN an unauthenticated user
- WHEN navigating to `/dashboard/ventas`
- THEN the user is redirected to `/login`
