# AI Lead Verification & Appointment Automation CRM - PRD

## Project Overview
A Multi-Tenant SaaS CRM Platform that automates lead capture, verification, qualification, and appointment booking using AI.

## Architecture
- **Frontend**: React (CRA + CRACO), TailwindCSS, Recharts, Lucide icons
- **Backend**: FastAPI (Python), MongoDB (Motor async)
- **Auth**: JWT + httpOnly cookies, bcrypt password hashing, brute force protection
- **AI**: OpenAI GPT-4o-mini via Emergent LLM Key (emergentintegrations)
- **Billing**: Stripe (emergentintegrations) - test mode
- **SMS**: Twilio (demo mode - any OTP accepted without real credentials)
- **Email**: Resend (transactional verification emails — `RESEND_API_KEY` configured; sender `onboarding@resend.dev`)
- **Design**: Light/Clean, white+blue palette, Outfit+Plus Jakarta Sans fonts

## User Roles
1. **Super Admin** - manages all businesses, platform analytics
2. **Business Owner** - manages their CRM, leads, appointments, chatbot

## Database Collections (MongoDB)
- users, businesses, leads, conversations, appointments, notifications, payment_transactions, login_attempts, password_reset_tokens

## What's Been Implemented (2026-05-31)

### Authentication
- [x] JWT login/logout with httpOnly cookies
- [x] Business owner registration with auto-business creation
- [x] **Email verification flow via Resend (2026-05-31)** — business owners must verify email before sign-in
  - `POST /api/auth/verify-email` (token-based, 24h expiry)
  - `POST /api/auth/resend-verification` (idempotent, prevents enumeration)
  - Frontend pages: `/verify-email`, `/verify-email-sent`
  - Login blocks unverified accounts with 403 + "Resend verification email" UI on login page
  - Super admin auto-marked verified on seed
- [x] Super admin seeded on startup
- [x] Brute force protection (5 attempts, 15min lockout)
- [x] **Password reset flow with Resend email (2026-05-31)** — `/forgot-password` and `/reset-password` pages, 1-hour token, idempotent, single-use, no email enumeration

### Super Admin Module
- [x] Platform dashboard with analytics
- [x] Business CRUD (create, edit, suspend, delete)
- [x] View all leads across all businesses
- [x] Platform analytics with charts

### Business Owner Module
- [x] CRM Dashboard with lead/appointment stats + charts
- [x] Lead Management (CRUD, status tracking, search/filter)
- [x] Lead Verification (SMS OTP via Twilio - demo mode)
- [x] Conversations Center (AI chat history viewer)
- [x] Appointment Management (CRUD, status tracking)
- [x] Analytics with recharts (pie, bar, area charts)
- [x] AI Chatbot Settings + Live Preview (OpenAI GPT-4o-mini)
- [x] Business Settings (profile, working hours)
- [x] Billing with Stripe plans (Starter $49, Growth $99, Pro $199, Enterprise $499)
- [x] Integrations (Twilio, WhatsApp, Calendly, API key, Webhook URL)

### API Endpoints
- POST /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/me
- GET/POST/PUT/DELETE /api/leads/
- GET/POST/PUT/DELETE /api/appointments/
- GET/DELETE /api/conversations/
- GET /api/analytics/
- POST /api/chatbot/{business_id}/message, /lead
- GET/POST /api/billing/plans, /checkout, /subscription, /transactions
- GET/PUT /api/settings/, /ai, /working-hours
- GET/PUT /api/integrations/, /regenerate-api-key
- GET/PUT /api/notifications/
- GET/POST/PUT/DELETE /api/admin/businesses, /leads, /appointments, /analytics

## Test Credentials
- Super Admin: admin@leadverify.ai / Admin@12345
- Business Owner: Register at /register

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] Twilio credentials integration (real SMS OTP)
- [ ] Email notifications (Resend)
- [ ] WhatsApp Business API integration

### P1 (Important)
- [ ] Chatbot widget.js (embeddable on external websites)
- [ ] Facebook/Google Lead Ads webhook support
- [ ] Calendly/Google Calendar integration
- [ ] Mobile responsive sidebar

### P2 (Nice to have)
- [ ] Audit logs
- [ ] Team invitations
- [ ] Export leads to CSV
- [ ] AI voice verification
