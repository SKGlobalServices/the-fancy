# Tasks: i18n Support for The Fancy Faces

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,450 (additions + deletions) |
| 400-line budget risk | High |
| 800-line review budget | Exceeded |
| Chained PRs recommended | Yes |
| Delivery strategy | single-pr-default (exceeds both budgets) |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | i18n Infrastructure + Route Migration | PR 1 | next-intl install, i18n core files, locale JSONs, proxy.ts integration, root layout, [locale] routes, delete old route groups. Base: main. ~500 additions |
| 2 | Language Switcher + Sidebar | PR 2 | LanguageSwitcher component, dashboard layout with switcher, sidebar navigation labels via t(). Base: main. ~150 additions |
| 3 | Expenses Types + Currency | PR 3 | Types use keys, currency.ts with AWG constant, replace formatMonto. Base: main. ~100 additions |
| 4 | Expense Feature Translation | PR 4 | expense-table, expense-form, category-manager, gastos page. Base: main. ~250 additions |
| 5 | Admin Users + Dashboard Home | PR 5 | create-user-form (fix English-only), user-list, admin users page, dashboard home. Base: main. ~150 additions |
| 6 | Tests | PR 6 | Translation key parity, formatCurrency, LanguageSwitcher, middleware, update existing tests with render-with-i18n. Base: main. ~200 additions |

Each PR is under 800 lines. PRs merge to main independently — no stack dependency. Order is recommended but not enforced.

## Phase 1: i18n Infrastructure

- [x] **T1.1** Install `next-intl` via pnpm. File: `package.json`. Deps: none. Est: +1 line. AC: `next-intl` in dependencies.
- [x] **T1.2** Create `src/i18n/routing.ts` with `defineRouting({ locales: ['en','es'], defaultLocale: 'en', localePrefix: 'always' })`. File: `src/i18n/routing.ts` (new). Deps: T1.1. Est: +20 lines. AC: Routing config exports locales and defaultLocale.
- [x] **T1.3** Create `src/i18n/request.ts` with `getRequestConfig` loading `{locale}.json`. File: `src/i18n/request.ts` (new). Deps: T1.1. Est: +20 lines. AC: Request config loads locale per request.
- [x] **T1.4** Create `src/i18n/navigation.ts` with `createNavigation` (Link, redirect, useRouter, usePathname). File: `src/i18n/navigation.ts` (new). Deps: T1.2. Est: +10 lines. AC: Navigation wrappers auto-prepend locale.
- [x] **T1.5** Create `src/i18n/types.ts` with TypeScript type for en.json messages. File: `src/i18n/types.ts` (new). Deps: T1.6. Est: +5 lines. AC: Type-safe keys compile from en.json.
- [x] **T1.6** Create `src/i18n/locales/en.json` with full namespace dictionary (common, navigation, auth, sidebar, dashboard, expenses, categories, users). File: `src/i18n/locales/en.json` (new). Deps: none. Est: +220 lines. AC: All spec keys present, type-safe.
- [x] **T1.7** Create `src/i18n/locales/es.json` with same key structure as en.json. File: `src/i18n/locales/es.json` (new). Deps: T1.6. Est: +220 lines. AC: Same keys as en.json, Spanish values.
- [x] **T1.8** Modify `src/proxy.ts` to chain next-intl `createMiddleware` with existing auth middleware. Exclude `/login`, `/api/*`, `/_next/*`, `/favicon.ico`. File: `src/proxy.ts` (modify). Deps: T1.2. Est: ~15 lines added. AC: `/login` and `/api/*` bypass i18n; locale routes work.
- [x] **T1.9** Create `src/test-utils/render-with-i18n.tsx` with `NextIntlClientProvider` + mock messages. File: `src/test-utils/render-with-i18n.tsx` (new). Deps: T1.6. Est: +25 lines. AC: Renders component wrapped with translations.

## Phase 2: Layout Migration

- [x] **T2.1** Modify `src/app/layout.tsx` — dynamic `<html lang={locale}>`, `generateMetadata` per locale, remove hardcoded `lang="es"`. File: `src/app/layout.tsx` (modify). Deps: T1.5. Est: ~10 lines changed. AC: `<html lang="en">` for /en/, `lang="es"` for /es/, `lang="en"` for /login.
- [x] **T2.2** Create `src/app/[locale]/layout.tsx` with `NextIntlClientProvider` wrapping children. File: `src/app/[locale]/layout.tsx` (new). Deps: T1.5. Est: +35 lines. AC: Provider renders for locale routes.
- [x] **T2.3** Create `src/app/[locale]/page.tsx` redirecting root `/en` to `/en/dashboard`. File: `src/app/[locale]/page.tsx` (new). Deps: T1.4. Est: +8 lines. AC: `/en` → `/en/dashboard`, `/es` → `/es/dashboard`.
- [x] **T2.4** Move `(dashboard)/layout.tsx` → `[locale]/layout.tsx` (integrate with T2.2 layout), update navigation imports to i18n wrappers. Files: delete `src/app/(dashboard)/layout.tsx`, modify `src/app/[locale]/layout.tsx` from T2.2. Deps: T1.4, T2.2. Est: ~20 lines changed + 135 deleted. AC: Dashboard renders under /en/dashboard, auth guard works.
- [x] **T2.5** Move `(dashboard)/page.tsx` → `[locale]/dashboard/page.tsx`, replace strings with `getTranslations('dashboard')`. Files: move + modify `src/app/[locale]/dashboard/page.tsx`, delete old. Deps: T2.3. Est: ~8 lines changed + 20 deleted. AC: Dashboard home translated per locale.
- [x] **T2.6** Move `(dashboard)/dashboard/gastos/page.tsx` → `[locale]/dashboard/gastos/page.tsx`, replace strings with `useTranslations()`. Files: move + modify, delete old. Deps: T1.4. Est: ~20 lines changed + 123 deleted. AC: Gastos page translated, month summary, buttons.
- [x] **T2.7** Move `(dashboard)/admin/users/page.tsx` → `[locale]/admin/users/page.tsx`, translate title/description. Files: move + modify, delete old. Deps: T1.4. Est: ~8 lines changed + 27 deleted. AC: Admin users page translates.

## Phase 3: Sidebar & Language Switcher

- [x] **T3.1** Create `LanguageSwitcher` Client Component — `useLocale`, `useRouter`, `usePathname` from i18n navigation, DropdownMenu with EN/ES options. File: `src/features/i18n/components/language-switcher.tsx` (new). Deps: T1.4. Est: +50 lines. AC: Dropdown shows both locales, click triggers locale change preserving path.
- [x] **T3.2** Modify dashboard layout — add `<LanguageSwitcher>` next to user avatar in header, translate "Sign out" / "Cerrar sesión" via `t('common.signOut')`, translate mobile menu aria-label. File: `src/app/[locale]/layout.tsx` (modify). Deps: T3.1, T2.4. Est: ~15 lines changed. AC: Switcher visible in dashboard, not on login; labels translate.
- [x] **T3.3** Modify Sidebar — nav labels → `useTranslations('sidebar')`, navItems use t() for labels, logout button → `t('common.signOut')`, brand name "The Fancy Faces" hardcoded, update imports (use i18n navigation Link). File: `src/features/auth/components/sidebar.tsx` (modify). Deps: T1.4. Est: ~40 lines changed. AC: Nav labels render per locale, brand name unchanged, role-based visibility preserved.

## Phase 4: Types & Currency

- [x] **T4.1** Modify `PaymentMethods` → keys (`'cash'`, `'transfer'`, `'card'`, `'credit'`, `'creditNote'`, `'other'`). File: `src/features/expenses/types/index.ts` (modify). Deps: none. Est: ~10 lines changed. AC: Methods are translatable keys, not display strings.
- [x] **T4.2** Modify `RegisteredByValues` → keys (`'anaPaula'`, `'leandro'`, `'monica'`, `'lizeth'`, `'owner'`, `'other'`). File: `src/features/expenses/types/index.ts` (modify). Deps: none. Est: ~8 lines changed. AC: Values are translatable keys.
- [x] **T4.3** Modify `SiNoValues` → keys (`'yes'`, `'no'`). File: `src/features/expenses/types/index.ts` (modify). Deps: none. Est: ~4 lines changed. AC: SiNo values are keys.
- [x] **T4.4** Update Zod schemas to use key-based enums. File: `src/features/expenses/types/index.ts` (modify). Deps: T4.1, T4.2, T4.3. Est: ~5 lines changed. AC: Schemas validate against key-based values.
- [x] **T4.5** Create `src/shared/lib/currency.ts` with `CURRENCY = 'AWG' as const` and `formatCurrency(amount, locale)`. File: `src/shared/lib/currency.ts` (new). Deps: none. Est: +25 lines. AC: AWG formatting works for en and es, locale-aware separators.

## Phase 5: Expenses Feature Translation

- [x] **T5.1** Translate `ExpenseTable` — column headers → `t('expenses.columns.*')`, formatMonto → `formatCurrency(monto, locale)`, formatFecha → locale-aware `date-fns` format, all filter labels, empty states, pagination, action items, delete dialog, error states via `t()`. File: `src/features/expenses/components/expense-table.tsx` (modify). Deps: T4.5. Est: ~60 lines changed. AC: All table text translates per locale, currency shows AWG, dates locale-aware.
- [x] **T5.2** Translate `ExpenseForm` — dialog titles, descriptions, all field labels/placeholders, validation messages, submit button, submitting state, toasts, quick category dialog via `t()`. Files: `src/features/expenses/components/expense-form.tsx` (modify). Deps: T4.1-T4.3. Est: ~70 lines changed. AC: All form text translates, payment method/show/registered by options show translated values, toasts in correct locale.
- [x] **T5.3** Translate `CategoryManager` — dialog title/description, add section, rename actions, delete dialog, empty states, toasts, errors via `t()`. File: `src/features/expenses/components/category-manager.tsx` (modify). Deps: T4.5. Est: ~50 lines changed. AC: All category manager text translates.

## Phase 6: Admin Users Translation

- [x] **T6.1** Translate `CreateUserForm` — all labels, placeholders, validation messages, success/error messages, role labels, access denied card via `t('users.*')` and `t('common.*')`. Fix the English-only bug. File: `src/features/admin-users/components/create-user-form.tsx` (modify). Deps: T1.4. Est: ~60 lines changed. AC: Form renders in correct locale, role options translate, validation messages translate, access denied card translates.
- [x] **T6.2** Translate `UserList` — table headers, empty state, date formatting via locale-aware `Intl.DateTimeFormat`. File: `src/features/admin-users/components/user-list.tsx` (modify). Deps: none. Est: ~20 lines changed. AC: Headers and empty state translate, date formats per locale.

## Phase 7: Tests

- [x] **T7.1** Write translation key parity test — en.json and es.json must have identical key structure (recursive). File: new test file. Deps: T1.6, T1.7. Est: +40 lines. AC: Test passes if keys match, fails if key missing in either locale.
- [x] **T7.2** Write `formatCurrency` unit tests — AWG in en and es locales, locale-specific separators, CURRENCY constant export. File: new test file. Deps: T4.5. Est: +30 lines. AC: Tests pass for both locales, format matches spec scenarios.
- [x] **T7.3** Write `LanguageSwitcher` component test — renders dropdown with both options, click triggers `router.replace`. File: new test file. Deps: T3.1, T1.9. Est: +40 lines. AC: Dropdown renders, locale switch triggers navigation.
- [x] **T7.4** Write middleware matcher test — `/login` excluded, `/en/dashboard` matched, `/api/admin/users` excluded. Use `vi.mock` to isolate. File: new test file. Deps: T1.8. Est: +30 lines. AC: Matcher rules verified via unit tests.
- [x] **T7.5** Update existing expense component tests — wrap with `render-with-i18n.tsx`, update assertions for translated labels, update type comparisons for key-based values. Files: modify `__tests__/expense-table.test.tsx`, `expense-form.test.tsx`, `category-manager.test.tsx`. Deps: T1.9, T5.1-T5.3. Est: ~60 lines changed. AC: Tests pass with i18n wrapper, assert translated output.

## Commit Plan

| # | Conventional Message | Work Unit |
|---|---------------------|-----------|
| 1 | `feat(i18n): install next-intl and create i18n core infrastructure` | T1.1-T1.7 |
| 2 | `feat(i18n): integrate next-intl middleware with existing proxy` | T1.8 |
| 3 | `test(i18n): add render-with-i18n test utility` | T1.9 |
| 4 | `feat(i18n): migrate layouts to dynamic locale and [locale] route group` | T2.1-T2.7 |
| 5 | `feat(i18n): add LanguageSwitcher component and translate sidebar` | T3.1-T3.3 |
| 6 | `feat(i18n): migrate expense types to translatable keys` | T4.1-T4.4 |
| 7 | `feat(i18n): add AWG currency constant and formatCurrency utility` | T4.5 |
| 8 | `feat(i18n): translate expense table and form components` | T5.1-T5.2 |
| 9 | `feat(i18n): translate category manager` | T5.3 |
| 10 | `fix(i18n): translate admin users create form (was English-only)` | T6.1 |
| 11 | `feat(i18n): translate user list table` | T6.2 |
| 12 | `test(i18n): add translation parity, formatCurrency, LanguageSwitcher, and middleware tests` | T7.1-T7.4 |
| 13 | `test(i18n): update existing component tests for translation support` | T7.5 |
