# Delta for App Layout

## MODIFIED Requirements

### Requirement: Root Layout Font Configuration

The root layout MUST import Playfair Display and Poppins via `next/font/google` with the following configuration:

- **Playfair Display**: weights [400, 500, 600, 700], subsets ["latin"], variable "--font-heading", display "swap"
- **Poppins**: weights [300, 400, 500, 600, 700], subsets ["latin"], variable "--font-sans", display "swap"
- **Geist Mono**: retained, variable "--font-mono", subsets ["latin"], display "swap"

The `<html>` element MUST apply all three font variables: `geistMono.variable`, `playfair.variable`, `poppins.variable`.

(Previously: Used Geist Sans variable "--font-geist-sans" and Geist Mono variable "--font-geist-mono"; --font-heading mapped to --font-sans)

#### Scenario: Fonts load without FOUT

- GIVEN the root layout loads
- WHEN the browser fetches Google Fonts
- THEN `display: swap` ensures fallback fonts show immediately
- AND no layout shift occurs when web fonts load

#### Scenario: CSS variables available globally

- GIVEN the `<html>` element has all three font variables
- WHEN any component uses `font-heading`, `font-sans`, or `font-mono`
- THEN the correct font family renders via Tailwind's `@theme inline` mapping

---

## ADDED Requirements

### Requirement: Metadata Title and Description

The root layout MUST export metadata with:
- `title`: "The Fancy Faces"
- `description`: "The Fancy Faces Beauty Studio — Aruba. You deserve a fancy life!"

(Previously: title "The Fancy - Sistema de Gastos", description "Sistema de gestión de gastos empresariales")

#### Scenario: Browser tab shows brand title

- GIVEN a user opens the admin app
- WHEN the page loads
- THEN the browser tab displays "The Fancy Faces"

#### Scenario: SEO description reflects brand positioning

- GIVEN a search engine crawls the page
- WHEN reading metadata
- THEN description contains "The Fancy Faces Beauty Studio — Aruba" and the tagline