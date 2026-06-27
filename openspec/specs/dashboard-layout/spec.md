# Delta for Dashboard Layout

## MODIFIED Requirements

### Requirement: Main Content Area Background

The main content area (`<main>`) MUST use warm cream background:

```tsx
<main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
```

Where `bg-background` resolves to `--background` = `#FFFAF5` (OKLCH 0.99 0.01 85).

(Previously: `bg-muted/20` which resolved to a light neutral gray)

#### Scenario: Dashboard main area shows warm cream

- GIVEN an authenticated user loads any dashboard route
- WHEN the main content area renders
- THEN the background color is #FFFAF5 (warm cream)
- AND NOT white or gray

---

### Requirement: Loading Spinner Colors

The authentication loading spinner MUST use the new primary color:

```tsx
<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
```

(Previously: `border-primary` with old neutral primary token)

#### Scenario: Loading spinner shows dusty rose

- GIVEN the auth check is in progress
- WHEN the loading spinner displays
- THEN the spinner border color is #714B67 (dusty rose)
- AND the transparent segment creates the spinning effect

---

### Requirement: Top Bar Header Styling

The top header bar MUST use:
- Background: `bg-background` (white #FFFFFF for the bar itself)
- Border bottom: `border-b border-border` (#DBD4CE warm neutral)
- User avatar dropdown trigger: `text-foreground` (#505050)

(Previously: Used `border-b` with old border token, neutral colors)

#### Scenario: Header bar has warm neutral border

- GIVEN the dashboard layout renders
- WHEN the top header is visible
- THEN the bottom border is #DBD4CE (warm neutral)
- AND user avatar text is #505050

---

### Requirement: Mobile Sheet Sidebar Background

The mobile sheet (`SheetContent`) MUST use:
- Background: `bg-sidebar` (#FFFFFF)
- Border: `border-r border-sidebar-border` (#DBD4CE)

(Previously: Inherited from old sidebar tokens)

#### Scenario: Mobile sidebar matches desktop styling

- GIVEN a user opens the mobile menu (viewport < md)
- WHEN the sheet slides in
- THEN background is white
- AND right border is warm neutral
- AND navigation items use same active/hover tokens as desktop

---

## ADDED Requirements

### Requirement: Gold Accent Decorative Elements

The dashboard layout MAY use `--gold` (#FFCB30) ONLY for decorative elements:
- Badge borders
- Icon accents
- Horizontal separators (`hr` with `border-gold`)
- Decorative dividers

Gold MUST NOT be used on interactive elements (buttons, links, inputs, focus rings).

#### Scenario: Gold appears only decoratively

- GIVEN a dashboard page includes a decorative badge
- WHEN the badge renders with `border-gold` or `text-gold`
- THEN the gold color (#FFCB30) is visible
- AND no button, link, or input uses gold for background, text, or border