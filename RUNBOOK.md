# Proxy — Resilience Runbook

> A living document of "what can break and how to fix it."
> Last updated: 19 March 2026

---

## Table of Contents

1. [Quick Reference: Common Issues](#1-quick-reference-common-issues)
2. [External Services & Dependencies](#2-external-services--dependencies)
3. [Authentication & Sessions](#3-authentication--sessions)
4. [Payment Flow (Stripe)](#4-payment-flow-stripe)
5. [AI Pipeline (Gemini)](#5-ai-pipeline-gemini)
6. [Chat / Chatbot](#6-chat--chatbot)
7. [Email (Resend)](#7-email-resend)
8. [File Uploads (Google Cloud Storage)](#8-file-uploads-google-cloud-storage)
9. [Database](#9-database)
10. [Security (CSRF, Rate Limiting)](#10-security-csrf-rate-limiting)
11. [Deployment Checklist](#11-deployment-checklist)
12. [Environment Variables](#12-environment-variables)
13. [User Journey: Full Flow & Failure Points](#13-user-journey-full-flow--failure-points)
14. [Prompt & Chatbot Tuning](#14-prompt--chatbot-tuning)
15. [Monitoring & Logs](#15-monitoring--logs)
16. [Incident Playbooks](#16-incident-playbooks)

---

## 1. Quick Reference: Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Login page refreshes, nothing happens | Session not saving to DB | Check `DATABASE_URL` in deployment secrets. Restart app. |
| Login returns 200 but user stays on login page | Session race condition | Already fixed with `req.session.save()`. If recurs, check DB connectivity. |
| "Invalid CSRF token" on any POST | CSRF cookie expired or missing | User refreshes page (GET sets new cookie). Check `apiRequest()` usage. |
| Password reset email not arriving | `RESEND_API_KEY` missing or invalid | Verify in Deployments → Secrets. Check Resend dashboard. |
| User verified email but can't login | `email_verified` column missing in prod DB | Run: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true;` |
| Profile stuck in "processing" | AI generation failed mid-way | Admin → Reprocess button. Or `/api/admin/reprocess/:customerId`. |
| Payment completed but profile not live | Stripe webhook failed | Check logs. Use Admin → Grant Access. Or replay webhook from Stripe dashboard. |
| Chat returns 500 error | Gemini API down or rate limited | Check `AI_INTEGRATIONS_GEMINI_API_KEY`. Wait for rate limit (1 min). |
| Chat responses are walls of text | System prompt formatting rules | Edit `server/system-prompt-builder.ts`. See [Section 14](#14-prompt--chatbot-tuning). |
| "Too many requests" error | Rate limiter triggered | Wait 15 min (auth), 1 min (chat), or 15 min (general API). |
| `db:push` wants to delete session table | Drizzle doesn't know about session table | **Abort.** Session table is managed by connect-pg-simple, not Drizzle. Skip db:push or select only new tables. |
| Build fails with chunk size warning | Large assets (videos) | Warning only — build still succeeds. Ignore. |
| New DB column not in production | `db:push` only affects workspace DB | Run `ALTER TABLE` manually in Replit Production Database SQL console. One statement at a time. |

---

## 2. External Services & Dependencies

### 2.1 PostgreSQL (Replit)

**What it does:** All data storage — users, profiles, knowledge, payments, sessions, blog posts.

**Env var:** `DATABASE_URL`

**What can break:**
- `DATABASE_URL` removed from deployment secrets → app connects to wrong/empty DB → all logins fail
- Connection pool exhaustion (too many concurrent queries)
- Production DB schema out of sync with code (missing columns)

**How to fix:**
- **DB URL missing:** Go to Replit Database tab → copy connection string → paste into Deployments → Secrets as `DATABASE_URL`. Redeploy.
- **Pool exhaustion:** Restart the deployment (redeploy).
- **Schema drift:** Run `ALTER TABLE` statements one at a time in Replit Production Database SQL console. Never use `db:push` for production.

**CRITICAL:** Replit shows "External database detected" warning when `DATABASE_URL` is set. **Ignore this warning. Do NOT remove `DATABASE_URL`.** Removing it breaks everything.

---

### 2.2 Stripe

**What it does:** One-time payments for profile publishing.

**Env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Price IDs (live, hardcoded in routes.ts):**
- Launch: `price_1TAQ4QPzBwfwKXghIiFEE6eG` ($99)
- Evolve: `price_1TAQ4oPzBwfwKXghRBwMw9F0` ($199)
- Concierge: `price_1TAQ57PzBwfwKXgh162qiUU2` ($499)

**What can break:**
- Missing `STRIPE_SECRET_KEY` → checkout creation fails (500 error)
- Wrong `STRIPE_WEBHOOK_SECRET` → webhook signature verification fails (400 error) → profile not published after payment
- Webhook arrives but profile ID missing from metadata → update silently skipped
- Double webhook delivery → safe (idempotent update)

**How to fix:**
- Verify both keys in Deployments → Secrets
- Check Stripe dashboard → Webhooks → Recent events for failures
- Replay failed webhook from Stripe dashboard
- Last resort: Admin → Grant Access to manually publish profile

---

### 2.3 Gemini AI (Google, via Replit proxy)

**What it does:** Resume parsing, questionnaire processing, chatbot responses.

**Env vars:** `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`

**Model:** `gemini-2.5-flash`

**What can break:**
- API key invalid/expired → all AI calls fail
- Rate limits exceeded → 429 errors
- Replit AI proxy down → connection errors
- Gemini returns malformed JSON → parse errors in processing
- Very long prompts → token limit exceeded

**How to fix:**
- Check API key in workspace secrets
- Rate limits: wait and retry (typically resets within minutes)
- Parse errors: already handled with fallback data — check logs for `[Resume Parse]` or questionnaire errors
- If AI is completely down: users can still manually fill questionnaire (no AI pre-fill), but chat won't work until restored

**Graceful degradation:**
- Resume upload fails → user fills questionnaire manually
- Questionnaire processing fails → partial data saved, user can edit
- Chat fails → user sees error message, profile page still loads

---

### 2.4 Resend (Email)

**What it does:** Sends verification, welcome, password reset, and profile-live emails.

**Env vars:** `RESEND_API_KEY`, `FROM_EMAIL` (default: `noreply@myproxy.work`)

**What can break:**
- Missing `RESEND_API_KEY` → emails silently skipped (app doesn't crash)
- Invalid sender domain → Resend rejects email
- Recipient email bounces → user never receives
- Resend rate limits → emails delayed or dropped

**How to fix:**
- Verify `RESEND_API_KEY` in both workspace AND deployment secrets
- Check Resend dashboard (resend.com) for delivery status, bounces
- User can always resend verification email via the login page
- User can request new password reset link

**Important:** Email failures are **non-blocking**. The app continues even if email fails. Profiles still publish, accounts still verify (if user has the link).

---

### 2.5 Google Cloud Storage (File Uploads)

**What it does:** Stores headshots, videos, CVs, resume PDFs.

**Env vars:** `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR` (set by Replit)

**What can break:**
- Env vars not set → upload endpoint throws error
- Replit sidecar (localhost:1106) unavailable → token refresh fails
- File too large → rejected by multer (5MB limit for resumes)
- Corrupted upload → file accessible but broken

**How to fix:**
- Verify Object Storage is enabled in Replit
- Restart deployment to reset sidecar connection
- User re-uploads file
- Check file accessibility via `/objects/:path` URL

---

## 3. Authentication & Sessions

### 3.1 Registration Flow

```
User submits form
  → Validate (Zod: email, password 8+, name 2+, username 3+ lowercase)
  → Check duplicate email → 400
  → Check duplicate username → 400
  → Hash password (bcrypt, 10 rounds)
  → Create customer (emailVerified: false)
  → Generate verification token (32 bytes random)
  → Hash token (SHA-256) → store in DB with 24hr expiry
  → Send verification email with raw token in URL
  → Return 201
```

**What can break:**
- Duplicate email/username → clear error message, user picks another
- Email send fails → account created but unverified. User clicks "Resend verification" on login page.
- Token generation fails → registration fails (500 error, extremely rare)

---

### 3.2 Email Verification Flow

```
User clicks email link → /verify-email?token=xxx
  → Frontend sends token to GET /api/auth/verify-email
  → Server hashes token (SHA-256), looks up in DB
  → Checks expiry (24 hours)
  → Sets emailVerified = true
  → Creates session (with explicit req.session.save())
  → Sends welcome email (async, non-blocking)
  → Returns 200 → user redirected to dashboard
```

**What can break:**
- Token expired (>24 hours) → user requests new verification email
- Token already used (emailVerified already true) → link is stale, user just logs in
- Session save fails → user verified but not logged in, must log in manually

---

### 3.3 Login Flow

```
User submits email + password
  → Validate (Zod)
  → Find customer by email → 401 if not found
  → Compare password hash (bcrypt) → 401 if mismatch
  → Check emailVerified → 403 if false (with unverified flag)
  → Create session (explicit req.session.save())
  → Return customer data (minus passwordHash)
```

**What can break:**
- Email not verified → 403 with `unverified: true` → frontend shows "verify email" prompt
- Session not persisting → was a major bug, fixed with explicit `req.session.save()` before response
- `SESSION_SECRET` changed between deploys → all existing sessions invalidated → users must re-login

---

### 3.4 Password Reset Flow

```
1. POST /api/auth/forgot-password
   → Find customer by email (silent if not found — no email enumeration)
   → Generate token → SHA-256 hash → store with 1hr expiry
   → Send password reset email with raw token

2. GET /api/auth/verify-reset-token?token=xxx
   → Hash token → look up in DB → check expiry
   → Return valid/invalid

3. POST /api/auth/reset-password
   → Hash token → look up → check expiry
   → Hash new password (bcrypt)
   → Update password, clear token
   → Create session → user logged in
```

**What can break:**
- Token expired (1 hour) → user requests new reset
- Email not arriving → check Resend API key and dashboard
- New password too short (<8 chars) → 400 error

---

### 3.5 Session Management

**Store:** PostgreSQL via `connect-pg-simple`
**Table:** `session` (auto-created with `createTableIfMissing: true`)
**Cookie:** `connect.sid`, HttpOnly, Secure (prod), SameSite: lax, 30-day max age

**What can break:**
- Session table missing → auto-recreates on restart
- `SESSION_SECRET` changed → all sessions invalidated
- DB connection lost → session reads/writes fail → all requests fail
- `db:push` tries to delete session table → **always abort this**

**How to fix:**
- Never change `SESSION_SECRET` unless you want to force all logouts
- If sessions corrupt: restart deployment (table recreates)
- If `db:push` prompts to delete session table: abort, skip `db:push`

---

## 4. Payment Flow (Stripe)

### Full Flow

```
1. User clicks "Pay" on PaymentGate
   → POST /api/create-checkout-session { tier: "launch" }
   → Server creates Stripe Checkout Session with metadata
   → Returns session URL
   → User redirected to Stripe

2. User pays on Stripe
   → Stripe redirects to /payment/success?session_id=xxx

3. Frontend polls: GET /api/payment/status/:sessionId
   → Server checks Stripe session status
   → If paid: update profile (published), customer (paid)
   → Return { status: "paid", domain: "myproxy.work/portfolio/username" }

4. Stripe sends webhook: POST /api/stripe/webhook
   → Verify signature
   → Extract metadata (profileId, customerId, tier)
   → Update profile to published
   → Send "Profile is live" email
```

### What Can Go Wrong

| Issue | Symptom | Fix |
|-------|---------|-----|
| Stripe key missing | Checkout creation fails (500) | Add `STRIPE_SECRET_KEY` to deployment secrets |
| Webhook secret wrong | Profile not published after payment | Fix `STRIPE_WEBHOOK_SECRET`, replay webhook from Stripe dashboard |
| Webhook never arrives | Profile stuck in "ready" | Check Stripe webhook endpoint URL. Must be `https://myproxy.work/api/stripe/webhook` |
| Payment succeeds but profile not published | Metadata missing from session | Check Stripe dashboard for session metadata. Admin → Grant Access as fallback |
| User paid but sees PaymentGate again | `paymentStatus` not set to "paid" in DB | Check profile row. Admin → Grant Access. |

### Admin Bypass

For any stuck payment, admin can use **Grant Access** button in admin dashboard:
- Sets `subscriptionStatus = "paid"` on customer
- Sets `paymentStatus = "paid"`, `isPublic = true`, `tier = "launch"` on profile
- Triggers reprocessing if questionnaire data exists
- Sends "Profile is live" email

---

## 5. AI Pipeline (Gemini)

### 5.1 Resume Parsing

```
POST /api/parse-resume (multipart, PDF, max 5MB)
  → Extract text via Gemini
  → Return: { name, roles, achievements, skills, ... }
```

**Failure modes:**
- Non-PDF → 400 "Only PDF resumes are supported"
- Corrupted PDF → 500 "Failed to extract data from resume"
- Gemini down → 500 error
- No name extracted → error thrown

**Fallback:** User fills questionnaire manually. Resume upload is optional.

---

### 5.2 Questionnaire Draft Generation

```
After resume parsed → generateQuestionnaireDraft(extractedData)
  → Gemini generates full 11-step questionnaire pre-fill
  → Marked with _aiDraft: true flag
  → User sees "AI pre-filled" banner, can edit everything
```

**Failure modes:**
- Gemini fails → draft generation skipped, user gets raw extracted data
- Malformed response → partial fill, user completes manually

**Fallback:** Always non-fatal. User can edit all fields.

---

### 5.3 Questionnaire Processing

```
POST /api/questionnaire/submit
  → processQuestionnaire(data)
  → 3 parallel Gemini calls (portfolio, skills, positioning)
  → Parse JSON responses
  → Build career timeline, knowledge entries, fact banks
  → Save to DB
  → Profile status: draft → processing → ready
```

**Failure modes:**
- Gemini rate limited → processing fails
- JSON parse errors → fallback to empty data (graceful)
- DB insert fails → partial data saved

**How to fix:**
- Admin → Reprocess button retries the entire pipeline
- Manually edit profile content via dashboard

---

## 6. Chat / Chatbot

### How It Works

```
POST /api/chat/:username
  → Load published profile
  → Fuzzy search knowledge entries (Fuse.js) for relevant context
  → buildSystemPrompt() — 14-section prompt with personality, stories, formatting rules
  → Gemini generateContent() (non-streaming)
  → Return response text
  → Save question to chat_messages (async, for analytics)
```

### What Can Break

| Issue | Symptom | Fix |
|-------|---------|-----|
| Profile not published | 404 error | Publish profile (payment or admin grant) |
| No knowledge entries | Generic/empty responses | Reprocess questionnaire via admin |
| Gemini down | 500 error | Check API key, wait for rate limit |
| Walls of text | Bad formatting | Edit system prompt (see Section 14) |
| Repetitive answers | Same story every time | Anti-repetition rules in system prompt |
| Hallucinated facts | AI makes up numbers | "Honesty" rule in prompt: "don't hallucinate numbers" |
| Rate limited | 429 after 30 messages/min | Wait 1 minute |

### Chat Analytics

Every question is saved to `chat_messages` table (fire-and-forget):
- `profileId` — which profile was asked
- `question` — what was asked
- `askedAt` — timestamp

This powers the "Questions Asked" metric on the user dashboard.

---

## 7. Email (Resend)

### Email Types

| Email | When Sent | Template Function | Blocking? |
|-------|-----------|-------------------|-----------|
| Verify Email | After registration | `verifyEmailTemplate()` | No (account created regardless) |
| Welcome | After email verified | `welcomeEmailTemplate()` | No |
| Password Reset | On forgot-password request | `passwordResetTemplate()` | No (token still saved) |
| Profile Live | After payment (webhook + grant-access) | `profileLiveTemplate()` | No (profile still publishes) |

### Debugging Email Issues

1. Check `RESEND_API_KEY` exists in deployment secrets
2. Check server logs for "Failed to send" messages
3. Check Resend dashboard (resend.com) → Logs → look for bounces/failures
4. Verify `FROM_EMAIL` is `noreply@myproxy.work` (domain must be verified in Resend)
5. Check spam folders

### Key Design Decision

All email sends are **fire-and-forget**. If email fails:
- Registration still completes (user can resend verification)
- Verification still works (welcome email is bonus)
- Payment still publishes profile (notification is bonus)
- Password reset token still saved (user re-requests if email lost)

---

## 8. File Uploads (Google Cloud Storage)

### Upload Flow

```
1. Client requests upload URL: POST /api/uploads/request-url
2. Server generates signed URL from Replit Object Storage
3. Client uploads directly to signed URL
4. Client saves the object path to profile (photoUrl, videoUrl, etc.)
5. Files served via /objects/:objectPath
```

### What Can Break

- Replit Object Storage not enabled → env vars missing
- Sidecar (localhost:1106) down → token refresh fails
- File too large (resume: 5MB limit via multer)
- Upload succeeds but URL not saved to profile → file orphaned

### Fix

- Enable Object Storage in Replit
- Restart deployment
- User re-uploads
- Check profile fields (photoUrl, videoUrl, cvResumeUrl, resumeUrl)

---

## 9. Database

### Tables & Relationships

```
customers (root)
  ├── twin_profiles (1:1, CASCADE DELETE)
  │     ├── fact_banks (1:many, CASCADE DELETE)
  │     ├── knowledge_entries (1:many, CASCADE DELETE)
  │     └── chat_messages (1:many, CASCADE DELETE)
  ├── chat_usage (1:many, CASCADE DELETE)
  └── payments (1:many, CASCADE DELETE)

blog_posts (standalone, admin-only)
session (managed by connect-pg-simple, NOT in Drizzle schema)
```

### Schema Drift Prevention

**Problem:** `db:push` only updates workspace (dev) DB. Production DB must be updated manually.

**Process for new columns:**
1. Add column in `shared/schema.ts`
2. Run `db:push` on Replit workspace (dev DB) — but abort if it tries to delete session table
3. Run `ALTER TABLE` manually in Production Database SQL console:
   ```sql
   ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE DEFAULT value;
   ```
4. Backfill existing rows if needed:
   ```sql
   UPDATE table_name SET column_name = default_value WHERE column_name IS NULL;
   ```
5. Run statements ONE AT A TIME (Replit SQL console doesn't support multiple)

### Profile Status States

```
draft → processing → ready → published
                       ↑          ↓
                       └── (unpublished, if admin revokes)
```

- `draft`: Initial state, questionnaire not submitted
- `processing`: AI is generating portfolio data
- `ready`: AI done, awaiting payment
- `published`: Paid and live (or admin-granted)

---

## 10. Security (CSRF, Rate Limiting)

### CSRF (Double-Submit Cookie)

**How it works:**
1. Every GET to non-API route → server sets `csrf-token` cookie (24hr, JS-readable)
2. Every POST/PUT/DELETE/PATCH to `/api/*` → client reads cookie → sends as `x-csrf-token` header
3. Server validates header matches cookie

**Exempt routes (no CSRF needed):**
- `/api/stripe/webhook` (uses Stripe signature verification)
- `/api/chat/:username` (public, unauthenticated)
- `/api/analytics/view/:username` (public)

**Common CSRF errors:**
- User's browser blocks cookies → CSRF always fails
- Frontend uses raw `fetch()` instead of `apiRequest()` → must manually include header
- Cookie expired (>24 hours without page load) → user refreshes page

### Rate Limits

| Endpoint | Window | Max Requests | Reset |
|----------|--------|-------------|-------|
| All `/api/*` | 15 minutes | 100 | Wait 15 min |
| Login, Register, Password Reset | 15 minutes | 10 | Wait 15 min |
| Chat `/api/chat/:username` | 1 minute | 30 | Wait 1 min |

**Rate limit response:** 429 `{ error: "Too many requests, please try again later." }`

---

## 11. Deployment Checklist

### Standard Deploy (no DB changes)

```bash
# Step 1 — Push from Mac
cd "/Users/vinos/Documents/Claude Code/proxy"
git add <files>
git commit -m "description"
git push origin main

# Step 2 — Pull on Replit Shell
git fetch origin && git reset --hard origin/main

# Step 3 — Build
npm run build

# Step 4 — Deploy
# Go to Replit Deployments tab → click Deploy
```

### Deploy with DB Changes

Same as above, plus between Step 2 and Step 3:

```bash
# Workspace DB (optional, for dev testing)
npm run db:push
# ⚠️ If it tries to delete "session" table → ABORT

# Production DB (required)
# Go to Replit → Database tab → SQL console
# Run ALTER TABLE statements ONE AT A TIME:
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS new_col TYPE DEFAULT value;
UPDATE table_name SET new_col = value WHERE new_col IS NULL;
```

### Post-Deploy Verification

1. Visit `https://myproxy.work` — page loads
2. Login with admin account — dashboard appears
3. Check a published profile — portfolio page + chat works
4. Check `/blog` — page loads (if blog system deployed)
5. Check server logs in Replit for errors

---

## 12. Environment Variables

### Deployment Secrets (Production — myproxy.work)

| Variable | Required | What Happens If Missing |
|----------|----------|------------------------|
| `DATABASE_URL` | **CRITICAL** | App connects to wrong DB. All logins fail. All data gone. |
| `SESSION_SECRET` | Yes | Falls back to hardcoded default (insecure but works) |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Yes | All AI features fail (resume parse, questionnaire, chat) |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Yes | AI calls go to wrong endpoint |
| `STRIPE_SECRET_KEY` | Yes | Payment checkout fails |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhooks rejected, profiles not published after payment |
| `RESEND_API_KEY` | Yes | All emails silently skipped |
| `FROM_EMAIL` | No | Defaults to `noreply@myproxy.work` |
| `NODE_ENV` | No | Defaults to development (affects security headers) |
| `APP_URL` | **DO NOT SET** | Auto-detected from request host. Setting it breaks dev/prod isolation. |

---

## 13. User Journey: Full Flow & Failure Points

```
SIGNUP ──→ VERIFY EMAIL ──→ UPLOAD CV ──→ FILL QUESTIONNAIRE ──→ PAY ──→ PROFILE LIVE
  │            │                │               │                  │          │
  │            │                │               │                  │          │
  ▼            ▼                ▼               ▼                  ▼          ▼
Email fails?  Token expired?  PDF corrupt?   AI fails?         Stripe     Webhook
User can      User resends    User fills     Admin can          fails?     fails?
resend        verification    manually       reprocess          User       Admin
                                                                retries    grants
                                                                           access
```

### Each Step's Failure & Recovery

| Step | What Can Fail | User Sees | Recovery |
|------|--------------|-----------|----------|
| 1. Register | Duplicate email/username | "Email already exists" | User picks different email/username |
| 2. Verify Email | Token expired | "Link expired" | Click "Resend verification" on login page |
| 3. Upload CV | PDF corrupt / too large | "Failed to extract" | User fills questionnaire manually |
| 4. Questionnaire | AI processing fails | Profile stuck in "processing" | Admin → Reprocess. Or user edits manually. |
| 5. Payment | Stripe checkout error | "Failed to create checkout" | Check Stripe key. User retries. |
| 6. Webhook | Signature invalid | Profile not published | Fix webhook secret. Admin → Grant Access. |
| 7. Profile Live | Email not sent | No notification | Profile still live. User checks dashboard. |

---

## 14. Prompt & Chatbot Tuning

### System Prompt Location

**File:** `server/system-prompt-builder.ts`

### 14 Sections of the System Prompt

1. **Identity & Persona** — "You ARE [name], not an AI assistant"
2. **Response Style Selection** — 4 question types (general, specific, transferable, out of scope)
3. **Tone & Behavior** — first person, communication style, honesty rules, vocabulary
4. **War Stories** — specific examples from questionnaire
5. **Core Profile** — summary, achievements, career timeline
6. **Philosophies & Approach** — "How I Work" framework
7. **Critical Formatting Rules** — paragraphs, bullets, bold, no headers
8. **Anti-Repetition Rules** — don't repeat same story twice
9. **Affirmative Response Handling** — when user says "yes", deliver immediately
10. **Voice Calibration** — few-shot examples of ideal responses
11. **Contact Information** — from knowledge entries
12. **Response Guidelines** — be conversational, ask follow-ups, show personality
13. **Fallback Response** — what to say for off-topic questions
14. **Final Instruction** — classify question type, respond accordingly

### Common Chatbot Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| **Walls of text** | Formatting rules contradicting or missing | Ensure Section 7 says: "Break into short paragraphs", "Use **bold**", "Use - bullets". Remove any "NO MARKDOWN" rules. |
| **Too generic** | Not enough knowledge entries | User needs more detailed war stories (min 3). Check knowledge_entries table. |
| **Hallucinating facts** | Insufficient data, AI fills gaps | Strengthen "Honesty" rule in Section 3: "If you don't know, say so." |
| **Robotic/corporate tone** | answerStyle or tone not set | Check questionnaire Step 7 data. Ensure tone/answerStyle saved. |
| **Always same story** | Anti-repetition not working | Check Section 8. May need to increase war story count. |
| **Says "As an AI"** | Breaking character | Section 12 rule: "Never say 'As an AI' or break character." |
| **Too long responses** | No length constraints | Section 3: "150-250 words for general, up to 400 for deep-dives." |
| **No follow-up questions** | Missing from response style | Section 2 Type 1: "End with: 'Want me to walk through a specific project?'" |

### How to Test Prompt Changes

1. Edit `server/system-prompt-builder.ts`
2. Push + deploy
3. Visit any published profile → chat
4. Ask a variety of questions:
   - General: "Tell me about your experience"
   - Specific: "Walk me through a project you led"
   - Transferable: "Have you done [something unrelated]?"
   - Off-topic: "What's the weather?"
   - Follow-up: "Yes, tell me more"
5. Check formatting: paragraphs separated? Bold on key terms? Bullets for lists?

### Adding New Prompt Sections

If feedback indicates a new issue pattern:
1. Identify the behavior to change
2. Add a new section to `buildSystemPrompt()` between existing sections
3. Include clear instructions + good/bad examples
4. Test with multiple question types
5. Deploy and monitor

---

## 15. Monitoring & Logs

### Where to See Logs

- **Replit Deployments → Logs tab** — production server logs
- **Stripe Dashboard → Webhooks** — webhook delivery logs
- **Resend Dashboard → Logs** — email delivery logs

### Logger Behavior

| Method | Output | Visible in Replit? |
|--------|--------|--------------------|
| `logger.info()` | stdout | Yes |
| `logger.error()` | stderr | Yes |
| `logger.warn()` | stderr | **NO** (Replit deployment hides stderr warnings) |
| `logger.debug()` | stdout | Only in dev |

**Important:** Always use `logger.info()` for any diagnostic messages you need to see in production. `logger.warn()` goes to stderr which is invisible in Replit deployment logs.

### What Gets Logged

- All API requests: `METHOD /path STATUS in Xms :: { response }`
- Auth events: registration, login, logout, email verification, password reset
- Stripe events: checkout created, webhook received, payment status
- AI processing: resume parsing, questionnaire generation, chat calls
- Email sends: verification, welcome, reset, profile-live
- Errors: full stack trace (dev only), status + message (prod)

### Log Analysis Tips

- **Search for 500 errors** — server-side failures
- **Search for 429 errors** — rate limiting (may indicate abuse)
- **Search for "webhook"** — Stripe payment issues
- **Search for "Failed to send"** — email delivery issues
- **Search for "Gemini"** or "generateContent" — AI failures

---

## 16. Incident Playbooks

### Playbook 1: "Nobody Can Login"

1. Check if deployment is running (visit myproxy.work — does page load?)
2. If page loads but login fails:
   - Check `DATABASE_URL` in Deployments → Secrets
   - Verify it points to Production Database (copy from Database tab)
   - Check `SESSION_SECRET` hasn't changed
3. If page doesn't load:
   - Check Replit deployment status
   - Redeploy
4. After fixing: test login with admin account

---

### Playbook 2: "User Paid But Profile Not Published"

1. Check Stripe Dashboard → Payments → find the payment
2. If payment succeeded:
   - Check Webhooks tab → find the event → check delivery status
   - If webhook failed: fix `STRIPE_WEBHOOK_SECRET` → redeploy → replay webhook
   - If webhook succeeded but profile not published: check server logs
3. Quick fix: Admin Dashboard → find user → click "Grant Access"
4. Verify: visit `myproxy.work/portfolio/username`

---

### Playbook 3: "Chat Is Down For Everyone"

1. Check server logs for Gemini errors
2. Verify `AI_INTEGRATIONS_GEMINI_API_KEY` in secrets
3. If rate limited: wait a few minutes, retry
4. If API key invalid: get new key, update secret, redeploy
5. If Replit AI proxy down: nothing to do, wait for Replit to fix
6. Profile pages still load — only chat is affected

---

### Playbook 4: "Emails Not Arriving"

1. Check `RESEND_API_KEY` in deployment secrets
2. Check Resend dashboard for delivery logs
3. If bouncing: recipient email invalid
4. If rate limited: wait and retry
5. If key expired: generate new key on Resend, update secret, redeploy
6. User workarounds:
   - Verification: click "Resend verification" on login page
   - Password reset: request new link
   - Profile live: check dashboard — profile is live even if email failed

---

### Playbook 5: "New Column Missing in Production"

1. Check error message — usually "column X does not exist"
2. Go to Replit → Database tab → Open SQL console
3. Run (one at a time):
   ```sql
   ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE DEFAULT value;
   ```
4. Backfill if needed:
   ```sql
   UPDATE table_name SET column_name = default_value WHERE column_name IS NULL;
   ```
5. Redeploy (or just wait — query should work immediately)

---

### Playbook 6: "Profile Stuck in Processing"

1. Check server logs for AI processing errors
2. If Gemini failed:
   - Admin Dashboard → find user → click "Reprocess"
   - Or: `POST /api/admin/reprocess/:customerId`
3. If Gemini keeps failing:
   - Check API key
   - Check if questionnaire data is valid (no corrupt JSON)
   - Last resort: manually update profile status via SQL:
     ```sql
     UPDATE twin_profiles SET status = 'ready' WHERE customer_id = 'xxx';
     ```

---

### Playbook 7: "Chatbot Giving Bad Responses"

1. Identify the issue type (see Section 14 table)
2. Check knowledge entries exist for the profile:
   - Admin Dashboard → Reprocess (regenerates entries)
3. If formatting issue:
   - Edit `server/system-prompt-builder.ts`
   - Adjust formatting rules section
   - Push + deploy + test
4. If tone/personality issue:
   - Check questionnaire Step 7 data (tone, answerStyle, vocabulary)
   - User can edit via dashboard → preview page
5. If knowledge gaps:
   - User adds more war stories / achievements via questionnaire
   - Admin reprocesses after changes

---

### Playbook 8: "Feedback: Prompt Needs Changing"

**When users report chatbot response quality issues:**

1. **Collect specifics:**
   - What question was asked?
   - What response was given?
   - What was wrong? (too long, too generic, wrong facts, bad tone, etc.)

2. **Diagnose:**
   - Is it a data problem? (missing knowledge entries → need more stories)
   - Is it a prompt problem? (system prompt rules need adjustment)
   - Is it a model problem? (Gemini limitation → may need model upgrade)

3. **Fix prompt issues:**
   - Open `server/system-prompt-builder.ts`
   - Find the relevant section (formatting? tone? response type?)
   - Add/modify rules
   - Add good/bad examples for the specific issue
   - Push + deploy + test with the same question

4. **Fix data issues:**
   - User adds more detailed stories via questionnaire
   - Admin reprocesses to regenerate knowledge entries
   - Check that knowledge entries actually saved (query DB)

5. **Track patterns:**
   - If multiple users report same issue → systemic prompt problem
   - If one user's chatbot is bad → their data needs enrichment
   - If all chatbots degraded → check if Gemini model changed or API key issues

---

## Appendix: Key File Locations

| File | What It Does |
|------|-------------|
| `server/index.ts` | Express app, middleware (helmet, rate limiters, CSRF) |
| `server/routes.ts` | All API endpoints + session config |
| `server/storage.ts` | All database queries (DatabaseStorage class) |
| `server/db.ts` | Drizzle + connection pool setup |
| `server/ai-processor.ts` | Gemini calls (resume parse, questionnaire, chat) |
| `server/system-prompt-builder.ts` | Chat system prompt (14 sections) |
| `server/emails.ts` | Email templates (verify, welcome, reset, profile-live) |
| `server/logger.ts` | Structured JSON logger |
| `shared/schema.ts` | Database schema + Zod validation |
| `client/src/lib/auth.tsx` | Auth context (login, register, logout) |
| `client/src/lib/queryClient.ts` | API request helper with CSRF |
| `client/src/pages/admin.tsx` | Admin dashboard (customers + blog) |
| `client/src/pages/portfolio.tsx` | Public profile page + chatbot |
| `client/src/pages/questionnaire.tsx` | 11-step questionnaire |
| `CLAUDE.md` | Project context for Claude Code |
