# DESIGN_SYSTEM.md

## Direction
Calm, precise, professional B2B tool. Spirit of Linear, Ahrefs and Plausible. Dense data, lots of alignment, very little decoration. Source of truth for layout: the Stitch project. Source of truth for tokens: this file.

## Colour Tokens
--bg: #FAFAF8              page background
--surface: #FFFFFF         cards, tables, inputs
--border: #E6E4DF          all 1px borders
--text: #1A1A18            primary text
--muted: #6B6A65           secondary text, captions
--primary: #1F6F54         buttons, active nav, relevance bars, links
--primary-hover: #185A44
--primary-tint: #E8F3EE    active nav background, highlights, pill backgrounds
--warning: #B45309         warning status only (301 redirects, usage near limit)
--danger: #B42318          errors only (404, destructive actions)

Rules: one accent only. Never use warning or danger for decoration or buttons (except a destructive button).

## Tailwind v4 theme (app/globals.css)
```css
@import "tailwindcss";
@theme {
  --color-bg: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-border: #E6E4DF;
  --color-text: #1A1A18;
  --color-muted: #6B6A65;
  --color-primary: #1F6F54;
  --color-primary-hover: #185A44;
  --color-primary-tint: #E8F3EE;
  --color-warning: #B45309;
  --color-danger: #B42318;
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --radius-md: 6px;
}
```
Map the shadcn variables (--background, --primary, --border, --ring, --radius) to these tokens.

## Typography (Inter via next/font)
Display (marketing only): 44/52 semibold
Page title: 24/32 semibold
Section title: 16/24 semibold
Body (app): 14/20 regular
Body (marketing): 16/24 regular
Caption: 12/16 medium
All numbers use `tabular-nums`.

## Spacing
8px grid: 4, 8, 16, 24, 32, 48, 64.
App page padding: 32px. Card padding: 20px. Marketing max width: 1120px.

## Radius, Borders, Shadows
Radius 6px everywhere. 1px borders. No shadows, except menus and modals (a very light one).

## Layout
App shell: 240px left sidebar (logo, site switcher, nav, user menu with plan badge). Nav items: Overview, Link suggestions, Orphan pages, Broken links, Weekly report, Settings. Active item: primary text on primary-tint.
Marketing shell: top nav (logo, Features, Pricing, Docs, Log in, "Start free" button) and a 4-column footer.
Onboarding shell: no sidebar, centred 480px column, 3-step indicator.

## Components
- Button: primary (green, white text, 36px), secondary (white, 1px border), ghost, destructive
- Input and select: 36px high, label above, helper text below, error text in danger
- Status pill: 12px text, tinted background. Pending = grey, Applied = green tint, 404 = danger, 301 = warning
- Data table: sticky header, 48px rows, hover background, tabular numbers
- Relevance bar: thin 4px green bar plus the number (example: 0.91)
- KPI block: label, big number, small grey delta, no sparkline
- Tabs: green underline. Modal and drawer: shadcn Dialog and Sheet
- Icons: lucide-react, 16px, grey, never inside coloured circles

## States
Hover: slightly darker or background tint. Focus: 2px green ring, never removed. Disabled: 50% opacity. Loading: skeletons for tables and cards, spinner inside buttons. Empty: one line of text plus one action button. Error: inline message in danger colour with a retry action.

## Responsive
Mobile below 640px, tablet 640 to 1024px, desktop above 1024px.
Must work well on mobile: landing, pricing, signup, login, weekly report.
App screens on mobile: sidebar becomes a top bar with a sheet menu, tables become stacked cards showing the 3 key fields, KPI blocks form a 2x2 grid.

## Accessibility
Text contrast at least 4.5:1. All controls reachable by keyboard. Visible focus ring. Use semantic elements (nav, main, table, button). Icon-only buttons need aria-labels. Colour is never the only status signal: pills always include text.
