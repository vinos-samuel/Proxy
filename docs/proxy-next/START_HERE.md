# Start the Proxy implementation

**24 September update:** The first implementation exposed design and authoring failures with real CV content. Use [EXPERIENCE_CORRECTION_PRD.md](EXPERIENCE_CORRECTION_PRD.md) and its implementation prompt for the next build. The original prompt below is historical context; do not restart the initial build or treat its previous readiness assessment as current.

Select **GPT-5.6 Sol**, high reasoning, in this project's Codex task. Copy the prompt below. Use the existing local repository; do not start a separate product or rewrite the app from scratch.

> Implement `docs/proxy-next/IMPLEMENTATION_PLAN.md`. Read it completely and inspect `docs/proxy-next/assets/workspace-concept.png` before coding. Read the current project instructions and verify the actual files, routes, branch and baseline; historical sprint notes may be stale. Preserve existing user work, public URLs, published designs, payment behavior and entitlements.
>
> Follow Stages 0–5 in order. Build one shared page-first experience for `/try`, direct signup and returning users. The first output must look finished without images. Deliver Editorial, Modern and Expressive styles, the private question panel with visible section updates and keep/edit/undo, source-aware content, reliable draft/account handoff and approved-snapshot publishing. The public bot is optional and uses only approved public information. Jev is for evaluated narrow judgments, not visual inspection or generation of the page.
>
> First complete the baseline audit and Stage 1 rendered workspace, show desktop/mobile screenshots and a working interaction, then continue through the remaining stages. Make each stage reviewable; update the execution log with completed work, test evidence and outstanding issues. Do not substitute a generic dashboard for the saved visual direction. Do not stop at a fixture-only prototype and call the product complete.
>
> Reuse existing foundations. Keep Stripe webhook and legacy `processQuestionnaire()` behavior intact. Use additive schema changes, separate private drafts from public snapshots, and preserve content through signup/verification. Do not run production migrations or deploy. Do not approve any schema push that removes the session table. At completion provide exact branch-aware Mac/Replit deployment steps, manual SQL one statement at a time, secret names, verification and rollback instructions. No unsolicited outreach or new pricing.

The plan is the source of truth for this new experience. The image establishes visual direction; its fictional person, metrics, stock photos and inconsistent portraits are not product requirements. Existing legacy styles must remain available to their owners.

If a session ends early, record the exact completed stage and next task in the plan's execution log. The next agent should resume there, not restart discovery or claim untested stages complete.
