# Proxy Daily Log

---

## 2026-04-03 (Session 2)

**Tasks Completed**
- Meta Pixel noscript tag moved from head to body (fixed build warning)
- DAILY_LOG.md created as session tracking record

**Files Modified**
- `client/index.html` — noscript tag relocated to body

**Blockers**
- Meta Pixel verification in Events Manager still pending — Vinos to confirm
- Projects & Showcase feature planned but not started (prerequisite: source-aware delete in processQuestionnaire)
- Content Import feature (Obsidian/Day One notes) added to roadmap, not yet scoped

---

## 2026-04-03

**Tasks Completed**
- Pricing restructured: Free / Pro $49 / Concierge $499 (replaced Launch/Evolve)
- Free tier publish flow + 48hr edit window enforced server-side
- Chat switched to Claude Haiku 4.5, anti-hallucination rules added to system prompt
- Smart chat endings: follow-ups only when data supports, else redirect to contact
- Blog multi-select categories + Market Intelligence / Future of Employment added
- Meta Pixel 2190101848483943 installed (PageView, Lead, Purchase events)
- CSP updated in Helmet to allow connect.facebook.net and facebook.com

**Files Modified**
- `client/index.html` — Pixel base code + noscript tag
- `server/index.ts` — CSP directives updated
- `client/src/pages/auth.tsx` — Lead event on signup
- `client/src/pages/payment-success.tsx` — Purchase event on payment
- `client/src/vite-env.d.ts` — TypeScript type for window.fbq
- `client/src/components/PaymentGate.tsx` — Free/Pro/Concierge tiers
- `server/routes.ts` — publish-free endpoint, tier gating, edit window
- `shared/schema.ts` — freePublishedAt column

**Blockers**
- Meta Pixel not yet verified in Events Manager — Vinos to test today

---

## 2026-04-04

**Tasks Completed**
- Fixed free publish flow bugs: status lifecycle, dashboard stale cache, portfolio 404
- Added "reprocessing" status for dashboard UI during questionnaire re-edit
- Tech theme contrast improved (text-zinc-300)
- Removed "Why AI CV" from portfolio.tsx and preview.tsx edit panel
- Nudge email system: 2 emails (50hr edit window closed, 72hr engagement), hourly cron, double-send protection
- Questions feed locked behind Pro with blur + upgrade prompt
- Admin nudge-test endpoint verified — both emails confirmed in inbox
- Production DB columns added: nudge1_sent_at, nudge2_sent_at

**Files Modified**
- `server/routes.ts` — publish flow fixes + admin nudge-test endpoint
- `server/ai-processor.ts` — preserve published status after reprocessing
- `server/nudge-cron.ts` — new hourly cron job
- `server/emails.ts` — nudgeEditWindowTemplate + nudgeEngagementTemplate
- `server/storage.ts` — getFreeProfilesDueForNudge + markNudgeSent
- `server/index.ts` — register cron in production
- `shared/schema.ts` — nudge1SentAt, nudge2SentAt columns
- `client/src/pages/dashboard.tsx` — reprocessing status, locked questions feed
- `client/src/pages/portfolio.tsx` — tech theme contrast + remove whyAiCv
- `client/src/pages/preview.tsx` — remove whyAiCv edit section
- `client/src/components/PaymentGate.tsx` — query invalidation after free publish
- `package.json` — node-cron dependency added

**Blockers**
- None

---

## 2026-04-04

**Tasks Completed**
- Demo onboarding flow: landing page CTAs + ENGAGE nav button route through `/portfolio/test2?demo=true`
- Sticky "Create Mine Free →" banner added to demo portfolio (logged-out visitors only)
- "← Back to Proxy" top bar added to demo portfolio view
- New demo video (Proxy Demo - final 3.mp4) swapped in for Demo 2
- System prompt overhauled: data boundary concept, Type 5 (Data Insufficient), broader anti-hallucination rules, mandatory contact redirect
- Company fact misattribution fix: question scanned for company name, focus instruction injected into system prompt
- Global CLAUDE.md updated: explicit deploy instructions rule added

**Files Modified**
- `client/src/pages/landing.tsx` — demo routing, new video import
- `client/src/pages/portfolio.tsx` — demo banner, back bar, useAuth import
- `server/system-prompt-builder.ts` — full system prompt overhaul + company focus
- `server/routes.ts` — company mention detection passed to buildSystemPrompt
- `server/seed.ts` — decouple admin and demo user seed checks
- `attached_assets/proxy-demo-final-3.mp4` — new demo video

**Blockers**
- Nudge email conversions not yet checked (free users haven't joined with 48hr offer yet)
- Bot testing post-deploy still needed for company misattribution fix

---

## 2026-04-06

**Tasks Completed**
- SEO fixes: hidden H1, meta description 153 chars, gzip compression, reduced Google Fonts to 1 family
- Admin account email rotated to vinos@myproxy.work via production DB SQL
- Full cascade delete account: chat messages → knowledge entries → fact banks → profile → customer
- Self-serve DELETE /api/account endpoint added
- Danger Zone UI added to dashboard with confirmation dialog
- Privacy policy updated: security section, correct storage provider, self-serve deletion documented

**Files Modified**
- `client/index.html` — SEO fixes, font reduction, deferred FB pixel
- `server/index.ts` — gzip compression middleware added
- `package.json` — compression dependency added
- `server/storage.ts` — deleteChatMessagesByProfileId + full cascade deleteCustomer
- `server/routes.ts` — DELETE /api/account endpoint
- `client/src/pages/dashboard.tsx` — Danger Zone delete account UI
- `client/src/pages/privacy.tsx` — full rewrite with security section

**Blockers**
- Delete account flow awaiting production verification

---

## 2026-04-06 (Session 2)

**Tasks Completed**
- Built full Conversational Twin Interview feature: `server/interview-agent.ts`, 3 API routes, `client/src/pages/twin-interview.tsx`
- Added `lastDeepenedAt` column to `twinProfiles` schema
- Added `mergeInterviewData()` + `updateLastDeepenedAt()` to storage
- Added "Deepen Your Twin" card to dashboard with voice-first copy
- Fixed mic button visibility (was invisible, same color as background)
- Switched mic to continuous mode (user stops manually)
- Fixed "Upgrade to Pro" scroll-to-payment button
- Fixed PaymentGate showing for free-tier published users
- Fixed PaymentGate layout (added `md:col-span-2`)
- Switched interview routes from dynamic to static imports

**Files Modified**
- `server/interview-agent.ts` — new file: gap diagnosis, Claude interview, extraction
- `server/routes.ts` — 3 interview endpoints + static import
- `server/storage.ts` — mergeInterviewData, updateLastDeepenedAt
- `shared/schema.ts` — lastDeepenedAt column
- `client/src/pages/twin-interview.tsx` — new file: voice-first chat UI
- `client/src/pages/dashboard.tsx` — Deepen card, PaymentGate fixes
- `client/src/App.tsx` — /interview route added

**Blockers**
- CRITICAL: POST /api/interview/start still returns HTML (200) instead of JSON in production — routes not registering. Static import fix deployed but unconfirmed. Production DB still needs: `ALTER TABLE twin_profiles ADD COLUMN IF NOT EXISTS last_deepened_at TIMESTAMP;`

---

## 2026-04-08

**Tasks Completed**
- Fixed Twin Interview: switched from Anthropic to Gemini (uses existing API key) — now working in production
- Fixed analytics showing same data across users: `queryClient.clear()` on logout
- Added 48hr free edit window expiry banner on dashboard
- Added Admin Outreach tab: broadcast email to free/paid/all users with audience picker
- Added Nudge button per user row in admin (triggers both nudge emails manually)
- Fixed nudge button condition to use `subscriptionStatus` instead of `profile.tier`

**Files Modified**
- `server/interview-agent.ts` — switched from Anthropic SDK to Gemini
- `server/emails.ts` — added broadcastTemplate
- `server/routes.ts` — added POST /api/admin/broadcast
- `client/src/lib/auth.tsx` — queryClient.clear() on logout
- `client/src/pages/dashboard.tsx` — freeWindowExpired computed + expiry banner
- `client/src/pages/admin.tsx` — Outreach tab, nudge button, Mail/Send icons

**Blockers**
- None

---

## 2026-04-09

**Tasks Completed**
- Landing page copy rewrite — north star language, removed jargon, human-first tone throughout
- FAQ updated — conversational onboarding marked live, new FAQ entry added
- Two LinkedIn marketing posts drafted (@aiformyjob + Proxy product announcement)
- Job Search CRM Phase 1 built — 3 DB tables, 12 routes, 12 storage methods, new /job-search page with Pro gate
- OWASP Top 10 security audit — full codebase scored
- Fixed CRM IDOR — customerId now enforced in all 6 mutating WHERE clauses
- Fixed payment session fixation — ownership check on /api/payment/status
- Fixed host header injection — `req.hostname` replaces `x-forwarded-host` in all email link builders
- Fixed hardcoded session secret fallback — throws on startup if SESSION_SECRET missing
- Fixed prompt injection — `sanitizeForPrompt()` applied across all prompt builders in both AI files
- Deployed to production ✅

**Files Modified**
- `client/src/pages/landing.tsx` — copy rewrite
- `client/src/pages/faq.tsx` — conversational onboarding live, new entry
- `shared/schema.ts` — jobCompanies, jobContacts, jobApplications tables
- `server/storage.ts` — 12 CRM CRUD methods, IDOR fix, `and` import
- `server/routes.ts` — 12 CRM routes, session secret fix, host header fix, payment ownership check
- `server/ai-processor.ts` — sanitizeForPrompt applied to all prompt builders
- `server/onboarding-agent.ts` — sanitizeForPrompt applied to buildSystemPrompt
- `client/src/pages/job-search.tsx` — NEW FILE: CRM page
- `client/src/App.tsx` — /job-search route added
- `client/src/pages/dashboard.tsx` — Job Search nav link

**Blockers**
- Production DB migrations for CRM tables (3 CREATE TABLE statements) — run in Replit SQL console before testing

---

## 2026-05-14

**Tasks Completed**
- Replaced old Meta Pixel ID (2190101848483943) with new ads account (1519382716329664) in correct project file
- Added JSON-LD schema.org Person markup to every public portfolio page
- Redesigned payment success page — on-brand, share-first with pre-written LinkedIn post (AEO copy)
- Added persistent share card to dashboard for all published users
- Added AEO section to landing page — 4 pillars + AI search result mockup
- Added 2 new FAQ entries: "What is AEO?" and "Will AI agents find my profile?"
- Resolved CLAUDE.md merge conflict from stash/rebase

**Files Modified**
- `client/index.html` — Meta Pixel ID updated
- `client/src/pages/portfolio.tsx` — JSON-LD Person schema useEffect added
- `client/src/pages/payment-success.tsx` — full redesign with share modal
- `client/src/pages/dashboard.tsx` — persistent share card for published users
- `client/src/pages/landing.tsx` — AEO section added
- `client/src/pages/faq.tsx` — 2 AEO Q&As added

**Blockers**
- Deploy pending: push to GitHub → Replit pull → npm run build → redeploy

---

## 2026-05-19

**Tasks Completed**
- Installed Google Analytics 4 (G-750EWDCJL2) on myproxy.work
- Added `sign_up` conversion event firing on successful registration
- Added `purchase` conversion event firing on payment success page (with value + tier)
- Fixed Content Security Policy (Helmet) to allow GA4 domains — was silently blocking the script
- GA4 Realtime confirmed working (live user visible in Singapore)
- Parked pitch deck content ideas (6 posts mapped) for next two weeks

**Files Modified**
- `client/index.html` — GA4 gtag.js snippet added
- `client/src/lib/auth.tsx` — `sign_up` gtag event on register
- `client/src/pages/payment-success.tsx` — `purchase` gtag event on payment confirm
- `server/index.ts` — CSP updated to allow googletagmanager.com and google-analytics.com

**Blockers**
- `sign_up` not yet starred as key event in GA4 — needs first real signup to fire

---

## 2026-05-19 (Session 2)

**Tasks Completed**
- Fixed blog Soft 404: preloaded blog post data as `window.__BLOG_POST__` so React renders immediately without API call — Google now indexes posts
- Added `BlogPosting` JSON-LD schema to all blog posts (server-side)
- Added `og:type = article` to blog post pages
- Added custom meta + `Blog` JSON-LD schema to `/blog` listing page
- Requested indexing in Search Console for 4 key blog posts

**Files Modified**
- `server/static.ts` — BlogPosting JSON-LD, og:type, blog listing meta, window.__BLOG_POST__ preload injection
- `client/src/pages/blog-post.tsx` — use `initialData` from `window.__BLOG_POST__` to skip API call on first render

**Blockers**
- None — blog indexing submitted, Google will crawl within days
