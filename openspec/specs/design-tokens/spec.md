# Design Tokens Specification

## Purpose

Define the complete brand design token system for The Fancy Faces Beauty Studio admin app, including color palette, typography scale, spacing, radius, and the gold-as-decorative-only accessibility constraint.

## Requirements

### Requirement: Brand Color Palette

The system MUST define a warm, luxury beauty salon color palette using OKLCH values for Tailwind v4 compatibility.

The system MUST provide the following color tokens in `:root` (no dark mode):

| Token | OKLCH Value | Hex | Usage |
|-------|-------------|-----|-------|
| `--background` | `oklch(0.99 0.01 85)` | #FFFAF5 | Dashboard background (warm cream) |
| `--foreground` | `oklch(0.32 0.01 85)` | #505050 | Primary text |
| `--card` | `oklch(1 0 0)` | #FFFFFF | Cards, sidebar, modals |
| `--card-foreground` | `oklch(0.32 0.01 85)` | #505050 | Text on cards |
| `--popover` | `oklch(1 0 0)` | #FFFFFF | Popovers, dropdowns |
| `--popover-foreground` | `oklch(0.32 0.01 85)` | #505050 | Text on popovers |
| `--primary` | `oklch(0.42 0.12 345)` | #714B67 | Interactive: buttons, links, active states |
| `--primary-foreground` | `oklch(0.98 0.01 85)` | #FFFAF5 | Text on primary |
| `--secondary` | `oklch(0.72 0.12 15)` | #EA838D | Hover states, secondary badges |
| `--secondary-foreground` | `oklch(0.98 0.01 85)` | #FFFAF5 | Text on secondary |
| `--muted` | `oklch(0.95 0.01 85)` | #F5EDE8 | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.45 0.01 85)` | #7A7A7A | Muted text |
| `--accent` | `oklch(0.95 0.01 85)` | #F5EDE8 | Accent backgrounds |
| `--accent-foreground` | `oklch(0.32 0.01 85)` | #505050 | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | #DC2626 | Errors, deletions (standard red) |
| `--destructive-foreground` | `oklch(0.985 0 0)` | #FFFFFF | Text on destructive |
| `--border` | `oklch(0.88 0.01 85)` | #DBD4CE | Borders, dividers |
| `--input` | `oklch(0.88 0.01 85)` | #DBD4CE | Input borders |
| `--ring` | `oklch(0.42 0.12 345)` | #714B67 | Focus rings (matches primary) |
| `--sidebar` | `oklch(1 0 0)` | #FFFFFF | Sidebar background |
| `--sidebar-foreground` | `oklch(0.32 0.01 85)` | #505050 | Sidebar text |
| `--sidebar-primary` | `oklch(0.42 0.12 345)` | #714B67 | Sidebar active items |
| `--sidebar-primary-foreground` | `oklch(0.98 0.01 85)` | #FFFAF5 | Text on sidebar primary |
| `--sidebar-accent` | `oklch(0.95 0.01 85)` | #F5EDE8 | Sidebar hover |
| `--sidebar-accent-foreground` | `oklch(0.32 0.01 85)` | #505050 | Text on sidebar accent |
| `--sidebar-border` | `oklch(0.88 0.01 85)` | #DBD4CE | Sidebar borders |
| `--sidebar-ring` | `oklch(0.42 0.12 345)` | #714B67 | Sidebar focus rings |
| `--gold` | `oklch(0.85 0.18 85)` | #FFCB30 | **Decorative ONLY** — badges, icons, borders, separators |

#### Scenario: Color tokens resolve in Tailwind v4

- GIVEN the `@theme inline` block defines all `--color-*` mappings to CSS variables
- WHEN a component uses `bg-primary`, `text-primary-foreground`, `bg-gold`, etc.
- THEN the correct OKLCH values render in the browser
- AND no dark mode variables exist (`.dark` block removed)

#### Scenario: Gold token restricted to decorative use

- GIVEN the `--gold` token is defined
- WHEN a developer applies `bg-gold`, `text-gold`, or `border-gold` to an interactive element (button, link, input)
- THEN a lint rule SHOULD warn "Gold is decorative-only; use primary/secondary for interactive elements"
- AND code review MUST reject gold on interactive elements

---

### Requirement: Typography Scale

The system MUST define font families via CSS variables mapped to Tailwind's `@theme inline`:

| Variable | Font | Weights | Variable Name |
|----------|------|---------|---------------|
| `--font-heading` | Playfair Display | 400, 500, 600, 700 + italic | `--font-heading` |
| `--font-sans` | Poppins | 300, 400, 500, 600, 700 | `--font-sans` |
| `--font-mono` | Geist Mono | 400, 500, 600, 700 | `--font-mono` |

The `@theme inline` MUST map:
- `--font-heading` → `var(--font-heading)`
- `--font-sans` → `var(--font-sans)`
- `--font-mono` → `var(--font-mono)`

#### Scenario: Heading text uses Playfair Display

- GIVEN a component renders `<h1 className="font-heading">`
- WHEN the page loads
- THEN Playfair Display renders at the specified weight
- AND no Flash of Unstyled Text (FOUT) occurs (`display: swap` via `next/font`)

#### Scenario: Body/UI text uses Poppins

- GIVEN a component renders `<p className="font-sans">`
- WHEN the page loads
- THEN Poppins renders at the specified weight
- AND no FOUT occurs

#### Scenario: Monospace uses Geist Mono

- GIVEN a component renders `<code className="font-mono">`
- WHEN the page loads
- THEN Geist Mono renders
- AND no FOUT occurs

---

### Requirement: Radius Scale

The system MUST define a consistent radius scale derived from `--radius: 0.625rem` (10px):

| Token | Calculation | Value |
|-------|-------------|-------|
| `--radius-sm` | `calc(var(--radius) * 0.6)` | 0.375rem (6px) |
| `--radius-md` | `calc(var(--radius) * 0.8)` | 0.5rem (8px) |
| `--radius-lg` | `var(--radius)` | 0.625rem (10px) |
| `--radius-xl` | `calc(var(--radius) * 1.4)` | 0.875rem (14px) |
| `--radius-2xl` | `calc(var(--radius) * 1.8)` | 1.125rem (18px) |
| `--radius-3xl` | `calc(var(--radius) * 2.2)` | 1.375rem (22px) |
| `--radius-4xl` | `calc(var(--radius) * 2.6)` | 1.625rem (26px) |

---

### Requirement: Chart Colors

The system MUST define 5 chart colors using the brand palette:

| Token | OKLCH Value | Purpose |
|-------|-------------|---------|
| `--chart-1` | `oklch(0.72 0.12 15)` | #EA838D (soft pink) |
| `--chart-2` | `oklch(0.42 0.12 345)` | #714B67 (primary) |
| `--chart-3` | `oklch(0.85 0.18 85)` | #FFCB30 (gold) |
| `--chart-4` | `oklch(0.55 0.02 85)` | Muted warm gray |
| `--chart-5` | `oklch(0.32 0.01 85)` | #505050 (foreground) |

---

### Requirement: No Dark Mode

The system MUST NOT include a `.dark` block in `globals.css`.

#### Scenario: Dark mode variables absent

- GIVEN `globals.css` is loaded
- WHEN the browser prefers dark mode
- THEN no CSS variables under `.dark` exist
- AND the warm cream theme renders regardless of system preference