# Delta for Sidebar

## MODIFIED Requirements

### Requirement: Brand Identity in Sidebar

The sidebar header MUST display:
- Brand logo: `<Image src="/logo_navbar.webp" alt="The Fancy Faces" width={32} height={32} />`
- Brand name: "The Fancy Faces" (text-lg font-semibold tracking-tight)
- Logo and name wrapped in a flex container with gap-2

The logo MUST use `next/image` with `priority` for above-the-fold loading.

(Previously: `<Scissors className="h-5 w-5 text-primary" />` icon with text "The Fancy")

#### Scenario: Sidebar shows brand logo and name

- GIVEN an authenticated user views any dashboard route
- WHEN the sidebar renders
- THEN the logo image loads from `/logo_navbar.webp`
- AND the text "The Fancy Faces" appears next to the logo
- AND both are vertically centered in the 16rem (h-16) header bar

#### Scenario: Logo loads with priority (no layout shift)

- GIVEN the sidebar header is in the initial viewport
- WHEN the page loads
- THEN the logo image has `priority` prop set
- AND no Cumulative Layout Shift (CLS) occurs from the logo

---

### Requirement: Sidebar Navigation Active State Colors

Active navigation items MUST use the new primary token:
- Background: `bg-primary/10` (dusty rose 10% opacity)
- Text/icon: `text-primary` (#714B67)

Inactive/hover items MUST use:
- Hover background: `hover:bg-accent`
- Hover text: `hover:text-accent-foreground`

(Previously: Active used `bg-primary/10 text-primary` with old primary; hover used `hover:bg-accent hover:text-accent-foreground`)

#### Scenario: Active nav item shows dusty rose accent

- GIVEN a user is on the Dashboard route ("/")
- WHEN the sidebar renders
- THEN the Dashboard link has `bg-primary/10 text-primary`
- AND the primary color resolves to #714B67 (OKLCH 0.42 0.12 345)

#### Scenario: Hover on inactive item uses warm accent

- GIVEN a user hovers over "Gastos" while on Dashboard
- WHEN the hover state triggers
- THEN background uses `bg-accent` (warm cream #F5EDE8)
- AND text uses `text-accent-foreground` (#505050)

---

### Requirement: Sidebar Background and Borders

The sidebar MUST use:
- Background: `bg-background` → resolves to sidebar variable (#FFFFFF)
- Border right: `border-r border-sidebar-border` (#DBD4CE)
- Text: `text-sidebar-foreground` (#505050)

(Previously: `bg-background` with old neutral tokens)

#### Scenario: Sidebar renders white with warm borders

- GIVEN the sidebar renders
- WHEN viewed in browser
- THEN background is pure white (#FFFFFF)
- AND right border is warm neutral (#DBD4CE)
- AND all text is warm gray (#505050)

---

## REMOVED Requirements

### Requirement: Lucide Scissors Icon as Brand Mark

(Reason: Replaced by brand logo image `/logo_navbar.webp` per rebranding)
(Migration: Import `Image` from `next/image`; remove `Scissors` from `lucide-react` imports)