# Archive Report: i18n Support

**Archived on**: 2026-06-27
**Change name**: i18n-support
**Archive location**: `openspec/changes/archive/2026-06-27-i18n-support/`
**Branch**: `feature/i18n-support`

---

## Change Summary

Added English + Spanish internationalization to The Fancy Faces using `next-intl`. The app was previously Spanish-only with one form entirely in English. This change adds path-based locale routing (`/en/...`, `/es/...`), a language switcher, and full translation support across all features.

## What Was Implemented

- **i18n Infrastructure**: next-intl middleware with locale detection (cookie, Accept-Language, fallback), request handler, navigation wrappers (Link, redirect, useRouter, usePathname), and locale dictionaries (`en.json`, `es.json`)
- **Route Restructuring**: All dashboard routes moved under `/[locale]/` route group; login and API routes remain at root without locale prefix
- **Language Switcher**: Dropdown component in dashboard header allowing toggle between English and Spanish, preserving current path
- **Sidebar Translation**: Navigation labels, user info, and logout button via translation keys; brand name "The Fancy Faces" hardcoded (untranslated)
- **Feature Translation**: Dashboard home, expenses (table, form, filters, dialogs, toasts), categories management, admin users (create form + user list) — all UI text via `useTranslations()` / `getTranslations()`
- **Expense Types**: Payment methods, registered by, and yes/no values migrated from display strings to translation keys
- **Currency**: Configurable `CURRENCY = 'AWG'` constant with locale-aware `formatCurrency()` utility, replacing hardcoded ARS
- **Type Safety**: `createSharedTypes` from next-intl ensures compile-time validation of all translation keys

## Specs Synced to Main

| Domain | Action | Details |
|--------|--------|---------|
| `i18n-core` | **Created** | New domain: routing, middleware, navigation wrappers, type-safe keys, dictionary namespace pattern, currency constant |
| `feature-translation` | **Created** | New domain: dashboard home, expenses, categories, admin users translations; AWG currency; locale-aware dates; common keys |
| `app-layout` | **Merged** | Added dynamic HTML lang, per-locale metadata, NextIntlClientProvider, locale route group structure (preserved font config) |
| `dashboard-layout` | **Merged** | Added language switcher in header, user menu sign out label + mobile menu ARIA via translation keys (preserved styling, loading, gold accent) |
| `sidebar` | **Merged** | Added nav labels via translation keys, sidebar namespace, user info labels, logout via common.signOut (preserved brand identity, active states, role-based visibility) |

## Final Stats

| Metric | Value |
|--------|-------|
| Tests | 117 passed (0 failed, 0 skipped) |
| Test duration | 14.24s |
| New test files | 5 (key parity, formatCurrency, LanguageSwitcher, middleware matcher, render-with-i18n) |
| Build | ✅ Compiled successfully (11.9s) |
| TypeScript | ✅ Passed (6.4s) |
| Static pages | ✅ 8/8 generated |
| Route verification | ✅ 8 routes verified (en/es × 4 dashboard routes + login + API) |
| Scenarios verified | 71/71 passed |

## Known Issues & Decisions

- **Brand name "The Fancy Faces"** is hardcoded in both locales (intentional — brand identity must remain consistent)
- **Login page** remains 100% English with no i18n, no locale prefix, and no language switcher (intentional — security/frictionless auth)
- **`es-AW` locale for currency**: Falls back to equivalent locale if `Intl.NumberFormat` does not support it
- **Date formatting** uses locale-aware `date-fns` format to avoid bundling all locales (dynamic import pattern)
- **Extending to new locales**: Adding a new language requires only a new JSON file with the same key structure — no code changes needed

## SDD Cycle Complete

The change has been fully planned, proposed, specified, designed, implemented, verified, and archived. Ready for the next change.
