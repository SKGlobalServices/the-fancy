# Delta for Dashboard Page

## MODIFIED Requirements

### Requirement: Welcome Heading Typography

The dashboard page heading (`<h1>`) MUST use:
- Font: Playfair Display (`font-heading`)
- Size: `text-3xl` (or larger per design)
- Weight: `font-bold` (700)
- Tracking: `tracking-tight`

(Previously: `text-3xl font-bold tracking-tight` with Geist Sans via `font-sans`)

#### Scenario: Dashboard title renders in Playfair Display

- GIVEN a user loads the dashboard home page ("/")
- WHEN the welcome section renders
- THEN the `<h1>` uses Playfair Display
- AND weight is 700 (bold)
- AND no FOUT occurs

---

### Requirement: Welcome Subtitle Typography

The welcome subtitle (`<p className="text-muted-foreground">`) MUST use:
- Font: Poppins (`font-sans` via default)
- Color: `text-muted-foreground` (#7A7A7A)
- Size: base (default)

(Previously: Same styling but with Geist Sans)

#### Scenario: Subtitle renders in Poppins with muted color

- GIVEN the dashboard home page loads
- WHEN the subtitle renders
- THEN font is Poppins
- AND color is warm muted gray (#7A7A7A)

---

## ADDED Requirements

### Requirement: Brand Tagline

The welcome section MUST include the brand tagline:

```tsx
<p className="mt-1 text-muted-foreground">
  Welcome to The Fancy Faces administration panel. You deserve a fancy life!
</p>
```

(Previously: "Welcome to The Fancy administration panel." — no tagline)

#### Scenario: Tagline appears in welcome text

- GIVEN a user loads the dashboard home page
- WHEN the welcome section renders
- THEN the text includes "You deserve a fancy life!"
- AND the tagline is part of the same paragraph as the welcome message

---

### Requirement: Page Title Metadata

The dashboard page inherits the root layout metadata ("The Fancy Faces") — no page-specific title override needed.

#### Scenario: Browser tab shows brand title on dashboard

- GIVEN a user navigates to "/"
- WHEN the page loads
- THEN the browser tab reads "The Fancy Faces"