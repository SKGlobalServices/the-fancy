# Delta for App Layout

## Purpose

Modify the root layout to support dynamic locale-aware `<html lang>`, per-locale metadata, and NextIntlClientProvider wrapping for Client Components. The login page remains at `/login` without locale prefix.

---

## MODIFIED Requirements

### Requirement: Root Layout Dynamic HTML Lang

The `<html>` element MUST set `lang` attribute dynamically from the route's `locale` parameter instead of hardcoded `"es"`.

The root layout MUST accept `params: Promise<{ locale: string }>` and await it to get the current locale.

(Previously: `<html lang="es" ...>` was static)

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

### Requirement: Per-Locale Metadata Title and Description

The root layout MUST export a `generateMetadata` function that returns locale-specific `title` and `description`.

| Locale | Title | Description |
|--------|-------|-------------|
| `en` | "The Fancy Faces" | "The Fancy Faces Beauty Studio — Aruba. You deserve a fancy life!" |
| `es` | "The Fancy Faces" | "The Fancy Faces Beauty Studio — Aruba. ¡Te mereces una vida fancy!" |

Brand name "The Fancy Faces" MUST remain identical in both locales.

(Previously: Static metadata with English title and English description)

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

### Requirement: Font Configuration Preserved

The root layout MUST continue importing Playfair Display, Poppins, and Geist Mono via `next/font/google` with the same configuration as before.

(Previously: Same font config — no change)

#### Scenario: Fonts load without FOUT (unchanged)

- GIVEN the root layout loads
- WHEN the browser fetches Google Fonts
- THEN `display: swap` ensures fallback fonts show immediately
- AND no layout shift occurs when web fonts load

---

## ADDED Requirements

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