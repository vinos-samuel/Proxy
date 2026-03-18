# Proxy / BIOSai — Project Context

## What This Is
Digital Twin / AI-powered career profile builder. Users upload a resume, fill an 11-step questionnaire, and get a public AI portfolio page with a chatbot that represents them.

**Live URL:** https://biosai.replit.app (hosted on Replit)
**GitHub:** https://github.com/vinos-samuel/Proxy (branch: main)
**Domain:** myproxy.work

## Workflow
- I edit files locally on Mac (`/Users/vinos/Documents/Claude Code/proxy/`)
- User pushes to GitHub → pulls on Replit
- Local dev: `npx tsx --env-file=.env server/index.ts` (configured in `.claude/launch.json`)
- Local DB doesn't work (Postgres is on Replit) — test on Replit after push

## ⚠️ Replit Pull Instructions (IMPORTANT — remind user every time)
Replit Agent sometimes makes code changes directly on Replit without going through GitHub. This causes "divergent branches" errors on `git pull`.

**Always use this instead of `git pull`:**
```
git fetch origin && git reset --hard origin/main
```
Then if the DB schema changed (new columns added to shared/schema.ts), also run:
```
npm run db:push
```
**Plain English:** This makes Replit's code exactly match GitHub. Any changes made directly on Replit (by Replit Agent) will be discarded — GitHub is always the source of truth.

## Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript, Wouter routing, TanStack Query, Tailwind |
| Backend | Express 5, TypeScript |
| DB | PostgreSQL + Drizzle ORM |
| AI | Google Gemini 2.5 Flash via `@google/genai` |
| Storage | Google Cloud Storage (file uploads) |
| Payments | Stripe (one-time, Checkout Sessions) |
| Email | Resend, FROM: noreply@myproxy.work |
| Auth | Passport.js local strategy, bcryptjs, express-session + pg store |
| Security | helmet, express-rate-limit, double-submit CSRF cookies |
| Logging | Custom JSON structured logger (`server/logger.ts`) |

## Key Env Vars (all in Replit Secrets)
- `DATABASE_URL` — Replit Postgres
- `AI_INTEGRATIONS_GEMINI_API_KEY` + `AI_INTEGRATIONS_GEMINI_BASE_URL` — Replit AI proxy
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `FROM_EMAIL=noreply@myproxy.work`
- `SESSION_SECRET`, `NODE_ENV=production`

## Stripe Price IDs (live)
- Launch: `price_1TAQ4QPzBwfwKXghIiFEE6eG` ($99)
- Evolve: `price_1TAQ4oPzBwfwKXghRBwMw9F0` ($199)
- Concierge: `price_1TAQ57PzBwfwKXgh162qiUU2` ($499)

## Key Architecture Decisions Made
- **CSRF:** Double-submit cookie pattern. Exempt: `/api/stripe/webhook`, `/api/chat/:username`
- **Chat:** Uses `generateContent` (non-streaming) — Replit AI proxy doesn't support SSE streaming
- **AI pre-fill:** Resume upload → `parseResumeWithGemini()` → `generateQuestionnaireDraft()` → saved to DB with `_aiDraft: true` flag
- **Payments:** PaymentGate.tsx → `/api/create-checkout-session` → Stripe redirect → webhook sets profile published
- **Admin routes:** All `/api/admin/*` require `requireAdmin` middleware (`isAdmin` field on customers table)
- **No `/api/test-publish`:** Deleted as security fix — all publishing goes through Stripe

## CSRF Pattern
Cookie `csrf-token` set on every GET to non-API routes. All POST/PUT/DELETE/PATCH to `/api/*` must include `x-csrf-token` header matching cookie. `apiRequest()` in `queryClient.ts` does this automatically. Raw `fetch()` calls must manually read the cookie.

## Questionnaire (11 steps)
step1: basic info | step2: summary + career history | step3: resume URL (to be removed — duplicate with step10) | step4: war stories (min 3) | step5: achievements | step6: technical skills | step7: voice/personality | step8: Q&A (min 3) | step9: objections (min 2) | step10: branding + headshot/video/CV upload | step11: chatbot setup

## Known Pending Tasks
- [ ] AI banner text — confirm it says "AI may have made assumptions — read through and adjust"
- [ ] Sprint 2: Publish First / Improve Later (completeness score, remove questionnaire-complete gate, nudge emails)
- [ ] Sprint 3: LinkedIn enrichment via Proxycurl API (posts, articles, comments, interests)
- [ ] Sprint 4: Conversational onboarding
- [ ] Post-launch: Fix @google-cloud/storage vulnerabilities (5 low severity, requires downgrade to v5.18.3)

## Completed
- [x] Remove duplicate CV field from Step 3 (resumeUrl) — already in Step 10
- [x] Sign-in form input text too faint — darkened
- [x] Chat CSRF exemption + switched to non-streaming (Replit proxy doesn't support SSE)
- [x] PaymentGate wired to Stripe checkout (/api/create-checkout-session)
- [x] Edit Content save CSRF fix (preview.tsx PATCH)
- [x] Career Trajectory UI — company name in header, roles nested inside
- [x] AI pre-fill questionnaire from resume (Sprint 1)
- [x] Privacy policy + Terms of Service pages
- [x] Password reset flow (forgot password email via Resend)
- [x] Structured logging (server/logger.ts)
- [x] Helmet, rate limiting, CSRF middleware
- [x] Stripe payment endpoints + webhook
- [x] Server-side Zod validation on key endpoints
- [x] Deleted /api/test-publish security bypass

## File Map (important files)
- `server/index.ts` — Express app, middleware stack (helmet, rate limiters, CSRF, sessions)
- `server/routes.ts` — All API endpoints
- `server/ai-processor.ts` — Gemini calls: `processQuestionnaire()`, `parseResumeWithGemini()`, `generateQuestionnaireDraft()`
- `server/storage.ts` — All DB queries (DatabaseStorage class)
- `server/logger.ts` — Structured JSON logger (use instead of console.*)
- `server/system-prompt-builder.ts` — Builds chat system prompt from knowledge entries
- `shared/schema.ts` — Drizzle DB schema + Zod types
- `client/src/pages/questionnaire.tsx` — 11-step questionnaire
- `client/src/pages/portfolio.tsx` — Public profile page + chat
- `client/src/pages/preview.tsx` — Owner preview + edit
- `client/src/pages/dashboard.tsx` — User dashboard
- `client/src/components/PaymentGate.tsx` — Stripe checkout UI
- `client/src/lib/queryClient.ts` — `apiRequest()` with auto CSRF headers

## Legal
- Privacy Policy: `/privacy` (Singapore PDPA, contact: myproxy_work@proton.me)
- Terms of Service: `/terms` (Singapore law, prices $99/$199/$499)
