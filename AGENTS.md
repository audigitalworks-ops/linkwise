# AGENTS.md

## Project Context
Linkwise is a Next.js (App Router) SaaS that suggests internal links for WordPress sites.
Stack: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Supabase (Auth + Postgres), Groq API, Lemon Squeezy, Resend, Vercel.
Keep it simple. Do not add libraries that are not listed in docs/ARCHITECTURE.md.

## Before You Start
Read, in this order:
1. docs/PRD.md
2. docs/DESIGN_SYSTEM.md
3. docs/ARCHITECTURE.md
4. docs/SECURITY.md
5. docs/CODE_STYLE.md
6. docs/DATABASE.md
7. docs/API.md
Then use the Stitch tools to open the project "Linkwise Design System & App" and view the matching screen before building any page.
Inspect existing components before creating new ones.

## General Rules
- TypeScript strict mode, no `any`.
- Server Components by default. Add "use client" only for interactivity.
- Reuse shadcn/ui components from components/ui. Build shared pieces in components/.
- Follow the folder structure in docs/ARCHITECTURE.md.
- Build one screen or feature at a time and stop for review after each phase.
- Ask before making architecture changes or adding dependencies.
- If docs conflict with each other or with Stitch, stop and ask.

## Design Rules
- Match the Stitch screens. Use only the tokens in docs/DESIGN_SYSTEM.md.
- One accent colour (green). Orange is for warning status only. Red is for errors only.
- No gradients, shadows (except menus and modals), emojis or decorative illustrations.
- Every screen needs loading, empty and error states.

## Security Rules
- Never expose keys. Secrets only in environment variables.
- Verify the user session on the server for every protected route and endpoint.
- Never trust a user_id or site_id from the client without checking ownership.
- Never store WordPress passwords in plain text. Follow docs/SECURITY.md.

## Commands
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test

## Boundaries (ask first)
- Changing the database schema or anything in supabase/migrations
- Adding a package
- Changing auth, billing or webhook code
- Deleting files
- Running destructive commands against any database

## Before Finishing a Task
Run lint, typecheck and build. Check the page at desktop (1440px) and mobile (390px). Remove console.log and dead code. Update docs if you changed a convention.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
