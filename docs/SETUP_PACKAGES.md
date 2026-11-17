# SETUP_PACKAGES.md

Run these before pasting the master prompt.

```bash
# 1. Create the Next.js app (TypeScript, Tailwind, App Router, ESLint)
npx create-next-app@latest linkwise --typescript --tailwind --eslint --app --import-alias "@/*"
cd linkwise

# 2. UI kit: shadcn/ui (choose "Neutral" when asked, we replace colours later)
npx shadcn@latest init

# 3. shadcn components used by the 13 screens
npx shadcn@latest add button input label card table tabs badge dialog sheet dropdown-menu select slider switch textarea checkbox progress accordion separator skeleton sonner

# 4. Icons (thin line icons) and the one chart on the report page
npm install lucide-react recharts

# 5. Database and login (Supabase)
npm install @supabase/supabase-js @supabase/ssr

# 6. AI suggestions (Groq SDK)
npm install groq-sdk

# 7. Read WordPress page HTML and find links
npm install cheerio

# 8. Forms and validation
npm install zod react-hook-form @hookform/resolvers

# 9. Payments (Lemon Squeezy) and email (Resend)
npm install @lemonsqueezy/lemonsqueezy.js resend

# 10. Date formatting ("Nov 4 - Nov 10, 2026")
npm install date-fns

# 11. Dev tools: formatter, tests, Supabase CLI
npm install -D prettier prettier-plugin-tailwindcss vitest supabase

# 12. Set up the Supabase folder, then add your keys
npx supabase init
cp .env.example .env.local

# 13. Add these scripts to package.json
#   "typecheck": "tsc --noEmit"
#   "test": "vitest run"
```

Inter needs no install because it loads through `next/font/google`.

After create-next-app, copy AGENTS.md, .env.example and the docs/ folder from this zip into the new linkwise project folder.
