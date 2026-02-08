# Digital Twin Studio

## Overview
A SaaS platform that lets professionals create AI-powered interactive portfolio websites (AI CVs) with a chatbot "Digital Twin" that answers questions about their career.

## Tech Stack
- React 18 + TypeScript + Vite (frontend)
- Express.js + TypeScript (backend)
- PostgreSQL + Drizzle ORM (database)
- Shadcn/Radix UI + Tailwind CSS (dark glassmorphic theme)
- Wouter (routing)
- Framer Motion (animations)
- Google Gemini AI via Replit AI Integrations (content processing + chatbot)
- Fuse.js (fuzzy search for chatbot knowledge matching)

## Architecture
- Multi-tenant: one app serves all customers
- All portfolio data in central PostgreSQL database
- AI processing via Gemini (generates knowledge base from questionnaire)
- SSE streaming for chatbot responses
- Session-based auth with bcrypt password hashing

## Key Routes
### Public
- `/` - Landing page
- `/login` - Email/password login
- `/register` - Sign up
- `/portfolio/:username` - Published AI CV

### Customer (authenticated)
- `/dashboard` - Customer home
- `/questionnaire` - Multi-step career form (6 steps)
- `/preview` - Live preview with publish button

### Admin
- `/admin` - Customer management and stats

## API Endpoints
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `GET /api/profile` - Get user's twin profile
- `POST /api/profile/publish` - Publish portfolio
- `POST /api/questionnaire/save` - Save questionnaire progress
- `POST /api/questionnaire/submit` - Submit for AI processing
- `GET /api/portfolio/:username` - Public portfolio data
- `POST /api/chat/:username` - Chat with digital twin (SSE streaming)
- `GET /api/admin/overview` - Admin dashboard data

## Database Schema
- `customers` - User accounts with auth
- `twin_profiles` - Profile data and AI-processed content
- `fact_banks` - Career history facts per company
- `knowledge_entries` - AI-generated knowledge base entries
- `chat_usage` - Token tracking per customer
- `payments` - Payment records

## Demo Accounts
- Admin: admin@digitaltwin.studio / admin123
- Demo: sarah@example.com / demo1234
- Demo portfolio: /portfolio/demo

## User Preferences
- Dark glassmorphic theme with indigo/violet accents
- Glass-morphism effects with backdrop-blur
