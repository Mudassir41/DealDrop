# DealDrop ⚡ — Hyperlocal Flash Sale Platform

**Hackathon:** Vashisht Hackathon 3.0 · IIITDM Kancheepuram · RetailTech Track  
**Live Demo:** https://dealdropautonauts.vercel.app/  
**Video Demo:** https://drive.google.com/drive/folders/1gwWl3fW3o-guLm5Lu45t79YgmEumfz6K  
**Repository:** https://github.com/Mudassir41/DealDrop

---

## 📌 Problem Statement

Local retailers lose revenue on overstocked or near-expiry inventory — while nearby customers remain completely unaware of the deals right around the corner. Existing platforms are broad, slow, and never truly hyperlocal.

**The gap:** No real-time, location-based channel that connects a kirana store's "50% off bread — 30 units, 1 hour only" directly to the 200 people within walking distance who would buy it instantly.

---

## 💡 Solution: DealDrop

DealDrop is a **zero-friction, hyperlocal flash-sale platform** built for Indian retail. Retailers post deals in under 60 seconds. An AI agent finds and notifies nearby customers through Telegram — no app download required.

From overstock → to sold out, in minutes.

---

## 🏗️ Technical Architecture

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + React 18 | Fast, SEO-friendly UI |
| **Backend** | Supabase (PostgreSQL) | Database, Auth, real-time |
| **AI Advisor** | Groq (llama3-70b-8192) + heuristic fallback | Timing, pricing & channel suggestions |
| **Telegram Bot** | Telegram Bot API + webhook | Push alerts, deal claiming, OTP |
| **Geospatial** | Haversine + Supabase geo queries | Distance filtering |
| **Mapping** | Leaflet.js (OpenStreetMap + Satellite) | Interactive live deal map |
| **Styling** | Tailwind CSS v3 | Responsive design system |
| **Deployment** | Vercel | Public deployment |

---

## 🚀 Key Features

### 🤖 1. Telegram AI Bot (Unique Differentiator)
A fully conversational Telegram bot that handles the entire user journey — **no app install required**.

- **/start** → Onboarding, location sharing, persona setup
- **/nearby** → Live deals within your radius, fetched from Supabase
- **/points** → Check your Drop Points gamification balance
- **/login email** → OTP-based account linking (Supabase Auth)
- **Natural language** → Powered by a Groq AI agent with 6 tool calls: `search_deals`, `get_categories`, `get_drop_points`, `register_store`, `post_deal`, `claim_deal`
- **Inline buttons** → "📍 Get Directions", "✅ Claim Deal", "🔕 Snooze 1hr" on every deal alert
- **Callback flow** → Claiming via Telegram returns a real 6-digit OTP to the customer

### 🗺️ 2. Interactive Deal Map
- Real-time deal pins on a live Leaflet map
- Toggle between **OpenStreetMap** and **Satellite view**
- Click any pin → deal popup with "View Deal" CTA
- User's current location pulsed on map
- Seeded with real retailer coordinates across **Chennai, Pondicherry, Salem, and Bangalore**

### 🧠 3. Groq-Powered AI Advisor
- Suggests optimal **sale window** (day + time) per category (e.g., bakeries → Friday 5–7 PM)
- Suggests **discount range** with rationale
- Predicts **redemption count** based on units + category + peak-day multipliers
- Full **heuristic fallback** if no API key — demo always works

### 🎟️ 4. OTP-Based Claim & Redemption Pipeline
- Customer claims deal → gets a **real 6-digit OTP**
- OTP stored in Supabase `claims` table with Telegram ID linkage
- Retailer opens `/dealer/scan` → scans customer QR or enters OTP → **verified in-store**
- Full audit trail per redemption

### 📊 5. Personalized Feed (5 Persona System)
- Buyers choose a persona on onboarding: **Hunter, Student, Parent, Worker, Homemaker**
- Feed API scores and ranks deals by persona-category affinity
- Syncs persona to Supabase for logged-in users; localStorage fallback for guests

### 🏪 6. Retailer Command Center
- Post a live deal in under 60 seconds (store name, product, discount %, units, duration, geofence radius)
- Real-time **units claimed / live viewers** dashboard
- Mark sold out, edit stock, pause a deal
- Rate platform after each successful deal
- AI chat bar for deal advice

### 🔔 7. Notifications & Profile API
- In-app notification feed (`/api/notifications`)
- User profile management (`/api/profile`) — syncs to Supabase
- Supabase-backed customer schema with `user_id` linkage for logged-in users

---

## 🔑 Demo Credentials

| Role | Action |
|---|---|
| **Customer** | Visit [live demo](https://dealdropautonauts.vercel.app/) → Click "I'm a Buyer" → onboard with any email |
| **Retailer** | Click "I'm a Retailer" → fill the deal form (no login required to post) |
| **Telegram** | Message [@dealdrop_alertbot](https://t.me/dealdrop_alertbot) → `/start` |

---

## Innovation (Hackathon Criterion 1)

- **Telegram-native(Whatsapp requires paid api), no-app-required** deal discovery — customers get push alerts where they already are
- **Conversational AI agent** in Telegram handles retail onboarding, deal search, and claiming in natural language
- **End-to-end OTP redemption loop** — the only solution with in-store QR verification
- **Groq-powered deal advisor** gives retailers data-driven timing and pricing recommendations with no manual tuning

---

## Technical Implementation (Hackathon Criterion 2)

- Supabase for persistent data, auth (OTP email), real-time deal state
- Haversine geo filtering on the API layer, seeded with real Indian city coordinates
- Groq llama3-70b tool-calling agent with sliding-window conversation memory per user
- In-memory fallback store ensures the app functions even without a Supabase connection — zero demo failures
- Supabase `claims` table with OTP uniqueness constraint and Telegram linkage
- Bot webhook registered programmatically via `/api/telegram/setup`

---

## Feasibility (Hackathon Criterion 3)

- Works today — deployed and accessible at https://dealdropautonauts.vercel.app/
- Frictionless onbaording and hook without forced login
- No app install barrier: Telegram is already on 500M+ phones
- Supabase scales horizontally; Vercel handles global edge deployment
- Clear monetization path: SaaS subscription for retailers (trial → paid tiers already in schema)
- Future roadmap: PostGIS spatial indexing, multi-language bot, WhatsApp channel, delivery integration

---

## Video Presentation (Hackathon Criterion 4)

**https://drive.google.com/drive/folders/1gwWl3fW3o-guLm5Lu45t79YgmEumfz6K**

Covers: problem walkthrough · live Telegram bot demo · deal posting · OTP claim & redemption · AI advisor output

---

## Deployment / Hosting (Hackathon Criterion 5)

**https://dealdropautonauts.vercel.app/** — publicly accessible, no local setup needed for judges.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+ · npm or pnpm
- Supabase project (free tier is fine)
- Telegram bot token (optional — app works without it via in-memory fallback)
- Groq API key (optional — heuristic advisor is the fallback)

### 1. Clone & install

```bash
git clone https://github.com/Mudassir41/DealDrop.git
cd DealDrop
npm install
```

### 2. Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

TELEGRAM_BOT_TOKEN=your_telegram_bot_token   # optional
GROQ_API_KEY=your_groq_key                   # optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database

Paste `supabase_schema.sql` into the Supabase SQL Editor and run. This creates all tables and seeds realistic deal data across Chennai, Pondicherry, Salem, and Bangalore.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

### 5. Register Telegram webhook (optional)

```bash
curl -X POST http://localhost:3000/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.vercel.app/api/telegram/webhook"}'
```

---

*Built for Vashisht Hackathon 3.0 · IIITDM Kancheepuram · RetailTech Track*

