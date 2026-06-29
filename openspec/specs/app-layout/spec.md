# App Layout Specification

## Purpose

Defines the root layout structure including font configuration, metadata, locale handling, and route organization.

---

## Requirements

### Requirement: Root Layout Font Configuration

The root layout MUST import Playfair Display and Poppins via `next/font/google` with the following configuration:

- **Playfair Display**: weights [400, 500, 600, 700], subsets ["latin"], variable "--font-heading", display "swap"
- **Poppins**: weights [300, 400, 500, 600, 700], subsets ["latin"], variable "--font-sans", display "swap"
- **Geist Mono**: retained, variable "--font-mono", subsets ["latin"], display "swap"

The `<html>` element MUST apply all three font variables: `geistMono.variable`, `playfair.variable`, `poppins.variable`.

#### Scenario: Fonts load without FOUT

- GIVEN the root layout loads
- WHEN the browser fetches Google Fonts
- THEN `display: swap` ensures fallback fonts show immediately
- AND no layout shift occurs when web fonts load

#### Scenario: CSS variables available globally

- GIVEN the `<html>` element has all three font variables
- WHEN any component uses `font-heading`, `font-sans`, or `font-mono`
- THEN the correct font family renders via Tailwind's `@theme inline` mapping

---

### Requirement: Root Layout Dynamic HTML Lang

The `<html>` element MUST set `lang` attribute dynamically from the route's `locale` parameter instead of hardcoded `"es"`.

The root layout MUST accept `params: Promise<{ locale: string }>` and await it to get the current locale.

#### Scenario: English locale sets lang="en"

- GIVEN a user visits `/en/dashboard`
- WHEN the root layout renders
- THEN `<html lang="en">` is rendered
- AND the browser uses English for accessibility (screen readers, spell check)

#### Scenario: Spanish locale sets lang="es"

- GIVEN a user visits `/es/dashboard`
- WHEN the root layout renders
- THEN `<html lang="es">` is rendered
- AND the browser uses Spanish for accessibility

#### Scenario: Login page has no locale param, defaults to en

- GIVEN a user visits `/login`
- WHEN the root layout renders
- THEN `<html lang="en">` is rendered (login is English-only)

---

### Requirement: Per-Locale Metadata

The root layout MUST export a `generateMetadata` function that returns locale-specific `title` and `description`.

| Locale | Title | Description |
|--------|-------|-------------|
| `en` | "The Fancy Faces" | "The Fancy Faces Beauty Studio — Aruba. You deserve a fancy life!" |
| `es` | "The Fancy Faces" | "The Fancy Faces Beauty Studio — Aruba. ¡Te mereces una vida fancy!" |

Brand name "The Fancy Faces" MUST remain identical in both locales.

#### Scenario: English metadata for /en/ routes

- GIVEN a request to `/en/admin/users`
- WHEN metadata is generated
- THEN `title` is "The Fancy Faces"
- AND `description` contains "You deserve a fancy life!"

#### Scenario: Spanish metadata for /es/ routes

- GIVEN a request to `/es/admin/users`
- WHEN metadata is generated
- THEN `title` is "The Fancy Faces"
- AND `description` contains "¡Te mereces una vida fancy!"

#### Scenario: Browser tab shows brand title

- GIVEN a user opens the admin app
- WHEN the page loads
- THEN the browser tab displays "The Fancy Faces"

#### Scenario: SEO description reflects brand positioning

- GIVEN a search engine crawls the page
- WHEN reading metadata
- THEN description contains "The Fancy Faces Beauty Studio — Aruba" and the tagline

---

### Requirement: NextIntlClientProvider in Root Layout

The root layout MUST wrap children with `NextIntlClientProvider` for Client Components to access translations via `useTranslations()`.

The provider MUST receive `messages` from the locale dictionary (passed via `getTranslations('common')` or similar) and the current `locale`.

This applies ONLY to routes under `/[locale]/...`. The login page (`/login`) MUST NOT be wrapped.

#### Scenario: Dashboard pages have translation provider

- GIVEN a user visits `/en/dashboard/gastos`
- WHEN the page renders
- THEN `NextIntlClientProvider` wraps the dashboard layout
- AND Client Components can call `useTranslations()`

#### Scenario: Login page has no translation provider

- GIVEN a user visits `/login`
- WHEN the page renders
- THEN no `NextIntlClientProvider` wraps the login form
- AND the login form remains 100% English with no i18n overhead

---

### Requirement: Locale Segment in Route Groups

The app directory structure MUST use `/src/app/[locale]/` for all localized routes (dashboard, admin, expenses) while keeping `/src/app/(auth)/login/` at the root without locale prefix.

```
src/app/
├── [locale]/
│   ├── layout.tsx          # Dashboard layout with locale
│   ├── page.tsx            # Dashboard home
│   ├── dashboard/
│   │   └── gastos/         # Expenses
│   └── admin/
│       └── users/          # Admin users
├── (auth)/
│   └── login/
│       └── page.tsx        # No locale prefix
└── api/                    # No locale prefix
```

#### Scenario: Dashboard routes under locale prefix

- GIVEN the app structure above
- WHEN a user navigates to `/es/dashboard/gastos`
- THEN the route matches `src/app/[locale]/dashboard/gastos/page.tsx`

#### Scenario: Login route at root

- GIVEN the app structure above
- WHEN a user visits `/login`
- THEN the route matches `src/app/(auth)/login/page.tsx`
- AND no `[locale]` segment is present
