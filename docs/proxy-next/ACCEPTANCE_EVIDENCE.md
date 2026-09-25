# Proxy experience correction: acceptance evidence

Date: 25 September 2026  
Specification: `docs/proxy-next/EXPERIENCE_CORRECTION_PRD.md`  
Repository base: `b3b5197`  
Status: implementation complete locally; isolated environment acceptance remains before deployment.

## Release decision

Do not deploy this work yet. The local implementation and production build pass, and the responsive design matrix has been inspected. The remaining release gates need the Replit development database or another authorised isolated environment: real registration and email verification, database-backed guest claim, two-tab database conflicts, first free publication, paid publication and rollback, and public/private chat endpoint checks.

No production migration, production data change, Stripe webhook change, supplied-CV publication, Git commit, or Git push was performed.

## Implemented scope

- One shared builder for `/try` guests and signed-in owners.
- Guest drafts stored with a hashed session key and database compare-and-swap revisions.
- Guest-to-account claim during registration, including verification in another browser.
- A no-CV start path and a CV-first path.
- Executive, Editorial, Modern, and Expressive designs on one semantic renderer.
- Compact selected-work cards with inline phone expansion and wide-row desktop expansion.
- Add from a CV suggestion, add manually, edit, rename, reorder, remove, and undo selected work.
- Grouped employer experience, role summaries, role evidence, employer-level contributions, strengths folding, and optional background content.
- Multi-turn private authoring questions across work, experience, working style, value, voice, skills, and career direction.
- Private answers remain private evidence. Only accepted proposed wording can enter the page.
- Private AI explorer test uses the public-shaped projection of the draft. Public chat uses only the active approved snapshot.
- Serialized document saves, acknowledged server state, pending local edits, three-way conflict review, and truthful save states.
- Separate staged and active publication snapshots. Approval stages a reviewed version; publication activates it after entitlement checks.
- First publication is free without a card. Existing free and paid entitlement rules remain in place.
- New positioning and account language across the creation and sharing journey.

## Automated evidence

### Profile-builder behavior

Command: `npm run test:profile-builder`

Result: **38/38 passed**.

Coverage includes:

- Valid document and Executive style validation.
- Concise headline fallback.
- Contextual missing-evidence questions.
- Three relevant exchanges on one complete work story: decision, influence, reflection.
- Skip and accepted-question memory.
- Public removal of sources, hidden contacts, private context, and review state.
- Empty private selected-work drafts excluded from the public projection.
- Staged review snapshots excluded from public output until activation.
- Active output selected even when a later reviewed version is staged.
- Stable proposals, private answer evidence, and undo.
- Add/remove/order undo for selected work.
- First free publication, free edit-window behavior, expired-free denial, paid publication, and paid rollback.
- Automatic merge for changes to separate fields.
- Explicit owner choice for conflicting changes to the same field.

### Question selection

Command: `npm run eval:builder-judgments`

Result: **20/20 expected selections** using the deterministic fallback. No TypeSafe key was available to this process, so no live Jev decision was exercised in this run.

### Production build

Command: `node --import tsx script/build.ts`

Result: **passed**. Vite built 2,165 modules and the server bundle completed. Existing warnings remain for one duplicate JSX `style` attribute in the legacy questionnaire, bundle size, old Browserslist data, and a PostCSS plugin. None prevented the build.

### TypeScript

Command: `npm run check`

Result: **41 existing repository errors**. The legacy questionnaire's duplicate JSX style attribute was fixed during this work, reducing the previous baseline from 42. The remaining list is in the known baseline areas: `App.tsx`, auth typing, job-search typing, Resend `reply_to`, Replit integration types, and existing route parameter types. No error points to the new builder, profile renderer, merge utility, profile-document schema, profile-builder service, or profile-builder routes.

### Diff integrity

Command: `git diff --check`

Result: **passed**.

### Prose integration script

Command: `node --import tsx script/check-prose.ts`

Result: **not run to completion**. It requires both the seeded Replit development database and Gemini credentials, then mutates the seeded draft by regenerating it. Run it only in the isolated development environment after `npm run seed:test`.

## Browser and design evidence

The local fixture route was inspected in the real application before browser automation became unavailable.

### Responsive matrix

- Four styles: Executive, Editorial, Modern, Expressive.
- Five widths: 390, 768, 1024, 1280, and 1440 pixels.
- Two contexts: editor workspace and visitor preview.
- Total: **40 style/width/context combinations**.

Checks passed in the inspected matrix:

- No horizontal overflow.
- All retained career roles remained present.
- The 40-strength fixture retained its final item through the disclosure control.
- Long work text did not enter narrow word-by-word columns.
- Modern contribution text stayed inside one readable content wrapper.
- Expressive dates and titles did not collide.
- Missing and failed portraits released the portrait column.
- At 768px the editor became a dismissible overlay while the page retained a readable width.
- At 390px work stories opened immediately under the selected card and **Close story** returned focus to **View story**.

### Content-shape matrix

Desktop and mobile were also checked with:

- 0, 1, 3, and 8 selected-work items.
- Sparse and long content.
- 40 strengths.
- No portrait, a valid portrait, and a failed portrait.

The eight-item case showed three initial cards plus **See all work**. The 40-item strengths case showed the compact initial set plus **Show all strengths**. Expanded content remained readable.

### Real builder interactions

Using the local anonymised long fixture in Executive:

- Opened Edit → Selected work.
- Added a manual work item.
- Edited title, company, summary, and contribution.
- Reordered the item.
- Removed the item.
- Confirmed the page fold and editor count updated without a visible save error.
- Opened and closed a work story and confirmed focus restoration.

Pure behavior tests cover operation-level undo. Database-backed undo after reload remains part of isolated environment acceptance.

### Design review limits

- The responsive checks used browser viewport overrides, not a 200% zoom run.
- The final ten-cycle save test was interrupted when Codex browser-use allowance was exhausted.
- Registration copy and route logic were reviewed in code, but a full account submission was intentionally not performed locally.

## Supplied CV evidence and privacy boundary

The supplied Mani Rakhra PDF was inspected locally without publishing it or committing its contents. Local PDF extraction confirmed that it is a two-page, long-content CV with contact data and multiple date ranges. The anonymised fixture mirrors its layout pressure: long career progression, employer-level contributions, multiple selected-work candidates, and a large strengths set.

The existing Gemini parser was not run against this private PDF. Automatic approval review rejected transmitting the PDF to the configured external Gemini service because that specific external transmission was not explicitly authorised. Therefore these remain unverified with the real PDF:

- Gemini parse and generation timing.
- Exact seven-role preservation through source → parsed data → document.
- Exact preservation of all Mani metrics, awards, certifications, and education.

Run this acceptance only with Vinos present in the authorised Replit development flow. Do not publish the result.

## Publication and privacy boundary evidence

Code and pure tests confirm:

- Approval writes the reviewed document to the staged `published_document` field.
- Existing public readers use `active_document`, falling back to the old field only for pre-migration rows.
- Publication copies the staged version into `active_document` after access checks.
- First checkout can bind the reviewed staged version without making the page public.
- Rollback swaps the active version only after access checks.
- Public projection removes raw sources, private authoring data, hidden contacts, review state, and source IDs.
- The private test endpoint builds a public-shaped projection from the owner's current draft.
- The public chat endpoint reads the active snapshot and rejects profiles where the active AI explorer setting is off.

Database-backed route verification remains required before release.

## Required isolated environment checks

Complete these on the separate development database. Do not use production data.

- [ ] Apply the additive schema changes from `DEPLOYMENT.md` to the development database. Do not approve a proposal to delete or rename the `session` table.
- [ ] Seed the test accounts.
- [ ] Direct signup → email verification → `/builder` → CV or questions → preview → publish free.
- [ ] Guest `/try` → partial conversation and manual edit → account creation → verification in another browser → same draft restored.
- [ ] Start without a CV and create an honest first page from name, role, and one work example.
- [ ] Conversation → questionnaire → direct edit → conversation. Confirm private progress and manual edits survive.
- [ ] Follow one authoring topic for at least three exchanges and accept one proposal.
- [ ] Pause, reload, and resume the conversation.
- [ ] Ten delayed-save sequences as guest and owner: edit text, immediately toggle Settings, change Style, and accept a proposal.
- [ ] A real two-tab same-field conflict opens field-level review and preserves both values.
- [ ] Offline, 500, 409, and expired guest-session recovery preserve text.
- [ ] Approval alone leaves an existing public page unchanged.
- [ ] Expired Free cannot change or roll back its active page through any current or legacy route.
- [ ] First free publication does not ask for card details.
- [ ] Paid/granted publication and rollback still work.
- [ ] Checkout cancellation and success retain the immutable reviewed revision. Do not alter the Stripe webhook.
- [ ] Public chat is unavailable when off, and reads only the active approved content when on.
- [ ] Private AI test never exposes raw CV text, private answers, sources, or hidden contacts.
- [ ] Legacy public pages, aliases, preview links, and rollout-disabled paths still work.
- [ ] Repeat the four-style matrix at 200% zoom and in the Replit preview frame.
- [ ] Run `npm run check:prose` against seeded development data.
- [ ] Record parse, generation, save, and first-usable-page timing for representative supported PDFs.

## Schema and deployment handoff

The schema change is additive:

- `profile_documents.active_document` stores the live approved snapshot separately from the next reviewed snapshot.
- `guest_profile_documents` stores guest working documents with durable revisions and expiry.

Use the exact one-statement-at-a-time SQL in `docs/proxy-next/DEPLOYMENT.md`. The backfill copies the existing published snapshot into `active_document`, preserving current public output. Vinos owns production SQL and deployment.

## Final acceptance rule

The code is ready for isolated environment acceptance. It is ready for production only after every unchecked release gate above is completed or explicitly accepted as a known risk by Vinos.
