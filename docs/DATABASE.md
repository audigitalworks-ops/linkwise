# DATABASE.md

## 1. Stack
PostgreSQL on Supabase. No ORM. Use supabase-js with generated types (`npx supabase gen types typescript`). Migrations are SQL files in supabase/migrations, applied with the Supabase CLI. Separate Supabase projects for development and production.

## 2. Models (all tables have id uuid primary key, created_at timestamptz default now())

### profiles
One row per auth user. id references auth.users(id). Fields: email, full_name.

### subscriptions
user_id (unique), plan (free | pro | agency), status (active | past_due | cancelled), ls_customer_id, ls_subscription_id, current_period_end, interval (monthly | yearly).
No row means the free plan.

### sites
user_id, name, url (unique per user), wp_username, wp_password_encrypted, min_relevance (default 0.75), scan_frequency (weekly | manual), require_approval (default true), ignore_patterns (text[]), last_scanned_at, connected (boolean).

### scans
site_id, status (queued | running | done | failed), total_pages, processed_pages, step (fetching | indexing | finding), error_message, started_at, finished_at.

### pages
site_id, wp_id, wp_type (post | page), url, path, title, excerpt, content_text, word_count, search_vector (tsvector, generated from title and content_text, GIN index), inbound_count, outbound_count, depth, is_orphan, monthly_clicks (nullable, for later).
Unique (site_id, wp_id, wp_type).

### page_links
site_id, source_page_id -> pages, target_page_id -> pages (nullable for external), target_url, anchor_text, is_internal, http_status (nullable), is_broken.
Index on (site_id, target_page_id) and (site_id, is_broken).

### suggestions
site_id, source_page_id, target_page_id, anchor_text, source_paragraph, relevance (numeric 0 to 1), status (pending | applied | dismissed), applied_at.
Unique (source_page_id, target_page_id, anchor_text).

### activity_log
site_id, user_id, action (link_applied | link_undone | link_dismissed | broken_fixed | scan_completed), page_id (nullable), details jsonb (include original_content for undo).

### report_snapshots
site_id, week_start (date), health_score, pages_scanned, orphan_count, broken_count, suggestions_ready, links_applied, orphan_score, depth_score, anchor_score, broken_score.
Unique (site_id, week_start). This feeds the 12-week chart.

## 3. Relationships
One user has many sites. One site has many scans, pages, page_links, suggestions and snapshots. Deleting a site cascades to everything under it. One user has zero or one subscription.

## 4. Row Level Security
Enable RLS on every table. Policy: a user can read and write rows only where the site belongs to them (join on sites.user_id = auth.uid()). `subscriptions` is read-only for the user. Writes to subscriptions happen only through the webhook using the service role client.

## 5. Rules
- Foreign keys everywhere. Cascade deletes from sites.
- Index every foreign key and every column used in filters.
- Never store the WordPress password unencrypted.
- Never edit the production database by hand. Every change is a new migration file named `YYYYMMDDHHMM_description.sql`.
- Seed data is fake only (greenleafgardening.com sample), never real users.
- Never run `supabase db reset` against production.

## 6. Plan Limits (checked in lib/billing/plans.ts)
free: 1 site, 20 pages. pro: 1 site, 500 pages. agency: 10 sites, 5,000 pages each.
