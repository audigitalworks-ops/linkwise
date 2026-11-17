# PRD.md

## Product Overview
Product: Linkwise
One line: Linkwise scans a WordPress site, suggests contextual internal links with exact anchor text, finds orphan pages and broken internal links, and emails a weekly link-health report.
Vision: Fixing internal links takes minutes, not days.

## Problem
Internal linking is slow and boring. SEO freelancers and small agencies check hundreds of pages by hand, miss orphan pages and never see broken links until rankings drop.

## Goal
A user connects a WordPress site, finishes the first scan in under 5 minutes, and applies their first link in under 10 minutes.

## Target Users
- SEO freelancers
- In-house SEO managers at small companies
- Small agency owners (5 to 10 client sites)
Markets: US first, then UK, Canada, Australia. Language: English only in v1. Prices in USD.

## Core Features (v1)
1. Connect a WordPress site with the REST API and an Application Password
2. Scan all posts and pages and store their links
3. Link suggestions: source page, anchor text, target page, relevance 0 to 1
4. Apply or dismiss a suggestion (Apply edits the real WordPress post)
5. Orphan page detection with "best linking candidates"
6. Broken internal link detection (404 and redirect chains) with a fix action
7. Health score from 0 to 100
8. Weekly report page, print-to-PDF, and a weekly email
9. Plans and billing (Free, Pro, Agency)

## Health Score Formula
score = 0.30*orphanScore + 0.25*depthScore + 0.20*anchorScore + 0.25*brokenScore
- orphanScore = 100 * (1 - orphanPages / totalPages)
- depthScore = % of pages reachable within 3 clicks from the home page
- anchorScore = % of internal links whose anchor text is not a duplicate of another anchor pointing to the same target
- brokenScore = 100 * (1 - brokenLinks / totalInternalLinks)

## Plans
| Plan | Price | Sites | Pages per site | Includes |
|---|---|---|---|---|
| Free | $0 | 1 | 20 | manual scan only, suggestions |
| Pro | $9/month ($79/year) | 1 | 500 | weekly report email, orphan and broken link detection |
| Agency | $29/month ($279/year) | 10 | 5,000 each | white-label report, 3 team seats |
Yearly billing saves 20%.

## The 13 Screens (source of truth: Stitch project "Linkwise Design System & App")
| # | Screen | Route |
|---|---|---|
| 1 | Landing | / |
| 2 | Pricing | /pricing |
| 3 | Sign up | /signup |
| 4 | Log in | /login |
| 5 | Onboarding: Connect site | /onboarding/connect |
| 6 | Onboarding: First scan | /onboarding/scan |
| 7 | Overview | /app |
| 8 | Link suggestions | /app/suggestions |
| 9 | Orphan pages | /app/orphans |
| 10 | Broken links | /app/broken-links |
| 11 | Weekly report | /app/report |
| 12 | Settings | /app/settings |
| 13 | Billing | /app/billing |

## Key User Flows
1. Visit / -> Start free -> /signup -> /onboarding/connect -> /onboarding/scan -> /app
2. In /app/suggestions: review a row -> Apply -> the WordPress post is updated -> status becomes Applied
3. Weekly: email arrives -> open /app/report -> fix new orphan or broken pages
4. Upgrade: /app/billing -> Change plan -> Lemon Squeezy checkout -> webhook updates the plan

## Decisions
- Onboarding step 2 "Connect Search Console" is shown in the indicator but skipped in v1. The "Monthly clicks" column shows "-" until Search Console is added in v1.1.
- Applying a link needs a WordPress user with the Editor role. Linkwise never edits a post unless the user clicks Apply or Apply selected. Because of this, the Stitch line "Read-only access by default" should be changed to "We only edit a post when you click Apply".
- Every applied link stores the original post content so it can be undone.

## Success Metrics
- Signup to first scan complete: above 60%
- First scan to first applied link: above 40%
- Free to Pro conversion: above 3%
- Weekly report email open rate: above 40%

## Out of Scope (v1)
Shopify and other CMS, Search Console, mobile app, non-English sites, Slack or API access, team roles beyond owner and member, AI-written content.
