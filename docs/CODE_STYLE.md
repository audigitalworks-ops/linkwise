# CODE_STYLE.md

## 1. Stack
TypeScript (strict), React, Next.js App Router, Tailwind CSS v4, shadcn/ui, ESLint, Prettier with prettier-plugin-tailwindcss.

## 2. Principles
- Readable over clever. Small focused files.
- Reuse components and helpers before writing new ones.
- No abstraction until something is used three times.
- No duplicate business logic: scoring, plan limits and link parsing each live in one file in /lib.

## 3. Naming
Components and their files: PascalCase (SuggestionsTable.tsx)
Other files: kebab-case (health-score.ts)
Functions and variables: camelCase
Constants: UPPER_SNAKE_CASE
Booleans: isLoading, hasAccess, canApply
Database columns: snake_case. Map to camelCase in the data layer.
Routes and folders: kebab-case (/app/broken-links)

## 4. Components
- Server Components by default. Client Components only for state, effects and events.
- Pages only fetch data and compose. Put UI in /components.
- Props have explicit TypeScript types. No `any`.
- Every list or table handles loading (skeleton), empty and error states.
- Forms: react-hook-form with a zod schema. Show field errors under the field.
- Use sonner toasts for success and failure of actions.

## 5. Data and Errors
- Supabase calls only in /lib and route handlers, not inside UI components.
- Every route handler: check session -> validate with zod -> check ownership -> act -> return the standard response shape.
- Throw typed errors in /lib and convert them to API errors in one helper (lib/api-response.ts).

## 6. Imports and Formatting
Use the `@/` alias. Order: React and Next, third-party, `@/` imports, relative imports. Run Prettier. Do not reformat unrelated files.

## 7. Comments
Explain why, not what. Example: "Retry once because WordPress hosts sometimes return a temporary 503."

## 8. Tests
Write Vitest tests only for pure logic: health-score.ts, parse-links.ts, apply-link.ts (anchor replacement), plan limit checks.

## 9. Before Finishing
npm run lint, npm run typecheck, npm run test, npm run build. Check 1440px and 390px. Remove console.log and dead code.
