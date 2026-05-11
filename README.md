# LegacyCapsule
### Every Event. Preserved.
**VALNEX, UNIPESSOAL LDA · RevoWorldTech**

---

LegacyCapsule is a premium digital platform that captures every voice, tribute, and moment of a significant life event — and preserves them in one beautifully produced digital Capsule. Organisers share a link. Guests contribute from anywhere in the world. Everything is compiled into a structured commemorative record that lasts forever.

**Domain:** itslegacycapsule.com  
**Status:** Phase 1 — 85% complete. Pre-deployment.

---

## Supported Event Types

Retirement · Wedding · Memorial & Funeral · Milestone Birthday · Anniversary · Graduation · Ordination · Chieftaincy Ceremony · Award Ceremony · Thanksgiving Service · Conference · Other

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL + RLS) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Components | Shadcn/UI |
| Email | Resend |
| Payments | Stripe (Phase 1.5) · Paystack (Phase 2) · Flutterwave (Phase 2) |
| Deployment | Vercel (GitHub auto-deploy) |
| DNS | Cloudflare |
| Dev environment | VS Code + Claude extension · PowerShell on Windows |

---

## Project Structure

```
legacycapsule/
├── app/                        # Next.js App Router pages and API routes
│   ├── page.tsx                # Homepage — animated world map hero
│   ├── layout.tsx              # Root layout — Navigation + Footer wrappers
│   ├── globals.css             # Design system tokens + Tailwind
│   ├── book/                   # Booking flow (4-screen multi-step)
│   ├── capsule/[slug]/         # Tribute wall — public capsule page
│   ├── admin/                  # LCAdmin console (pricing, flags, moderation)
│   ├── for-you/                # Audience page — personal organisers
│   ├── for-planners/           # Audience page — event professionals
│   ├── start-planning/         # Audience page — new planners
│   ├── gift/                   # Gift a Capsule page
│   ├── resellers/              # Reseller programme page
│   ├── examples/               # Live examples gallery
│   ├── pricing/                # Pricing page
│   └── about/                  # About page
│
├── components/
│   ├── LogoCapsule.tsx         # SVG capsule logo — single source of truth
│   ├── AnimatedWorldMap.tsx    # Animated SVG world map component
│   └── layout/
│       ├── Navigation.tsx      # Main navigation bar
│       ├── Footer.tsx          # Site footer
│       ├── NavigationWrapper.tsx  # Conditionally renders nav
│       └── FooterWrapper.tsx      # Conditionally renders footer
│
├── lib/
│   ├── mapCities.ts            # 59 world cities across 9 animation stages
│   ├── email.ts                # Resend email functions
│   ├── verification.ts         # Token generation and verification
│   ├── supabase.ts             # Supabase client
│   └── utils.ts                # Shared utilities
│
├── public/
│   └── world-map-simple.svg    # World map SVG (simplemaps.com)
│
├── CURRENT_STATE.md            # Exact build state — read first every session
├── AGENTS.md                   # Claude behaviour rules — read second
└── README.md                   # This file
```

---

## Getting Started

### Prerequisites
- Node.js (LTS)
- npm (not yarn or pnpm)
- Supabase project with full schema deployed
- Resend account with itslegacycapsule.com domain (pending verification)

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000

# Production build check (run before every commit)
npm run build
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values. Every variable must also be added to Vercel project settings for production.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # → https://itslegacycapsule.com on Vercel

# Admin
NEXT_PUBLIC_ADMIN_PASSWORD=
LCADMIN_PASSWORD=
LCADMIN_SESSION_SECRET=

# Stripe (add when account created)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Design System

All design tokens are defined in `app/globals.css` and used across marketing pages via CSS custom properties. The tribute wall and admin pages use Tailwind dark theme directly. Both systems coexist without conflict.

### Brand Colours
| Token | Value | Use |
|---|---|---|
| `--lc-purple` | `#2D1B69` | Primary brand purple |
| `--lc-purple-deep` | `#0D0820` | Deepest backgrounds |
| `--lc-gold` | `#B8960C` | Primary brand gold |
| `--lc-gold-light` | `#D4AE2A` | Hover states, highlights |
| `--lc-ivory` | `#F5F3EE` | Light section backgrounds |

### Typography
| Token | Font | Use |
|---|---|---|
| `--font-display` | Cormorant Garamond | Hero headlines, italic sublines |
| `--font-heading` | Playfair Display | Section headings |
| `--font-body` | DM Sans | Body text, labels, buttons |
| `--font-accent` | Cormorant SC | Small caps labels |

### Logo
The `LogoCapsule` component (`components/LogoCapsule.tsx`) is the single source of truth for the brand logo. It renders as an SVG capsule shape — purple left half with "LEGACY" in gold, gold right half with "CAPSULE" in purple. Any logo changes are made in this file only.

```tsx
<LogoCapsule size="sm" />   // Navigation bar (148×38)
<LogoCapsule size="md" />   // Booking flow (188×50)
<LogoCapsule size="lg" />   // Large display (248×66)
<LogoCapsule size="xl" />   // Hero / print (330×90)
```

---

## Key Components

### AnimatedWorldMap
SVG-based world map with gold city pins lighting up from Lisbon outward across 9 stages. Used in the homepage hero.

```tsx
<AnimatedWorldMap
  mode="hero"           // "hero" (480px) | "idle" (100vh, for live event streaming)
  showOverlay={false}   // false = pure background map. true = adds tagline overlay.
  className="w-full"
/>
```

### Navigation
Transparent on load, solid purple on scroll. Quick access bar appears after 1.5× viewport scroll. Never import Navigation directly in page files — it is handled by `NavigationWrapper` in `app/layout.tsx`.

### Booking Flow
Four-screen multi-step flow in `app/book/page.tsx`.

| Screen | Purpose |
|---|---|
| 1 | Visitor path — Personal Organiser / Event Professional / Gift a Capsule |
| 2 | Event type — 11 options as visual cards |
| 3 | Package selection — prices read from Supabase `lc_pricing` table |
| 4 | Capsule details — form, live URL preview, summary, create |

---

## Database

Full schema is managed in Supabase. The complete column-level specification lives in **MVP Build Guide v2.0 Section 2.3** in the project documents folder.

### Critical notes
- `contributions.contributor_name` — column was renamed from `name`. Always use `contributor_name` in all queries and inserts.
- `lc_pricing` — all prices live here. Never hardcode a price anywhere in the codebase.
- `lc_feature_flags` — feature toggles managed from LCAdmin. Read on page load where relevant.
- RLS is enabled on all tables with permissive open policies for Phase 1. These are replaced with auth-based policies in Phase 2.

---

## Admin Console

Located at `/admin`. Password protected.

| Route | Purpose |
|---|---|
| `/admin` | Hub — links to all admin sections |
| `/admin/pricing` | Edit all prices — writes to `lc_pricing` table |
| `/admin/flags` | Toggle feature flags — writes to `lc_feature_flags` table |
| `/admin/dashboard/[slug]` | Per-capsule moderation queue (to be built out) |

---

## Payments

Architecture is unified through a single `PaymentService` class. The booking flow calls `PaymentService` — never a processor directly. Regional routing is automatic based on country code.

| Region | Processor | Currency | Phase |
|---|---|---|---|
| EU (incl. Portugal) | Stripe | EUR | 1.5 |
| UK | Stripe | GBP | 1.5 |
| US / Canada | Stripe | USD / CAD | 1.5 |
| Rest of World | Stripe | EUR | 1.5 |
| Nigeria / Ghana / Kenya | Paystack | NGN / GHS / KES | 2 |
| Cross-border Africa | Flutterwave | Multi | 2 |

All revenue settles to Valnex LDA Portuguese bank account regardless of processor.

**Important:** The Start Your Capsule CTA must not connect to a live payment flow until Stripe is fully tested on the production URL. A non-functional booking flow damages credibility.

---

## Build Phases

| Phase | Name | Status |
|---|---|---|
| **1** | MVP — Tribute Page | 85% complete |
| **1.5** | Stripe Payment Integration | Not started |
| **2** | Platform Expansion + Coordinate Pillar | Not started |
| **3** | Six Engagement Experiences | DB tables already built |
| **4** | Publication Engine | Not started |
| **5** | Globe Upgrade (d3.js + globe.gl) | Not started |
| **6** | Communiva Integration | Not started |

Phase graduation criteria and full scope per phase are documented in **Master Build Plan v1.0** and **Master Document v3.0**.

---

## Project Documents

All authoritative documents are in the project folder. Read the relevant document before making decisions in its domain.

| Document | Governs |
|---|---|
| `LegacyCapsule_Master_Build_Plan_v1_0.docx` | Build sequence, phase order, current state register |
| `LegacyCapsule_Master_Document_v3_0.docx` | Full product specification — all features and rules |
| `LegacyCapsule_MVP_Build_Guide_v2_0.docx` | Full schema, tier engine, RLS, email, deployment |
| `LCAdmin_Build_Guide_v1_0.docx` | Admin console, pricing, feature flags, audit log |
| `Payment_Integration_Guide_v1_0.docx` | Stripe, Paystack, Flutterwave, regional routing |
| `LegacyCapsule_AnimatedWorldMap_Build_Guide_v1_0.docx` | World map component, city data, upgrade path |
| `LegacyCapsule_Six_Engagement_Experiences.docx` | 6 automated emotional touchpoints — Phase 3 |
| `LegacyCapsule_Publication_Engine_Build_Guide.docx` | PDF publication editor and generator — Phase 4 |
| `RevoWorldTech_EcoControl_Spec_v1.docx` | Reseller engine, regional pricing multipliers |
| `LegacyCapsule_BuildHandoff_10May2026.docx` | All deviations from original specs — deviation register |

---

## Deployment

**Platform:** Vercel (connected to GitHub — auto-deploys on push to main)  
**DNS:** Cloudflare — set Vercel records to DNS only (not proxied)  
**Email:** Resend — domain itslegacycapsule.com pending verification

### Pre-deploy checklist
- [ ] `npm run build` returns zero errors
- [ ] `app/test-map/` directory deleted
- [ ] All env vars added to Vercel project settings
- [ ] `NEXT_PUBLIC_APP_URL` set to `https://itslegacycapsule.com` in Vercel
- [ ] Resend domain shows Verified in Resend dashboard
- [ ] Full end-to-end test on production URL before sharing with any real user

---

## Ecosystem Context

LegacyCapsule is the flagship app of a wider digital ecosystem being built by RevoWorldTech. All architectural decisions must account for future integration.

```
Valnex (holding company)
└── RevoWorldTech (digital app arm)
    ├── LegacyCapsule    ← this project (flagship)
    ├── Communiva        ← community management hub (planned)
    │   ├── LegacyCapsule as module
    │   ├── SMSProvince as module
    │   └── CDLS as module
    ├── SMSProvince      ← bulk SMS (planned)
    ├── CDLS             ← digital library (planned)
    └── RevoRent         ← property management (planned)
```

---

## Working with Claude

This project is built with Claude as the primary planning and coding assistant.

- **Claude chat (claude.ai):** Planning, architecture, writing complete file content
- **Claude Code (VS Code extension):** Execution — applying changes, running commands, reporting output

Both must read `CURRENT_STATE.md` and `AGENTS.md` at the start of every session. `AGENTS.md` contains all behaviour rules, coding constraints, and known gotchas specific to this project.

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*  
*itslegacycapsule.com · May 2026*
