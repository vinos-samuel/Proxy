# Builder design & depth corrections

Date: 24 September 2026
Status: Proposed. Supplements `EXPERIENCE_CORRECTION_PRD.md` (codex) — does not replace it.
Input: Vinos's 12 findings from the live Replit preview (Mani Rakhra CV) + a code check of the actual signup path.

## Reconciliation — 24 September follow-up

The revised `EXPERIENCE_CORRECTION_PRD.md` incorporates this review's main recommendation: connect the existing private interview to the first page, with multiple optional follow-ups. It also restores the prefilled questionnaire as an input option, makes Executive available to new documents, and specifies direct signup alongside guest entry. Use that PRD as the combined build specification; the original review below is retained for context.

Corrections to technical claims below:

- The current picker mainly checks empty fields and filters answered IDs. No hard one-question cap exists. The causal claim that factual grounding caused this limitation is an interpretation, not established by the code.
- `sanitizeForPrompt()` does not verify or ground facts. Reuse the interview with source attribution, validated output and owner review. Its old questionnaire-submit path cannot simply overwrite the new document.
- Authoring chat sees private material; a visitor-bot preview must enforce a public-only projection. The old interview routes do not substitute for testing that boundary. Reuse components, not private data access.
- Voice can remain a secondary tool without making publication a prerequisite for deeper thinking. Preserve existing access entitlements when adapting availability.
- Layout repairs must preserve full text; clipping a headline is not a content fix. Save-race reproduction and the approval/publication boundary remain release blockers.

## Verdict

Codex's bug list is correct: headline clipping, dead grids on Modern/Expressive, the settings save race, the empty role-summary field, stale "Twin" copy. Fix those — they are silent trust-killers, a first-time user hits one and doesn't come back.

Codex's response to the *content* problem is wrong. It treats "don't invent facts" as "ask fewer, thinner questions." That's not the same rule. The real defect: the new CV-upload builder never connects to the conversational bot that made the old product's profiles good. Fix the flow, not just the copy.

## Your two questions, answered directly

**"Why are we restricting to one useful question?"**

It isn't a hard cap. `getImprovementCandidates()` in `server/profile-builder.ts` returns an array — plural, by design. One-at-a-time display is a UI choice, and the right one: the old 11-step form was too much at once, and a single skippable question is a correct fix for that specific complaint.

The real gap is depth, not count. Codex's grounding rule — never state a number that isn't in the CV or explicitly attributed — is correct; that's the fix for the earlier invented-stats incident. But codex implemented it by only surfacing a question when the picker is already confident there's a clean, safe gap to fill against CV text alone. A CV alone rarely carries the "why," "how," or "so what" behind a bullet point — that only comes out in conversation. So the picker had nothing sharp to ask Mani, and defaulted to a generic prompt. Grounding and depth are two different problems. Codex solved the first and let the second get worse.

**"What happens if a user directly signs up?"**

Checked `client/src/App.tsx` and `client/src/pages/dashboard.tsx`. A brand-new account's only CTA — **BUILD MY PAGE** — routes straight to `/builder`, the CV-upload page-first flow. It never touches the conversational bot.

The bot (`/onboarding-chat`, "Chat to finish your profile") only appears later, and only on the *old* questionnaire path, once an AI draft already exists. Voice interview (`/interview`, "Add more evidence") is gated further still — it only shows once a profile is `ready` or `published`.

So today: every new signup gets the thin, CV-only draft first. The tool that actually built good profiles — multi-turn, grounded, follows up on what's missing — is buried behind steps most new users will never reach. That is the real regression behind your instinct. It isn't a copy problem.

## The fix: one flow, not three

Right now there are three disconnected paths to a finished page: CV-upload builder, old 11-step questionnaire + AI draft + chat, and voice interview. Collapse to one:

1. Upload CV → instant readable page. Keep this — it's a good hook once the layout bugs are fixed.
2. Immediately follow with the *existing* bot (`server/onboarding-agent.ts` — already built, already grounded via `sanitizeForPrompt()`), reframed as "make this page yours." It asks multiple grounded, skippable questions per section — not one lonely question per project card.
3. Codex's section-8 question rules (cite the source, one clear ask, skip/not-sure, no invented outcomes) become this bot's per-section prompts. Don't build a second, thinner question system next to a fuller one that already exists.
4. `/interview` (voice, deeper stories) stays as the "go deeper later" tool, after publish. That part of the current design is already right.

This keeps codex's safety rule (never invent a stat) and restores the depth that made the live product's profiles worth sending to an employer.

## Design fixes — mapped to your 12 findings

| # | Finding | Fix |
|---|---|---|
| 1 | Headline oversized | Cap generated headline ~90 chars; size type off the container width, not viewport (`vw` units are the bug). |
| 2 | Vague question | Fixed by the merged flow above. Show the source line it's asking about ("From your CV: ...") so the question is legible on its own. |
| 3 | Edit/Style/Settings nav | Keep as-is. Just fix #11 and drop the internal revision number from user-facing chrome. |
| 4 | Experience truncated (Modern/Expressive) | All three styles must render the same underlying content with expand/collapse — not `slice(0,3)` with nothing else rendering it. |
| 5, 9 | Can't add "selected work"; card grows unreadable | Add item CRUD (add / edit / reorder / remove). Closed card is compact and fixed-height; "View story" expands to the full text — don't grow the closed card. |
| 6 | Bot missing | Not a bug — a sequencing gap. Fixed by the merged flow. Also wire a private test-chat before anyone flips the public toggle. |
| 7 | Role-summary field empty in editor | Editor points at `summary`; the visible text is in `highlights`. Point the field at what's actually rendered. |
| 8 | "Twin" / old language | Sweep signup, logo tagline, success screens, emails — not just the builder page. |
| 10 | Free vs. signup | Current shape (guest preview → account required to publish) is correct — just say so up front on the CTA ("Create a free account to publish — no card"), and don't route new Free users through the 3-plan modal to get there. |
| 11 | Settings error | Real bug: Edit/Style/Settings panels each fire their own save with no shared queue, so two in quick succession collide. Needs one mutation queue, not a per-panel patch. |
| 12 | Modern/Expressive layout wonky | Rebuild both grids around actual content — they currently assume a column count lower than the fields they render. Same content contract across all three styles, verified against Mani's real CV, not a short fixture. |

## Build order

1. Headline/content-safety, save-race, grid overflow — these break trust on the first interaction; fix before anything else.
2. Wire the existing bot into the CV-upload flow as step 2, not a feature the user has to discover later.
3. Selected-work CRUD + compact card design.
4. Vocabulary sweep, free/signup copy.
5. Re-test all three styles against Mani's actual CV — not a short fixture — before calling any of this done.

## What to cut from codex's plan

- "One question, then skip / not-sure" as a permanent ceiling — replace with "as many grounded questions as the bot can ask per section, always skippable, never inventing a number." Same safety rule, no artificial thinness.
- A new private test-chat drawer built from scratch — `/onboarding-chat` and `/interview` already exist and already do this. Wire them in rather than adding a fourth chat surface.

## Why this matters for the pilot

This decides whether a first-time visitor's page is something they're willing to send to an employer. Fix the trust-killers (#1, #11, #12) before the depth work — a broken layout or a false save error loses the pilot user on the first try, before the content quality question even comes up.
