# Design: i18n Support for The Fancy Faces

## Architecture Overview

Request flow for locale-aware rendering:

```
Browser ──→ next-intl Middleware ──→ /[locale]/... route
  │                                      │
  │  /login (excluded) ◄──┐              │
  │  /api/* (excluded) ◄──┘              │
  │                                      ▼
  │                            src/i18n/request.ts
  │                            loads en.json / es.json
  │                                      │
  │                                      ▼
  │                            [locale]/layout.tsx
  │                            NextIntlClientProvider
  │                            (messages + locale context)
  │                                      │
  │                   ┌──────────────────┼──────────────────┐
  │                   ▼                  ▼                  ▼
  │           Server Components    Client Components  LanguageSwitcher
  │           getTranslations()    useTranslations()  useRouter() +
  │                                                   usePathname()
```

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Library | `next-intl` with `localePrefix: 'always'` | `react-i18next`, custom i18n | Tight Next.js integration, built-in middleware, type-safe keys via `createSharedTypes` |
| Login page | No i18n, no locale prefix, no switcher | Wrapping login in i18n provider | Security: login must be frictionless. 100% English, excluded from middleware matcher |
| Route structure | `[locale]/` wraps all dashboards, login stays at root | Double layouts, query-param locale | Clearer URL semantics, no duplicate route groups, middleware handles one pattern |
| Translation type safety | `createSharedTypes<typeof en>()` from `next-intl` | Runtime key checking only | Compile-time errors for missing keys, en.json is source of truth |
| Expense types | Display values → translation keys (e.g., `PaymentMethods: ['cash', 'transfer']`) | Keeping Spanish strings + mapping | Keys are locale-agnostic; `t('expenses.paymentMethods.cash')` resolves per locale |
| Currency | `CURRENCY = 'AWG'` constant + `Intl.NumberFormat` | Hardcoded ARS | Single source of truth, locale-aware formatting via `en-AW` / `es-AW` |

## Data Flow

```
                    Middleware Flow
                    ──────────────
  Request ──→ createMiddleware() ──→ Cookie check ──→ Accept-Language ──→ en fallback
                  │                       │                    │
                  ▼                       ▼                    ▼
            /login or /api/*        Has cookie?          No cookie?
                  │                       │                    │
                  ▼                       ▼                    ▼
             passthrough            use cookie          detect & redirect
             (no locale)                                 /en/path

                    Component Data Flow
                    ──────────────────
  getRequestConfig({ request })
       │
       ├── Loads en.json or es.json based on locale
       └── Returns { locale, messages, timeZone }

  [locale]/layout.tsx
       │
       └── NextIntlClientProvider locale={locale} messages={messages}
                │
                ├── Server Components: getTranslations('namespace')('key')
                └── Client Components: useTranslations('namespace')('key')
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/i18n/routing.ts` | Create | `defineRouting({ locales: ['en','es'], defaultLocale: 'en' })` |
| `src/i18n/request.ts` | Create | `getRequestConfig` — loads `{locale}.json` per request |
| `src/i18n/navigation.ts` | Create | `createSharedPathnamesNavigation` — Link, redirect, useRouter, usePathname |
| `src/i18n/locales/en.json` | Create | English namespace dictionary (common, navigation, auth, dashboard, expenses, categories, users, sidebar, language) |
| `src/i18n/locales/es.json` | Create | Spanish namespace dictionary (same structure as en.json) |
| `src/shared/lib/currency.ts` | Create | `CURRENCY = 'AWG'` constant + `formatCurrency(amount, locale)` |
| `src/middleware.ts` | Create | next-intl `createMiddleware` + config. Excludes: `/login`, `/api/*`, `/_next/*`, `/favicon.ico`, `/logo*`, `/images/*` |
| `src/app/layout.tsx` | Modify | Dynamic `<html lang={locale}>`, `generateMetadata` per locale, remove hardcoded `lang="es"` |
| `src/app/[locale]/layout.tsx` | Create | `NextIntlClientProvider` wrapper for locale children |
| `src/app/[locale]/page.tsx` | Create | Redirect root `/[locale]` to `/[locale]/dashboard` |
| `src/app/[locale]/dashboard/page.tsx` | Move | Current `(dashboard)/page.tsx` → translated via `getTranslations('dashboard')` |
| `src/app/[locale]/dashboard/gastos/page.tsx` | Move | Current `(dashboard)/dashboard/gastos/page.tsx` |
| `src/app/[locale]/admin/users/page.tsx` | Move | Current `(dashboard)/admin/users/page.tsx` |
| `src/app/[locale]/layout.tsx` | Modify/Move | Current `(dashboard)/layout.tsx` → add `<LanguageSwitcher>`, translated labels, locale-aware auth guard redirect |
| `src/app/(dashboard)/layout.tsx` | Delete | Replaced by `[locale]/layout.tsx` |
| `src/app/(dashboard)/page.tsx` | Delete | Replaced by `[locale]/dashboard/page.tsx` |
| `src/app/(dashboard)/admin/users/page.tsx` | Delete | Replaced by `[locale]/admin/users/page.tsx` |
| `src/app/(dashboard)/dashboard/gastos/page.tsx` | Delete | Replaced by `[locale]/dashboard/gastos/page.tsx` |
| `src/features/auth/components/sidebar.tsx` | Modify | Nav labels → `t('sidebar.*')`, logout → `t('common.signOut')`, brand name hardcoded |
| `src/features/expenses/components/expense-table.tsx` | Modify | Column headers → `t('expenses.columns.*')`, `formatMonto` → `formatCurrency`, date → locale-aware, all strings translated |
| `src/features/expenses/components/expense-form.tsx` | Modify | Labels, placeholders, validation, toasts → `t()` calls |
| `src/features/expenses/components/category-manager.tsx` | Modify | All UI strings → `t('categories.*')` and `t('common.*')` |
| `src/features/expenses/types/index.ts` | Modify | `PaymentMethods` → keys (`'cash'`, `'transfer'`, etc.), `RegisteredByValues` → keys, `SiNoValues` → `['yes', 'no']` |
| `src/features/admin-users/components/create-user-form.tsx` | Modify | Full translation: all labels, placeholders, validation, toasts → `t('users.*')` |
| `src/features/admin-users/components/user-list.tsx` | Modify | Table headers, empty state, date formatting → `t('*')` + locale-aware |
| `src/shared/lib/test-setup.ts` | Modify | Add `vi.mock('next-intl', ...)` if needed for test isolation |
| `package.json` | Modify | Add `next-intl` dependency |

## Interfaces / Contracts

```ts
// src/i18n/types.ts — auto-generated type-safe keys
import { createSharedTypes } from 'next-intl';
import en from './locales/en.json';

export type Locale = (typeof import('./routing').locales)[number];
export type IntlMessages = typeof en;
```

```ts
// src/shared/lib/currency.ts
export const CURRENCY = 'AWG' as const;

const localeMap: Record<string, string> = {
  en: 'en-AW',
  es: 'es-AW',
};

export function formatCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(localeMap[locale] ?? locale, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
  }).format(amount);
}
```

```ts
// src/features/i18n/components/language-switcher.tsx — NEW
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Switch language">
          <Languages className="h-4 w-4" />
          <span className="ml-1 text-sm">{locale === 'en' ? 'EN' : 'ES'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={locale === 'en'}
          onClick={() => router.replace(pathname, { locale: 'en' })}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={locale === 'es'}
          onClick={() => router.replace(pathname, { locale: 'es' })}
        >
          Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

```ts
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|login|favicon.ico|logo|images).*)'],
};
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Translation dictionary parity | Test that `en.json` and `es.json` have identical key structure (recursive key comparison) |
| Unit | `formatCurrency` | Test AWG formatting in en and es locales, test locale-specific separators |
| Unit | `LanguageSwitcher` | Mount with mock locale, verify dropdown renders both options, click triggers `router.replace` |
| Integration | `ExpenseTable` with i18n | Create `test-utils/render-with-i18n.tsx` wrapper with `NextIntlClientProvider` + mock messages; update existing snapshot tests |
| Integration | `CreateUserForm` with i18n | Same wrapper, verify labels render from mock messages in both locales |
| Middleware | Locale detection | Unit test the matcher patterns: `/login` excluded, `/en/dashboard` matched, `/api/admin/users` excluded |
| Middleware | Redirect | Test root `/` → `/en/` redirect, `/login` passthrough |

**New test utility** — `src/test-utils/render-with-i18n.tsx`:
```tsx
import { NextIntlClientProvider } from 'next-intl';
import { render, type RenderOptions } from '@testing-library/react';
import enMessages from '@/i18n/locales/en.json';

function renderWithI18n(ui: React.ReactElement, locale = 'en', options?: RenderOptions) {
  return render(
    <NextIntlClientProvider locale={locale} messages={enMessages}>
      {ui}
    </NextIntlClientProvider>,
    options,
  );
}
```

## Migration / Rollout

- **Phase 1**: Install `next-intl`, create `src/i18n/` core (routing, request, navigation, locale files), create middleware
- **Phase 2**: Restructure routes — move dashboards under `[locale]/`, keep login at `/login`, update root layout
- **Phase 3**: Migrate Sidebar, translate nav labels, add LanguageSwitcher to dashboard header
- **Phase 4**: Migrate feature components: expense table/form → translation keys, types → key-based arrays, currency → AWG
- **Phase 5**: Migrate admin users (fix English-only bug), migrate user list, update tests

**Rollback**: Single `git revert` of the feature branch. Remove `src/i18n/`, `src/app/[locale]/`, new middleware, `next-intl` from deps. Restore original route groups and components.

## Open Questions

- [ ] Confirm `es-AW` locale is valid in `Intl.NumberFormat` — fallback to `es` if unsupported
- [ ] Date formatting: confirm `date-fns` locale import pattern for dynamic locale loading (avoid bundling all locales)
