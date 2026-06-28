# Delta for Sidebar

## ADDED Requirements

### Requirement: Sales Navigation Link

The MUST include a "Ventas" nav item linking to `/dashboard/ventas` with the `sidebar.sales` translation key. It MUST respect role-based visibility — visible for all authenticated roles (user, admin, super-admin).

The updated navItems array MUST be:

| Route | Translation Key |
|-------|-----------------|
| `/` | `sidebar.dashboard` |
| `/dashboard/gastos` | `sidebar.expenses` |
| `/dashboard/ventas` | `sidebar.sales` |
| `/admin/users` | `sidebar.users` |

#### Scenario: Sales link visible for all roles

- GIVEN any authenticated user (user, admin, or super-admin)
- WHEN the sidebar renders
- THEN a "Ventas" nav item links to `/dashboard/ventas`
- AND the label translates via `t('sidebar.sales')`

#### Scenario: Active state for sales route

- GIVEN a user is on `/dashboard/ventas`
- WHEN the sidebar renders
- THEN the Ventas link shows active styling (`bg-primary/10 text-primary`)
