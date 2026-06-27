# Design: Rebranding — Design System (The Fancy Faces)

## Technical Approach

Replace color tokens, typography, and brand identity across 5 files — no logic or data changes. Strategy: update the design token layer first (CSS variables → `@theme inline`), then font configuration in the root layout, then visual skinning per component. Specs mapped: `design-tokens`, `app-layout`, `sidebar`, `dashboard-layout`, `dashboard-page`.

Implementation order: `globals.css` → `layout.tsx` → `sidebar.tsx` → `(dashboard)/layout.tsx` → `(dashboard)/page.tsx`.

## Architecture Decisions

### Decision: Color Token Delivery

| Option | Tradeoff | Decision |
|--------|----------|----------|
| CSS custom properties in `:root` only | Works but Tailwind v4 needs `@theme inline` mapping | Keep existing pattern: `:root` vars + `@theme inline` `--color-*` references |
| Define OKLCH directly in `@theme inline` | Duplicates values (spec vs vars), harder to inspect | Use CSS vars as single source of truth |

### Decision: Font Loading

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `next/font/google` with CSS variables | Zero CLS, FOUT avoided via `display:swap` | Use Playfair Display → `--font-heading`, Poppins → `--font-sans`, retain Geist Mono → `--font-mono` |
| `@import` from Google Fonts CSS | Render-blocking, layout shift, no Next.js optimization | Rejected |

### Decision: Dark Mode Removal

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Keep `.dark` block inactive | Dead code, confuses future devs | Delete entire `.dark` block — spec explicitly forbids it |
| Leave empty `.dark` | Cleaner diff but tech debt | Full removal |

### Decision: Gold Decorative Token

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add `--gold` as regular `--color-*` | Accessible in Tailwind but risk of misuse | Add with naming convention in `:root`; lint rule deferred |
| Omit from `@theme inline` | No gold classes available; defeats purpose | Include in `@theme inline` as `--color-gold` |

## Data Flow

```
@theme inline (Tailwind classes)
        │
        ▼
:root CSS variables (OKLCH values)
        │
        ▼
next/font variables (className on <html>)
        │
        ▼
Components (bg-primary, text-foreground, font-heading, etc.)
```

No runtime data flow — all static CSS resolution.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modify | Replace `:root` tokens with brand palette (OKLCH), add `--gold`, add `--font-heading`/`--font-sans` mapping, delete `.dark` block |
| `src/app/layout.tsx` | Modify | Import Playfair Display + Poppins, set CSS variables, update metadata title/description |
| `src/features/auth/components/sidebar.tsx` | Modify | Replace `Scissors` with `<Image src="/logo_navbar.webp">`, update brand text to "The Fancy Faces", import `next/image` |
| `src/app/(dashboard)/layout.tsx` | Modify | Change `<main>` from `bg-muted/20` to `bg-background` |
| `src/app/(dashboard)/page.tsx` | Modify | Add `font-heading` to `<h1>`, update welcome text with tagline "You deserve a fancy life!" |

## Interfaces / Contracts

No new interfaces. The contract is the CSS variable set in `:root` and the corresponding `@theme inline` mappings — any component using Tailwind utility classes (`bg-primary`, `text-foreground`, `font-heading`) implicitly conforms.

```css
/* @theme inline pattern — already established in codebase */
@theme inline {
  --color-primary: var(--primary);
  --color-gold: var(--gold);
  /* ... all other tokens follow same pattern */
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual | Color tokens, fonts, logo, brand text | Manual visual regression across all dashboard routes |
| Build | No TypeScript/compilation errors | `pnpm build` or `pnpm typecheck` |
| A11y | Gold not on interactive elements, contrast ratios | Code review (lint rule deferred per proposal) |

## Migration / Rollout

No migration required. Rollback: `git checkout` on the 5 modified files reverts all changes. No DB or API dependencies.

## Open Questions

- None — all decisions are mapped from specs.
