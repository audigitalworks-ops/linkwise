# Linkwise - WordPress Internal Linking SaaS

Linkwise is an automated internal-linking SaaS for WordPress websites. It crawls posts and pages via the native WordPress REST API, computes an internal-linking health score, identifies orphan pages and broken links, uses AI (Groq + LLaMA 3.3) to generate high-relevance contextual anchor suggestions, applies links in 1-click without breaking markup, and emails a weekly health report via Resend.

---

## 1. Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, React 19, TypeScript strict mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + shadcn/ui (`@base-ui/react`)
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL with Row-Level Security)
- **AI Scoring**: [Groq SDK](https://groq.com) (`llama-3.3-70b-versatile` with Zod JSON schema validation)
- **HTML Parsing & DOM Mutation**: [Cheerio](https://cheerio.js.org)
- **Billing & Customer Portal**: [Lemon Squeezy](https://lemonsqueezy.com)
- **Email Delivery**: [Resend](https://resend.com)
- **Testing**: [Vitest](https://vitest.dev)

---

## 2. Getting Started

### Prerequisites

- Node.js `v20+` or `v22+`
- `pnpm` (`v10+`)
- A Supabase project (for Postgres and Auth)
- A WordPress site (`v5.6+`) with Application Passwords enabled

### Installation

1. **Clone the repository and enter directory**:
   ```bash
   cd linkwise
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From Supabase dashboard -> Project Settings -> API.
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role secret for admin/cron actions.
   - `ENCRYPTION_KEY`: 32-byte hex string (64 characters) used for AES-256-GCM encryption of WordPress credentials:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - `GROQ_API_KEY`: Groq API key for link evaluation.
   - `CRON_SECRET`: Random secret bearer token for Vercel Cron.
   - `LEMONSQUEEZY_*`: Lemon Squeezy API key, store ID, variant IDs, and webhook secret.
   - `RESEND_API_KEY` & `EMAIL_FROM`: Resend credentials for weekly report emails.

4. **Apply Supabase Database Migrations**:
   Run the SQL migrations located in `supabase/migrations/` in order via Supabase CLI or the SQL Editor:
   - `20261116000000_create_profiles_and_subscriptions.sql`
   - `20261116000001_create_sites_scans_pages_and_features.sql`

5. **Start Development Server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Scripts

- `pnpm dev`: Start local development server on port 3000.
- `pnpm build`: Run Next.js production build with static generation and typechecking.
- `pnpm start`: Run Next.js production server.
- `pnpm lint`: Run ESLint across the codebase.
- `pnpm typecheck`: Run TypeScript compiler type checking (`tsc --noEmit`).
- `pnpm test`: Run Vitest unit tests suite.

---

## 4. Key Workflows & Architecture

### 1. Connecting a WordPress Site
- User enters Site URL, WordPress Username, and an Application Password (`Users -> Profile -> Application Passwords`).
- **SSRF Protection**: Validates public HTTPS endpoint and blocks private, link-local, loopback, and RFC 1918 IPs.
- **Credential Storage**: Credentials are encrypted with `AES-256-GCM` (`ciphertext:iv:authTag`) and never returned to the client.

### 2. Scanning & Health Score Formula
- Scans run as chunked steps (`POST /api/scans/:id/step`) to respect serverless execution time limits.
- Health score ($0 \dots 100$) formula:
  $$\text{Score} = 0.30 \times \text{orphanScore} + 0.25 \times \text{depthScore} + 0.20 \times \text{anchorScore} + 0.25 \times \text{brokenScore}$$
  - **orphanScore**: $100 \times (1 - \text{orphanPages} / \text{totalPages})$
  - **depthScore**: percentage of pages reachable within 3 clicks from homepage (BFS graph traversal).
  - **anchorScore**: percentage of non-duplicate anchor texts pointing to the same target.
  - **brokenScore**: $100 \times (1 - \text{brokenLinks} / \text{totalInternalLinks})$.

### 3. AI Suggestions & Exact HTML Replacement
- Postgres full-text search (`search_vector` GIN index) finds candidate targets.
- Groq evaluates paragraph relevance and proposes exact verbatim anchor phrases.
- Link application (`lib/wordpress/apply-link.ts`) uses Cheerio to wrap only the exact unlinked text node while strictly preserving headings, formatting, and surrounding tags.
- Original content is backed up in `activity_log` for 1-click instant undo.

### 4. Billing & Subscription Management
- Checkout powered by Lemon Squeezy with monthly and yearly intervals (20% discount on yearly).
- Webhook route `POST /api/webhooks/lemonsqueezy` verifies HMAC SHA-256 signature and manages `subscriptions` table.
- Plan limits enforced on server:
  - **Free**: 1 site, 20 pages, manual scans.
  - **Pro**: 1 site, 500 pages, automated weekly scans, orphan/broken link fixes, bulk apply.
  - **Agency**: 10 sites, 5,000 pages per site, white-label reports.

### 5. Automated Weekly Reports & Cron
- `vercel.json` schedules `GET /api/cron/weekly-report` every Monday at `03:00 UTC`.
- Authenticated via `Authorization: Bearer <CRON_SECRET>`.
- Snapshots weekly health score in `report_snapshots` and sends responsive HTML email via Resend to Pro and Agency subscribers.

---

## 5. Security Checklist Review

- [x] **Authentication & Session**: Server-side verification using `supabase.auth.getUser()`, never trusting unverified tokens.
- [x] **Row-Level Security (RLS)**: Enforced across all Supabase tables (`sites`, `scans`, `pages`, `page_links`, `suggestions`, `activity_log`, `report_snapshots`, `subscriptions`).
- [x] **SSRF Guard**: Strict URL validation blocking RFC 1918 private ranges, `127.0.0.1`, `localhost`, and link-local addresses.
- [x] **Zero Raw Passwords**: WordPress credentials encrypted with `AES-256-GCM` before persisting; decrypted strictly server-side in `WordPressClient`.
- [x] **Input Validation**: All API bodies, query params, and webhook payloads parsed and validated with Zod/typed schemas.
- [x] **Safe HTML Mutation**: No `dangerouslySetInnerHTML` on untrusted WordPress markup.
- [x] **Webhook Security**: Constant-time HMAC SHA-256 signature verification (`crypto.timingSafeEqual`).
- [x] **Cron Protection**: Protected with `CRON_SECRET` bearer token validation.

---

## 6. License

Proprietary - Linkwise Inc.
