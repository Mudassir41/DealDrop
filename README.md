# DealDrop — Hyperlocal Flash Sale Platform

**Hackathon Theme:** RetailTech  
**Project:** DealDrop  
**Repository:** `Mudassir41/DealDrop`  
**Live Demo:** https://dealdropautonauts.vercel.app/  
**Video Demo:** https://drive.google.com/drive/folders/1gwWl3fW3o-guLm5Lu45t79YgmEumfz6K

---

## Problem Statement

Local stores often struggle to clear inventory quickly, while nearby shoppers miss short-lived discounts due to poor visibility and fragmented discovery. Existing deal platforms are typically broad, slow-moving, or not truly hyperlocal in real time.

**Need:** A platform that enables **location-aware, time-sensitive flash deals** with a smooth claim-and-redemption flow for both customers and retailers.

---

## Our Solution

**DealDrop** is a hyperlocal flash-sale web platform that connects users with nearby limited-time offers and provides merchants with fast customer conversion tools.

### Core Features

- **Hyperlocal deal discovery**
  - Distance-aware listing of nearby stores/deals
  - Expanded practical radius for real city coverage

- **Flash deal urgency UX**
  - Urgency pulse indicators
  - Time remaining display
  - Live viewer counters
  - Verified badges and distance tags

- **Claim + Redemption pipeline**
  - Claim API returns **real 6-digit OTP**
  - OTP persisted in claims flow (with fallback handling)
  - Retailer-side OTP scan/verification support

- **Deal detail experience**
  - QR + OTP display in claim flow
  - Star rating support
  - Directions button
  - Message Store action

- **Product robustness improvements**
  - Push notification prompt
  - Loading skeletons
  - Bottom navigation with map toggle
  - Profile + notifications API routes
  - Onboarding sync to Supabase for logged-in users
  - Customer schema improvements (`user_id` linkage)

---

## Innovation (Hackathon Criterion 1)

- Real-time, **hyperlocal urgency-driven retail conversion**
- End-to-end claim-to-redemption loop using OTP validation
- Practical UX blending map/list navigation, trust indicators, and fast actions

---

## Technical Implementation (Hackathon Criterion 2)

### Stack

- **TypeScript** (primary)
- Next.js / React (frontend + API routes)
- Supabase (data/auth persistence)
- Vercel (deployment)

### Engineering Focus

- Restored stable baseline first, then layered only verified improvements
- Preserved robust UI paths (deal cards, modal actions, nav, loading states)
- Added/retained API endpoints for profile and notifications
- Improved claim/redeem reliability via OTP flow and fallback handling
- Kept modifications minimal to avoid regressions under hackathon timelines

---

## Feasibility (Hackathon Criterion 3)

- Suitable for real-world local commerce events and inventory bursts
- Scalable by city/zone via radius and indexing strategies
- Designed for low-friction judge/user access through web deployment
- Clear scope for future growth:
  - Merchant dashboard analytics
  - Personalized ranking/recommendations
  - Abuse/fraud controls
  - Richer notification and campaign automation

---

## Video Presentation (Hackathon Criterion 4)

Demo video link (includes problem explanation, solution walkthrough, and key features):  
**https://drive.google.com/drive/folders/1gwWl3fW3o-guLm5Lu45t79YgmEumfz6K**

---

## Deployment / Hosting (Hackathon Criterion 5)

- Public deployment: **https://dealdropautonauts.vercel.app/**
- Accessible without local setup for judges
- Submission includes hosted app + code + demo video

---

## Setup Instructions

> Prerequisites: Node.js (LTS), npm/pnpm, and required environment variables.

### 1) Clone repository

```bash
git clone https://github.com/Mudassir41/DealDrop.git
cd DealDrop
```

### 2) Install dependencies

```bash
npm install
# or
pnpm install
```

### 3) Configure environment variables

Create a `.env.local` file in project root (values from your Supabase/Vercel project):

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
# add other project-specific vars if used
```

### 4) Run locally

```bash
npm run dev
# or
pnpm dev
```

Open `http://localhost:3000`.

### 5) Production build (optional check)

```bash
npm run build && npm start
# or
pnpm build && pnpm start
```

---

## Submission & Eligibility Note

As per hackathon rules, submission includes:
- Source code repository
- Public hosted deployment
- Video demonstration

---

