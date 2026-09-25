# Deployment and rollback

**24 September release hold:** Review `ACCEPTANCE_EVIDENCE.md` before deployment. The correction code is implemented, but authorised signup/publication, two-tab database concurrency and real Gemini upload timing still need an isolated Replit acceptance run. Do not use Mani's private CV for a public test.

Do not run `npm run db:push` if Drizzle proposes deleting or renaming `session` or any unrelated table. This project has produced that unsafe prompt before. Apply the additive statements below in the workspace database first. After acceptance, apply them again in the Replit Production Database SQL console. Run one statement at a time.

```sql
CREATE TABLE IF NOT EXISTS profile_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), twin_profile_id uuid NOT NULL UNIQUE REFERENCES twin_profiles(id) ON DELETE CASCADE, working_document jsonb NOT NULL, published_document jsonb, active_document jsonb, previous_published_document jsonb, revision integer NOT NULL DEFAULT 1, schema_version integer NOT NULL DEFAULT 1, published_revision integer, created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, published_at timestamp);
```

```sql
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS active_document jsonb;
```

```sql
UPDATE profile_documents SET active_document = published_document WHERE active_document IS NULL AND published_document IS NOT NULL;
```

```sql
CREATE TABLE IF NOT EXISTS guest_profile_documents (session_key text PRIMARY KEY, working_document jsonb NOT NULL, extracted_data jsonb, revision integer NOT NULL DEFAULT 1, created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at timestamp NOT NULL);
```

These changes are additive. `active_document` is the version visitors see. Approval writes only the reviewed staging version. Publish moves that reviewed version into `active_document`. Existing profiles and public themes continue to read from `twin_profiles` until an owner publishes a new document.

Add `TYPESAFE_API_KEY` to both Workspace Secrets and Deployment Secrets. The page and improvement flow continue with deterministic rules when the secret is missing or TypeSafe is unavailable.

The new onboarding is enabled by default. For a controlled onboarding rollback, add `VITE_PROFILE_BUILDER_ROLLOUT=false` to both Workspace Secrets and Deployment Secrets, rebuild, and redeploy. This sends `/try` to registration and returns signed-in creation links to the legacy questionnaire. The `/builder` route and all already-published new pages remain available, so the switch does not hide customer work. Remove the variable, rebuild, and redeploy to enable the new onboarding again.

Rollback does not require dropping the table. Revert the application commit and redeploy. Existing legacy profiles continue rendering from their original fields. New published snapshots remain stored for a later roll-forward. Dropping the table would destroy working and approved new-design documents and is not part of rollback.

Smoke checks after deployment:

1. Open `/try`, upload an anonymised test PDF, and confirm a complete Executive page appears without a mandatory questionnaire.
2. Follow one work topic through three relevant questions. Keep one proposed change, switch to Edit, then return to Improve and confirm progress remains.
3. Add one CV-suggested work item and one manual item. Rename, reorder, remove, undo, reload, and confirm stable content.
4. Inspect Executive, Editorial, Modern and Expressive in editor and visitor preview at phone, tablet and desktop widths.
5. Register from a guest draft, verify email, and confirm `/builder` opens the same content. Confirm it did not publish automatically.
6. Approve, publish Free without a card, and confirm the public page matches the reviewed preview.
7. Edit an already-public page and press Review and approve only. In another logged-out browser, confirm the live page did not change. Then publish and confirm it changes.
8. Repeat one edit in two tabs. Confirm non-overlapping fields merge and overlapping fields show the per-field review screen without losing either value.
9. Confirm a new page has no Ask action until enabled. Test privately, enable it, publish, and confirm public answers exclude CV source excerpts, private notes and hidden contacts.
10. Confirm an expired Free test account cannot change the live page through builder publish, legacy free publish or rollback.
11. Open existing legacy portfolios and confirm their URLs, themes, edits, payment entitlements and visitor chat still work.
12. Set `VITE_PROFILE_BUILDER_ROLLOUT=false`, rebuild, and confirm the legacy creation and recovery links still work. Remove the variable and rebuild before release.
