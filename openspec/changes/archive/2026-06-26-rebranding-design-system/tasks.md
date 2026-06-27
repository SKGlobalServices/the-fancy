# Tasks: Rebranding — Design System (The Fancy Faces)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~88 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Design Tokens (globals.css)

- [x] 1.1 Replace `:root` variables with brand OKLCH values (warm cream bg, dusty rose primary, soft pink secondary, gold decorative, chart colors)
- [x] 1.2 Add `--gold: oklch(0.85 0.18 85)` token + `--color-gold: var(--gold)` in `@theme inline`
- [x] 1.3 Update `--font-heading` in `@theme inline` to `var(--font-heading)` instead of `var(--font-sans)`
- [x] 1.4 Delete entire `.dark` block (lines 86-118) and `@custom-variant dark` line

## Phase 2: Root Layout (layout.tsx)

- [x] 2.1 Import `Playfair_Display` and `Poppins` from `next/font/google`; configure with weights, subsets, `display:swap`, and CSS variables `--font-heading` / `--font-sans`
- [x] 2.2 Remove `Geist` (Sans) import and config; retain `Geist_Mono`
- [x] 2.3 Apply `playfair.variable` and `poppins.variable` in the `<html>` className alongside `geistMono.variable`
- [x] 2.4 Update metadata: `title` → "The Fancy Faces", `description` → "The Fancy Faces Beauty Studio — Aruba. You deserve a fancy life!"

## Phase 3: Sidebar (sidebar.tsx)

- [x] 3.1 Replace `Scissors` lucide import with `Image` from `next/image` in sidebar
- [x] 3.2 Replace `<Scissors className="h-5 w-5 text-primary" />` with `<Image src="/logo_navbar.webp" alt="The Fancy Faces" width={32} height={32} priority />`
- [x] 3.3 Update brand text from "The Fancy" to "The Fancy Faces"

## Phase 4: Dashboard Layout & Page

- [x] 4.1 In `(dashboard)/layout.tsx`: change `<main>` className from `bg-muted/20` to `bg-background`
- [x] 4.2 In `(dashboard)/page.tsx`: add `font-heading` to `<h1>` className
- [x] 4.3 In `(dashboard)/page.tsx`: update welcome text to include tagline "You deserve a fancy life!"

## Phase 5: Verification

- [x] 5.1 Run `pnpm build` (or `pnpm typecheck`) — zero compilation errors
- [x] 5.2 Visual regression: verify warm cream bg, dusty rose interactive elements, gold decorative-only, logo renders, Playfair Display headings, Poppins body
- [x] 5.3 Confirm browser tab reads "The Fancy Faces" and no dark mode CSS remains
