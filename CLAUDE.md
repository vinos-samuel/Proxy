# Proxy / BIOSai — Project Context
> **On session start:** Read `~/Documents/Projects/_MissionControl/PROJECTS.md` for cross-project context and priorities.

## Session Protocol
At the end of every session, update the "Current Sprint" block above with:
- What was completed
- Where we stopped
- What's next
- Any new decisions made

## Current Sprint — 2026-09-28 (Session 15)
**Status:** UI review → full front-end redesign, 4 commits on branch `claude/wonderful-wozniak-vcdxlw` (this branch also contains the unmerged Session 14 branch `remove-concierge-pricing-redesign`, so merging this one covers both). Typecheck unchanged (40 pre-existing errors, none in touched files), `npm run build` passes, `npm run test:profile-builder` 38/38. **Not yet on `main`, not deployed.** No schema change.

**Completed:**
- Step 1 (bugs): Publish visible on phones in the builder; published free users no longer told "Publish your page"; dashboard lock box overlap fixed; logo tagline removed; J&J removed from trust strip (Vinos: not a confirmed user); two "(not used yet)" private-note fields hidden (data kept)
- Step 2 (publish flow): one **Publish** button + confirmation sheet (URL, design, chat on/off, contact) that calls the existing `/api/builder/approve` then `/publish`; upload shows a 4-step progress checklist + skeleton; phone bottom bar (Improve/Edit/Design/Preview); **"Ask about my work" now ON by default for new pages** (CV upload + no-CV start only — `server/profile-builder.ts`, `server/profile-builder-routes.ts`; legacy imports and existing pages unchanged); FAQ corrected to match
- Step 3 (say less): new homepage — headline "Your CV can't answer questions. Your page can." / "Upload your CV. See your finished page in a minute, then share one link."; CV upload in the hero hands the file to `/try` via `client/src/lib/pending-cv-upload.ts`; 11 sections → 5; phone height 11,725px → ~3,950px. Dashboard rebuilt as a "your link" page
- Step 4 (one look): calm sage-and-serif brand across homepage, sign-in/register/password pages, dashboard, PaymentGate, share kit, About/FAQ/Blog/blog post/Privacy/Terms, payment success/cancelled, 404. New logo: lower-case serif "proxy" whose "o" is a ring with three typing dots (deliberately no speech tail — Evaneos uses a speech-bubble "O"). New favicon.svg/png, apple-touch-icon, og-image-v3.png. Builder gains a 5-check "Page strength" meter
- Removed the struck-through "$99" next to Pro $49 in PaymentGate (Pro was never sold at $99)

**Where we stopped:** all four steps committed and pushed to `claude/wonderful-wozniak-vcdxlw`. Verified only in local renders with mocked APIs (no local DB) — needs a real run on the Replit workspace.

**What's next:**
- Vinos: merge + deploy (steps below), then on the workspace: upload a CV from the homepage hero and confirm it lands on the progress screen and then the builder; publish once via the new sheet; check dashboard as a free published user
- Check `builder_first_page` seconds in PostHog before keeping "in a minute" in the headline subtext
- PostHog IS installed in `client/index.html` (contradicts older notes below). Its `api_host` is `https://us.posthog.com`; PostHog's standard US host is `https://us.i.posthog.com` — confirm events arrive in Live events
- Still old visual style (not in scope this session): questionnaire, preview, twin-interview, onboarding-chat, job-search, admin, preview-draft, portfolio page chrome
- Run a trademark search on the new logo before any print use

**Architecture decisions made this session:**
- One brand system: tokens + classes live in `client/src/index.css` under "Proxy brand" (`.site`, `.site-btn`, `.site-card`, `.site-display`…); shared `SiteNav`/`SiteFooter` in `client/src/components/SiteChrome.tsx`. New public pages use these, never the old 3px-border/green style
- The signature element is the talking "o" (`TalkingO` in `ProxyLogo.tsx`); reuse it for "answering…" states, nowhere decorative
- Publishing is one user action; the server's approve step stays as a stale-tab guard and is chained client-side
- Page-strength checks are computed from the document in the browser and must stay factual (no invented scores)

## Previous Sprint — 2026-09-26 (Session 14)
**Status:** All 21 findings from a copy-vs-code audit are implemented. `copy-audit-fixes` branch merged to `main` and pushed — Vinos pulled it on Replit workspace and confirmed the pricing section renders correctly. A second branch, `remove-concierge-pricing-redesign`, is pushed but **not yet merged** — needs Vinos's review and merge before deploy.

**Completed:**
- Fixed a real privacy bug: an "Improve" answer entered the public AI explorer's background as soon as a suggestion was generated, before the user accepted it — even a skipped suggestion stayed there. Now only entered on explicit accept (`server/profile-builder.ts`, `server/profile-builder-routes.ts`)
- Added real object-storage file deletion on account delete — headshot/video/CV were previously only removed from the DB, never from storage (`server/storage.ts`, `objectStorage.ts`)
- Fixed the new Page Builder's `/api/builder/publish` route never sending the "your page is live" email — only legacy publish paths did
- Fixed `nudge-cron.ts` early-returning for the entire hourly tick whenever no free-tier profile needed an edit-window/engagement nudge, silently skipping feedback/tips/weekly-digest emails for everyone else that hour
- Added a real total visitor-question count (`storage.getAnalytics`) — dashboard and emails previously showed a count capped at the last 10 rows and presented it as a total
- Made the tips email's opening line conditional on actual publish state instead of assuming every recipient had published
- Added a `LegacyRoute` guard on `/questionnaire` (previously only `/preview` and `/interview` had it) so current-Builder accounts can't land on the legacy form
- Documented PostHog/GA4/Meta Pixel in `privacy.tsx` — it claimed no third-party tracking while all three were live in `index.html`
- Rerouted landing-page pricing/final CTAs from `/register` straight to `/try`, matching the hero button's existing discovery-first pattern
- Removed Concierge from self-serve pricing on the homepage, FAQ, and terms — it had already been dropped from the dashboard's `PaymentGate` tier list in an earlier, unlogged change, but never removed from marketing copy. Backend (`server/routes.ts`, `payment-success.tsx`) still accepts a `concierge` tier — left alone on the assumption it's still sold manually, not confirmed with Vinos
- Redesigned both pricing UIs (homepage + dashboard) as a Pro-hero card with Free as a smaller secondary strip, now that there are only two self-serve tiers
- Fixed dozens of smaller copy issues: unsupported absolute claims, a dead "Delete Draft" button pointing at a nonexistent route, internal-looking `SCREAMING_SNAKE_CASE` feature labels, stale "11-step questionnaire" (it's 12), "Context Ingestion"/"career proxy" jargon, developer-facing 404 text
- Updated the stale `claude/fix-build-hanging-7MnVR` dev-branch instruction below — that branch is far enough behind `main` that merging it would have deleted the current Page Builder redesign

**Where we stopped:** `copy-audit-fixes` is merged to main and live on the Replit workspace preview, confirmed visually by Vinos. `remove-concierge-pricing-redesign` is pushed to GitHub but not yet merged — waiting on Vinos's review.

**What's next:**
- Vinos: review and merge `remove-concierge-pricing-redesign`, then deploy both branches' combined changes to production
- Verify on Replit (not tested locally — no local DB): object-storage file deletion on account delete, the new profile-live email send on `/api/builder/publish`, the privacy fix (skip a suggestion, confirm it never reaches the AI explorer)
- Confirm with Vinos whether Concierge ($499) is still sold at all (e.g. manually after a discovery call) — if not, strip the backend/`payment-success.tsx` support too
- Vinos wants to start GTM on the refreshed Proxy next week using a tool called "Origami" — not yet scoped, no context captured on what it is or how Claude's involved

**Architecture decisions made this session:**
- A "suggested change" only becomes background the public AI explorer can draw on once the owner explicitly accepts it (`applyProposal`) — never at the moment it's proposed. Any future feature that lets an owner preview AI-facing content before it's public must gate on acceptance, not generation
- Nudge cron's independent email programs (feedback, tips, digest) must never share a single early-return with the free-tier nudge loop — each program's due-list should be fetched and processed unconditionally
- Topic branches are per-session and named for the work (e.g. `copy-audit-fixes`), never a fixed dev-branch name — see the updated deploy section below for why

## Previous Sprint — 2026-09-26 (Session 13)
**Status:** `codex/proxy-experience-correction` (the redesign branch from Sessions before this one, 19 commits, never previously merged) is now merged to `main` and deployed to production. All bugs found during today's testing are fixed and deployed. Production data cleaned up.

**Completed:**
- Fixed expired live Stripe key (`STRIPE_SECRET_KEY` rotated in Stripe + both Workspace and Deployment secrets)
- Found and fixed a real bug: a logged-in user's CV upload could silently overwrite an unrelated existing account's draft with no confirmation — added a `confirmReplace` guard on `/api/builder/upload`
- Found a second related bug: `loadBuilder()` let a logged-in user with no working draft yet silently inherit a stray guest session's draft — now returns null instead, guest content only reachable via explicit `/api/builder/adopt-guest`
- Merged `codex/proxy-experience-correction` into `main` (50 files, schema changes: new `active_document` column, new `guest_profile_documents` table) — resolved via a real `git merge`, not cherry-picking, with both branches' independent guest-draft-isolation fixes reconciled
- Fixed guest session cookie never being sent after CV upload (root cause: express-session's `shouldSetCookie()` requires the session object to actually change, not just `.save()` — verified against `node_modules/express-session` source directly)
- Fixed a recurring save-crash: AI-generated "improve" text (bounded to 2500 chars) written into fields with smaller real limits (headline 240, project fields 900, experience summary 800, source label 160) — found via exhaustive automated curl testing across all 3 sample CVs, two separate occurrences (one in `applyProposal`, one — the one actually hit in practice — in `/api/builder/improve` directly)
- Stopped raw ZodError dumps from reaching users (global error handler in `server/index.ts`); made it show just the failing field name for fast diagnosis without needing server logs
- Fixed bot answers collapsing into one dense paragraph — the "no markdown" anti-hallucination prompt rule had also banned all line breaks; now explicitly allows paragraph breaks while still banning markdown syntax characters
- Fixed missing post-publish navigation (no way back to dashboard except a buried footer link)
- Fixed welcome/tips email copy that assumed a cold registration, not a guest-draft-first signup
- Cleaned up production data: deleted a stray `profile_documents` row on the `vinos` account left over from the account-overwrite bug (its `working_document` had another test persona's data; `published_document`/`active_document` were never populated — the live page has always rendered from legacy `twin_profiles` fields, confirmed by direct SQL)
- Made the "use my existing profile" path prominent for any pre-existing account (published, ready, or draft) instead of a buried text link; added a dashboard note explaining "Add More Evidence" (enriches the current legacy live page) vs "Page Builder" (moves to the new design) are different tools

**Where we stopped:** Everything tested today is deployed and verified live. No open bugs from this session.

**What's next:**
- Hand off the prepared Codex review prompt (copywrite, email templates, notification copy audit) — given to Vinos, not yet run
- No other committed next item

**Architecture decisions made this session:**
- A logged-in user's CV upload must never silently replace an existing draft — always requires explicit confirmation, both server-side (`confirmReplace` param) and client-side (`window.confirm` prompt)
- Guest session establishment requires an actual property write on `req.session`, not just calling `.save()` — `saveUninitialized: false` means an unmodified session never gets cookied regardless
- Any value written into a bounded schema field must be clamped to that field's real limit at the point of assignment, not assumed safe because its own type allows more — this bit us twice in the same session on different fields
- Global error handler never forwards a raw ZodError's message to the client, but does surface the failing field path + issue text (not the value) so bugs are diagnosable from a screenshot alone

## Previous Sprint — 2026-09-01 (Session 12)
**Status:** P0 + all 4 P1 items code-complete, typecheck clean (42 pre-existing errors unchanged, none new), build clean. Committed to branch `blog-fixes-cta-capture-share`. **Not yet on `main`, not yet deployed** — Vinos needs to merge and run deploy steps (schema change, see below).

**This session completed:**
- P0 fixed: CTA blocks (`*[sentence. [link](url)]*`) were leaving stray `*`/`[`/`]` visible — the link regex swallowed the nested bracket, and there was no single-asterisk italic support at all. Added a block-level case in `renderMarkdown()` that strips the outer `*[ ]*` wrapper before parsing, added general single-asterisk italic to `inlineMarkdown()`, tightened the link regex so it can't span into a nested `[`. Verified with a standalone test script (5 cases incl. bold-inside-CTA and non-CTA regression checks) before touching the real component — all passed
- P1.1 Email capture: new `blog_subscribers` table (`shared/schema.ts`) — separate from `customers`, no auth/lifecycle overlap. `POST /api/blog/subscribe` (dedup by email, existing CSRF pattern, no new rate limiter — general API limiter already covers it). Capture form on `blog-post.tsx` after post content + share bar
- P1.2 Share bar: copy-link (clipboard API + 2s "Copied" state), LinkedIn share-intent link, X/Twitter share-intent link. Pure frontend, no backend
- P1.3 Keep Reading: reuses existing `GET /api/blog` list client-side, same-category posts if ≥2 exist else most recent, excludes current post, caps at 3
- P1.4 Byline: hardcoded "Written by Vinos Samuel" under the post title
- P2.5 (source citations) partially covered for free: inline links inside post body now render correctly as a side effect of the P0 fix. Did NOT build the dedicated "Sources" schema field — that's stretch scope requiring a new column, per the brief's own instruction to confirm before adding one

**Where we stopped:**
- Did not touch the two "don't guess" open questions — category taxonomy mismatch and monospace body font — no code changes made for either, flagging both back to Vinos per the brief
- Did not build a dedicated post-schema "Sources" block (P2 stretch) — needs a decision first
- Did not attempt to remove any prose "forward this post" CTA line that may still live inside individual posts' stored `content` — that's per-post DB content, not code; the new Share bar is additive, nothing was deleted from post bodies

**What's next:**
- Vinos: merge `blog-fixes-cta-capture-share` to main, deploy (schema changed — see deploy steps), verify P0 fix + new sections on a live post
- Decide: taxonomy (keep current live tabs vs match content-calendar pillars — my lean stated in the brief: keep live taxonomy, remap planning docs to it)
- Decide: whether to build the dedicated "Sources" schema field, or leave inline links as the citation mechanism
- Still open from session 11: PostHog wiring
- **Queued (not started):** add a second share bar + email capture form near the top of the blog post page (currently both only appear after the post body). Vinos wants both positions — top and bottom — not top instead of bottom.

**Architecture decisions made this session:**
- CTA convention (`*[sentence with optional [link](url)]*`) is now a recognized block-level pattern in the markdown renderer, not just inline emphasis — any future content convention like this should get its own block-level case rather than trying to force it through inline regex alone
- `blog_subscribers` is intentionally separate from `customers` — no shared lifecycle, no password, just email capture. Don't merge these later without a real reason
- Related-posts logic lives entirely client-side against the existing `GET /api/blog` endpoint — no new endpoint needed for a same-page, same-request-cycle feature like this

**Don't touch (this session, unchanged):** server/ai-processor.ts, Stripe webhook flow

---

## Previous Sprint — 2026-08-18 (Session 11)
**Status:** Both workstreams (honest marketing copy + free-tier edit-window fix) are code-complete, typecheck/build clean, committed to branch `honest-copy-and-free-tier-fix`. **Not yet on `main`, not yet deployed** — Vinos needs to merge and run the deploy steps.

**This session completed — Workstream A (honest copy):**
- Hero rewritten: "Don't send a PDF. Send a link." + "Built for mid to senior professionals whose careers don't fit on two pages." Trust statement moved directly under the CTA buttons (was buried lower on the page). Priya hero widget untouched — still live-fetches `/api/portfolio/priya`, no homepage theme picker added (stays declined per session 10)
- Cut fabricated/borrowed stats wherever found: the "8-minute conversation vs 6-second scan" pairing, "87% never reach a human," and the Laszlo Bock 5–10x referral stat (real, but about referrals generally — not Proxy's own data). Kept the real qualitative point each was making, just without the invented number
- Stopped marketing Job Search Agent/CRM as a homepage feature: removed the Pro-tier bullet, the comparison-table row, and the CRM-focused testimonial (testimonial grid now 2 cols, not 3). The feature itself, `server/job-search-agent.ts`, is untouched and still explained honestly in FAQ, gated to Pro
- Replaced the 5-item "what happens after" list and about.tsx's vague "Agents Coming" suite-pitch card with the same 3 plain-word uses: email signature, LinkedIn, send instead of a CV
- Found and fixed a false FAQ claim while auditing ("recently shipped: session analytics via PostHog") — PostHog isn't wired (confirmed multiple times this project), only basic view/question counts are real and shipped. Corrected to describe what's actually there
- portfolio.tsx: "Download CV" button now hidden on all 4 themes when `cvResumeUrl` is a literal placeholder string, not a real URL — Priya's flagship demo had a dead button before this
- Dropped 2 "unlock" instances in dashboard.tsx per copy rules

**This session completed — Workstream B (free tier stops being a trap):**
- Real behavior change, not just copy: the free-tier edit gate in `PATCH /api/profile` now checks 7 days (168h) since `freePublishedAt`, not 48h. Drafts were already unrestricted before this (the gate only ever applied post-publish) and still are
- `dashboard.tsx`'s `freeWindowExpired` check, `nudge-cron.ts`'s edit-window-closed email trigger (was 50h, now 170h), and `emails.ts`'s `nudgeEditWindowTemplate` copy all updated to match the new 7-day window
- Copy fixed everywhere it said "1 edit within 48 hours": landing.tsx pricing card, PaymentGate.tsx tier list + publish-free confirmation modal, FAQ (both plainText and rendered), terms.tsx
- No schema change — reused the existing `freePublishedAt` column, just changed the threshold

**Where we stopped:**
- Everything above is on branch `honest-copy-and-free-tier-fix`, not merged to `main`, not deployed. See deploy steps given to Vinos at end of session
- Did not start a third workstream — job-search-agent.ts, ai-processor.ts, Stripe webhook, and job-search.tsx are all untouched as instructed

**What's next:**
- Vinos: merge branch to main, deploy, verify on production (see deploy steps)
- Still open from session 10: PostHog wiring (now blocks even more — pricing A/B test, job-search-agent adoption, and this session surfaced a FAQ line that had to be walked back because of it)
- Known Pending Tasks below still has the stale "CRM Phase 2 not started" line from before session 10's finding — someone should clean this up next time this file is touched for real, not just noted again

**Architecture decisions made this session:**
- "Make the product honest" now has a concrete standard: no stat on a public page unless it's Proxy's own data or explicitly attributed with a real source. Borrowed/generic industry stats (Laszlo Bock, "87%", "8 min vs 6 sec") read as Proxy's own performance claims to a visitor — cut them, keep the qualitative point
- Marketing pages don't sell in-progress or under-demoed features. Job Search Agent/CRM is real and shipped, but it lives in FAQ (where a Pro user can find it) not the homepage, until it has its own public proof point
- Free-tier edit windows are governed by one existing field (`freePublishedAt`) checked against `tier` — never add a second edit-tracking mechanism; change the threshold, not the approach
- A placeholder value (e.g. `cvResumeUrl` still holding literal template text) must fail closed in the UI — hide the affected element rather than render a broken link, especially on demo/flagship accounts other people are actually looking at

**Don't touch (this session, unchanged):** server/ai-processor.ts processQuestionnaire(), Stripe webhook flow, server/job-search-agent.ts and job-search.tsx, LinkedIn enrichment/Proxycurl, auth flows on worf.replit.dev

---

## Sprint History — 2026-08-18 (Session 10)
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

**⚠️ CRITICAL — Claude's rule:** Every session, commits go to a new topic branch named for that session's work (e.g. `copy-audit-fixes`, `honest-copy-and-free-tier-fix`) — never straight onto `main`. Claude MUST end every session by telling Vinos the exact branch name and how to merge it into main. Work is NOT done until it is on main. Never leave commits only on a topic branch with no merge instructions.
(History note: an earlier fixed branch name, `claude/fix-build-hanging-7MnVR`, was named here — it went stale and, as of 2026-09-26, is far enough behind `main` that merging it would delete the current Page Builder redesign. Don't merge it. Always check `git log main..<branch>` and `git diff main <branch> --stat` before merging any old branch, dev or otherwise.)

**Step 1 — Merge this session's branch and push from Mac terminal (from proxy folder, replace `<branch>` with the name Claude gave you):**
```
git checkout main && git merge <branch> && git push origin main
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
