# SECURITY.md

## 1. Purpose
Security rules for Linkwise. Developers and AI agents must follow them.

## 2. Authentication and Authorization
- Supabase Auth with email and password plus Google sign in.
- Every route under /app and every protected API route checks the session on the server (`supabase.auth.getUser()`), never `getSession()` alone.
- Middleware redirects logged-out users from /app and /onboarding to /login.
- Ownership: every query that takes a site_id, scan_id or suggestion_id must confirm the row belongs to the current user. Row Level Security is on for every table as the second layer.
- Plan limits (sites, pages) are enforced on the server in lib/billing/plans.ts, never only in the UI.

## 3. Secrets and Environment Variables
- All secrets live in environment variables. Never commit .env.local.
- Keep .env.example with names only.
- NEXT_PUBLIC_ variables may only contain the Supabase URL, the Supabase anon key and the app URL.
- SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, LEMONSQUEEZY_*, RESEND_API_KEY, ENCRYPTION_KEY, CRON_SECRET are server only.

## 4. WordPress Credentials
- Users give a WordPress username and an Application Password.
- Encrypt the password with AES-256-GCM (node:crypto) using ENCRYPTION_KEY before saving. Store iv and auth tag with the ciphertext.
- Never return the password to the browser. Never log it.
- Decrypt only inside lib/wordpress/client.ts, right before a request.
- Disconnecting a site deletes the stored credentials.
- Only call the user's own site URL. Block private and local addresses (localhost, 127.0.0.1, 10.x, 172.16-31.x, 192.168.x, 169.254.x) to prevent SSRF. Require https.

## 5. Input Validation
- Validate every request body, query and param with zod on the server.
- Reject unknown fields.
- Sanitise anything from WordPress before rendering. Never use dangerouslySetInnerHTML with WordPress content. When showing a source paragraph, render text and highlight the anchor with a React element.

## 6. API Security
- Protected routes return 401 when logged out and 403 when the resource is not theirs.
- Rate limits (stored in the database, simple counters): 10 scans per site per day, 60 AI suggestion calls per scan batch, 5 test-connection attempts per minute per user.
- Webhooks: verify the Lemon Squeezy HMAC signature before reading the body. Ignore events with an invalid signature.
- Cron route: require the header `Authorization: Bearer CRON_SECRET`.
- HTTPS only in production.

## 7. Data Protection
- Store only what the product needs: page URL, title, text excerpt, links.
- Do not log passwords, tokens, API keys or full page content.
- Deleting a site deletes its pages, links, suggestions and scans (cascade).

## 8. Error Handling
User-facing errors must not show stack traces, SQL errors, keys, file paths or WordPress credentials. Use the error shape in docs/API.md and log details server-side.

## 9. AI Agent Rules
The agent must never: hardcode a credential, disable auth or RLS to make something work, bypass ownership checks, put a secret in client code, write to WordPress outside the apply-link flow, or run destructive commands on a real database. Ask first when a task conflicts with this file.
