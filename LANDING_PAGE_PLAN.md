# Landing Page Restructure Plan
_Agreed in session 2026-06-05. Build in next session._

## Goal
Mid-senior professional lands → feels understood in 10 seconds → trusts it in 30 → clicks to try in 60.

---

## New Section Order

| # | Section | Key Change |
|---|---------|------------|
| 1 | **Hero** | New headline + targeting line + trust statement |
| 2 | **Who it's for** | Moved from section 6 — make them feel seen first |
| 3 | **Problem/Solution** | Resume vs Proxy comparison — moved up |
| 4 | **See it live** | Link to real demo profile (not video modal) |
| 5 | **How it works** | 3 steps — only after they're convinced |
| 6 | **How to use it** | NEW: 3 use cases — email signature, LinkedIn, share with recruiters |
| 7 | **AEO reframed** | Recruiter search angle — no jargon |
| 8 | **Referral edge** | Stays as-is |
| 9 | **Pricing** | Stays as-is |
| 10 | **Final CTA** | Stays as-is |

**Cut entirely:** Job Search Agent section (move to dashboard/FAQ), schema.org/AEO jargon

---

## Copy Changes

### Hero
- **Headline:** "Don't send a PDF. Send a link."
- **Subline:** "Built for mid to senior professionals whose careers don't fit on two pages."
- **Trust statement (below CTA buttons):** "Your profile is private until you publish it. We don't sell your data or use it to train AI models."
- **Remove:** `// CAREER_PORTFOLIO` label — means nothing to users
- **Remove:** Long product description paragraph in hero

### One-line strip
- Move "Think of it as your LinkedIn — but it actually talks back." INTO the hero as social proof — don't bury it in a strip

### Who it's for
- Keep existing copy — it's good, just needs to be section 2

### AEO Section — rewrite headline and body
- **Old:** Schema.org markup, AI agent-readable, structured data jargon
- **New headline:** "Recruiters search for talent. Their AI does too."
- **New body:** "A recruiter searches 'Senior HR Director APAC open to work'. Their AI sourcing tool does the same scan. A PDF never shows up in those results. A Proxy profile does — indexed, structured, and readable by both humans and AI."
- Remove all schema.org / structured data / machine-readable bullet points — replace with plain language

### Demo button
- **Change:** "See a live example" button opens `myproxy.work/portfolio/priya` in new tab (not video modal)
- **Add:** Small caption — "See a real profile — try asking the AI a question"

### New section: How to use it (after How It Works)
Three use cases, simple cards:
1. **Add it to your email signature** — "Every email you send becomes a door to your full career story"
2. **Put it on your LinkedIn** — "Add the link to your About section. Let recruiters explore before they reach out"
3. **Share it instead of a CV** — "When someone asks for your resume, send your Proxy link instead"

---

## Visual Changes

| Element | Before | After |
|---------|--------|-------|
| Hero background | Grey (#E8E8E3) | White |
| Step cards (How it works) | Orange / Blue / Green | White cards, black border, green accent number only |
| Section rhythm | All grey, sections bleed together | Alternate white / light grey so sections feel distinct |
| Demo | Video modal (fictional Alex Rivera) | Screenshot of Priya's profile + link to myproxy.work/portfolio/priya |

**Do NOT change:** Font, logo, nav, black/green/white brand system, Resume vs Proxy cards, pricing section, footer

---

## Demo Profile
Use `myproxy.work/portfolio/priya` — confirmed working:
- Real headshot + video intro
- Strong title: VP, Talent Acquisition & Workforce Strategy – APAC
- Real metrics in bio (38% spend reduction, 42 specialists)
- Working AI Twin chatbot with suggested questions
- Right target audience for the product

---

## Privacy / Trust
Two fears to address explicitly on the page (not just in privacy policy):
1. "Who can see my profile?" → "Your profile is private until you publish it. You control visibility."
2. "What does Proxy do with my data?" → "We don't sell it, share it, or use it to train AI models."

Both addressed in a single 2-line trust statement below the hero CTA buttons.
