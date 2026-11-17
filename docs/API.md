# API.md

## 1. Conventions
Base path: /api. Format: JSON. Auth: Supabase session cookie (no manual tokens).
Pages read data directly in Server Components. These routes exist for mutations, polling and webhooks.

Success: { "success": true, "data": { ... } }
Error: { "success": false, "error": { "code": "INVALID_INPUT", "message": "Site URL is required." } }

Status codes: 200 ok, 201 created, 400 invalid input, 401 not logged in, 403 not yours or plan limit, 404 not found, 409 conflict, 429 rate limited, 500 server error.
Error codes: INVALID_INPUT, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, PLAN_LIMIT, WP_UNREACHABLE, WP_AUTH_FAILED, RATE_LIMITED, INTERNAL.

## 2. Endpoints

### Sites
POST /api/sites/test-connection  body: { url, username, appPassword } -> { pagesFound: 312 }
POST /api/sites  body: { name, url, username, appPassword } -> 201 { siteId }
DELETE /api/sites/:siteId
PATCH /api/sites/:siteId/settings  body: { scanFrequency, minRelevance, ignorePatterns, requireApproval }

### Scans
POST /api/sites/:siteId/scan -> 201 { scanId }
POST /api/scans/:scanId/step -> { status, processedPages, totalPages, step }  (call repeatedly until status is done)
GET /api/scans/:scanId -> { status, processedPages, totalPages, step }

### Suggestions
GET /api/sites/:siteId/suggestions?status=&minRelevance=&q=&page=1&pageSize=20
POST /api/suggestions/:id/apply -> { status: "applied" }
POST /api/suggestions/:id/dismiss
POST /api/suggestions/bulk-apply  body: { ids: string[] } (max 25)
POST /api/activity/:id/undo  restores the saved original post content

### Orphans and broken links
GET /api/sites/:siteId/orphans
GET /api/pages/:pageId/link-candidates  -> 3 suggested source pages with anchor text
GET /api/sites/:siteId/broken-links?type=all|404|redirect
POST /api/broken-links/:id/fix  body: { action: "replace" | "remove", newUrl?: string }

### Report
GET /api/sites/:siteId/report?weekStart=2026-11-04

### Billing
POST /api/billing/checkout  body: { plan: "pro" | "agency", interval: "monthly" | "yearly" } -> { url }
GET /api/billing/portal -> { url }  (update card, cancel)
POST /api/webhooks/lemonsqueezy  (public, signature verified)

### Cron
GET /api/cron/weekly-report  (header Authorization: Bearer CRON_SECRET)

## 3. Example: apply a suggestion
POST /api/suggestions/sug_123/apply
200: { "success": true, "data": { "status": "applied", "activityId": "act_456" } }
403: { "success": false, "error": { "code": "PLAN_LIMIT", "message": "Upgrade to Pro to apply links on more than 20 pages." } }

## 4. Third-Party Services
Groq: link scoring. Env GROQ_API_KEY, GROQ_MODEL. Server only. If it fails, mark the scan step failed and let the user retry.
Lemon Squeezy: payments. Env LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID, LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID, LEMONSQUEEZY_AGENCY_MONTHLY_VARIANT_ID, LEMONSQUEEZY_AGENCY_YEARLY_VARIANT_ID, LEMONSQUEEZY_WEBHOOK_SECRET. Webhook events handled: subscription_created, subscription_updated, subscription_cancelled, subscription_expired.
Resend: email. Env RESEND_API_KEY, EMAIL_FROM. Used only by the weekly report cron.
WordPress: user's own site, /wp-json/wp/v2/posts and /pages. Credentials are decrypted server-side only.
