# MASTER_PROMPT.md


```
You are building "Linkwise", a WordPress internal-linking SaaS, from the existing Stitch design.

STEP 0: READ FIRST
Read AGENTS.md, then docs/PRD.md, DESIGN_SYSTEM.md, ARCHITECTURE.md, SECURITY.md, CODE_STYLE.md, DATABASE.md and API.md. They are the source of truth for scope, rules, stack, data and endpoints. Do not add packages other than the ones already installed. If anything conflicts or is missing, ask before assuming.

STEP 1: READ THE DESIGN
Use the Stitch tools to open the project "Linkwise Design System & App". List all 13 screens and the design system. For each screen you build, open the matching Stitch screen and match its layout, spacing, content and components. Use the colour and type tokens from docs/DESIGN_SYSTEM.md. The screens are mapped to routes in the PRD table.

BUILD IN PHASES. After each phase, run lint, typecheck and build, summarise what you did, list anything you were unsure about, and STOP and wait for my "continue".

PHASE 1: Foundation and all 13 screens with mock data
- Add the theme tokens to app/globals.css, load Inter, map shadcn variables to the tokens.
- Build the marketing, auth, onboarding and app layouts (route groups from ARCHITECTURE.md), including the 240px sidebar, mobile top bar and the 3-step indicator.
- Build all 13 screens as pixel-faithful UI using typed data from lib/mock-data.ts (greenleafgardening.com sample). Include loading, empty and error states.
- Make landing, pricing, signup, login and weekly report responsive at 390px.
- No backend yet. Navigation between all screens must work.

PHASE 2: Auth
- Supabase clients (browser, server, admin), middleware protecting /app and /onboarding, signup, login, Google sign in, logout.
- Create migrations for profiles and subscriptions with RLS. Show me the SQL before applying.

PHASE 3: Sites and onboarding
- Migrations for sites, scans, pages, page_links, suggestions, activity_log, report_snapshots with RLS and indexes, exactly as in DATABASE.md. Show me the SQL before applying.
- lib/crypto.ts (AES-256-GCM), lib/wordpress/client.ts (SSRF-safe), test-connection and create-site endpoints, the Connect site screen wired up, plan limits in lib/billing/plans.ts.

PHASE 4: Scan engine
- Chunked scan (POST /api/scans/:id/step), parse-links with cheerio, orphan detection, broken link checks, health-score.ts with Vitest tests, the First scan screen with live progress.
- Wire the Overview screen to real data.

PHASE 5: Suggestions
- Full-text candidate search, Groq scoring with zod-validated JSON, suggestions table with filters, pagination, expanded row, apply, dismiss, bulk apply and undo (apply-link.ts with tests). Never edit WordPress except in the apply flow.

PHASE 6: Orphans, broken links, report, settings
- Wire screens 9, 10, 11, 12 to real data. Report chart from report_snapshots. "Download PDF" uses a print stylesheet.

PHASE 7: Billing
- Lemon Squeezy checkout, customer portal, signature-verified webhook, Billing screen, plan enforcement across the app, pricing page CTAs.

PHASE 8: Weekly email and launch checks
- Resend weekly report email, the Vercel cron route protected by CRON_SECRET, .env.example complete, security checklist from SECURITY.md reviewed line by line, README with setup steps.

RULES
- One phase at a time. Do not skip ahead.
- Never invent endpoints, tables or colours that are not in the docs.
- Never put secrets in code or commit .env.local.
- When you finish a phase, tell me exactly how to test it.
Begin with STEP 0 and STEP 1, confirm the 13 screens you found, then start PHASE 1.
```
