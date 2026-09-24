# Deployment and rollback

Do not run `npm run db:push` if Drizzle proposes deleting or renaming `session` or any unrelated table. This project has produced that unsafe prompt before. Create the new table with the single additive statement below in the workspace database and again in the Replit Production Database SQL console.

```sql
CREATE TABLE IF NOT EXISTS profile_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), twin_profile_id uuid NOT NULL UNIQUE REFERENCES twin_profiles(id) ON DELETE CASCADE, working_document jsonb NOT NULL, published_document jsonb, previous_published_document jsonb, revision integer NOT NULL DEFAULT 1, schema_version integer NOT NULL DEFAULT 1, published_revision integer, created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, published_at timestamp);
```

Run one statement at a time. This table is additive. Existing profiles and public themes continue to read from `twin_profiles` until a user approves and publishes a new document.

Add `TYPESAFE_API_KEY` to both Workspace Secrets and Deployment Secrets. The page and improvement flow continue with deterministic rules when the secret is missing or TypeSafe is unavailable.

The new onboarding is enabled by default. For a controlled onboarding rollback, add `VITE_PROFILE_BUILDER_ROLLOUT=false` to both Workspace Secrets and Deployment Secrets, rebuild, and redeploy. This sends `/try` to registration and returns signed-in creation links to the legacy questionnaire. The `/builder` route and all already-published new pages remain available, so the switch does not hide customer work. Remove the variable, rebuild, and redeploy to enable the new onboarding again.

Rollback does not require dropping the table. Revert the application commit and redeploy. Existing legacy profiles continue rendering from their original fields. New published snapshots remain stored for a later roll-forward. Dropping the table would destroy working and approved new-design documents and is not part of rollback.

Smoke checks after deployment:

1. Open `/try`, upload a test PDF, and confirm a complete page appears without a questionnaire.
2. Change style, answer one improvement question, edit the suggestion, keep it, and undo it.
3. Register from a guest draft, verify email, and confirm `/builder` opens the same content.
4. Approve, publish Free, and confirm the public page matches the preview.
5. Confirm a new page has no Ask action until it is enabled.
6. Enable Ask, publish again, and confirm it answers only from approved page content.
7. Confirm a working edit does not appear publicly until the next approval and publish.
8. Open an existing legacy portfolio and confirm its theme and bot still work.
9. Copy the public link and confirm the button reports `Copied`.
10. Set `VITE_PROFILE_BUILDER_ROLLOUT=false`, rebuild, and confirm an existing ready user's dashboard Publish and Preview buttons still open `/preview`; confirm an unfinished owner's recovery CTA opens `/questionnaire`. Remove the variable and rebuild before enabling the new onboarding again.
