# Proxy

## Overview
A SaaS platform ("Proxy") that lets professionals create AI-powered interactive portfolio websites with a chatbot "Digital Twin" that actively represents their career 24/7. Tagline: "Don't Just Send a Resume. Deploy an Agent."

## Tech Stack
- React 18 + TypeScript + Vite (frontend)
- Express.js + TypeScript (backend)
- PostgreSQL + Drizzle ORM (database)
- Shadcn/Radix UI + Tailwind CSS (light gray + dark green theme)
- Wouter (routing)
- Framer Motion (animations)
- Google Gemini AI via Replit AI Integrations (content processing + chatbot)
- Fuse.js (fuzzy search for chatbot knowledge matching)
- Replit Object Storage (file uploads: headshot, video, CV)

## Architecture
- Multi-tenant: one app serves all customers
- All portfolio data in central PostgreSQL database
- AI processing via Gemini (generates knowledge base from questionnaire, rewrites content for impact)
- SSE streaming for chatbot responses
- Session-based auth with bcrypt password hashing
- Object Storage for file uploads (authenticated upload, public serving)
- Three portfolio branding themes: Corporate, Tech, Creative
- Payment system in test mode (Stripe code backed up in stripe-backup/ for future activation)
- Test mode bypass allows testers to publish without payment via POST /api/test-publish
- Published portfolios generate subdomains as username.myproxy.work

## Branding
- Color: Dark green primary (hsl 152, 60%, 30%) on light gray background
- Font: Open Sans
- Logo: Terminal icon from lucide-react
- Tagline: "Don't Just Send a Resume. Deploy an Agent."

## Key Routes
### Public
- `/` - Landing page with hero, CTAs
- `/login` - Email/password login
- `/register` - Sign up
- `/portfolio/:username` - Published AI portfolio with themed layout

### Customer (authenticated)
- `/dashboard` - Customer home
- `/questionnaire` - Step 0 (optional PDF resume upload) + 12-step career form
- `/preview` - Live preview with inline editing and publish button

### Admin
- `/admin` - Customer management and stats

## API Endpoints
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `GET /api/profile` - Get user's twin profile
- `PATCH /api/profile` - Edit profile fields (displayName, roleTitle, positioning, persona, tone, achievements)
- `POST /api/profile/publish` - Publish portfolio
- `POST /api/test-publish` - Test mode: publish with tier selection, no payment required
- `POST /api/parse-resume` - Upload PDF resume for AI extraction (authenticated, multer)
- `POST /api/questionnaire/save` - Save questionnaire progress
- `POST /api/questionnaire/submit` - Submit for AI processing
- `GET /api/portfolio/:username` - Public portfolio data (includes brandingTheme, videoUrl, cvResumeUrl)
- `POST /api/chat/:username` - Chat with digital twin (SSE streaming)
- `GET /api/admin/overview` - Admin dashboard data
- `POST /api/upload/request-url` - Request presigned upload URL (authenticated)
- `GET /objects/*` - Serve uploaded objects publicly

## Database Schema
- `customers` - User accounts with auth
- `twin_profiles` - Profile data and AI-processed content (includes brandingTheme, videoUrl, cvResumeUrl columns)
- `fact_banks` - Career history facts per company
- `knowledge_entries` - AI-generated knowledge base entries
- `chat_usage` - Token tracking per customer
- `payments` - Payment records

## Portfolio Themes
- **Corporate**: Deep navy bg (#0A1128), gold accents (#C9A961), serif headings, formal style
- **Tech**: Black bg, blue/cyan neon accents, Space Grotesk font, system style
- **Creative**: Warm off-black (#18181B), sage green accents (#8BA888), refined serif headings, minimal style
- All themes: No section labels (SECTION I/MODULE_01 removed), clean headings only

## Portfolio Sections
1. Hero (video/avatar, name, title, positioning, contact buttons)
2. Embedded Chatbot (full inline chat, main feature)
3. Impact Metrics (quantified achievements with icons, ALL CAPS labels, comparison context)
4. Where I'm Most Useful (scenario-based positioning cards with icons and intro text)
5. How I Work / Operating Model (4-step methodology with subtitle)
6. Career Trajectory (grouped by company with role progression, collapsible achievements)
7. Skill Matrix (10-14 grouped categories with EXPERT/ADVANCED proficiency badges, icons, descriptions) + individual skill tags row below
8. Footer (Powered by Proxy)

## AI Processing Quality
- Three parallel Gemini calls: main portfolio, skills matrix, positioning scenarios
- Strategic positioning mindset (not resume listing)
- Skills grouped by category with proficiency levels and evidence-based descriptions
- "Where I'm Most Useful" uses scenario-based buyer pain points with icons
- Impact metrics include comparison context (e.g., "vs 18% industry average")
- Career timeline groups roles by company to show progression
- NA/N/A/None values filtered from all achievement lists
- Double bullets stripped from achievement formatting
- User's suggested questions from Step 11 override AI-generated ones
- Chatbot responds conversationally (no markdown, no section headers like Challenge/Approach/Result)

## File Upload Flow
- Two-step presigned URL pattern: request URL with metadata (authenticated), then direct upload to GCS
- Files served publicly at /objects/* path
- Questionnaire step 10 has upload fields for headshot, intro video, CV/resume

## AI Processing
- Three parallel Gemini calls generate portfolio data, skills matrix, and positioning scenarios
- Gemini rewrites war stories as narratives for maximum impact
- Achievements rewritten with quantified metrics, NA/empty values filtered
- Skills analyzed and grouped into 4-8 categories with proficiency levels
- "Where I'm Most Useful" scenarios created from buyer pain point perspective
- Generates knowledge base entries from questionnaire data
- Builds chatbot persona from user's communication style and career data
- Chatbot system prompt enforces conversational tone (no markdown formatting)

## Demo Accounts
- Admin: admin@digitaltwin.studio / admin123
- Demo: sarah@example.com / demo1234
- Demo portfolio: /portfolio/demo

## User Preferences
- Light gray + dark green theme (not dark glassmorphic)
- Open Sans font
- "Agent" metaphor: portfolios that work for you 24/7
- Three branding themes for portfolios (Corporate/Tech/Creative)

## Stripe Backup
- Stripe code saved in stripe-backup/ directory for future restoration
- Files: stripeClient.ts, webhookHandlers.ts, seed-stripe-products.ts, index.ts.bak, routes.ts.bak
- To restore: copy files back and reinstall stripe + stripe-replit-sync packages
