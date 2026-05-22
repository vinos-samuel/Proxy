# Proxy — Product Notes

## Product
AI Digital Twin platform for senior professionals. Upload CV, AI builds your career portfolio with interactive chatbot. Live at myproxy.work.

## Current state: LAUNCHED (March 2026)
Product is live, first users onboarded, preparing public announcement on LinkedIn/Twitter.

---

## What's built and working

### Core flow
- Signup → email verification → login
- Upload CV → AI pre-fills 11-step questionnaire (Gemini 2.5 Flash)
- Review/edit questionnaire → submit → AI processes into Digital Twin
- Pay via Stripe ($99/$199/$499) → profile goes live
- Published profile at myproxy.work/portfolio/username
- Interactive chatbot on profile — recruiters ask questions, Twin answers

### User features
- Dashboard with profile status, portfolio URL, analytics (view count, questions asked)
- Password reset (token hashed, email via Resend)
- Edit published profile content (all paid/granted users)

### Admin features
- Admin dashboard with Customers + Blog tabs
- Customer management: filter tabs, grant free access, delete user, view profile
- Blog CRUD: create/edit/delete posts, publish/unpublish, markdown content, hero images
- Reprocess profiles on demand

### SEO / AEO
- Sitemap.xml (auto-generated: static pages + blog posts + published portfolios)
- Robots.txt (allows public pages, blocks admin/dashboard/API)
- Blog with JSON-LD BlogPosting structured data
- FAQ with JSON-LD FAQPage structured data
- Google Search Console verified

### Email
- Transactional (via Resend): verify email, welcome, password reset, profile live
- Sender display name: "Proxy <noreply@myproxy.work>"
- Personal outreach: vinos@myproxy.work via Zoho Mail
- Contact email across site: vinos@myproxy.work

### DNS / Email auth
- SPF: zohomail.com + send.resend.com
- DKIM: Resend + Zoho keys configured
- DMARC: p=none (softened for launch deliverability)
- MX: Zoho (mx.zoho.com, mx2, mx3)

### Security
- Helmet, rate limiting, CSRF (double-submit cookie)
- Session: express-session + connect-pg-simple
- Passwords: bcryptjs hashed
- Reset tokens: SHA-256 hashed before storage

---

## What's NOT built yet

| Task | Effort | Impact | Notes |
|------|--------|--------|-------|
| "Your Twin is building" email | 15 min | Medium | Send on questionnaire submit, sets expectations |
| Nudge emails (48hr cron) | 1 session | High | Re-engage dropoffs. No cron infrastructure exists yet |
| Sprint 3: LinkedIn enrichment | 1-2 sessions | High | Proxycurl API. Needs account + API key (~$10/100 credits) |
| Sprint 4: Conversational onboarding | 3-5 sessions | High | AI interview instead of form. Parallel path to questionnaire |
| @google-cloud/storage vuln fix | 30 min | Low | 5 low severity, requires downgrade to v5.18.3 |

---

## Key decisions made

- **No streaming chat**: Replit AI proxy doesn't support SSE. Using generateContent (non-streaming)
- **One-time payment, not subscription**: Stripe Checkout Sessions, no recurring billing
- **AI pre-fill is the default onboarding**: Upload CV → AI writes questionnaire → user reviews
- **No questionnaire-complete gate**: Users can pay at any point after starting
- **Grant-access bypasses Stripe**: Admin can give free access, triggers same flow as payment
- **GitHub is source of truth**: Always push from Mac, force-pull on Replit
- **db:push only hits dev DB**: Production columns added manually via SQL console
- **DMARC p=none during launch**: Will tighten to p=quarantine once sender reputation is established
- **Zoho for personal email, Resend for transactional**: Keeps deliverability high on both channels

---

## Pricing (Stripe live)
- Launch: $99 (price_1TAQ4QPzBwfwKXghIiFEE6eG)
- Evolve: $199 (price_1TAQ4oPzBwfwKXghRBwMw9F0)
- Concierge: $499 (price_1TAQ57PzBwfwKXgh162qiUU2)
- Founding member pricing — first 100 members

---

## Tech stack
Frontend: React 18 + TypeScript + Tailwind + Wouter + TanStack Query
Backend: Express 5 + TypeScript
DB: PostgreSQL + Drizzle ORM (Replit hosted)
AI: Google Gemini 2.5 Flash
Storage: Google Cloud Storage
Payments: Stripe
Email: Resend (transactional) + Zoho Mail (personal)
Auth: bcryptjs + express-session + connect-pg-simple
Hosting: Replit (custom domain myproxy.work)

---

## Deploy workflow
1. Claude edits locally on Mac
2. Push: `cd "/Users/vinos/Documents/Claude Code/proxy" && git add <files> && git commit -m "desc" && git push origin main`
3. Pull on Replit: `git fetch origin && git reset --hard origin/main`
4. If schema changed: `npm run db:push` (dev only) + ALTER TABLE on production SQL console
5. Build: `npm run build`
6. Redeploy from Replit Deployments tab

---

## Sprint ideas (prioritized)

1. **"Your Twin is building" email** — quick win, keeps users engaged post-submit
2. **Nudge emails** — re-engage users who signed up but didn't complete/pay
3. **LinkedIn enrichment (Proxycurl)** — richer profiles, competitive differentiator
4. **Conversational onboarding** — lower friction alternative to 11-step form
5. **Completeness score on dashboard** — nudge users to improve their profile after publishing
