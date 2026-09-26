# Proxy experience correction PRD

Date: 24 September 2026
Status: Proposed implementation specification. Product code is not changed by this review.
Owner: Vinos Samuel
Priority: Correct the experience before expanding the pilot or promoting the new builder.

## 1. Release decision and intended result

The current builder is not ready for a customer pilot on design and usability grounds. The earlier build checks and code audit did not establish that it works well with a real, long CV. Vinos's Replit screenshots supersede the previous broad visual-readiness claims.

Keep the positioning: **Prepare convincing evidence for your next opportunity.** Explain it plainly: **Turn your CV and experience into a professional page you can confidently send to an employer or client.**

The next release must let someone:

1. Upload a CV and immediately recognise their career in a readable, finished page.
2. See useful examples of their work, with correct attribution and no invented detail.
3. Open a specific section, edit exactly what they can see, or answer a clear optional question.
4. Add another piece of work without facing a long form.
5. Use the proven Executive design or the three newer designs without losing information or breaking the layout.
6. Preview for free without an account; create a free account to own and publish the page.
7. Optionally test and enable the AI explorer, with explicit control over its information.

Business purpose: reduce the effort before a useful first output and increase confidence in sharing it. First measure usable pages, voluntary shares, and recipient engagement. These changes do not prove willingness to pay or better hiring outcomes.

### Scope correction: fast first page, full depth available

The first plan reduced the depth too far. **One question at a time is a presentation rule, not a limit on the conversation.** Preserve the useful questionnaire, conversational interview and Executive design in the new experience. A fast CV-derived page is the starting point; the person's decisions, stories, working style and ambitions make it distinctive.

After the first page appears, the Improve panel should immediately offer a contextual opening from the existing interview approach. The user can continue a conversation, switch to the prefilled questionnaire under Edit, edit visible text directly, or preview/publish. None requires completing an interview first. Do not introduce a separate wizard or force another submit-and-regenerate cycle.

The companion `DESIGN_UX_CORRECTIONS.md` correctly identifies the disconnected interview as a regression. Reconciliation: the current picker checks mostly empty challenge/contribution/outcome fields and excludes answered IDs; it has no one-question-total cap. That mechanism explains thin follow-ups. It does not establish that a grounding policy caused the limitation. `sanitizeForPrompt()` cleans input characters and lengths; it does not establish factual accuracy. Reuse the interview's useful behaviour with source checks and owner review, rather than treating its old output path as safe to connect unchanged.

Private authoring chat and public visitor Q&A have different jobs. The authoring assistant can ask about private experience and propose additions. The visitor bot can use only the active approved public version. Reuse components where helpful, but never use the private interview endpoint as a visitor preview. Voice remains a secondary, resumable way to deepen a page; publication is not a product prerequisite for discussing one's career. Any change to its present availability must preserve existing access entitlements.

## 2. Evidence and limits of this review

Reviewed all nine screenshots supplied by Vinos, both rendered pages and extracted text of the supplied Mani Rakhra CV, and the current local builder, renderer, CSS, schema, generation, save, and publish code. The local repository was at `b3b5197` when reviewed. The exact Replit deployment commit and its parsed CV JSON were not supplied.

This is a source-and-screenshot review, not a claim that the reported Replit interactions were reproduced. The settings race below is a code-supported hypothesis that must be reproduced before its fix is called verified. Existing automated tests primarily exercise pure document operations; they do not prove browser layout, human question comprehension, concurrent guest saves, or a real signup-to-publish journey.

The CV remains a local review input. Do not commit its PDF, raw text, contact details, or unredacted screenshots as public fixtures. Use it locally for acceptance, and commit an anonymised structural equivalent for repeatable regression checks. Do not transmit it to an additional AI service just to create a mockup.

### What the CV actually supports

- Seven role entries: five at Argyll Scott, then Senior Consultant at Martin Ward Anderson, and English Language Teacher at Beijing Xicheng Foreign Languages School.
- Argyll Scott has employer-level context, a promotion sequence, Client Services and Executive Search achievement groups, and awards. The CV does not map every achievement unambiguously to one of the five titles.
- Possible selected-work examples include building the regional Key Account Management framework, the cross-sell incentive programme, the MSP go-to-market strategy, and sponsorship of global client onboarding.
- Supported proof includes 3x growth across five key accounts; cross-sell revenue from 13% in 2019 to 22% in 2021 and more than GBP 1.2m NFI; completion of 98% of engaged retained mandates; and a team of 11 billing consultants and three researchers. Preserve each claim's exact scope. The 98% figure concerns retained mandates, not all recruitment activity.
- The document has certifications, education, awards and community interests. The current data model cannot faithfully represent all of them.
- Earlier employers have titles and dates but little descriptive detail. Their missing narrative must not be invented.
- “Doubled our books,” “90% client retention,” and “30% margins” appear in Vinos's test answers, not in the supplied CV. Treat them as user-provided statements if retained, never as CV-extracted evidence.
- Preserve “Present” and source wording about years of experience. Do not recalculate a claim such as 18 years from today's date without confirmation.

## 3. Findings mapped to Vinos's twelve points

**1. Oversized headline — confirmed.** `buildProfileDocument()` takes the first positioning paragraph and clips it at 240 characters. CSS uses large viewport-based type inside a much narrower preview. This is a combined content and layout defect, not only a font-size defect. See sections 5 and 6.

**2. Vague question — confirmed.** `getImprovementCandidates()` supplies a generic challenge question against a card titled with a job title. The user cannot tell which piece of work “this work” means. First identify a real initiative; then ask a contextual question about it. See section 8.

**3. Edit/Style/Settings are useful — retain the navigation.** Improve each panel's content and behaviour, rather than inventing another navigation system. Remove the technical revision number from normal user-facing chrome. See sections 5, 7 and 10.

**4. Experience detail missing — confirmed at rendering; extraction coverage needs reconciliation.** Editorial renders only the first three highlights without expansion. Modern and Expressive render no role summary or highlights. Separately, the CV groups some achievements at employer level. All designs must offer the same substantive content. See section 9.

**5 and 9. Cannot add selected work; cards become too tall — confirmed.** The UI can edit only existing challenge/contribution/outcome fields. It has no add, rename, reorder or remove actions. The builder creates at most three initial projects; the schema allows eight. Add an item-focused editor and compact public cards with expandable details. See section 7.

**6. Bot missing — partly intentional, partly an implementation gap.** It defaults off as agreed. However, the renderer also requires `onAsk`, and the builder does not pass that handler. Enabling it therefore cannot demonstrate the feature in the current workspace. Add a private test experience; retain explicit opt-in for public use. See section 11.

**7. Empty role-summary editor beside visible text — confirmed.** Parsed roles populate `highlights`, while Edit exposes only `summary`. The UI is editing a different field from the text the user sees. Expose both with clear labels and direct section targeting. See section 9.

**8. Old language — confirmed.** Registration still uses career-agent positioning and an incorrect `.myproxy.work` suffix. The logo tagline also carries old positioning. Audit the whole creation-to-share journey, including success pages and email copy, against one vocabulary. See section 12.

**10. Free versus account requirement — product clarification.** Free means no payment, not anonymous public hosting. Preview, editing and design exploration remain available to a guest. A free account and verification are required to publish, preserve ownership and allow later editing/deletion. Make this clear before signup. See section 12.

**11. Settings error — confirmed symptom; likely overlapping requests.** Edit saves on blur, while settings and styles immediately send full-document saves using the render's revision. Those controls are not protected by a common mutation queue. A same-tab sequence can produce an error labelled “another tab.” A failed toggle can also leave “Draft saved” visible. See section 10.

**12. Modern and Expressive — confirmed structural failures.** Modern's project article has three grid columns but up to five direct children: number, title, context, contribution and outcome. Contribution can therefore flow into the narrow number column. Expressive has narrow nested columns and date/title tracks without a useful gap. Skills become a long slash-separated paragraph. Viewport breakpoints also fail to respond to the narrower builder container. See section 6.

## 4. Priority and release gates

### P0: restore trust and basic usability

- Fix the hero content contract and layout at actual preview widths.
- Rebuild Modern/Expressive grids around readable content; maintain content parity across all styles.
- Preserve CV facts and employer/role attribution; show all retained detail through expansion.
- Fix save sequencing, truthful state and recovery. Repeated same-tab use must not trigger a false concurrency error.
- Make visible text editable through the corresponding field.
- Verify that approval alone does not modify an already-live page, and entitlement checks cannot be bypassed through approval. This is a release gate, not a trusted conclusion from the earlier audit.

### P1: complete the intended creation experience

- Add, edit, rename, reorder and remove selected work.
- Replace vague questions with grounded, specific questions and helpful source context.
- Introduce compact cards, item-focused editing, meaningful style previews, and readable career expansion.
- Add private AI exploration preview and explain free publishing.
- Align language and signup with the new positioning.

### P2: polish after P0 and P1 pass

- Refine motion, typography, small interactions and phone layouts using actual rendered pages.
- Measure first-page timing and completion on representative CVs.
- Run the pilot; use observed sharing and recipient feedback to choose subsequent work.

No new pricing model, generated imagery, online-presence scraping, broad admin rebuild, or general-purpose CMS belongs in this correction.

## 5. Workspace design: a page with a focused editor

Keep a calm neutral app shell. The person's page provides the visual character. The default view is a page with a focused editor. The full questionnaire remains available as a prefilled, section-based input option under Edit; it is not mandatory before seeing a page.

**Desktop:** top bar 56–64px. Left: back to dashboard/home and Proxy. Right: truthful save state, **Preview**, **Publish free** for an eligible new/free user or **Publish changes** for an existing publisher. Paid upgrade is secondary when relevant, not the first way to see the page.

The page receives the remaining space after a 340–380px panel. At widths that cannot support a readable preview plus panel, show the page full-width with a dismissible editor. Do not insist on a 70/30 ratio when it makes either side unusable.

**Preview is available to guests.** It temporarily hides editor chrome and shows the same document renderer at visitor width, with a clear **Back to editing** action. It does not create a public URL. Do not rely on an owner-only public route for guest preview.

Panel tabs remain **Improve · Edit · Style · Settings**. Edit first shows an outline: Introduction, Selected work, Experience, Strengths, More about you. Selecting one item opens only that editor with **Back to sections**, a meaningful heading, and its local actions. The relevant page section scrolls into view and gets a subtle focus outline. An explicit **Edit** control appears on hover and keyboard focus in owner mode, never on a public page.

Keep a compact, persistent save indicator. Put publication in one predictable place; remove the duplicated oversized publication footer from every panel. Keep mobile actions reachable without consuming most of the screen. With the keyboard open, the answer field and primary action must remain usable.

Desktop shape:

```text
Proxy   Back to dashboard                 All changes saved   Preview   Publish free
┌─────────────────────────────────────────────┬──────────────────────────────┐
│ Mani Rakhra                                 │ Improve Edit Style Settings  │
│ Client Services Director APAC               │                              │
│ Building stronger client partnerships       │ Selected work                │
│ across APAC                                 │ 3 examples                   │
│ Short, supported introduction               │                              │
│ [Contact, if selected] [Ask, if enabled]     │ Key-account framework   Edit │
│                                             │ Cross-sell programme    Edit │
│ Selected work                               │ MSP strategy            Edit │
│ Key-account framework → View story          │                              │
│ Cross-sell programme  → View story          │ + Add work                   │
└─────────────────────────────────────────────┴──────────────────────────────┘
```

This is an interaction wireframe, not an approved screenshot or generated factual profile.

## 6. Executive and three newer styles with the same readable content

### Executive: preserve the proven design

Make Executive a selectable design for new documents, not only a legacy page that existing users can retain. Use the current Executive renderer as the visual reference: paper surface, restrained serif hierarchy, clear career progression and readable work evidence. Recommend it as the initial default for this correction release. Adapt it to the shared document and responsive content contract; do not simply rename Editorial to Executive. Preserve an existing draft's chosen style. Existing published designs and URLs do not change without owner publication.

The initial new-document style enum contains only Editorial, Modern and Expressive. Adding Executive therefore requires an explicit validated style addition and compatible defaults, not just a fourth swatch. All four choices must support the same information and editing interactions. Other existing legacy styles remain supported on existing profiles; automatic conversion is outside this correction.

### Shared hero and typography contract

- Separate **name**, **current role**, **short headline**, and **summary**. Do not promote an entire summary into display type.
- Generate a headline of approximately 6–12 words, targeting no more than 90 characters. Validate this in code; a prompt alone is insufficient. Fall back to the actual role or another short source-supported phrase if generation fails.
- Proposed Mani headline: **Building stronger client partnerships across APAC.** This is proposed positioning derived from his CV, not a quotation or a verified business result.
- The introductory summary is 40–70 words by default. Longer owner-written text remains available through **Read more**; never delete it to meet the visual budget.
- Use the profile container width, not viewport width, for typography and component breakpoints. Starting bounds: headline 32–48px desktop builder, up to 56px on a wide public page, 28–36px on phones; body 16–18px, line height 1.45–1.65. Final values require actual rendering.
- Aim for a generated headline of at most three lines at the reference builder width. Owner-entered long text must reflow safely, offer a shortening suggestion, and remain fully accessible. Never fix overflow by truncating the stored text or shrinking body text below 16px.
- On a 1440×900 reference desktop and 390×844 phone at default zoom, the generated introduction and its configured actions must be visible in the first usable screen, with the beginning of the next section on desktop. Reflow at 200% zoom may extend the hero; legibility takes priority over fitting a fixed height.
- With no portrait, use a true text composition. No large initials rectangle occupying a portrait column. A small monogram near the name is optional. A failed portrait must also release the empty column.
- Name is the primary document heading. Subsequent sections have a consistent hierarchy. No layout uses an entire paragraph as its main heading.

### Editorial: composed and spacious

Warm ivory, dark ink, muted olive, serif headline and sans-serif body. A restrained masthead introduces the person. The hero has a readable text width and an optional small portrait, followed by selected work. One work item occupies the available reading width; two or more can use two columns only when each remains at least 320px wide. A single narrow orphan card beside a large empty area is not acceptable.

Experience is a full-width employer narrative with compact progression rows. Skills are a short, curated group of chips. Dividers organise content; giant whitespace and large initials do not substitute for design.

### Modern: precise, useful, easy to scan

Off-white, navy, and one quiet accent. Compact identity bar; a short headline with summary below. Selected work uses a readable index: small number, initiative title, one-sentence summary, optional supported outcome, **View story**. Put detailed situation/contribution/result text inside one content wrapper when opened; never let each paragraph auto-flow into the article's outer grid.

Use either full-width rows or a clean two-card grid. The section label belongs above the list at narrow preview widths. Do not spend 150px of a narrow canvas on a decorative label rail. Experience details stay available exactly as in Editorial. Dates participate in normal layout; no absolute positioning beside long role names.

### Expressive: distinctive, controlled

Plum identity area, restrained lilac accent, warm light surfaces for longer reading. A short serif headline can create personality without becoming a poster. Use one featured work example followed by a compact list of other examples. The featured item remains concise and expandable; it is not an enormous box of three long paragraphs.

Use colour blocks, typographic contrast and spacing for character. Career uses clear title/company/date hierarchy with an explicit gap. At narrow widths dates move above or below the title. Strengths use compact groups/chips, never a slash-separated wall of text. No three-column prose layout inside an already narrow work card.

### Responsive rules and style previews

The renderer must respond to available container width in both workspace and public context. Start with stacked content below roughly 640px of page width, cautious two-column composition from 640–920px, and wider composition only above that. Confirm breakpoints against actual minimum reading widths; these are starting values, not permission to retain broken grids.

Style choices show a miniature of the user's actual introduction and first work card, with the same name and portrait in each. Do not use abstract colour swatches as the sole preview. Switching style changes presentation only: content, ordering, expansion availability, source attribution and contact choices remain identical.

## 7. Selected work: compact on the page, focused in the editor

### What counts as selected work

A specific initiative, engagement, decision, deliverable or supported achievement. A generic role description is experience, not automatically a project. Do not create a project by copying the first bullet of every job.

For Mani, initial candidate cards can be built from these supplied facts:

1. **Building an APAC key-account framework** — framework and key-account managers; supplied outcome of 3x growth across five key accounts.
2. **Growing cross-sell through regional incentives** — incentives and regional performance; preserve the 2019–2021 context and original revenue/NFI wording.
3. **Developing an MSP go-to-market strategy** — securing/delivering MSP accounts and contractor growth; do not invent a numeric outcome.

Attach these to Argyll Scott unless the role attribution is supported or the owner confirms it. Do not infer that every initiative occurred after the February 2021 promotion.

### Public card and expansion

A closed card shows initiative title (normally one or two lines), company/context, a short factual summary (normally two or three lines), at most one supported result, and **View story**. Target 220–320px height for normal content; never use a rigid height that clips text at zoom or in longer names. If content exceeds the summary budget, the explicit expansion gives access to the full text.

Opening a story reveals **Context · What I did · What changed** in a wide reading panel directly below the selected card row. On phones it opens inline in the single column. Use the full row instead of making a narrow card several screens tall. No nested scrolling text boxes for public reading. **Close story** returns focus to its trigger. Missing fields have no public label or filler.

Show up to three featured cards initially, with **See all work (N)** if more exist. This is display folding, not data deletion. Keep the current eight-item limit for this release unless real usage requires more; show it before the user starts a ninth item. Reordering is available through accessible Move up/Move down controls; drag can be added only as an alternative.

### Add and edit flow

**+ Add work** is always available in owner mode in both the Selected work section and the panel outline, including when no projects exist. Offer two clear starts:

- **Use something from my CV:** choose a source-backed suggestion not already used. The tile explains which CV statement it comes from. Do not add it silently.
- **Add my own example:** title plus a short description of what the owner did. Company and outcome are optional. More detail can be added later.

Minimum useful new item: title plus one substantive description/contribution. Save it as a private draft without requiring challenge, numbers, media or all fields. Empty cards never enter the public projection.

The item editor exposes title, company/role association, short summary, context, contribution and result. Start with the short summary and contribution; optional sections expand on demand. Helper labels should read **What was happening?**, **What did you do?**, **What changed?** Label examples as suggestions, not facts.

Rename, reorder, remove and undo removal must work. If deletion affects a pending AI proposal, explicitly discard that proposal or cancel deletion; do not leave invalid references. New item IDs must remain stable through save, reload, style changes and account claim. Edits are private until publication. Undo should reverse the actual item operation, including order and references, within the existing bounded history.

## 8. Improvement questions that a person can answer

### A conversation with depth, available immediately

Reuse and adapt `server/onboarding-agent.ts` as the private authoring conversation. Its existing topics include career stories, working style, unique value, personality/voice, skills depth and career direction. Keep these topics available and add opportunity context only when the person chooses to provide it. No mandatory story count, numeric result, or fixed number of exchanges before preview or publication.

Start from a real source detail. Follow the answer: ask about decisions, personal contribution, constraints, trade-offs, outcomes or attribution when that would make the work clearer. A filled field does not mean a story is complete. Missing facts can be asked about without asserting them. User answers become attributed private evidence; only reviewed proposed wording enters the page. Qualitative outcomes are valid. Do not inherit the old prompt's `[EDIT] Add a number` placeholders or insist on numbers.

For example, after the CV identifies the key-account framework, ask what was difficult beforehand. If the answer describes inconsistent account ownership, ask what the person changed. Then ask how they secured agreement, if that is not already answered. This is an illustrative branch, not a claim about Mani's experience. Skip known facts and stop probing a topic when the person declines or chooses another topic.

Show a visible page improvement as soon as there is enough material; do not wait for the whole interview to finish. Keep the conversation resumable and offer **Keep talking**, **Choose another topic**, and **Finish for now**. A completed conversation is never required to publish.

### Questionnaire and conversation share the page

Retain the structured questionnaire's useful coverage: identity, career history, stories, achievements, skills, voice/working style, optional Q&A, concerns the person wants to address, media and contact preferences. Group it into clear sections, prefill known information and remove mandatory quotas. Do not render private objections, ambitions or interview transcripts publicly by default.

The questionnaire, interview and direct editor must read and update one working document and its private evidence. Switching input mode must preserve answers, manual edits, style and pending proposals. The old chat currently reads `questionnaireData` and submits through `/api/questionnaire/submit`; a simple link to that route is not integration. Use a deliberate adapter to the current revision/proposal API. Avoid dual-writing two competing profile versions or altering legacy `processQuestionnaire()`.

Where one answer can improve more than one section, propose the affected changes together with a clear review. Do not silently rewrite the whole page or overwrite a manual edit. Save private conversation progress independently of whether a wording proposal is accepted; keep it out of public JSON and analytics.

### Individual question contract

Each question contains:

1. **Which work:** the initiative title and employer.
2. **What Proxy already knows:** one short source excerpt or clear paraphrase, marked **From your CV** or **You added**. Private source context is owner-only.
3. **One question at a time:** tied to the named topic and prior answers, with further useful follow-ups available; no generic “this work.”
4. **Optional guidance:** one sentence explaining what kind of answer helps, without supplying fictional results.
5. **Show the improvement**, **Skip**, and **I'm not sure**. The latter two do not block publishing or pressure the person.

Examples appropriate to this CV:

- For key accounts: “Your CV mentions an APAC key-account framework. Before you introduced it, what was difficult about managing those accounts?” Helper: “For example, describe a coordination or client-service problem you actually faced.”
- For incentives: “What did you change in the incentive programme to encourage teams to cross-sell?”
- For attribution: “Which role were you in when you built the key-account framework?” Offer the CV's real roles plus **Across several roles** and **Leave this unspecified**. Do not force a false assignment.
- For an unknown outcome: “After the new MSP strategy was introduced, what changed for the team or clients?” Helper: “A specific observation is enough. You do not need a number.”

Do not ask for an outcome already stated in the CV. Do not ask someone to explain why their entire job was necessary. Avoid judging evidence only by whether a field is non-empty. “ABCDEF” and unrelated answers should not earn a quality-complete message; preserve the user's input and ask for clarification or allow manual editing.

Show proposed wording beside the original wording and highlight the affected section. Keep, edit suggestion, discard and undo must have explicit semantics. Preserve unresolved suggestions when moving between tabs. Do not regenerate the full page.

When no useful question remains, say **No more suggestions for this section right now.** Offer **Add another example**, **Choose a different section**, and **Preview your page**. Do not claim **Your strongest sections are covered** merely because a few fields were filled or questions skipped.

Code selects valid candidates and handles IDs/budgets. Jev may rank or classify ambiguous evidence where evaluated; it does not generate the page, inspect design or certify truth. Gemini can phrase grounded questions and proposed text. Provide a deterministic contextual question when either provider fails. No model call on every keystroke or tab render. Re-evaluate when relevant content changes and distinguish loading, failure and genuinely no useful candidate.

## 9. Experience: retain detail and expose the same fields for editing

Group roles beneath an employer when the CV groups them. For Mani, show **Argyll Scott · Sep 2010–Present** with five progression entries and an employer-level **Selected contributions** area for material not safely assignable to a single title. Preserve the two earlier employers as compact entries. Do not invent descriptions to make them equally long.

The most recent employer is open initially. Show its role sequence and a concise selection of its contributions; **Show all contributions (N)** reveals the remainder. Earlier employer detail is collapsed but available where it exists. Dates/titles remain scannable. Do not duplicate identical bullets under all five roles to fill space.

The editor follows the same structure. Selecting a role shows title, employer, dates, optional overview, and editable achievement bullets. Selecting an employer contribution edits that contribution. If overview is absent, say **Add a short role overview (optional)**; never present an empty “summary” as though it contains the visible bullets.

All four styles use the same underlying experience content and expansion semantics. Editing any visible summary or bullet must change that exact text in every style. Earlier bullets must not disappear because a renderer uses `slice(0,3)` without a disclosure control.

Deduplicate strengths and show a curated first 6–8 with **Show all strengths (N)**. Keep all supported items available. Let the owner edit and reorder them. Do not derive dozens of inflated skills from every phrase in the CV.

Retain supplied education, certifications and awards in an optional **More about me** area, with owner visibility controls. Interests are opt-in. Store structured evidence and source references so omitted-at-first-view does not mean lost. This closes a CV completeness gap; do not grow it into a credential-verification product. Personal contact details, citizenship and private address remain unselected by default.

## 10. Saving and settings: one dependable editing state

### Reproduction first

Test: edit a text field, then immediately click Settings and toggle AI/email; toggle two settings quickly; switch Style immediately after an edit; keep a proposal while its edited text is saving. Inject 300–1500ms latency and out-of-order responses. Repeat as both guest and account owner. Record request IDs, operation names, revisions and status codes, not CV text or contact data.

Current code sends whole documents from stale render closures. Blur and toggle can submit the same revision. This plausibly explains screenshot 6; do not assert it was the only cause without a trace.

### Required behaviour

- Maintain separate acknowledged server state and local pending edits. Exactly one state-changing operation is in flight per document in a tab; use the latest acknowledged revision for the next operation.
- Coalesce pending edits for the same field; preserve later local edits when an earlier response returns. Do not let an older whole-document payload reset newer fields.
- Do not save unchanged fields merely because they blurred. Preserve pending text across tabs/panels. Continue accepting typing while saving; queue or temporarily disable actions that cannot safely overlap.
- Use this sequencing for text, settings, style, project actions, proposals, undo, approval and publish. A per-button fix is insufficient.
- States: **Unsaved changes**, **Saving…**, **All changes saved**, **Could not save — Retry**, and a distinct real conflict state. Never show “Draft saved” after a failed settings request. Tab selection alone neither saves nor clears an error.
- On a true revision conflict, preserve local edits and offer **Review changes**. Fetch the latest server version and reapply only non-conflicting field changes; ask the owner which version to keep for conflicting fields. Never retry a stale whole-document overwrite or tell the person to reload before preserving their text.
- Publication waits for all changes to be acknowledged and binds to the reviewed revision. Navigation and signup must not drop a pending save.
- Guest persistence needs actual cross-request/cross-tab protection. Its current request-local session revision check is not a database compare-and-swap. Test two simultaneous guest writes and expired sessions; do not claim atomicity from the in-memory check. Select the smallest durable solution after that test, and document any schema change before implementation.

Settings should expose **AI explorer**, **Contact details**, and **Publishing** groups. Allow editing an email/LinkedIn/website value before choosing to show it. A toggle for unavailable data should offer a real **Add LinkedIn** action, not “Add later” with no path. Never infer opt-in from a CV upload. Remove technical revision numbers from the normal UI; retain them for diagnostics.

## 11. Optional AI explorer: visible and testable

Keep default off for new profiles. The page must stand on its own. In Settings explain: **Let visitors ask questions about the information on your published page. AI answers may be incomplete.**

When enabled in the private draft, the preview shows **Ask about my work · AI** in a secondary position after contact. Clicking it opens a working private test drawer. Give 2–3 source-supported starter questions and a free-text input; this is not a static FAQ replacement. Let the user inspect an answer before enabling public use.

For private testing, construct the public-shaped projection of the current document server-side from the owner's session. Label it **Private test · uses this preview**. Do not feed raw CVs, source excerpts, hidden contacts or private answers to that chat. It is separate from the public endpoint and must have CSRF, ownership/session checks, abuse limits and honest failure states. Guests may use a small disclosed session budget; reaching it must not block page editing.

Published chat uses the approved active snapshot only. Test mode never publishes a document. Turning the draft setting on is not the same as enabling it on a live page; **Publish changes** applies it. Turning the public explorer off must make its public endpoint unavailable, not just hide the button.

## 12. Free preview, account ownership, publishing and consistent language

Recommended journey:

**Direct signup:** register → verify email → shared builder → upload CV (primary) or **Start with questions instead** → first useful page → optional conversation/questionnaire/direct edits → choose style and preview → review and publish free.

Without a CV, collect name, professional role and one useful experience description through chat or the structured form, then offer a first page. Describe it honestly as a starting page, with no invented career history or achievements. Keep enrichment available alongside it.

**Guest:** upload → finished page → edit/preview/test → **Publish free** → a short account-ownership step → verify → return to the exact page → confirm the public version → live link.

Both entry points use the same authoring capabilities, including conversational depth, questionnaire and Executive. Account creation happens at a different point; the product does not become a different builder. Guest conversation/proposals must transfer with the draft. Returning owners resume their existing page and conversation; they are never forced to upload again or replace a live page.

**Current code, not a completed journey:** verification navigates to `profileCreationPath`, which is `/builder` when rollout is enabled. Ordinary login goes to `/dashboard` unless a next URL is provided; its Build my page action also uses `/builder`. The older `/onboarding-chat` reads questionnaire data and is not connected to new-document authoring. The interview's dashboard entry is shown later for ready/published profiles. Routing to the shared builder is present; integration of these deeper inputs and an observed end-to-end direct-signup journey are still required. These are local-code findings, not verification of a specific deployed commit.

Before account creation: **Your page is ready. Create a free account to keep it and publish your link. No card required.** Offer **Keep editing** and existing-account sign-in. Preserve all edits, selection and ordering through failed registration, verification on another browser and a repeated claim. Never auto-publish because someone verified an email.

Registration heading: **Save your page. Make it yours.** Use the correct address format `myproxy.work/portfolio/your-name`. Pre-fill only safe draft identity fields and offer an editable unique slug. Keep password/email-verification security; do not add social auth as a prerequisite to this correction.

Do not send new Free users through a large three-plan purchase modal merely to make a free page public. Show the Free path directly. Retain existing paid offers as optional upgrades, and preserve the seven-day Free public-edit window with clear wording. Explain expiry at publication, not after the user has invested more work. Do not change entitlements or prices without a separate decision.

Approved vocabulary: **your page**, **professional profile**, **selected work**, **career experience**, **AI explorer**, **publish free**, **publish changes**. Positioning uses “evidence”; ordinary controls do not need to repeat it everywhere.

Remove user-facing **Initialize your Twin**, **AI career agent**, technical revision labels, unsupported hiring claims and the old logo tagline from the new journey. Audit homepage CTA, signup/login, verification, builder, dashboard, preview, pricing handoff, success screen, share text and relevant emails. Do not rename database tables or break legacy URLs to remove a word from copy.

### Publication boundary requiring re-check

The inspected `/api/builder/approve` calls `publishProfileDocument()`, which writes `publishedDocument`. Public readers consume that field for an already-live profile. Therefore approval can alter an existing public page before the separate Publish action and before `/api/builder/publish` checks entitlement. The earlier audit's overall assurance does not settle this path.

Acceptance: on an already-public Free or paid page, editing and pressing **Approve** alone must leave the live output unchanged. An expired Free user must not update live content via approval, free-publish, rollback or a legacy endpoint. First-time checkout stages an immutable reviewed version; later working edits cannot replace it. Repair approval-versus-active-publication storage semantics minimally, preserve the Stripe webhook's contract, and test all activation paths before claiming the boundary is safe. If this needs an additive column/document-state change, specify the exact migration and Vinos handoff; no production writes in implementation.

## 13. Data and implementation guidance

Inspect current HEAD before editing; local and Replit may differ. Implement against the behaviour requirements, not a line-number assumption.

Likely files:

- `client/src/components/profile-document-view.tsx`: shared semantic content, expansion, all four layouts, owner target callbacks and AI entry point.
- `client/src/index.css`: container-aware type/grid rules, focus and reduced motion, phone and zoom layouts.
- `client/src/pages/builder.tsx`: selected-item editing, project actions, save coordination, recovery, guest preview, publishing and test chat.
- `server/profile-builder.ts`: source-backed initiative extraction, role/employer attribution and contextual question candidates; stop first-bullet project fabrication and arbitrary slicing.
- `server/ai-processor.ts`: narrow structured parsing/generation additions; keep legacy `processQuestionnaire()` behaviour unchanged.
- `shared/profile-document.ts`: versioned additions for initiative summary, source/role association, employer contributions and optional qualifications; validate IDs, lengths, references and public fields.
- `server/profile-builder-routes.ts`, `server/storage.ts`, relevant reads in `server/routes.ts` and `server/static.ts`: concurrency, private test projection, approval/publication semantics and public parity.
- Auth, logo, PaymentGate, dashboard, email and share components: coherent wording and account/free flow.
- `server/onboarding-agent.ts`, `client/src/pages/onboarding-chat.tsx`, questionnaire and interview components: reuse the topic coverage and conversation UI through the shared working-document/revision API. Preserve legacy paths while adapting new authoring; do not send new documents through legacy regeneration.

Do not silently discard existing version-1 documents or require a re-upload. New fields need defaults and an idempotent adapter. Preserve existing manually written content and source IDs. If recovering detail requires re-reading a CV that is no longer available, explicitly offer re-upload; do not pretend the missing data was recovered. Private recovery/import must never silently replace an existing public snapshot.

Implement bounded structured output with explicit validation; no arbitrary model HTML/CSS. Keep full retained evidence separate from display excerpts. Any hard input/storage limits must be visible and recoverable; truncating at eight bullets or 500 characters without notice is not an acceptable completeness strategy.

No broad backend rebuild is required for layout and editor improvements. Targeted data-model and concurrency changes are required where the current structure cannot preserve content or publication boundaries. Keep the existing legacy renderer available.

## 14. Acceptance plan: real content before a readiness claim

### A. CV completeness and grounding

- Locally upload Mani's PDF with consent under the existing product flow. Do not publish it as a test.
- Reconcile source → parsed representation → document → rendered view. Seven roles must remain, with original dates and employers. All five Argyll Scott titles remain distinct.
- Preserve the supported key-account, cross-sell, MSP, retained-search and team examples; don't invent a project problem or assign ambiguous employer evidence to a specific role.
- Certifications/education/awards remain available in optional sections. Earlier roles without narrative remain honest.
- Distinguish CV facts from Vinos's test answers; verify no metric travels to the wrong project.
- Simulate generation failure: concise source-based fallback remains readable and complete enough to edit.

### B. Design matrix

Render each of Executive, Editorial, Modern and Expressive in both workspace and visitor preview at 390, 768, 1024, 1280 and 1440px viewport widths. Record actual page-container widths. Include 200% browser zoom and the Replit preview frame when feasible.

Use: long original headline, corrected headline, 0/1/3/8 projects, a 40-item skills list, long company/title/date strings, rich/sparse CVs, no photo, valid photo, failed photo, and maximum valid detail text. Inspect actual text wrapping and hierarchy, not just `scrollWidth`.

Pass criteria: no overlap, clipped controls, narrow word-by-word prose columns, unlabeled hidden content, giant initials slot, slash-wall skills, or inaccessible full text. All styles show equivalent experience and project information. Closed cards remain scannable, expanded stories readable, and the identity/actions legible in the first usable screen for the reference content.

Show screenshots of all four styles with realistic long content, both with panel open and in visitor preview. Compare against the approved concept's calm hierarchy, not its fictional person's exact words. A single short curated fixture does not close this gate.

### C. Authoring and questions

- From both guest entry and direct signup, open the private conversation immediately after first-page creation. Follow one topic through at least three relevant exchanges, accepting an improvement before ending the interview. No artificial one-question ceiling or mandatory exchange quota.
- Move conversation → questionnaire → direct edit → conversation. All accepted content and private progress remain; existing manual edits are not silently overwritten, and known answers are not asked again.
- Cover a working-style/personality topic and a career story, not only empty project fields. Pause, reload and resume. A declined topic stays declined until the owner reopens it.
- Start without a CV through questions or form, obtain an honest first page and continue editing it without uploading a file.

- Add an example from a CV suggestion and one manually. Rename, change attribution, reorder, remove, undo, reload and switch style; content persists.
- Edit a visible role bullet and optional overview; each exact change appears in all styles.
- A user can identify which initiative the question refers to without explanation from Vinos. Confirm this with a small observed usability session; code review cannot establish comprehension.
- Skip/I'm not sure do not repeat indefinitely; adding another example introduces relevant candidates. Empty/loading/error states do not falsely claim quality completion.
- Open/close a work story and experience details with keyboard, touch and reduced motion. Focus returns predictably.

### D. Saving, account and publication

- Repeat the delayed-save sequences from section 10 ten times each as guest and account owner: no lost edits or false same-tab conflict.
- Real two-tab conflicts preserve both versions for review. Concurrent guest requests cannot silently overwrite each other.
- Offline/500/409/expired-session states preserve text and show accurate recovery controls. “Saved” appears only after acknowledgement.
- Guest preview works before signup. Signup/verification retains content and returns to the builder. Free publication never requests card details.
- Test direct registration/verification → new builder → conversation/form → preview → free publication, and returning login → resume. Test guest-to-account transfer with a partially completed conversation. Use an authorised isolated test environment; do not test auth on the prohibited workspace host.
- Approval alone leaves the live page unchanged. Expired Free access cannot bypass publication checks. Paid/granted access, checkout cancellation/success, retries and rollback remain correct.
- Bot off is enforced by the public server; private test and public chat use the correct separate projections.
- Old legacy profiles, preview/publish links, aliases and the rollout-disabled path still work.

### E. Performance and measurement

Record parse, generation, save and first usable render timings with representative supported PDFs. Report actual sample size and distribution; do not claim a meaningful p90 from a handful of uploads. Original ≤60s median/≤120s p90 values remain engineering targets, not marketing promises.

Extend existing events only as needed for Preview opened, work added, story expanded, save failed/recovered, account step started/completed, free published and link copied. No content, answers or contact data in event properties. A copied link is not a confirmed send; the pilot must observe actual sharing separately.

## 15. Build order and handoff

1. Establish a private long-content reference from the real CV and an anonymised regression equivalent. Save current failure screenshots. Reproduce the save collision and approval-on-live-page path.
2. Correct preservation/attribution and save/publication boundaries. Add behavioural regression tests for these failures; keep content stable while redesigning.
3. Bring Executive into the shared renderer and repair the current hero/grids. Establish compact work expansion, experience disclosure and the selected-item editor using real long content.
4. Adapt the existing private interview and prefilled questionnaire to the shared document. Make them available from both entry points immediately after first-page creation, with a no-CV questions alternative. Demonstrate useful multi-turn depth and safe mode switching.
5. Complete project lifecycle controls and the Editorial, Modern and Expressive designs. Add visitor-bot preview using the restricted public projection, clear free-account publishing and the vocabulary audit. Compare all four designs at actual builder widths.
6. Run the full acceptance matrix, report untested conditions, and update deployment/rollback instructions only for actual code/schema changes.

Do not repeat the previous readiness claim from a passing build plus 20 pure-function tests. A release review must include a rendered real-CV flow, save-failure recovery, source reconciliation and an end-to-end unpublished-to-published test in an authorised isolated environment.

Vinos owns production SQL and Replit deployment. Do not run migrations, publish Mani's page, send outreach, alter pricing, or touch the production Stripe webhook during this work.

### Implementation prompt

> Implement `docs/proxy-next/EXPERIENCE_CORRECTION_PRD.md` against current repository HEAD. It supersedes earlier visual-readiness claims for the new page-first flow. Read the full document and original implementation plan. First reproduce the save-collision and approval-on-live-page paths, then correct content preservation and the renderer using realistic long data. Deliver Executive plus the three newer designs, compact expandable work, complete editable experience, add-work controls, the adapted existing multi-turn authoring interview and prefilled questionnaire, restricted visitor-bot preview and free-account publishing. Test both direct signup and guest entry; one question at a time must not become a ceiling on depth. Do not treat generic swatches, clipped paragraphs, invented project detail, or fixture-only screenshots as completion. Keep the shared renderer and source/public boundaries; preserve existing documents and legacy profiles. Work through the acceptance matrix and report evidence and untested conditions. No production migration, deployment, outreach or pricing changes.
