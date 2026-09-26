# Proxy: page-first creation and publishing

Date: 23 September 2026. Status updated 24 September: initial implementation reviewed with a real CV; corrections required before pilot. Read [EXPERIENCE_CORRECTION_PRD.md](EXPERIENCE_CORRECTION_PRD.md) for the current execution specification. Earlier broad readiness claims below are historical.

## 1. Outcome and scope

Positioning: **Prepare convincing evidence for your next opportunity.**

Concrete explanation: turn your CV and experience into a professional page you feel confident sending to a potential employer or client.

One Proxy product, for candidates and independent consultants. Consultants are a pilot audience, not an exclusive new market. Preserve existing accounts, content, public URLs, purchased access, and published designs.

The complete first release is:

**Upload CV → see a polished personal page → answer an optional targeted question → see the section improve → save → approve → publish → share.**

Both `/try` and direct signup must use this experience. This is not a cosmetic improvement to `/try` followed by the old questionnaire. Design quality is part of the first output, not a later layer. The public bot is optional; the private improvement panel is a separate feature.

Vinos requested planning only in this session. Execution belongs in a subsequent implementation session. No deployment, migrations, model API calls, or external messages were performed for this plan.

## 2. Design reference and fidelity contract

Open and inspect [the approved-direction concept](assets/workspace-concept.png) before implementation. It is a generated concept with fictional content, not an exact screenshot specification. Preserve its calm hierarchy, large page preview, editorial typography, compact side panel, and visible section improvement. Do not copy its incidental errors: inconsistent portraits between styles, arbitrary input counter, unnecessary stock photography, or fictional facts.

Deliver three new styles: **Editorial, Modern, Expressive**. Existing `executive`, `corporate`, `tech`, `creative` and their legacy aliases must continue rendering unchanged for existing published profiles. Use separate new style/version identifiers; do not silently remap old themes.

### Workspace

- Desktop: slim top bar with Proxy identity, save status, Preview, and Publish. Page takes about 70–75% of usable width; improvement panel about 25–30%, with a practical minimum width near 320px. Adapt at intermediate widths rather than shrinking text.
- Preview is the actual new public renderer with owner controls outside it. Do not maintain a second mock preview that drifts from the published result.
- Panel tabs: Improve, Style, Settings. Improve presents one question tied to a named section, answer input, Update my page, and Skip. No mandatory question count or completion percentage.
- An answer produces a proposed change to the affected section. Highlight the change and provide Keep, Edit, Undo. Keep commits it to the working draft; Publish is a separate action. Preserve the old section until acceptance. A later answer must not overwrite an unreviewed suggestion.
- Direct manual editing is always available. Users may stop answering and publish a valid page.
- Style thumbnails use the person's actual content and portrait. Switching style never changes their facts, writing, photo, or saved answers. Recommend a starting style without making style selection an entry gate.
- Mobile: full-width page with a reachable Improve action opening a dismissible bottom sheet or panel. Keep the relevant section visible after applying a suggestion. No squeezed desktop columns. Back, close, keyboard, focus, and unsaved-state handling are required.
- Saving, saved, failed, and retry states must be truthful. Never show a successful save before server acknowledgement.

### Public page

- Above the fold: name, clear professional value, relevant context, and a contact action. Optional real portrait. Selected work and experience follow according to available material.
- Project cards explain problem, personal contribution, and outcome when supplied. Show useful partial examples without empty labels or invented outcomes. With no suitable projects, lead with experience and strengths; do not fabricate case studies to fill a grid.
- Details can expand; the initial page remains scannable. The optional Ask about my work action is secondary and clearly identified as AI.
- Editorial: warm ivory, dark ink, restrained olive, expressive serif headlines, readable sans-serif body, hairline dividers and generous space.
- Modern: light background, navy/ink, clean sans-serif hierarchy, deliberate grid and compact evidence blocks. It must differ in composition, not merely accent colour.
- Expressive: plum/lilac or a similarly restrained bold palette, confident type and asymmetric composition, accessible body text. Professional rather than a gaming dashboard.
- Start around 16–18px public body text, comfortable line length, responsive headline scale, visible keyboard focus, adequate contrast, touch targets, and reduced-motion support. Test actual font loading and fallback layout.
- Decorative rules, geometric shapes, restrained colour fields, and typography can provide visual character. No dependence on stock photos, mandatory portraits, client logos, charts without data, or large empty media slots.

### Content-adaptive layouts

Each style must look intentionally finished with (a) a sparse CV and no media, (b) rich text and no media, (c) a portrait, and (d) approved work samples. Also test long names, long titles, missing metrics, and failed images. Text-only is a first-class composition, not the image layout with gaps removed.

Use existing uploads for portraits and supported media. Do not introduce an arbitrary-file publishing system. AI artwork generation, generated project images, and automated visual scoring are deferred. Never invent a face or visual proof of someone's work. A future artwork option must be decorative, optional, and outside the first-page critical path.

## 3. Current code: verified starting points

Read these files again before editing; this map is not permission to assume their contents remain unchanged.

- `client/src/pages/try.tsx`: anonymous PDF upload, generated preview and draft chat already exist. Replace the page-first experience here through shared components; do not build another unrelated preview.
- `server/routes.ts`: `/api/anon/upload-cv` currently parses the CV, then waits for both `generateQuestionnaireDraft()` and `generatePortfolioPreview()` in parallel. A new first page must not wait for the full questionnaire draft.
- Anonymous drafts currently live in the session, with a four-hour TTL and eight draft-chat messages. These are current implementation details, not proposed improvement-panel limits. Keep guest generation bounded and disclose actual expiry; choose and document limits during implementation.
- `/api/auth/register` claims an anonymous draft into the new account before email verification. Extend that handoff to preserve the entire new document, selected style, answers, edits, and any review state. Delete guest state only after durable transfer succeeds.
- `client/src/pages/auth.tsx`, `verify-email.tsx`, `client/src/lib/auth.tsx`, `App.tsx`, `dashboard.tsx`: inspect registration, verification, login destinations, and all creation links. Auth itself need not be replaced.
- `preview.tsx`, `preview-draft.tsx`, `questionnaire.tsx`, `onboarding-chat.tsx`: existing editors and redirects must route correctly for new versus legacy profiles. Legacy editors must not become an unguarded way to modify a new public page.
- `portfolio.tsx`: four existing complete layouts; retain legacy rendering, introduce a versioned new renderer used by both workspace and public page. Preserve public slug aliases in `server/portfolio-alias.ts`.
- `shared/schema.ts`: `twinProfiles`, `factBanks`, and `knowledgeEntries` already exist. There is no dedicated new working/public document separation. `PATCH /api/profile` writes directly to fields used for public output.
- `server/ai-processor.ts`: existing CV parser and generators. The current preview prompt asks for exactly four quantitative achievements. The new path must allow zero metrics and must not use invented story drafts as evidence.
- `server/onboarding-agent.ts`: existing conversation includes warm-up phases and typically 10–20 exchanges. Do not transplant that requirement into the improvement panel.
- `server/system-prompt-builder.ts`, public portfolio/chat endpoints and `server/storage.ts`: inspect all public reads, not just UI rendering. New draft material must never enter public answers or public JSON.
- `PaymentGate.tsx`, free-publish and paid-publish endpoints: preserve pricing, entitlement enforcement and Stripe webhook behavior. Existing free-publish code sets `freePublishedAt`; an update must not restart the seven-day clock.
- Analytics currently include conditional browser hooks; their presence does not prove events are delivered. Verify initialization and collection rather than claim PostHog is already complete.

Historical AGENTS sprint entries are stale. The July Mission Control freeze is superseded for this work by Vinos's explicit September request. Preserve unrelated files and uncommitted work. At planning start `AGENTS.md` was already untracked.

## 4. One journey, every entry route

Proposed shared authenticated route: `/builder`. `/try` uses the same workspace and renderer with a guest persistence adapter. Confirm naming against the current router; no second app.

1. Guest: `/try` → PDF upload → page → optional improvements → create account to save/publish → verify/login → same page. No re-upload, regeneration, or loss of selected design.
2. Direct signup: existing registration/verification → `/builder` → upload → same page and panel.
3. Guest who already has an account: login then explicitly adopt the guest draft. Never overwrite existing work silently; keep existing page and offer the new draft separately until accepted. Test interrupted and repeated claim attempts.
4. Returning none/draft/ready: offer the new builder and reuse existing material. Ready profiles do not need another questionnaire. Conversion is idempotent; inspect `_aiDraft` and `[EDIT]` markers and avoid treating generated placeholders as facts.
5. Published legacy: retain old page and bot behavior. Offer Try the new design as a private working copy. New content/design becomes public only after approval. Preserve the previous published version for rollback.
6. Published new: open the latest working document; public version stays unchanged until Publish updates.

Keep existing authentication checks, safe local return paths, ownership checks, CSRF double-submit headers via `apiRequest()`, and verification. Register/login/verification destination work is in scope; replacing auth is not. Do not test auth against production or `worf.replit.dev`; use isolated local test fixtures/test harness unless Vinos authorizes a different test environment.

## 5. Data and publishing design

Use a small additive, versioned document model. Recommended starting design: one new `profile_documents` table keyed uniquely to the existing profile, storing the private working document, an approved published snapshot, previous published snapshot for bounded rollback, document revision, schema version, and timestamps. Keep original source/provenance data private and separate from the public projection. The implementer must inspect the public/chat read paths and confirm this model before writing the migration. Do not create a general event-sourcing or unlimited history system.

The typed document needs stable section/project IDs, identity, positioning, experience, optional projects/outcomes, skills, user-selected contact fields, media references, new style/version, optional public-bot setting, and source references for generated claims. A source reference means supplied material supports the wording, not independent verification of truth. User statements can support a claim; mark their origin accurately.

Use strict Zod schemas, length limits, source-ID validation, an explicit public projection, and structured model output. Do not render arbitrary AI HTML or CSS. Uploading a CV does not grant permission to publish its phone, address, email, document download URL, or every source link. Contact details and downloads need explicit owner selection.

### Update semantics

- Every update carries the expected document revision. Reject stale results instead of overwriting newer manual edits, another tab, or a newer upload.
- Model responses are proposed section patches. Validate their scope; they cannot alter payments, ownership, publication status, unrelated sections, or source records.
- Keep, manual edits, and undo save atomically. Bound undo history and define it in the UI. A failed model call leaves the previous draft intact.
- Store skipped/answered questions against section revisions. Do not repeat a skipped question on every render. Reconsider only after relevant material changes or an explicit user request.
- Public APIs, cached metadata, social cards, downloads, and public bot retrieval use only the approved snapshot and explicitly selected public fields. Never serialize raw sources or the private workspace object.

### Publication and entitlements

New document publication must explicitly bind to a reviewed revision. Payment is not approval of future edits. Reuse existing entitlement rules, not a customer `paid` label alone (free publishing also uses paid-like fields).

For a new paid profile, stage the reviewed immutable snapshot while `isPublic` remains false. Existing checkout/webhook can activate the profile; the new public reader must show only that staged approved snapshot, never later working edits. First trace the actual webhook flow to confirm compatibility without modifying it. If the webhook can expose different content or mutate that snapshot, resolve the boundary before release rather than assume compatibility.

Free publication and updates must enforce current server-side eligibility, preserve the original `freePublishedAt`, and not reset paid tiers. Make publish retries idempotent; avoid duplicate first-publish notifications. No publish action can succeed while an unreviewed suggestion is unresolved without explicitly discarding it. Manual review of the rendered page is sufficient; no mandatory project/story counts or AI score threshold.

Legacy pages remain served by the old renderer until an approved new snapshot is active. Avoid overwriting legacy content solely to make the new builder work. Prevent old questionnaire/process/editor routes from overwriting new approved output after conversion. Keep the existing Stripe webhook and `processQuestionnaire()` unchanged; prefer isolated new services and adapters. Narrow changes to shared generation helpers are permitted only when necessary for this explicitly requested workflow and covered by regression checks.

## 6. Generation and useful questions

### First page

Parse the CV, map source facts, then generate only the initial page content needed. Reuse suitable existing helpers; do not force a full questionnaire, bot training, artwork, or question ranking to finish before showing the page. A deterministic source-based page is a valid fallback if generation fails. Parsing failure must show a useful retry path, not a fictitious profile.

Show honest progress stages rather than invented percentages. Make successful draft state resumable; do not depend on untracked in-process background work surviving Replit restarts. Prefer a simple bounded request design initially; add durable jobs only if measured execution times require them.

Instrument upload-to-first-usable-render before optimizing. Initial engineering targets, not public promises: median ≤60 seconds, p90 ≤120 seconds for representative supported PDFs under documented conditions. If missed, report actual timing by parse/generate/save/render stage and remove avoidable serial work. Do not hide latency by presenting fictional user content.

### Improvement panel

Candidate gaps come from actual sections: unclear contribution, unexplained problem, missing outcome, ambiguous audience, or a factual clarification. Pick one useful gap; zero questions is valid when nothing worthwhile is missing. Skip, I don't know, and direct editing must work.

Example: “What did you personally change in this project?” → user answer → a short revised contribution paragraph in that project → Keep/Edit/Undo. Do not regenerate the entire page, require numeric results, use manipulative quality scores, or turn this into an endless chat.

### Jev and Gemini responsibilities

- Code: fixed validation, layout/media presence rules, save/publish flow, budgets, revision checks, and routing.
- Jev, after evaluation: rank existing gap candidates; assess whether contribution/outcome is explained; select among approved layouts using supplied goals/content/preferences; flag wording that lacks support in supplied material.
- Gemini: CV interpretation where already used, initial prose, a natural-language question for a selected gap, and section rewrite proposals.
- A Jev judgement is not proof or permission. User review stays in the loop. It must not decide publication, authenticity, or employment suitability.
- Jev is text-only as of this plan. It cannot inspect a rendered design. Use real screenshots and human/vision-capable review for visual QA, code for measurable layout/accessibility checks.
- Read the TypeSafe skill and live docs before integration. Keep its key server-side; no credentials in source, logs, browser bundles, or prompts. Deployment secret setup is a Vinos handoff item.
- Evaluate against at least 20 deliberately varied, non-sensitive/labeled examples: sparse/rich CVs, repeated/skipped questions, unsupported metrics, conflicting answers, confidential work, and acceptable no-question cases. Compare useful-question selection, unsupported-claim misses, latency and cost against a simple fallback. Document results, not invented accuracy claims.
- Run judgments once per relevant document change, not per keystroke or page render. Missing key, timeout, ambiguity, or provider failure must fall back to a small targeted rule/question set or manual editing. Never block the page on Jev.

Source docs: [models](https://docs.typesafe.ai/models), [confidence](https://docs.typesafe.ai/confidence), [citation checks](https://docs.typesafe.ai/cookbooks/citation_check). Recheck these at build time.

## 7. Execution stages

Each stage should leave a reviewable change, a short progress entry below, and concrete validation evidence. Continue routine implementation without repeatedly asking permission. A visual checkpoint is for showing the result and incorporating feedback, not an excuse to stop before making it usable.

### Stage 0 — Baseline and boundary audit

Read the listed files, current branch/status, exact publish/webhook behavior, and active instructions. Record `npm run check` and `npm run build` baseline if the environment supports them; do not assume historical error counts. Trace all signup, login, verify, dashboard, questionnaire, preview and publishing entry points. Confirm minimal additive schema and rollback design. No production writes.

Done: documented baseline, route map, migration design and public/draft boundary. No stale AGENTS assumptions or untracked user files discarded.

### Stage 1 — Rendered design and working interaction

Build the shared new page renderer and responsive workspace with explicitly fictional local fixtures. Editorial first, then Modern and Expressive against the same typed content. Demonstrate answer → proposed section change → keep/edit/undo → style switch. Fixtures must be isolated from real upload paths and never passed off as an AI response.

Done: screenshots at 1440, 768 and 390px; all three styles look finished without images; portrait/work-sample variants also work; no horizontal overflow; keyboard and mobile panel work. Compare with the saved concept and explain deviations. Show Vinos the functioning preview before investing in polish that conflicts with the agreed direction. Stage 1 alone is not launchable.

### Stage 2 — Real CV, persistence and account continuity

Implement the typed document, additive storage, first-page generation, shared guest/authenticated adapters, durable account claim, and draft restoration. Update `/try`, direct signup destinations and dashboard links together behind a controlled rollout switch. Test guest-to-existing-account handling and verification return.

Done: actual uploaded CV produces the new page; reload/registration/verification preserve content and design; no forced questionnaire; source-based fallback works; failures retain recoverable state. Public legacy profiles unaffected.

### Stage 3 — Targeted improvements and Jev evaluation

Wire source-aware section proposals, revision protection, manual editing, skip memory, bounded undo and conditional question selection. Add Jev after the labeled comparison; keep fallback. Keep the first-render path independent.

Done: a useful answer improves only its target; user edits survive; sparse data produces no invented facts; stale responses fail safely; provider failure does not block editing or publishing.

### Stage 4 — Publishing, optional bot and all entry routes

Connect approved snapshots to entitlement-safe publishing, preserve legacy links/designs, add explicit upgrade-to-new-design preview for existing users, and source the optional public bot exclusively from approved public information. New profiles default to bot off; users can enable after preview. Existing published bot settings do not change silently. Use safe deterministic social-card layouts drawn from published content, copy-link confirmation, contact action, and publicly readable metadata. Inspect current server metadata routing before implementing social previews; do not assume client-only tags work for crawlers.

Done: public output matches approved preview; private answers never leak in JSON/chat/metadata; repeat publication does not restart free windows; paid and granted access retain existing entitlement; owner visits are not counted as new prospects; rollback to the previous approved content is possible.

### Stage 5 — Positioning, measurement and pilot release

Update homepage, creation CTAs, dashboard instructions, relevant onboarding emails and FAQ to match the real delivered flow. Lead with the outcome and real example output. Avoid a full redesign of unrelated blog/admin/CRM pages. Audit links from old emails/bookmarks. Preserve SEO routes. No claim of a generation time or better hiring outcomes without evidence.

Instrument the funnel using one verified collection path: entry → upload started/completed → first usable page (duration) → improvement proposed/kept/skipped → account claim → publish → copy/share action → recipient visit/contact action. Do not send CV content, answers, contact details, or unapproved snippets into analytics. Disable content capture/session replay on sensitive builder inputs. Distinguish owner/test traffic, repeated loads and likely bots. A copy click is not proof a link was sent; a contact click is not proof of an enquiry.

Pilot with ten people who have an actual upcoming use: five candidates and five consultants. Each uses their own page from upload to sending their own link. Vinos handles recruitment and outreach; do not message on his behalf. Record observed time-to-useful-page, completion failures, voluntary sends, recipient feedback and willingness to pay. Small pilot findings are directional, not statistically conclusive.

Done: coherent full journey for both entry paths, production-safe rollout instructions, verified events, screenshot evidence, regression checks and no forced migration. Flag controls must not make already-published new pages disappear when new onboarding is rolled back.

## 8. Required verification

- Lifecycle: guest/direct signup, verification on a different browser after account claim, expired guest session, retries, failed claim recovery, existing-account import, none/draft/ready/published users.
- Data: no duplicate imports, stable section IDs, cross-account access rejected, CSRF enforced, malformed/oversized model output rejected, source/private contact fields excluded from public response.
- Editing: reload, failed save, concurrent tab, late model response, upload replacement, skip memory, edit/undo, pending proposal at publish, switched style with identical content.
- Publishing: free first publish/update/expired edit window, paid/granted user, retry, failed publication, payment cancelled/successful, working edits made while checkout pending, published snapshot isolation, old URLs/aliases and old themes.
- Bot: off means unavailable server-side, not merely hidden; on uses approved public data only; no access to raw CV/private answers; known prompt-injection content stays data rather than instructions.
- Visual: all three new styles × no images/portrait/work samples, sparse/rich content, long strings, keyboard/focus, reduced motion, failed images, real mobile width and desktop, matching preview/public renderer.
- Performance: report measured stage timings, request counts and model failures. No blanket model calls every render, no artwork on critical path.
- Regression: existing legacy questionnaire, public profiles, payment integration, blog and admin routes remain functional. Run check/build; report new versus pre-existing failures honestly. Do not introduce a large test framework merely to mirror implementation; add focused tests for these meaningful boundaries.

## 9. Deployment and rollback requirements for the executing agent

This planning session requires no deployment. At implementation handoff, provide exact commands for the actual branch and changed files, following current project branch instructions. Do not blindly stage the entire directory or assume main/remote state. Preserve the pre-existing untracked AGENTS file.

Vinos performs production SQL and Replit deployment. Supply additive, idempotent SQL matching the final schema, one statement at a time. Do not run a production migration. For dev `npm run db:push`, inspect the proposed diff; **abort if it wants to drop or rename the `session` table or any unrelated table**. This previously happened in this project. Provide narrowly scoped dev SQL instead if needed. Do not approve data loss to get the new table created.

The handoff must include Mac commit/push/merge instructions for the real branch; Replit `git fetch origin && git reset --hard origin/main` (warn that uncommitted Replit changes would be discarded); exact SQL where required; `npm run build`; Deployments-tab redeploy; any new server-side secret names; smoke checks; and additive-schema-compatible rollback steps. Keep legacy public rendering and new public snapshot rendering available through rollout rollback. Do not launch marketing for a new journey while direct signup still lands in the old questionnaire.

## 10. Explicitly deferred

No consultants-only rebrand, mandatory opportunity brief, job discovery, recruiter CRM expansion, subscriptions/pricing changes, LinkedIn scraping/enrichment, arbitrary online-presence crawling, automated outreach, generated proof imagery, image generation dependency, public design scores, or broad admin/blog redesign. Single-project sharing and opportunity-specific page variants can follow if the pilot shows a need. The current release shares the professional page with clear selected work and contact paths.

## 11. Model and handoff

Use **GPT-5.6 Sol**, high reasoning, for the main implementation. This is a recommendation based on cross-cutting complexity, not a guarantee of design fidelity. Official guidance describes Sol for complex professional work and Terra as balancing intelligence and cost: [Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol), [Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra).

Use Terra later for bounded changes once components/contracts are stable (copy, small styling corrections, isolated tests). Keep the same plan and reference image. The agent cannot switch its own primary model; Vinos selects the model. The build model does not change Proxy's runtime Gemini/Jev provider choices.

See [START_HERE.md](START_HERE.md) for the implementation prompt. Screenshots, shared rendering, fixtures, and acceptance checks are what preserve fidelity across models.

## 12. Execution log

- 2026-09-23: Plan and reference image saved. Repository inspected read-only; no application implementation, schema change, build, production action or Jev call performed. Start at Stage 0. Product decisions above reflect the conversation; the proposed table and route names remain implementation recommendations to validate against the current code.
- 2026-09-23: Stages 0–5 implementation completed locally. Added the versioned private/public document model, shared builder and public renderer, three styles, guest/account continuity, section-scoped improvements, guarded Jev ranking with deterministic fallback, approved-snapshot publishing, optional approved-content-only public AI, rollback, social cards, funnel events, positioning copy and a controlled onboarding rollback switch. Preserved legacy rendering, public routes, entitlements, Stripe webhook and `processQuestionnaire()`.
- 2026-09-23: Verification completed: 20/20 focused builder checks, 20/20 fallback judgment cases, guarded live Jev 20/20 with one Jev selection, production build passed, and visual QA completed at 1440, 768 and 390px with no observed horizontal overflow. TypeScript retains 42 pre-existing errors and introduced none in the new builder modules. See `JEV_EVALUATION.md`, `VISUAL_QA.md` and `DEPLOYMENT.md`.
- 2026-09-23: Production migration, deployment and ten-person pilot were not run. They require Vinos's Replit database/secrets/deployment access and real participants. Exact handoff is in `DEPLOYMENT.md`.
- 2026-09-23: Independent Claude audit rated the core architecture solid and found one High and one Medium rollback-routing regression plus two Low accessibility gaps. Fixed all four: ready/published dashboard actions remain on legacy `/preview`, unfinished-owner recovery follows the rollout path, reduced motion covers the mobile builder panel, and new controls have explicit focus-visible rings. Both disabled-rollout and default production builds pass after the fixes.
