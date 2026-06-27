# Delta for i18n Core

## Purpose

Establish the internationalization infrastructure using next-intl with path-based routing, locale detection, type-safe translation keys, and dictionary management for English and Spanish.

---

## ADDED Requirements

### Requirement: Path-Based Locale Routing

The system MUST implement path-based routing with `localePrefix: 'always'` so all localized routes are prefixed with `/en/` or `/es/`.

The middleware MUST:
- Detect locale from `NEXT_LOCALE` cookie, `Accept-Language` header, or default to `en`
- Rewrite requests to include locale prefix (e.g., `/dashboard` → `/en/dashboard`)
- Exclude Firebase Auth routes (`/api/auth/*`), API routes (`/api/*`), and login page (`/login`) from locale handling
- Set `NEXT_LOCALE` cookie on locale change with `SameSite=Lax`, `Secure` in production, `max-age=31536000` (1 year)

| Property | Value |
|----------|-------|
| Default locale | `en` |
| Supported locales | `en`, `es` |
| `localePrefix` | `always` |
| Cookie name | `NEXT_LOCALE` |
| Cookie options | `SameSite=Lax`, `Secure` (prod), `max-age=31536000` |

#### Scenario: Root redirects to default locale

- GIVEN a user visits `/`
- WHEN the middleware processes the request
- THEN the user is redirected to `/en/`
- AND the `NEXT_LOCALE` cookie is set to `en`

#### Scenario: Explicit locale in path is respected

- GIVEN a user visits `/es/dashboard`
- WHEN the middleware processes the request
- THEN the request proceeds to the Spanish dashboard
- AND the `NEXT_LOCALE` cookie is updated to `es`

#### Scenario: Login page has no locale prefix

- GIVEN a user visits `/login`
- WHEN the middleware processes the request
- THEN the request proceeds without locale prefix
- AND no `NEXT_LOCALE` cookie is set or modified

#### Scenario: API routes have no locale prefix

- GIVEN a request to `/api/admin/users`
- WHEN the middleware processes the request
- THEN the request proceeds without locale prefix
- AND the `NEXT_LOCALE` cookie is not modified

#### Scenario: Firebase Auth routes excluded

- GIVEN a request to `/api/auth/signIn`
- WHEN the middleware processes the request
- THEN the request proceeds without locale prefix

---

### Requirement: Request Handler and Navigation Wrappers

The system MUST provide a `src/i18n/request.ts` that exports:
- `getRequestConfig()` for server-side dictionary loading
- `getTranslations()` wrapper for Server Components

The system MUST provide a `src/i18n/navigation.ts` that exports locale-aware wrappers:
- `Link` (replaces `next/link`)
- `redirect` (replaces `next/navigation`)
- `useRouter` (replaces `next/navigation`)
- `usePathname` (replaces `next/navigation`)
- `getPathname` for static generation

All navigation wrappers MUST automatically prepend the current locale to generated paths.

#### Scenario: Server Component uses getTranslations

- GIVEN a Server Component calls `getTranslations('expenses')`
- WHEN the component renders
- THEN the English or Spanish dictionary is loaded based on the request locale
- AND type-safe translation keys are available via `createSharedTypes`

#### Scenario: Client Component uses useTranslations

- GIVEN a Client Component calls `useTranslations('expenses')`
- WHEN the component renders
- THEN the namespace dictionary is available with type-safe keys
- AND ICU MessageFormat syntax works (variables, plurals, select)

#### Scenario: Navigation Link generates localized path

- GIVEN a component uses `<Link href="/dashboard/gastos" />`
- WHEN the user is on `/es/...`
- THEN the generated href is `/es/dashboard/gastos`

---

### Requirement: Type-Safe Translation Keys via createSharedTypes

The system MUST use `createSharedTypes<typeof en>()` from next-intl to generate TypeScript types from the English dictionary, ensuring all translation keys are compile-time validated.

English dictionary (`en.json`) MUST be the source of truth. Spanish dictionary (`es.json`) MUST have identical key structure.

| File | Purpose |
|------|---------|
| `src/i18n/locales/en.json` | Source dictionary (all keys defined) |
| `src/i18n/locales/es.json` | Spanish translations (same keys as en.json) |
| `src/i18n/types.ts` | `createSharedTypes<typeof en>()` export |

#### Scenario: Missing translation key causes compile error

- GIVEN a component uses `t('expenses.nonexistent')`
- WHEN TypeScript compiles
- THEN a type error is raised: "Property 'nonexistent' does not exist"

#### Scenario: Adding key to en.json makes it available everywhere

- GIVEN a new key `expenses.newField` is added to `en.json`
- WHEN the project compiles
- THEN `t('expenses.newField')` is type-safe in all components
- AND `es.json` must add the same key (CI check recommended)

#### Scenario: ICU MessageFormat with variables works

- GIVEN a dictionary entry `"welcome": "Welcome, {name}!"`
- WHEN a component calls `t('welcome', { name: 'Ana' })`
- THEN the rendered output is "Welcome, Ana!" (or Spanish equivalent)

#### Scenario: Pluralization works via ICU

- GIVEN a dictionary entry `"items": "{count, plural, one {# item} other {# items}}"`
- WHEN a component calls `t('items', { count: 1 })`
- THEN output is "1 item" (English) or "1 artículo" (Spanish)
- WHEN count is 5
- THEN output is "5 items" (English) or "5 artículos" (Spanish)

---

### Requirement: Scalable Dictionary Structure (Namespace Pattern)

The system MUST organize translations by feature namespace to support future languages without restructuring.

```json
{
  "common": { "save": "Save", "cancel": "Cancel", "delete": "Delete", "edit": "Edit" },
  "navigation": { "dashboard": "Dashboard", "expenses": "Expenses", "users": "Users", "categories": "Categories" },
  "auth": { "login": "Login", "logout": "Logout", "email": "Email", "password": "Password" },
  "expenses": { "title": "Expenses", "add": "Add Expense", "filters": "Filters", ... },
  "categories": { "title": "Categories", "add": "Add Category", ... },
  "users": { "title": "Users", "create": "Create User", "role": "Role", ... },
  "dashboard": { "welcome": "Welcome to...", "tagline": "You deserve a fancy life!" }
}
```

#### Scenario: Adding new locale requires only new JSON file

- GIVEN the team decides to add French (`fr`)
- WHEN a new `fr.json` is created with the same namespace structure
- THEN the locale works without code changes
- AND `localePrefix: 'always'` automatically handles `/fr/...` routes

---

## REMOVED Requirements

### Requirement: Static Spanish-Only Routing

(Reason: Replaced by dynamic locale-based routing with `/en/` and `/es/` prefixes)
(Migration: All internal links updated via next-intl navigation wrappers; old non-prefixed routes now redirect)

---

## ADDED Requirements

### Requirement: Currency Constant for AWG

The system MUST define a configurable currency constant `CURRENCY = 'AWG'` in `src/shared/lib/currency.ts` so the currency can be changed in one place.

The constant MUST be used by all currency formatting logic instead of hardcoded `ARS` or `USD`.

#### Scenario: Currency constant is used for formatting

- GIVEN an expense amount of 100.50
- WHEN formatted via `formatCurrency(amount)`
- THEN the output uses AWG (Aruban Florin) with correct locale formatting
- AND changing `CURRENCY` to `USD` updates all formatting site-wide

#### Scenario: Currency code is exported for type safety

- GIVEN `export const CURRENCY = 'AWG' as const`
- WHEN used in TypeScript
- THEN the type is `'AWG'` (literal), preventing invalid currency codes