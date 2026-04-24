# Proxy / BIOSai — Project Context

## Session Protocol
At the end of every session, update the "Current Sprint" block above with:
- What was completed
- Where we stopped
- What's next
- Any new decisions made

## Current Sprint — 2026-04-23
**Status:** LAUNCHED. Code pushed to GitHub main. Needs Replit pull + build + redeploy to go live.
**Last session completed:**
- Landing page full redesign (client/src/pages/landing.tsx): new hero with two-column layout + JSX chatbot mockup, new headline ("You've done the work. A PDF shouldn't be how you're judged for it."), grounded subheadline (no "AI version of you"), removed status bar + terminal CTAs + 4-card grid, added How It Works (3 plain steps), new Job Search Agent feature section, condensed problem comparison (3 rows), "who it's for" updated to mid-to-senior, pricing cleaned up (strikethrough removed), simplified final CTA
- FAQ updated (client/src/pages/faq.tsx): "Who is Proxy for?" updated to mid to senior, time estimates changed to "around 10 minutes", new Q&A "What is the Job Search Agent?", updated "What's coming next?" list, CTA copy updated
- Merged feature/job-search-agent branch into main
- Merged claude/fix-build-hanging-7MnVR branch into main
- Pushed all to GitHub main
**Still needs deploy:** Pull on Replit (`git fetch origin && git reset --hard origin/main`), then `npm run build`, then redeploy from Deployments tab
**Don't touch:** server/ai-processor.ts, Stripe webhook flow, server/job-search-agent.ts — all working in production
**Pending decision:** None

## What This Is
Digital Twin / AI-powered career profile builder. Users upload a resume, fill an 11-step questionnaire, and get a public AI portfolio page with a chatbot that represents them.

**Live URL:** https://myproxy.work (Replit deployment with custom domain)
**Dev URL:** worf.replit.dev (Replit workspace — separate DB, do not test auth flows here)
**GitHub:** https://github.com/vinos-samuel/Proxy (branch: main)
**Domain:** myproxy.work


## Workflow
- Claude edits files locally on Mac (`/Users/vinos/Documents/Claude Code/proxy/`)
- Vinos pushes to GitHub → pulls on Replit → restarts Replit server
- Local dev: `npx tsx --env-file=.env server/index.ts` (configured in `.claude/launch.json`)
- Local DB doesn't work (Postgres is on Replit) — always test on Replit after push
- **Vinos is not a technical engineer** — keep instructions simple and step-by-step

## REMIND VINOS EVERY TIME: How to deploy changes
After Claude writes code, Vinos does these steps:

**⚠️ CRITICAL — Claude's rule:** Every session, ALL commits go to the dev branch (`claude/fix-build-hanging-7MnVR`). Claude MUST end every session by telling Vinos to merge the dev branch into main. Work is NOT done until it is on main. Never leave commits only on the dev branch.

**Step 1 — Merge dev branch and push from Mac terminal (from proxy folder):**
```
git fetch origin && git merge origin/claude/fix-build-hanging-7MnVR && git push origin main
```

**Step 2 — Pull on Replit Shell (ALWAYS use this, never plain `git pull`):**
```
git fetch origin && git reset --hard origin/main
```

**Step 3 — Only if shared/schema.ts was changed (new DB columns added):**
```
npm run db:push
```
WARNING: `db:push` runs against the WORKSPACE database (dev), NOT production. If new columns are needed in production, also run ALTER TABLE manually via the Replit Production Database SQL console — one statement at a time (Replit SQL console does not support multiple statements in one go).

**Step 4 — Build (required before redeploy):**
```
npm run build
```

**Step 5 — Redeploy** from the Replit Deployments tab (click Deploy button)

**Why not `git pull`?** Replit Agent sometimes commits code changes directly on Replit. This causes "divergent branches" conflicts. The `reset --hard` command above bypasses that by forcing Replit to match GitHub exactly. GitHub is always the source of truth.

## Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript, Wouter routing, TanStack Query, Tailwind |
| Backend | Express 5, TypeScript |
| DB | PostgreSQL + Drizzle ORM |
| AI | Google Gemini 2.5 Flash via `@google/genai` |
| Storage | Google Cloud Storage (file uploads) |
| Payments | Stripe (one-time, Checkout Sessions) |
| Email | Resend (transactional, FROM: noreply@myproxy.work), Zoho Mail (vinos@myproxy.work for personal/outreach) |
| Auth | bcryptjs, express-session + connect-pg-simple (pg store) |
| Security | helmet, express-rate-limit, double-submit CSRF cookies |
| Logging | Custom JSON structured logger (`server/logger.ts`) |

## Two Separate Environments — Critical to Understand
| | Workspace (Dev) | Deployment (Prod) |
|---|---|---|
| URL | worf.replit.dev | myproxy.work |
| Database | Workspace PostgreSQL (separate) | Replit Production Database |
| Secrets | Workspace Secrets tab | Deployments → Secrets tab |
| Code runs | When Replit Run button is pressed | After clicking Deploy |

**Never test auth flows (login, password reset, email verification) on worf.replit.dev** — they use the dev database, which is separate from production.

## Key Env Vars
**Workspace secrets** (dev, worf.replit.dev):
- `DATABASE_URL` — dev Postgres (separate from prod)
- `AI_INTEGRATIONS_GEMINI_API_KEY` + `AI_INTEGRATIONS_GEMINI_BASE_URL`
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `FROM_EMAIL=noreply@myproxy.work`
- `SESSION_SECRET`, `NODE_ENV=production`
- Do NOT set `APP_URL` in workspace — without it, reset/verify links use the request host (worf.replit.dev), keeping dev tokens in dev DB

**Deployment secrets** (prod, myproxy.work) — set in Deployments → Secrets tab:
- `DATABASE_URL` — MUST point to the Replit Production Database connection string. Replit shows "External database detected" warning — ignore it, do NOT remove DATABASE_URL. Removing it breaks all logins.
- `RESEND_API_KEY`, `FROM_EMAIL=noreply@myproxy.work`
- `SESSION_SECRET`, `NODE_ENV=production`
- All AI + Stripe secrets same as workspace
- Do NOT set `APP_URL` in deployment secrets — the app builds reset/verify links from the request host automatically

## Production Database — Important Notes
- Replit's Production Database shows up in the Database tab (currently ~31.78MB, 100GB limit)
- `npm run db:push` does NOT update the production DB — it only updates the workspace DB
- When new columns are added to schema.ts, they must be added to production manually via SQL console
- Run SQL statements ONE AT A TIME in the Replit SQL console (multiple statements cause an error)
- Example: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true;`
- After adding columns, run `UPDATE customers SET email_verified = true;` etc. to backfill existing rows

## Stripe Price IDs (live)
- Pro: `price_1TGcOtPzBwfwKXgh2Ka7ye3e` ($49)
- Concierge: `price_1TAQ57PzBwfwKXgh162qiUU2` ($499)
- Free tier: No Stripe — publishes directly via `/api/publish-free`
- Old Launch ($99) and Evolve ($199) prices retired

## Key Architecture Decisions Made
- **CSRF:** Double-submit cookie pattern. Exempt: `/api/stripe/webhook`, `/api/chat/:username`
- **Chat:** Uses `generateContent` (non-streaming) — Replit AI proxy doesn't support SSE streaming
- **AI pre-fill:** Resume upload → `parseResumeWithGemini()` → `generateQuestionnaireDraft()` → saved to DB with `_aiDraft: true` flag
- **Payments:** PaymentGate.tsx → `/api/create-checkout-session` → Stripe redirect → webhook sets profile published
- **Admin routes:** All `/api/admin/*` require `requireAdmin` middleware (`isAdmin` field on customers table)
- **No `/api/test-publish`:** Deleted as security fix — all publishing goes through Stripe
- **Sessions:** express-session + connect-pg-simple. `createTableIfMissing: true` so session table auto-creates. `pruneSessionInterval: false` to avoid dist/table.sql error in Replit.
- **Email verification:** New users must verify email before logging in. Existing users have `email_verified = true` set via SQL. Token stored in `email_verification_token` + `email_verification_token_expiry` columns.
- **Password reset:** Token hashed (SHA-256) before storing. Raw token sent in email link. `reset_token` + `reset_token_expiry` columns on customers table.
- **logger.warn goes to stderr** — invisible in Replit deployment logs. Always use `logger.info` for any diagnostic logs you need to see in production.

## CSRF Pattern
Cookie `csrf-token` set on every GET to non-API routes. All POST/PUT/DELETE/PATCH to `/api/*` must include `x-csrf-token` header matching cookie. `apiRequest()` in `queryClient.ts` does this automatically. Raw `fetch()` calls must manually read the cookie.

## Questionnaire (11 steps)
step1: basic info | step2: summary + career history | step3: resume URL (removed — was duplicate with step10) | step4: war stories (min 3) | step5: achievements | step6: technical skills | step7: voice/personality | step8: Q&A (min 3) | step9: objections (min 2) | step10: branding + headshot/video/CV upload | step11: chatbot setup

## Known Pending Tasks
- [ ] "Your Twin is building" email on questionnaire submit
- [ ] Nudge emails (48hr after signup if draft, 48hr after ready if not published) — needs cron
- [ ] Sprint 3: LinkedIn enrichment via Proxycurl API (~1-2 sessions, needs Proxycurl account + API key)
- [ ] Sprint 4: Conversational onboarding (~3-5 sessions, parallel path to questionnaire)
- [ ] Post-launch: Fix @google-cloud/storage vulnerabilities (5 low severity, requires downgrade to v5.18.3)

## Completed
- [x] Remove duplicate CV field from Step 3 (resumeUrl) — already in Step 10
- [x] Sign-in form input text too faint — darkened
- [x] Chat CSRF exemption + switched to non-streaming (Replit proxy doesn't support SSE)
- [x] PaymentGate wired to Stripe checkout (/api/create-checkout-session)
- [x] Edit Content save CSRF fix (preview.tsx PATCH)
- [x] Career Trajectory UI — company name in header, roles nested inside
- [x] AI pre-fill questionnaire from resume (Sprint 1) — generateQuestionnaireDraft() added
- [x] AI pre-fill banner — shows when _aiDraft: true, dismiss button, re-upload button in questionnaire
- [x] Privacy policy + Terms of Service pages
- [x] Password reset — fully working on myproxy.work
- [x] Email verification on signup — new users must verify before logging in
- [x] Structured logging (server/logger.ts)
- [x] Helmet, rate limiting, CSRF middleware
- [x] Stripe payment endpoints + webhook
- [x] Server-side Zod validation on key endpoints
- [x] Deleted /api/test-publish security bypass
- [x] All file uploads (headshot, video, CV, resume) — CSRF fixed via cookie helper in use-upload hook
- [x] Email templates redesigned — branded with Proxy green/black, proper HTML layout (server/emails.ts)
- [x] Welcome email — fires after email verification, guides user to start questionnaire
- [x] File map updated: server/emails.ts — all email templates (verifyEmailTemplate, welcomeEmailTemplate, passwordResetTemplate)
- [x] Admin dashboard improved — filter tabs, date joined, email verified badge, view profile link, grant free access (bypasses Stripe), delete user with confirmation
- [x] "Your profile is live" email on Stripe payment + admin grant-access (server/emails.ts: profileLiveTemplate)
- [x] Profile analytics on dashboard — visitor count, questions asked, explainer text
- [x] Chat formatting fixed — removed contradicting "NO MARKDOWN" rule, AI now uses paragraphs/bullets/bold
- [x] Portfolio URL fixed — all references updated from username.myproxy.work to myproxy.work/portfolio/username
- [x] Grant-access users can edit — removed tier-based "Upgrade to Edit" restriction
- [x] Blog system — admin CRUD (Blog tab in admin.tsx), public listing (/blog), post pages (/blog/:slug), JSON-LD SEO
- [x] FAQ updated — formatted answers with spacing/bullets, ATS question added, feedback section with mailto
- [x] FAQ JSON-LD structured data for AEO (schema.org FAQPage)
- [x] Sitemap.xml — auto-generated from static pages + published blog posts + published portfolios
- [x] Robots.txt — allows public pages, blocks admin/dashboard/API
- [x] Blog nav links added to landing, about, faq pages
- [x] Google Search Console verification DNS record added
- [x] Zoho Mail set up for vinos@myproxy.work (MX, SPF, DKIM, DMARC configured)
- [x] Privacy policy contact email updated to vinos@myproxy.work
- [x] DMARC softened to p=none for email deliverability during launch
- [x] Sender display name on transactional emails ("Proxy <noreply@myproxy.work>")
- [x] Contact email updated to vinos@myproxy.work in terms.tsx, faq.tsx, email templates
- [x] Sprint 2: No questionnaire-complete gate — users can pay at any point after CV upload + AI pre-fill

## File Map (important files)
- `server/index.ts` — Express app, middleware stack (helmet, rate limiters, CSRF)
- `server/routes.ts` — All API endpoints + session middleware (registered inside registerRoutes)
- `server/ai-processor.ts` — Gemini calls: `processQuestionnaire()`, `parseResumeWithGemini()`, `generateQuestionnaireDraft()`
- `server/storage.ts` — All DB queries (DatabaseStorage class)
- `server/db.ts` — Drizzle + pool setup (pool exported for connect-pg-simple session store)
- `server/logger.ts` — Structured JSON logger (use instead of console.*)
- `server/system-prompt-builder.ts` — Builds chat system prompt from knowledge entries
- `shared/schema.ts` — Drizzle DB schema + Zod types
- `client/src/pages/questionnaire.tsx` — 11-step questionnaire
- `client/src/pages/portfolio.tsx` — Public profile page + chat
- `client/src/pages/preview.tsx` — Owner preview + edit
- `client/src/pages/dashboard.tsx` — User dashboard
- `client/src/pages/auth.tsx` — Login + Register pages
- `client/src/pages/verify-email.tsx` — Email verification landing page
- `client/src/components/PaymentGate.tsx` — Stripe checkout UI
- `client/src/lib/queryClient.ts` — `apiRequest()` with auto CSRF headers
- `client/src/lib/auth.tsx` — useAuth hook, AuthProvider, login/register/logout mutations
- `client/src/pages/blog.tsx` — Public blog listing with category filters
- `client/src/pages/blog-post.tsx` — Individual blog post page with markdown renderer + JSON-LD
- `client/src/pages/admin.tsx` — Admin dashboard (Customers + Blog tabs)
- `server/emails.ts` — All email templates (verify, welcome, passwordReset, profileLive)

## Legal
- Privacy Policy: `/privacy` (Singapore PDPA, contact: vinos@myproxy.work)
- Terms of Service: `/terms` (Singapore law, prices $99/$199/$499)
