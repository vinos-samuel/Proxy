# Proxy / BIOSai — Project Context
> **On session start:** Read `~/Documents/Projects/_MissionControl/PROJECTS.md` for cross-project context and priorities.

## Session Protocol
At the end of every session, update the "Current Sprint" block above with:
- What was completed
- Where we stopped
- What's next
- Any new decisions made

## Current Sprint — 2026-08-18 (Session 10)
**Status:** All 5 items of the "theme picker previews → landing widget → /try rebuild → email → LinkedIn" plan are done. Deployed, verified on production, redesign email sent to all users, LinkedIn article posted.

**This session completed:**
- Theme picker previews (item 1): new `client/src/components/theme-preview-swatch.tsx`, wired into `questionnaire.tsx` step 10 — token-accurate mini mockups for all 4 themes, replacing text-only radio cards
- Landing hero widget restyle (item 2): rebuilt to match real Executive theme (paper bg, serif headline, hairline borders, mono labels) instead of its own black brutalist card
- Found and removed `priya-demo.mp4` — a stale screen recording of a discontinued "Twin Interface" UI that predated all 4 current themes
- Found and fixed a deeper bug: the hero widget's "Priya" was fictional ("Priya Anand", invented Q&A) while the real demo account (`myproxy.work/portfolio/priya`) is Priya Sharma. Vinos switched her real profile to Executive theme; widget rebuilt to fetch her real name/role/photo/video/positioning-quote/suggested-questions live from `/api/portfolio/priya` — zero hardcoded content, can't drift again
- Root-caused a "chat fallback" bug Vinos saw on prod: he was testing on `worf.replit.dev` (workspace preview, separate DB) where the `priya` demo account doesn't exist — not a real bug. Confirmed working correctly on actual production
- Fixed `**bold**` markdown rendering as literal asterisks in chat answers on the hero widget and `/try` — extracted portfolio.tsx's `renderAnswer()` into shared `client/src/lib/renderAnswer.tsx`, used by all 3 chat surfaces now
- `/try` rebuild (item 3): draft preview card rebuilt in real-Executive-theme pattern, then expanded per feedback — added per-role achievement bullets and a Skills section (data was already returned by the backend, just never rendered), plus a callout explaining the full questionnaire sharpens the profile further
- Added theme-based audience segmentation ("Executive theme" / "Dark/Tech/Creative") to the admin broadcast tool, resolving legacy theme values the same way portfolio.tsx's rendering does
- Items 4–5: drafted and iterated email + LinkedIn copy through several rounds (corrected the underlying story twice based on Vinos's actual user feedback — first pass conflated "picker confusion" with the real issues, which were "themes looked generic" from existing users and "can't tell what I'd get" from dropped-off prospects), ran both through no-ai-slop and two other copywriting/storytelling skills. Generated real visual assets for both (theme-previews.png via Playwright screenshot of the actual shipped swatch component, plus a live screenshot of Priya's real profile) since Resend needed an actual image, not a mockup. Vinos sent the email via Resend (diagnosed a `[name]` merge-tag issue — Resend's Audience contact list is separate from Proxy's own DB and needs first names mapped on import) and posted the LinkedIn article. Both done.

**Where we stopped:**
- All 5 planned items shipped and confirmed live. No open thread from this plan.
- Discussed but explicitly declined: adding the 4 themes to the homepage for new users (Vinos: "leave the home page theme ask, do not build") — reasoning logged below in case it comes up again.
- Discussed separately: a personal outreach video (Vinos explaining Proxy) for 1:1 email/LinkedIn outreach to individuals, staffing companies, and freelancers — advised yes with two conditions (one reusable video not per-prospect, separate scripts per audience segment) and to track reply rate before scaling. Not built (it's a Vinos-side recording task, not code).
- Evaluated github.com/MadsLorentzen/ai-job-search as a possible fork for the CRM — verdict: don't fork (wrong stack for hosted SaaS, scrapes job boards which is a real ToS/legal risk at company scale). More importantly: discovered `server/job-search-agent.ts` (529 lines — research, outreach, follow-up, cover letter, role fit, interview prep, thank-you, negotiate, all using Twin profile data) is already fully built and wired into `job-search.tsx`, contradicting the stale "CRM Phase 2: not started" line in Known Pending Tasks below. The real open question is adoption, not capability — no PostHog wired yet, so usage of the agent panel is unmeasured.

**What's next:**
- No committed next item from this plan — ask Vinos what's next when picking this back up
- If revisited: PostHog wiring (blocks both the pricing A/B test and answering whether the job-search agent panel is actually used)
- Known Pending Tasks below has a stale line ("CRM Phase 2... not started") — the code exists; update that list next time it's touched

**Architecture decisions made this session:**
- Hero-widget-style "mini theme cards" (step 10 picker, landing hero, `/try` draft) all follow one pattern now: real theme color/font tokens, live-fetched real data where a real account exists, never hardcoded fictional content — extend this pattern rather than inventing a new one if another such card is needed
- Landing page and `/try` page chrome (nav, CTAs, upload/loading/error states) stays in Proxy's own brutalist site style; only the content that represents an actual profile gets restyled to match its real theme — a deliberate scope boundary, not an oversight
- `HERO_DEMO_USERNAME = "priya"` is now a single named constant in `landing.tsx` — every reference to the demo account routes through it, so the widget and the "see the full profile" link can never point at different accounts again
- Chat-answer bold-markdown rendering lives in one shared place (`client/src/lib/renderAnswer.tsx`) — any new surface that shows a live AI answer should import it, not reimplement it
- Homepage theme-picker fix (item 1) already covers "pick blind" — the real friction items 3–5 addressed were "themes looked generic" (existing users) and "can't tell what I'd get" (dropped-off prospects). These are two different problems; don't conflate them again in future messaging
- Don't scrape job boards to reduce CRM friction (ToS/legal risk at company scale) — if job-discovery friction gets prioritized, the lower-risk version is a user-supplied job URL fetched server-side on request, not systematic crawling

**Don't touch:** server/ai-processor.ts processQuestionnaire(), Stripe webhook flow, server/job-search-agent.ts (fully built — see above, not a stub)
**Pending decisions:**
- Test $19/mo pricing alongside $49 — not actioned
- PostHog session tracking for drop-off analysis — needed before A/B test, and now also needed to measure job-search-agent adoption
- Whether to backfill "roles you're targeting" for existing users, or leave it new-users-only permanently
- Free tier limits — visitor question cap discussed, not implemented
- Whether `/try`'s draft-preview pattern should also gain a real video slot — not raised yet, parallel opportunity
- Homepage 4-theme showcase for new users — explicitly parked this session, not rejected outright

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
| Database | Neon dev project (separate from prod — see note below) | Replit Production Database |
| Secrets | Workspace Secrets tab | Deployments → Secrets tab |
| Code runs | When Replit Run button is pressed | After clicking Deploy |

**⚠️ History note (fixed 2026-07-20):** for an unknown period before this date, the Workspace Secrets `DATABASE_URL` was actually pointing at the *same* database as production (both had host `ep-withered-rice-aigjhqf1...`). Any testing done on worf.replit.dev before this date — signups, logins, password resets — was writing to real production data, not a sandbox. This is now fixed: Replit's own Database tab for this project only offers a single database (no built-in way to add a second), so a genuinely separate dev database was created directly via neon.tech and wired into Workspace Secrets only. Production's Deployment Secrets were never touched and still point to the original database.

**Never test auth flows (login, password reset, email verification) on worf.replit.dev** — they use the dev database, which is now actually separate from production (see history note above for when this became true).

## Key Env Vars
**Workspace secrets** (dev, worf.replit.dev):
- `DATABASE_URL` — separate Neon dev project (host starts with `ep-blue-field-avzfds4n...`), NOT the production host (`ep-withered-rice-aigjhqf1...`). If this ever needs recreating, see the history note above — Replit's Database tab does not offer a second DB for this project, so provision directly at neon.tech and paste the connection string in here only.
- `AI_INTEGRATIONS_GEMINI_API_KEY` + `AI_INTEGRATIONS_GEMINI_BASE_URL`
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `FROM_EMAIL=noreply@myproxy.work`
- `SESSION_SECRET`, `NODE_ENV=production`
- Do NOT set `APP_URL` in workspace — without it, reset/verify links use the request host (worf.replit.dev), keeping dev tokens in dev DB

## Test Data — `npm run seed:test`
- Creates/resets 4 accounts on the workspace dev DB, each frozen at a funnel stage: `test-fresh@proxy.test` (no profile), `test-draft@proxy.test` (AI draft, unsubmitted), `test-ready@proxy.test` (processed, unpublished), `test-live@proxy.test` (published, fake views + questions). All passwords `test1234`.
- Refuses to run if the target DB has more than 20 customers (production-like) unless `--force` is passed — but even forced, it only ever touches the 4 `@proxy.test` emails.
- Sample CVs for manual upload-flow testing live in `test-fixtures/` (3 realistic PDF CVs — ops, tech, marketing personas). Regenerate them with `tsx script/generate-test-cvs.ts` if content needs to change.
- After any schema change, re-run `npm run db:push` against the workspace dev DB first, then `npm run seed:test` again.

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
- [ ] Run 3 CREATE TABLE migrations in Replit Production SQL console (job_companies, job_contacts, job_applications) if not yet done
- [ ] Test Job Search CRM on production end-to-end
- [ ] Blog PATCH Zod validation — `server/routes.ts` `/api/admin/blog/:id` PATCH passes raw `req.body` to storage (OWASP medium)
- [ ] CRM routes max-length validation — add length limits to CRM POST/PATCH endpoints (OWASP medium)
- [ ] Standardise bcrypt rounds to 12 — registration uses 10, password reset uses 12 (OWASP low)
- [ ] npm audit + @google-cloud/storage — 5 low-severity CVEs, downgrade to v5.18.3 (OWASP medium)
- [ ] "Your Twin is building" email on questionnaire submit
- [ ] Nudge emails (48hr after signup if draft, 48hr after ready if not published) — needs cron
- [ ] CRM Phase 2: AI agent features (company research, outreach drafting, interview prep using Twin profile)
- [ ] CRM Phase 3: Contact discovery (Apollo/people search integration)
- [ ] Subscription model — introduce after CRM Phase 3 ships; CRM currently for all Pro users
- [ ] Sprint 3: LinkedIn enrichment via Proxycurl API
- [ ] Post-launch: Fix @google-cloud/storage vulnerabilities (5 low severity, requires downgrade to v5.18.3)
- [ ] Scale: Add auth-gated signed URL proxy for CV/resume downloads — currently UUID-obscured but no auth on direct URL (PDPA concern at scale)

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
- [x] Conversational onboarding — two-path choice (Bot vs Forms), warm layered bot prompt, extraction on complete
- [x] Landing page copy rewrite — north star language, jargon removed, human-first tone
- [x] FAQ — conversational onboarding live (removed from coming-soon, new entry added)
- [x] Job Search CRM Phase 1 — companies, contacts, applications; 3 tables, 12 routes, new /job-search page
- [x] OWASP security audit — full Top 10 scored; 5 critical/high fixes applied
- [x] Security: CRM IDOR fixed — customerId enforced in all 6 mutating WHERE clauses
- [x] Security: Payment session fixation fixed — ownership check on /api/payment/status
- [x] Security: Host header injection fixed — req.hostname replaces x-forwarded-host in all email links
- [x] Security: Session secret hardcoded fallback removed — throws on startup if SESSION_SECRET missing
- [x] Security: Prompt injection — sanitizeForPrompt() applied across all AI prompt builders in both ai-processor.ts and onboarding-agent.ts

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
- `server/onboarding-agent.ts` — Conversational onboarding: Gemini-powered, in-memory sessions, sanitizeForPrompt applied
- `client/src/pages/onboarding-chat.tsx` — Onboarding chat UI with voice input
- `client/src/pages/job-search.tsx` — Job Search CRM (3 tabs: Applications, Companies, Contacts), Pro-gated

## Legal
- Privacy Policy: `/privacy` (Singapore PDPA, contact: vinos@myproxy.work)
- Terms of Service: `/terms` (Singapore law, prices $99/$199/$499)
