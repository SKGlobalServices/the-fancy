# Sidebar Specification

## Purpose

Defines the sidebar structure including brand identity, navigation labels, user info section, logout button, styling, and role-based link visibility. The brand name "The Fancy Faces" must remain hardcoded (untranslated) in both locales.

---

## Requirements

### Requirement: Brand Identity in Sidebar

The sidebar header MUST display:
- Brand logo: `<Image src="/logo_navbar.webp" alt="The Fancy Faces" width={32} height={32} priority unoptimized className="rounded-full" />`
- Brand name: **"The Fancy Faces"** (hardcoded, NOT translated, text-lg font-semibold tracking-tight)
- Logo and name wrapped in a flex container with gap-2

The logo MUST use `next/image` with `priority` for above-the-fold loading.

#### Scenario: Sidebar shows brand logo and untranslated name

- GIVEN an authenticated user views any dashboard route in any locale
- WHEN the sidebar renders
- THEN the logo image loads from `/logo_navbar.webp`
- AND the text "The Fancy Faces" appears next to the logo
- AND the text is identical in both `en` and `es` locales
- AND both are vertically centered in the 16rem (h-16) header bar

#### Scenario: Logo loads with priority (no layout shift)

- GIVEN the sidebar header is in the initial viewport
- WHEN the page loads
- THEN the logo image has `priority` prop set
- AND no Cumulative Layout Shift (CLS) occurs from the logo

---

### Requirement: Navigation Labels via Translation Keys

All navigation item labels MUST use translation keys via `useTranslations('sidebar')`:

| Route | Translation Key |
|-------|-----------------|
| `/` | `sidebar.dashboard` |
| `/dashboard/gastos` | `sidebar.expenses` |
| `/admin/users` | `sidebar.users` |

The `navItems` array MUST be transformed to use `t('sidebar.dashboard')`, etc., instead of hardcoded strings.

#### Scenario: Navigation labels translate per locale

- GIVEN locale is `en`
- WHEN the sidebar renders
- THEN nav items show "Dashboard", "Expenses", "Users"
- GIVEN locale is `es`
- WHEN the sidebar renders
- THEN nav items show "Dashboard", "Gastos", "Usuarios"

---

### Requirement: Sidebar Translation Namespace

A new translation namespace `sidebar` MUST exist in both `en.json` and `es.json` with keys:

```json
{
  "dashboard": "Dashboard",
  "expenses": "Expenses",
  "users": "Users",
  "role": "Role"
}
```

#### Scenario: Sidebar namespace loads correctly

- GIVEN the sidebar component uses `useTranslations('sidebar')`
- WHEN the component renders
- THEN all navigation labels resolve from the sidebar namespace
- AND no missing key errors occur at compile time (type-safe keys)

---

### Requirement: User Info Section Labels via Translation

The user info section at the bottom of the sidebar MUST use translation keys:
- Role label (if displayed): `t('sidebar.role')`
- Any descriptive text

The user's display name and email remain dynamic (from auth) and are NOT translated.

#### Scenario: User info shows dynamic data, static labels translate

- GIVEN locale is `en`
- WHEN the sidebar user section renders
- THEN any static labels (e.g., "Role") show in English
- GIVEN locale is `es`
- WHEN the sidebar user section renders
- THEN any static labels show in Spanish
- AND the user's name and email are unchanged

---

### Requirement: Logout Button Label via Translation

The logout button in the sidebar MUST use `t('common.signOut')` for its label.

#### Scenario: Logout button translates

- GIVEN locale is `en`
- WHEN the sidebar logout button renders
- THEN it shows "Sign out"
- GIVEN locale is `es`
- WHEN the sidebar logout button renders
- THEN it shows "Cerrar sesión"

---

### Requirement: Sidebar Navigation Active State Colors

Active navigation items MUST use the primary token:
- Background: `bg-primary/10` (dusty rose 10% opacity)
- Text/icon: `text-primary` (#714B67)

Inactive/hover items MUST use:
- Hover background: `hover:bg-accent`
- Hover text: `hover:text-accent-foreground`

#### Scenario: Active nav item uses primary token

- GIVEN a user is on the Dashboard route ("/")
- WHEN the sidebar renders
- THEN the Dashboard link has `bg-primary/10 text-primary`
- AND the primary color resolves to #714B67 (OKLCH 0.42 0.12 345)

#### Scenario: Hover on inactive item uses warm accent

- GIVEN a user hovers over "Gastos" while on Dashboard
- WHEN the hover state triggers
- THEN background uses `bg-accent` (warm cream #F5EDE8)
- AND text uses `text-accent-foreground` (#505050)

---

### Requirement: Sidebar Background and Borders

The sidebar MUST use:
- Background: `bg-background` → resolves to sidebar variable (#FFFFFF)
- Border right: `border-r border-sidebar-border` (#DBD4CE)
- Text: `text-sidebar-foreground` (#505050)

#### Scenario: Sidebar renders white with warm borders

- GIVEN the sidebar renders
- WHEN viewed in browser
- THEN background is pure white (#FFFFFF)
- AND right border is warm neutral (#DBD4CE)
- AND all text is warm gray (#505050)

---

### Requirement: Role-Based Link Visibility

The **Users** link (`/admin/users`) MUST be hidden for `user` role users. It MUST be visible for `admin` and `super-admin`.

#### Scenario: Role-based link visibility

- GIVEN a user with role `user`
- WHEN viewing the dashboard layout
- THEN the **Users** link is not rendered
- GIVEN a user with role `admin` or `super-admin`
- WHEN viewing the dashboard layout
- THEN the **Users** link is rendered
