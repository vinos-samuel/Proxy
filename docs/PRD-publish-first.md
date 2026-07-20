# PRD — Publish-First Flow, Executive Theme, Honest Prose

**Product:** Proxy (myproxy.work)
**Written:** 2026-07-16
**Owner:** Vinos
**Builder notes:** Read `CLAUDE.md` in the repo root first — it has the deploy workflow, the two-database model (workspace vs production), and the don't-touch list. Every schema change in this PRD must ship with the exact `ALTER TABLE` statement for the Replit production SQL console (one statement at a time). Do not touch: Stripe webhook flow, `server/job-search-agent.ts`. Keep diffs surgical; match existing code style. Run `npx tsc --noEmit` and `npm run build` before declaring any workstream done.

---

## 1. Problem

58 signups → 40 uploaded a CV → 14 published → 2 paid. The biggest leak is upload→publish (65% drop). Root causes, confirmed by code review and user observation:

1. All 11 questionnaire sections stand between the user and a published page. The AI pre-fills ~80% but the UI shows 0% progress and 12 apparently-incomplete steps.
2. The bot path is unbounded (10–20 exchanges) and ends by dumping the user back into the forms.
3. The published output undersells: dark theme reads "developer portfolio" not "executive profile," the hero is two dense paragraphs of AI-sounding prose, the chat (the differentiator) sits 7,000px down the page, and missing photo/video render as ugly placeholders.

## 2. Goal & success metric

**Goal:** a new user goes from CV upload to a published, good-looking, honestly-written profile in under 10 minutes, then improves it in small optional steps that each visibly upgrade the live page.

**Primary metric:** upload→publish rate. Historical benchmark 35% (40→14). Target: 60%+ for new cohorts.
**Guard metric:** published profiles per week; time-to-publish (signup → published).

## 3. Out of scope

- Agency features (candidate masking, consultant notes, agency branding, shortlist pages)
- Pricing changes
- Removing Tech/Creative themes from *existing* published profiles (they keep what they chose)
- CRM / job-search agent changes

---

## Workstream 0 — Test harness (build FIRST)

Testing today requires manually creating accounts and typing profile content. Remove that friction permanently.

### 0.1 Sample CV fixtures
- Create `test-fixtures/` in the repo with 3 PDF CVs for fake personas (generate the PDFs — simple text-based, 2 pages each):
  - `cv-senior-ops.pdf` — Priya Nair, Head of Operations, 18 yrs, financial services, Singapore
  - `cv-tech-lead.pdf` — Marcus Tan, Engineering Manager, 12 yrs, SaaS, remote
  - `cv-marketing-vp.pdf` — Elena Rodrigues, VP Marketing, 15 yrs, FMCG, Hong Kong
- Each CV must include: contact block, summary, 4+ roles with dated achievements (with numbers), skills list — enough for the AI draft to be rich.

### 0.2 Seed personas — `npm run seed:test`
- New script `script/seed-test.ts`, npm script `seed:test`. Runs against `DATABASE_URL` (workspace only — refuse to run if the URL host matches production; check for a `--force` flag override).
- Creates/rebuilds 4 accounts (idempotent — delete and recreate on rerun):

| email | password | state |
|---|---|---|
| test-fresh@proxy.test | test1234 | verified, no profile |
| test-draft@proxy.test | test1234 | profile with full `_aiDraft` questionnaireData (reuse Priya persona content), status `draft` |
| test-ready@proxy.test | test1234 | processed profile, status `ready`, unpublished |
| test-live@proxy.test | test1234 | published + public, free tier, viewCount 23, 6 chat_messages questions spread over the last 10 days |

- Print the account table to console on completion, clearly formatted so Vinos can read credentials straight off the terminal without hunting — e.g.:

```
============================================
 TEST ACCOUNTS READY — myproxy.work workspace
============================================
 test-fresh@proxy.test   / test1234   → no profile yet
 test-draft@proxy.test   / test1234   → AI draft, not submitted
 test-ready@proxy.test   / test1234   → processed, ready to publish
 test-live@proxy.test    / test1234   → published, 23 views, 6 questions
============================================
Login at: https://worf.replit.dev/login
```

**Acceptance:** running `npm run seed:test` twice in a row succeeds; logging in as each persona lands in the correct state; production URL guard refuses to run; the printed table is copy-paste ready (aligned columns, includes the login URL).

---

## Workstream 1 — Honest prose (prompt rewrite)

The profile generator produces hype ("visionary system builder," "redefines enterprise growth," "showcasing his unique ability"). Senior professionals and the recruiters reading them discount this language instantly.

### 1.1 Where
- `server/ai-processor.ts` — every prompt that generates visitor-facing prose: `processQuestionnaire()` (persona/summary/knowledge content), `generatePortfolioPreview()` (positioning, heroSubtitle), `generateQuestionnaireDraft()` (professionalSummary, story text).
- Do NOT restructure these functions — edit prompt text only.

### 1.2 Style rules to add to each prose-generating prompt

```
WRITING RULES (mandatory):
- Short sentences. Plain words. Write like a sharp colleague describing this person, not a marketer.
- Every claim must be anchored to something specific: a number, a company, a project, a timeframe.
- BANNED WORDS/PHRASES (never output): visionary, passionate, transformational, transformative,
  redefines, revolutionize, spearheaded, dynamic, results-driven, seasoned professional,
  proven track record, cutting-edge, innovative mindset, thought leader, synergy, leverage (as a verb),
  unique ability, showcasing, testament to, delve, tapestry, in today's fast-paced world.
- No sentence may start with a rhetorical setup ("What sets X apart is...", "It's not just X, it's Y").
- If the CV gives no number for a claim, state the claim plainly without inflating it.
- Positioning line: max 140 characters, one sentence, concrete. Good: "I run supply-chain ops for
  consumer brands — 18 years, 3 markets, $200M budgets." Bad: "A visionary operations leader
  transforming businesses."
```

### 1.3 Acceptance
- Re-run generation on the `test-draft` persona: output contains zero banned words (add a unit-style check script `script/check-prose.ts` that greps generated output for the banned list — manual run is fine, no CI needed).
- Positioning fits 140 chars; hero paragraphs (if any remain post-Workstream 3) each ≤ 3 sentences.

---

## Workstream 2 — Executive light theme (new default)

### 2.1 Theme definition
Add `executive` to the `themes` object in `client/src/pages/portfolio.tsx`, same key shape as existing themes:

- Background `#FAFAF7` (warm off-white); text `#1A1A1A`; muted `#5A5A62`
- Single accent: deep green `#15803D` (buttons, links, chat user bubble, timeline dots). No gradients, no glow effects — `glow`/`ctaGlow` values should be subtle shadows (`shadow-sm`, `shadow-md`), not colored halos
- Cards: white background, `border border-[#E7E7E1]`, `rounded-lg`, `shadow-sm`
- Headings: Space Grotesk (already loaded), tight tracking; body: system sans/Inter
- Chat: user bubble `#15803D` white text; bot bubble white with `#E7E7E1` border
- Metric numbers: `text-4xl font-bold text-[#1A1A1A]`
- Must pass WCAG AA contrast on all text

### 2.2 Wiring
- New profiles default to `executive`: change the fallback in `portfolio.tsx` (`rawTheme || "corporate"` → `"executive"`) AND the questionnaire step 10 default AND `shared/schema.ts` default for `brandingTheme` (currently "executive" string already — verify it maps).
- Step 10 theme picker: reduce choices to two — "Executive (recommended)" and "Dark". "Dark" maps to the existing `corporate` theme. Existing profiles with `tech`/`creative` keep rendering with their stored theme (keep those theme objects; just remove them from the picker).
- The draft preview page renders in `executive`.

### 2.3 Acceptance
- `test-live` persona re-pointed to executive renders correctly: light page, AA contrast, no glow effects, chat legible.
- A profile with `brandingTheme: "tech"` still renders exactly as before.

---

## Workstream 3 — Portfolio page restructure (hero + chat + empty states)

### 3.1 Hero (first viewport, desktop and mobile)
Replace the current name + paragraphs hero with:
- Photo (if present), name, **one-line positioning** (the ≤140-char line from Workstream 1), current role + location
- Up to 3 stat chips (first 3 entries of `stats` jsonb; hide the row if fewer than 2)
- **Inline chat entry:** an input field ("Ask me anything about my work…") plus 2 suggested-question chips (from `portfolioSuggestedQuestions`). Submitting from the hero scrolls to the chat section and fires the question there.
- CTA row: [Ask my Twin] (scrolls to chat) · [LinkedIn] · [Download CV] — render only the ones with data.

### 3.2 Full story
- The long persona paragraphs move into a "Full story" section, collapsed by default behind a "Read the full story →" expander. First 2 sentences visible as teaser.

### 3.3 Empty states — collapse, never placeholder
- No photo → hero renders single-column, no avatar circle, no initials badge
- No video → video section does not render at all (no player shell, no caption)
- No stats → no chips row; timeline empty → section + nav item hidden; skills empty → hidden
- Draft mode keeps its existing lock overlays (draft mode is a sales tool — do not change it in this workstream)

### 3.4 Section nav
- Sticky top nav (light, blurred backdrop): Story · Experience · Numbers · Ask me — anchor links, only for sections that exist. Mobile: horizontal scroll pills.

### 3.5 Scroll-reveal bug
- Investigate the framer-motion scroll-reveal sections rendering as black/invisible at mid-scroll (reproduced in an automated browser on `portfolio/anthonychan`). Either fix the `whileInView` trigger (add `viewport={{ once: true, amount: 0.1 }}`) or remove reveal animations entirely. Content must never be invisible after scroll.

### 3.6 Acceptance
- `test-live` persona: chat question submitted from hero chip appears in chat section with answer; profile with no photo/video/stats shows no dead zones; every section reachable from nav; no invisible sections at any scroll position (verify by screenshotting at 5 scroll offsets).

---

## Workstream 4 — Publish-first flow

### 4.1 Server: allow publishing an AI draft
`server/routes.ts` `/api/publish-free`:
- Current gate rejects `status !== "ready" && !== "published"`. Change: also accept `status === "draft"` **when** `profile.questionnaireData?._aiDraft === true`.
- The existing code path already runs `processQuestionnaire()` for draft-status profiles — verify it fires, keep it async (publish returns immediately, processing completes in background; page shows "Twin is warming up" until knowledge entries exist — see 4.6).

### 4.2 Draft preview: add the publish exit
On `/portfolio/:username?draft=true`, alongside the existing "Complete your profile" CTA:
- Primary button: **"Publish this now — free"** → confirmation modal (reuse free-confirm content from `PaymentGate.tsx`: 48hr edit window, URL preview) → calls `/api/publish-free` → success screen with the existing share kit.
- Secondary: "Improve it first" → existing onboarding-chat route.
- Banner copy change: "AI built this from your CV. Publish it now, or make it stronger first — you can deepen it anytime after it's live."

### 4.3 Questionnaire: endowed progress + renames
- Stepper: steps whose data is non-empty (AI-prefilled or user-filled) show a green check; progress bar starts at the true percentage, not 0.
- Renames (UI strings only, no schema changes): "Context Ingestion" → "Your Story" · "War Stories" → "Your Best Stories" · "Objection Handling" → "Tough Questions" · "Chatbot Setup" → "Your Twin's Setup"
- Remove "(min 3)" style labels from step descriptions; minimums stay enforced only at submit for the *full* profile path, and are NOT required for free publish of an AI draft.

### 4.4 Bot: capped one-topic sessions
`server/onboarding-agent.ts` + `client/src/pages/onboarding-chat.tsx`:
- Add a `mode` to the session: `"full"` (existing) or `"one_story"`.
- `one_story` mode system prompt: capture ONE career story (challenge → what they did → result with numbers) in **at most 6 exchanges**, then wrap with the exact completion phrase. UI header shows "Story session · ~5 minutes".
- Completion of ANY bot session navigates to the draft preview (if unpublished) or the live profile (if published) — **never** back into the questionnaire forms. The done-screen buttons change accordingly ("See it on your profile →").

### 4.5 Dashboard: Twin strength meter + one next action
For published profiles, replace the "how to publish" block with a **Twin Strength** card:
- Score (0–100): published base 40 · +10 per real story with all 4 fields, max 3 (30) · +10 writing sample present · +10 Q&As approved (step 8 has 3 non-empty answers) · +5 photo · +5 video
- Show as a labeled meter ("Your Twin: 60 — Solid. Two stories short of Strong.")
- Below it, exactly ONE suggested action (highest-value missing item, in this order: first story → writing sample → Q&As → second story → photo → third story → video), as a single button that deep-links to the right micro-session (one_story bot, or the specific questionnaire step).
- Each completed action triggers reprocessing of the affected knowledge (existing submit/reprocess path) and the card updates.

### 4.6 "Twin warming up" state
- Immediately after a draft publish, knowledge entries may not exist yet (background processing). Portfolio chat: if profile is published but has zero knowledge entries, the chat answers from the draft-chat pipeline (`/api/chat/draft` logic) instead of failing; show a subtle "Twin is still learning — full answers in a few minutes" note. Poll/flip to the real chat when processing completes.

### 4.7 Nudges & digest (wire the loop)
- Existing nudge cron (`server/nudge-cron.ts`) stays. Add to the weekly digest (built 2026-07-16, `weeklyDigestTemplate`): if the profile's Twin Strength < 70, append one line — "Your Twin is at {score}. {next action} would make it stronger →" linking to the dashboard.
- **Unanswered-question tagging:** add `answered_ok boolean DEFAULT true` to `chat_messages`. In the portfolio chat handler, when the Twin's reply IS the fallback response (string match against the profile's `fallbackResponse`), set `answered_ok = false`. Digest email: if any `answered_ok = false` this week, include "A visitor asked something your Twin couldn't answer: '{question}'. Add a story about it →".
- Production SQL (run one at a time in Replit production SQL console):
```sql
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS answered_ok BOOLEAN DEFAULT true;
```

### 4.8 Acceptance
- `test-draft` persona: from draft preview, one click + confirm publishes; page is live; chat answers within the warming-up state; share kit shows.
- `test-fresh` persona: full path CV upload → preview → publish in under 10 minutes of user time.
- Bot one_story session ends in ≤6 exchanges and lands on the profile, not the forms.
- Strength meter math matches the table above; suggested action deep-links correctly.
- A chat question hitting the fallback is stored with `answered_ok = false` and appears in the next digest.

---

## 5. Phasing (each phase independently shippable)

| Phase | Contents | Size |
|---|---|---|
| 0 | Test harness (fixtures + seed:test) | S |
| 1 | Prompt rewrite (WS1) | S |
| 2 | Executive theme + picker reduction (WS2) | M |
| 3 | Portfolio restructure: hero, chat-in-hero, empty states, nav, scroll bug (WS3) | L |
| 4a | Publish-from-draft: server gate + preview CTA + warming-up chat (4.1, 4.2, 4.6) | M |
| 4b | Questionnaire progress + renames; bot caps + routing (4.3, 4.4) | M |
| 4c | Strength meter + next action; digest additions + answered_ok (4.5, 4.7) | M |

Ship order: 0 → 1 → 2 → 4a → 3 → 4b → 4c. (4a before 3 because publish-first moves the metric fastest; the restructure makes what they publish better.)

## 6. Copy guidelines (all new UI strings)

Short sentences. No AI-sounding phrases (no "It's not X, it's Y", no "seamlessly", no "unlock"). Buttons say what happens: "Publish this now — free", "Add one story (5 min)", "See it on your profile". Never guilt the user ("You're missing…" → "One story would make this stronger").

## 7. Deploy reminders (per CLAUDE.md)

- Schema changes in this PRD: `chat_messages.answered_ok` (4.7). Workspace: `npm run db:push` is NOT safe in this repo (it proposes destructive drift) — apply columns with direct `ALTER TABLE` in both workspace and production SQL consoles.
- After each phase: push to GitHub main → Replit `git fetch origin && git reset --hard origin/main` → `npm run build` → Republish from Deployments tab → curl-verify on myproxy.work.
