# LegacyCapsule
### Events end. Legacies don't.
**VALNEX, UNIPESSOAL LDA · RevoWorldTech**

---

LegacyCapsule is a premium digital platform that captures every tribute, voice, and moment of a significant life event — and preserves them in one beautifully produced digital Capsule. Organisers share a link. Guests contribute from anywhere in the world. Everything is curated, moderated, and compiled into a permanent commemorative record.

**Domain:** itslegacycapsule.com (live on Vercel — DNS pending full propagation)  
**Status:** Phase 1 — approximately 90% complete. Core flows live. Tribute wall rebuild in progress.

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
| Email | Resend — domain verified ✅ |
| Payments | Stripe (Phase 1.5 — account pending) · Paystack (Phase 2) · Flutterwave (Phase 2) |
| Deployment | Vercel (GitHub auto-deploy — live) ✅ |
| DNS | Cloudflare — nameserver fix pending support response |
| Dev environment | VS Code + Claude Code extension · PowerShell on Windows |

---

## Project Structure

```
legacycapsule/
├── app/
│   ├── page.tsx                    ✅ Full premium homepage — animated world map hero
│   ├── layout.tsx                  ✅ NavigationWrapper + FooterWrapper (conditional)
│   ├── globals.css                 ✅ Full design system tokens
│   ├── book/page.tsx               ✅ 4-screen booking flow — all screens premium
│   ├── capsule/[slug]/page.tsx     🔄 Tribute wall — premium rebuild in progress
│   ├── capsule/[slug]/manage/      ✅ Organiser control panel (new)
│   ├── capsule/[slug]/submit/      ⚠️ Submission form — not yet built
│   ├── capsule/[slug]/profile/     ⚠️ Honouree profile page — not yet built
│   ├── admin/page.tsx              ✅ LCAdmin hub
│   ├── admin/pricing/page.tsx      ✅ Reads from lc_pricing
│   ├── admin/flags/page.tsx        ✅ Feature flags management
│   ├── api/email/verify-organiser/ ✅ Sends verification + welcome email
│   ├── api/email/approval/         ✅ Sends approval notification
│   ├── api/verify/route.ts         ✅ Token verification — sets page_state to active
│   ├── api/geocode/route.ts        ✅
│   ├── for-you/                    ✅ Audience page
│   ├── for-planners/               ✅ Audience page
│   ├── start-planning/             ✅ Audience page
│   ├── gift/                       ✅ Gift a Capsule page
│   ├── resellers/                  ✅ Resellers page
│   ├── examples/                   ⚠️ Needs real demo capsule slugs
│   ├── pricing/                    ⚠️ Confirm reads from Supabase not hardcoded
│   └── about/                      ⚠️ Placeholder copy — needs real narrative
│
├── components/
│   ├── LogoCapsule.tsx             ✅ SVG capsule logo — SINGLE SOURCE OF TRUTH
│   ├── AnimatedWorldMap.tsx        ✅ Animated SVG world map
│   ├── TributeMap.tsx              ✅ Leaflet map — gold pins, dark tiles (new)
│   └── layout/
│       ├── Navigation.tsx          ✅
│       ├── Footer.tsx              ✅
│       ├── NavigationWrapper.tsx   ✅
│       └── FooterWrapper.tsx       ✅
│
├── lib/
│   ├── mapCities.ts                ✅ 59 cities, 9 stages, Lisbon origin
│   ├── email.ts                    ✅ FROM: noreply@itslegacycapsule.com
│   ├── verification.ts             ✅ Token generation and verification
│   ├── supabase.ts                 ✅
│   ├── eventLabels.ts              ✅ Public-facing dynamic labels (new)
│   ├── tributeWallHelpers.ts       ✅ Shared tribute wall utilities (new)
│   └── utils.ts                    ✅
│
├── public/
│   └── world-map-simple.svg        ✅
│
├── CURRENT_STATE.md                # Exact build state — read first every session
├── AGENTS.md                       # Claude behaviour rules — read second
└── README.md                       # This file
```

---

## Getting Started

### Prerequisites
- Node.js (LTS)
- npm (not yarn or pnpm)
- Supabase project with full schema deployed

### Local Development

```bash
npm install
npm run dev
# → http://localhost:3000

npm run build   # Run before every commit
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend (domain verified ✅)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # → https://itslegacycapsule.com on Vercel

# Admin
LCADMIN_PASSWORD=
LCADMIN_SESSION_SECRET=

# Stripe (add when account is ready)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Design System

All tokens in `app/globals.css`. Marketing pages use CSS custom properties. Tribute wall and admin use Tailwind directly. Both coexist.

### Brand Colours
| Token | Value | Use |
|---|---|---|
| `--lc-purple` | `#2D1B69` | Primary brand purple |
| `--lc-purple-deep` | `#0D0820` | Deepest backgrounds |
| `--lc-gold` | `#B8960C` | Primary brand gold |
| `--lc-gold-light` | `#D4AE2A` | Hover, highlights |
| `--lc-ivory` | `#F5F3EE` | Light section backgrounds |

### Typography
| Token | Font | Use |
|---|---|---|
| `--font-display` | Cormorant Garamond | Hero headlines |
| `--font-heading` | Playfair Display | Section headings |
| `--font-body` | DM Sans | Body text, labels, buttons |
| `--font-accent` | Cormorant SC | Small caps labels |

### Logo
`LogoCapsule.tsx` is the single source of truth. Never create alternatives.

```tsx
<LogoCapsule size="sm" />   // Navigation (148×38)
<LogoCapsule size="md" />   // Booking flow (188×50)
<LogoCapsule size="lg" />   // Large display (248×66)
<LogoCapsule size="xl" />   // Hero/print (330×90)
```

---

## Key Rules

**"Honouree" is internal language only.** Never use it in public-facing UI, emails, or page copy. All public references use the subject's actual name or an event-type-appropriate phrase generated by `lib/eventLabels.ts`.

**Never hardcode prices.** All prices read from `lc_pricing` Supabase table.

**`contributions.contributor_name`** — was `name`, renamed. Always use `contributor_name`.

**Moderation is the organiser's responsibility** via `/capsule/[slug]/manage`. LCAdmin is platform-level only — not per-capsule moderation.

---

## Booking Flow

Four-screen premium dark gradient flow in `app/book/page.tsx`.

| Screen | Purpose | State |
|---|---|---|
| 1 | Visitor type — Personal / Professional / Gift | ✅ Premium |
| 2 | Event type — 12 options as visual cards | ✅ Premium |
| 3 | Package — Free / Legacy Honour (€50) / Legacy Premier (€80) | ✅ Premium |
| 4 | Capsule details — name, tag, email, slug, summary | ✅ Premium |
| 5 | Confirmation — capsule live, share link | ✅ Premium |

---

## Capsule Lifecycle

```
Created → pending_verification
Organiser clicks verify link → active
Contributor submits tribute → pending_review
Organiser approves via /manage → approved → appears on wall
```

---

## Email Flow

| Email | Trigger | Recipient |
|---|---|---|
| Organiser verification + welcome | Capsule creation | Organiser |
| Submission confirmation + edit link | Tribute submitted (if email given) | Contributor |
| Keepsake Card | Tribute approved | Contributor |
| Collective Belonging | Publication distributed | All contributors |
| Anniversary | 1 year after event date | All contributors |

---

## LCAdmin Console

Located at `/admin`. Password protected (server-side — LCADMIN_PASSWORD env var).

| Route | Purpose |
|---|---|
| `/admin` | Hub |
| `/admin/pricing` | Edit all prices → lc_pricing |
| `/admin/flags` | Toggle feature flags → lc_feature_flags |

**LCAdmin is platform-level only.** Per-capsule moderation is done by the organiser at `/capsule/[slug]/manage`.

---

## Database — Key Tables

| Table | Purpose |
|---|---|
| `capsules` | Core capsule records |
| `contributions` | Tribute submissions — use `contributor_name` not `name` |
| `lc_pricing` | All prices — never hardcode |
| `lc_feature_flags` | Feature toggles |
| `lc_content` | Admin-editable UI content strings (tier names, features, copy) |
| `lc_pricing_zones` | Regional pricing multipliers per zone |
| `email_verifications` | Organiser + contributor tokens |
| `capsule_profile_sections` | Honouree profile content sections |
| `capsule_featured_photos` | Primary photos album |
| `capsule_gallery` | Secondary photos |
| `honouree_portal_tokens` | Honouree private view access |
| `capsule_support_accounts` | "Ways to Honour" payment details |
| `support_acknowledgements` | Guest gift acknowledgements |
| `honouree_email_templates` | Honouree thank-you email templates |
| `honouree_broadcasts` | Honouree broadcast messages |

---

## Payments

Architecture unified through `PaymentService`. Regional routing automatic.

| Region | Processor | Currency | Phase |
|---|---|---|---|
| EU / UK / US / ROW | Stripe | EUR/GBP/USD | 1.5 |
| Nigeria / Ghana / Kenya | Paystack | NGN/GHS/KES | 2 |
| Cross-border Africa | Flutterwave | Multi | 2 |

All revenue settles to Valnex LDA Portuguese bank account.

---

## Build Phases

| Phase | Name | Status |
|---|---|---|
| **1** | Core platform — tribute flow | ~90% complete |
| **1.5** | Stripe payment integration | Next — Stripe account pending |
| **2** | Platform expansion + Coordinate pillar | Not started |
| **3** | Six Engagement Experiences | DB tables built — code pending |
| **4** | Publication Engine | Not started |
| **5** | Globe upgrade (globe.gl) | Not started |
| **6** | Communiva integration | Not started |

---

## Ecosystem

```
Valnex (holding company — Portugal)
└── RevoWorldTech (digital app arm)
    ├── LegacyCapsule    ← this project (flagship)
    ├── Communiva        ← community hub (planned)
    ├── SMSProvince      ← bulk SMS (planned)
    ├── CDLS             ← digital library (planned)
    └── RevoRent         ← property management (planned)
```

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*  
*itslegacycapsule.com · May 2026*
