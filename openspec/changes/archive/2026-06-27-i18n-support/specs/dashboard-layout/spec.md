# Delta for Dashboard Layout

## Purpose

Add a language switcher dropdown in the dashboard header (top bar) that allows users to switch between English and Spanish. The switcher must persist the choice via cookie and URL, and must NOT be visible on the login page.

---

## MODIFIED Requirements

### Requirement: Top Bar Header with Language Switcher

The top header bar MUST include a language switcher dropdown in the user menu area (next to the user avatar).

The switcher MUST:
- Display current locale label ("English" / "Español")
- Allow switching to the other locale
- Navigate to the same path under the new locale (e.g., `/en/dashboard/gastos` → `/es/dashboard/gastos`)
- Update the `NEXT_LOCALE` cookie
- Be fully accessible (keyboard navigation, ARIA labels, focus management)

The switcher MUST NOT appear on the login page.

(Previously: Header had only user avatar dropdown with "Cerrar sesión")

#### Scenario: Language switcher visible in dashboard

- GIVEN an authenticated user on `/en/dashboard`
- WHEN the top header renders
- THEN a language switcher dropdown is visible next to the user avatar
- AND the current locale shows as "English"

#### Scenario: Switching locale updates URL and cookie

- GIVEN a user on `/en/dashboard/gastos` clicks "Español"
- WHEN the switcher handles the click
- THEN the browser navigates to `/es/dashboard/gastos`
- AND the `NEXT_LOCALE` cookie is set to `es`
- AND the page re-renders with Spanish translations

#### Scenario: Switcher preserves current path

- GIVEN a user on `/en/admin/users` switches to Spanish
- WHEN navigation completes
- THEN the URL is `/es/admin/users` (same path, different locale)
- AND NOT redirected to dashboard home

#### Scenario: Switcher not visible on login page

- GIVEN a user visits `/login`
- WHEN the page renders
- THEN no language switcher is present in the header
- AND the page remains 100% English

#### Scenario: Switcher accessible via keyboard

- GIVEN focus is on the language switcher trigger
- WHEN the user presses Enter or Space
- THEN the dropdown opens
- WHEN the user presses ArrowDown/ArrowUp
- THEN focus moves between options
- WHEN the user presses Enter on an option
- THEN the locale changes and dropdown closes

---

### Requirement: User Menu "Sign out" Label via Translation

The user dropdown menu MUST use translation keys for "Sign out" / "Cerrar sesión" instead of hardcoded text.

(Previously: Hardcoded "Cerrar sesión" in Spanish)

#### Scenario: Sign out label translates

- GIVEN locale is `en`
- WHEN the user menu opens
- THEN the logout item shows "Sign out"
- GIVEN locale is `es`
- WHEN the user menu opens
- THEN the logout item shows "Cerrar sesión"

---

### Requirement: Mobile Menu Button ARIA Label via Translation

The mobile hamburger button MUST use a translation key for its `aria-label`.

(Previously: Hardcoded `aria-label="Abrir menú"`)

#### Scenario: Mobile menu button label translates

- GIVEN locale is `en` on mobile viewport
- WHEN the hamburger button renders
- THEN `aria-label="Open menu"`
- GIVEN locale is `es` on mobile viewport
- WHEN the hamburger button renders
- THEN `aria-label="Abrir menú"`

---

## ADDED Requirements

### Requirement: Language Switcher Component

A new `LanguageSwitcher` Client Component MUST be created at `src/features/i18n/components/language-switcher.tsx` that:
- Uses `useLocale()` and `useRouter()` from next-intl navigation
- Renders a `DropdownMenu` with two items: English and Español
- On selection, calls `router.push(pathname, { locale: newLocale })`
- Shows current locale with a check mark or similar indicator

#### Scenario: Language switcher renders correctly

- GIVEN the dashboard layout includes `<LanguageSwitcher />`
- WHEN the header renders
- THEN the dropdown shows current locale as selected
- AND the other locale is available as an option

#### Scenario: Switcher works on all dashboard routes

- GIVEN a user on any `/en/dashboard/*` or `/es/dashboard/*` route
- WHEN the language switcher is used
- THEN the locale changes and the same route is preserved

---

## REMOVED Requirements

### Requirement: Hardcoded Spanish-Only User Menu

(Reason: Replaced by translation-key-based labels for user menu items)
(Migration: "Cerrar sesión" → `t('common.signOut')`; "Abrir menú" → `t('common.openMenu')`)

---

## PRESERVED Requirements

### Requirement: Main Content Area Background

The main content area (`<main>`) MUST use warm cream background:
```tsx
<main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
```
Where `bg-background` resolves to `--background` = `#FFFAF5` (OKLCH 0.99 0.01 85).

### Requirement: Loading Spinner Colors

The authentication loading spinner MUST use the primary color:
```tsx
<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
```

### Requirement: Top Bar Header Styling

The top header bar MUST use:
- Background: `bg-background` (white `#FFFFFF`)
- Border bottom: `border-b border-border` (`#DBD4CE` warm neutral)
- User avatar dropdown trigger: `text-foreground` (`#505050`)

### Requirement: Mobile Sheet Sidebar Background

The mobile sheet (`SheetContent`) MUST use:
- Background: `bg-sidebar` (`#FFFFFF`)
- Border: `border-r border-sidebar-border` (`#DBD4CE`)

### Requirement: Gold Accent Decorative Elements

The dashboard layout MAY use `--gold` (`#FFCB30`) ONLY for decorative elements (badge borders, icon accents, separators). Gold MUST NOT be used on interactive elements.