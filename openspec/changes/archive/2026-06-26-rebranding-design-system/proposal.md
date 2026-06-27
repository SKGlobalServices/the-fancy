# Proposal: Rebranding — Design System (The Fancy Faces)

## Intent

Replace the generic admin UI with the brand identity of **The Fancy Faces Beauty Studio** (Aruba). Current look uses Geist font, neutral grays, and Scissors icon — doesn't reflect the luxury beauty salon aesthetic or the "You deserve a fancy life!" positioning.

## Scope

### In Scope
- Color tokens: warm cream bg (#FFFAF5), dusty rose primary (#714B67), soft pink secondary (#ea838d), gold accent (#ffcb30, decorative-only)
- Typography: Playfair Display (headings) + Poppins (body) via Google Fonts
- Sidebar: logo\_navbar.webp replaces Scissors icon, brand name → "The Fancy Faces"
- Dashboard: warm cream background, updated welcome text with tagline
- globals.css: full token set in `@theme inline`, remove dark mode vars
- Metadata: title → "The Fancy Faces"

### Out of Scope
- Dark mode (deferred)
- Public website or client-facing pages
- Functional or behavioral spec changes

## Capabilities

### New Capabilities
- `design-tokens`: brand color system, typography scale, gold decorative-only accessibility rule

### Modified Capabilities
- None (visual-only rebranding, no spec-level behavior changes)

## Approach

1. Update `globals.css` — replace all color tokens with brand palette, add CSS variables for gold-as-decorative, strip `.dark` block, add Poppins/Playfair Display font-face hooks
2. Update `layout.tsx` — import Playfair Display + Poppins via `next/font/google`, update metadata title + description
3. Update `sidebar.tsx` — replace `<Scissors>` with `<Image src="/logo_navbar.webp">`, update brand text
4. Update dashboard layout — warm cream bg on main area, update spinner
5. Update dashboard page — welcome text + tagline "You deserve a fancy life!"
6. Visual regression pass across all dashboard routes

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modified | Brand color tokens, font hooks, remove dark mode |
| `src/app/layout.tsx` | Modified | Google Fonts imports, metadata title |
| `src/features/auth/components/sidebar.tsx` | Modified | Logo image, brand name, accent colors |
| `src/app/(dashboard)/layout.tsx` | Modified | Background, spinner, header styling |
| `src/app/(dashboard)/page.tsx` | Modified | Welcome text + tagline |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Gold (#ffcb30) used on interactive elements (1.3:1 contrast) | Low | CSS custom property convention, lint rule, code review |
| Google Fonts render-blocking or layout shift | Low | `next/font` with `display=swap`, preload, font-display swap |
| Existing components assume old color tokens | Med | Target diff against 5 files only; visual regression after apply |

## Rollback

`git checkout` on the 5 modified files reverts all changes. Tokens and fonts are fully scoped — no DB or API changes.

## Success Criteria

- [ ] Dashboard background is warm cream (#FFFAF5), not white
- [ ] Gold (#ffcb30) appears ONLY in decorative elements (badges, borders, icons, separators)
- [ ] All interactive elements use #714B67 (primary) or #ea838d (secondary)
- [ ] Sidebar shows logo\_navbar.webp + "The Fancy Faces"
- [ ] Playfair Display renders headings, Poppins renders body text
- [ ] Google Fonts load without visible FOUT
- [ ] `<title>` reads "The Fancy Faces"
