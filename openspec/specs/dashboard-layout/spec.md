# Dashboard Layout Specification

## Purpose

Defines the dashboard layout structure including the top header bar, language switcher, main content area, mobile sheet sidebar, loading states, and decorative elements.

---

## Requirements

### Requirement: Top Bar Header with Language Switcher

The top header bar MUST use:
- Background: `bg-background` (white #FFFFFF for the bar itself)
- Border bottom: `border-b border-border` (#DBD4CE warm neutral)
- User avatar dropdown trigger: `text-foreground` (#505050)

The top header bar MUST include a language switcher dropdown in the user menu area (next to the user avatar).

The switcher MUST:
- Display current locale label ("English" / "Español")
- Allow switching to the other locale
- Navigate to the same path under the new locale (e.g., `/en/dashboard/gastos` → `/es/dashboard/gastos`)
- Update the `NEXT_LOCALE` cookie
- Be fully accessible (keyboard navigation, ARIA labels, focus management)

The switcher MUST NOT appear on the login page.

#### Scenario: Header bar has warm neutral border

- GIVEN the dashboard layout renders
- WHEN the top header is visible
- THEN the bottom border is #DBD4CE (warm neutral)
- AND user avatar text is #505050

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

### Requirement: User Menu Labels via Translation

The user dropdown menu MUST use translation keys for "Sign out" / "Cerrar sesión" instead of hardcoded text.

The mobile hamburger button MUST use a translation key for its `aria-label`.

#### Scenario: Sign out label translates

- GIVEN locale is `en`
- WHEN the user menu opens
- THEN the logout item shows "Sign out"
- GIVEN locale is `es`
- WHEN the user menu opens
- THEN the logout item shows "Cerrar sesión"

#### Scenario: Mobile menu button label translates

- GIVEN locale is `en` on mobile viewport
- WHEN the hamburger button renders
- THEN `aria-label="Open menu"`
- GIVEN locale is `es` on mobile viewport
- WHEN the hamburger button renders
- THEN `aria-label="Abrir menú"`

---

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

### Requirement: Main Content Area Background

The main content area (`<main>`) MUST use warm cream background:

```tsx
<main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
```

Where `bg-background` resolves to `--background` = `#FFFAF5` (OKLCH 0.99 0.01 85).

#### Scenario: Dashboard main area shows warm cream

- GIVEN an authenticated user loads any dashboard route
- WHEN the main content area renders
- THEN the background color is #FFFAF5 (warm cream)
- AND NOT white or gray

---

### Requirement: Loading Spinner Colors

The authentication loading spinner MUST use the primary color:

```tsx
<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
```

#### Scenario: Loading spinner shows dusty rose

- GIVEN the auth check is in progress
- WHEN the loading spinner displays
- THEN the spinner border color is #714B67 (dusty rose)
- AND the transparent segment creates the spinning effect

---

### Requirement: Mobile Sheet Sidebar Background

The mobile sheet (`SheetContent`) MUST use:
- Background: `bg-sidebar` (#FFFFFF)
- Border: `border-r border-sidebar-border` (#DBD4CE)

#### Scenario: Mobile sidebar matches desktop styling

- GIVEN a user opens the mobile menu (viewport < md)
- WHEN the sheet slides in
- THEN background is white
- AND right border is warm neutral
- AND navigation items use same active/hover tokens as desktop

---

### Requirement: Gold Accent Decorative Elements

The dashboard layout MAY use `--gold` (#FFCB30) ONLY for decorative elements:
- Badge borders
- Icon accents
- Horizontal separators (`hr` with `border-gold`)
- Decorative dividers

Gold MUST NOT be used on interactive elements (buttons, links, inputs, focus rings).

#### Scenario: Gold appears only decoratively

- GIVEN a dashboard page includes a decorative badge
- WHEN the badge renders with `border-gold` or `text-gold`
- THEN the gold color (#FFCB30) is visible
- AND no button, link, or input uses gold for background, text, or border
