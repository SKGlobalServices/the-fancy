# Proposal: i18n Support

## Intent

Add English + Spanish internationalization to the-fancy. The app is currently Spanish-only with inconsistencies — one form is entirely in English. English-speaking users cannot use the system. Target: ~10KB bundle cost via next-intl.

## Scope

### In Scope
- next-intl middleware routing (`/en/...`, `/es/...`)
- JSON dictionary files (namespaced, ICU MessageFormat)
- Language switcher inside dashboard (header/user menu area)
- Translated strings: dashboard home, gastos, admin users, categories, expenses
- Dynamic `<html lang>` and locale-aware metadata
- Type-safe translation keys via `createSharedTypes`

### Out of Scope
- Login page — 100% English, no i18n, no language switcher
- Visual redesign or dark mode
- Translation of brand name "The Fancy Faces"

## Capabilities

### New Capabilities
- `i18n-core`: next-intl routing, middleware, request handler, navigation wrappers (Link, redirect, useRouter), locale dictionaries

### Modified Capabilities
- `app-layout`: `<html lang>` static `"es"` → dynamic per-locale
- `dashboard-layout`: Language switcher dropdown in header
- `sidebar`: Navigation labels → translation keys
- `dashboard-page`, `admin-users`, `gastos`: All UI text → `useTranslations` / `getTranslations`

## Approach

Use next-intl with path-based routing (`localePrefix: 'always'`). Middleware detects locale from cookie/header and redirects to `/[locale]/...`. Server Components use `getTranslations()`, Client Components use `useTranslations()`. Firebase Auth routes, API routes, and login page excluded from locale middleware. Brand name "The Fancy Faces" hard-coded in both locales. Currency: AWG (Aruban Florin), configurable via constant for future changes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/middleware.ts` | New | next-intl `createMiddleware` with matcher |
| `src/i18n/` | New | routing, request, navigation, `en.json`, `es.json` |
| `src/app/[locale]/` | New | All dashboard routes under locale prefix |
| `src/app/(auth)/login/` | Unchanged | Stays at `/login`, no locale prefix |
| `src/app/layout.tsx` | Modified | Dynamic `lang` per locale |
| `src/app/(dashboard)/layout.tsx` | Modified | Language switcher in header |
| `src/features/*/` | Modified | UI text through translation hooks |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| Firebase Auth session path under locale | Medium | Explicit exclude in middleware matcher |
| Route group restructure breaks links | High | Single-pass refactor, verify all internal links compile |
| Existing tests reference old paths | High | Update test assertions to `/[locale]/` routes |
| Dictionary key drift from UI | Low | Type-safe keys prevent missing keys at compile time |

## Rollback Plan

Revert `src/middleware.ts`, remove `src/i18n/` and `src/app/[locale]/`, restore `src/app/(dashboard)` and `src/app/(auth)` to current structure. Self-contained addition — rollback is a single git revert.

## Dependencies

- `next-intl` (add via pnpm)

## Success Criteria

- [ ] All pages render in `/en/...` and `/es/...` without content gaps
- [ ] Language switcher visible only inside dashboard, never on login
- [ ] Login page is 100% English, no locale prefix, no switcher
- [ ] Type-safe translation keys compile without errors
- [ ] Firebase auth flow works under any locale
