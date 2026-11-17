# ARCHITECTURE.md

## System Overview
Browser
  -> Next.js app on Vercel (pages, route handlers)
      -> Supabase (Auth + Postgres)
      -> WordPress site REST API (read posts and pages, update post content)
      -> Groq API (anchor text and relevance scoring)
      -> Lemon Squeezy (checkout, subscriptions, webhooks)
      -> Resend (weekly report email)

No separate backend, queue, cache or vector database in v1.

## Tech Stack
| Need | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling and UI | Tailwind CSS v4, shadcn/ui, lucide-react |
| Charts | recharts (one line chart only) |
| Auth and DB | Supabase Auth and Postgres, with Row Level Security |
| AI | Groq API (groq-sdk), model set in env GROQ_MODEL |
| HTML parsing | cheerio |
| Validation and forms | zod, react-hook-form |
| Payments | Lemon Squeezy (merchant of record, works from India) |
| Email | Resend |
| Hosting and cron | Vercel (cron for the weekly report) |

Note: Vercel Hobby is not allowed for commercial use. Start on Hobby while building, move to Pro before charging customers.

## Project Structure
```
/app
  /(marketing)    / and /pricing
  /(auth)         /login and /signup
  /(onboarding)   /onboarding/connect and /onboarding/scan
  /(app)/app      overview, suggestions, orphans, broken-links, report, settings, billing
  /api            route handlers (see docs/API.md)
/components
  /ui             shadcn components
  /marketing /app /shared
/lib
  /supabase       browser, server and admin clients
  /wordpress      client.ts (REST calls), parse-links.ts, apply-link.ts
  /scan           run-scan.ts, health-score.ts, orphans.ts, broken-links.ts
  /ai             suggest-links.ts (Groq)
  /billing        plans.ts, lemonsqueezy.ts
  crypto.ts       encrypt and decrypt WordPress passwords
  api-response.ts standard success and error responses
  mock-data.ts    typed mock data used while building UI
/supabase/migrations
/docs
/types
```

## Data Flow: Scan
1. User creates a scan: a row in `scans` with status `queued`.
2. The browser calls POST /api/scans/:id/step repeatedly. Each call handles one chunk (about 20 pages) and stays under the Vercel time limit.
3. Step 1 fetches the page list from WordPress (posts and pages, 100 per request). Later steps fetch content, extract internal links with cheerio and save pages and page_links.
4. When all pages are done: detect orphans, check link status for broken links (HEAD requests, 5 at a time), compute the health score, generate suggestions, save a `report_snapshots` row. Scan status becomes `done`.
5. The First scan screen polls GET /api/scans/:id to show "184 of 312 pages".

## Data Flow: Suggestions
1. For each page, find candidate targets with Postgres full-text search (tsvector on title and content).
2. Send the source paragraph and 5 candidates to Groq. Ask for strict JSON: target_page_id, anchor_text (must appear exactly in the paragraph), relevance 0 to 1.
3. Validate with zod. Discard anchor text that is not in the paragraph, pages already linking to the target, and relevance below the site's minimum.
4. Save to `suggestions` with status `pending`.

## Data Flow: Apply a Link
1. Verify the suggestion belongs to the user's site.
2. Fetch the post with context=edit and save the original content in `activity_log`.
3. Wrap the first exact, unlinked match of the anchor text in the source paragraph with an anchor tag.
4. PATCH the post. Mark the suggestion `applied`. Write an activity row.
5. Undo restores the saved original content.

## Data Flow: Billing
Checkout through Lemon Squeezy -> webhook POST /api/webhooks/lemonsqueezy -> verify signature -> update `subscriptions` -> the app reads the plan from the database only.

## Deployment
GitHub -> Vercel (auto deploy). Environment variables are set in Vercel. Migrations are applied with the Supabase CLI. vercel.json defines one cron: GET /api/cron/weekly-report every Monday 03:00 UTC (the route needs the CRON_SECRET header).

## Scalability Notes (later, not now)
Move scanning to a real queue (Inngest or Trigger.dev) when sites exceed 1,000 pages. Add embeddings (pgvector) if full-text candidates are not good enough. Add Search Console in v1.1.
