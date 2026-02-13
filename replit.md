# BIOS.ai

## Overview
A SaaS platform ("BIOS.ai") that lets professionals create AI-powered interactive portfolio websites with a chatbot "Digital Twin" that actively represents their career 24/7. Tagline: "Don't Just Send a Resume. Deploy an Agent."

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
- Three portfolio branding themes: Executive, Futurist, Minimalist

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
- `/questionnaire` - 12-step career form
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
- **Corporate**: Deep navy bg (#0A1128), gold accents (#C9A961), serif headings (Playfair Display), SECTION I/II/III labels, formal style
- **Tech**: Black bg, blue/cyan neon accents, Space Grotesk font, MODULE_01/02/03 labels, system status indicators
- **Creative**: Warm off-black (#18181B), sage green accents (#8BA888), refined serif headings, no section labels, minimal style

## Portfolio Sections
1. Hero (video/avatar, name, title, positioning, contact buttons)
2. Impact Metrics (achievements as metric cards)
3. Skill Matrix (technical skills as badge grid)
4. Career Timeline (vertical timeline of career history)
5. Signature Stories (expandable CAR format cards)
6. Embedded Chatbot (full inline chat, main feature)
7. Footer (Powered by BIOS.ai)
Plus floating chat FAB for mobile

## File Upload Flow
- Two-step presigned URL pattern: request URL with metadata (authenticated), then direct upload to GCS
- Files served publicly at /objects/* path
- Questionnaire step 10 has upload fields for headshot, intro video, CV/resume

## AI Processing
- Gemini rewrites war stories in CAR format (Challenge, Action, Result) for maximum impact
- Achievements rewritten with quantified metrics
- Generates knowledge base entries from questionnaire data
- Builds chatbot persona from user's communication style and career data

## Demo Accounts
- Admin: admin@digitaltwin.studio / admin123
- Demo: sarah@example.com / demo1234
- Demo portfolio: /portfolio/demo

## User Preferences
- Light gray + dark green theme (not dark glassmorphic)
- Open Sans font
- "Agent" metaphor: portfolios that work for you 24/7
- Three branding themes for portfolios (Corporate/Tech/Creative)
