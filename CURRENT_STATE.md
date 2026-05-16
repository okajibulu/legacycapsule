# CURRENT_STATE.md
## LegacyCapsule — Live Build State
**Date:** 16 May 2026
**Read this file first before any planning or build work.**

---

## 1. PROJECT IDENTITY

| Field | Value |
|---|---|
| Legal entity | VALNEX, UNIPESSOAL LDA — Portugal |
| Trading name | RevoWorldTech |
| Flagship app | LegacyCapsule |
| Brand line | "Events end. Legacies don't." |
| Domain | itslegacycapsule.com |
| DNS | Cloudflare — nameserver fix pending support response |
| Vercel | Live — okajibulu-legacycapsule-git-main-okajibulus-projects.vercel.app |
| GitHub | okajibulu/legacycapsule — auto-deploys to Vercel on push to main |
| Supabase | zclmllbfuekyeshiihgt.supabase.co |
| Email | noreply@itslegacycapsule.com via Resend — VERIFIED |
| Stack | Next.js 16.2.6 · TypeScript · Supabase · Tailwind CSS v4 · Vercel |
| Package manager | npm only |

---

## 2. ECOSYSTEM

```
Valnex (holding company — Portugal)
└── RevoWorldTech (digital app arm)
    ├── LegacyCapsule    ← this project (flagship, in build)
    ├── Communiva        ← community hub (planned)
    ├── SMSProvince      ← bulk SMS (planned — Phase 2 integration)
    ├── CDLS             ← digital library (planned)
    └── RevoRent         ← property management (planned)
```

LegacyCapsule must be designed to operate as a Communiva module in future.

---

## 3. ROUTE STRUCTURE — AUTHORITATIVE MAP

Every AI session must use these paths. No exceptions.

### Public routes:
```
/                              Homepage
/for/[slug]                    Public tribute wall
/for/[slug]/submit             Tribute submission form
/for/[slug]/edit/[token]       Contributor edit (token-gated)
/for/[slug]/profile            Subject profile page (not yet built)
/book                          Booking flow
/pricing                       Pricing page
/for-you                       Audience page
/for-planners                  Audience page
/start-planning                Audience page
/gift                          Gift a Capsule
/resellers                     Resellers page
/examples                      Examples gallery
/about                         About page
```

### Organiser routes (private):
```
/manage/[slug]                 Organiser control panel
/manage/[slug]/publication     Publication editor (Phase 4)
```

### Admin routes:
```
/admin/login                   Admin login
/admin/dashboard               Dashboard
/admin/capsule                 Capsule list
/admin/capsule/[id]            Individual capsule
/admin/clients                 Client accounts
/admin/transactions            Payment records
/admin/moderation              Platform moderation
/admin/resellers               Reseller management
/admin/content                 lc_content editor
/admin/pricing                 lc_pricing editor
/admin/pricing-zones           lc_pricing_zones editor
/admin/flags                   Feature flags
```

### API routes:
```
/api/verify                    Token verification
/api/geocode                   Geocoding
/api/checkout                  Stripe checkout creation
/api/webhooks/stripe           Stripe webhook
/api/publication/init          Initialise publication
/api/publication/save          Autosave layout
/api/publication/generate      PDF pipeline (Puppeteer)
/api/email/verify-organiser    Organiser verification + welcome
/api/email/verify-contributor  Contributor verification
/api/email/approval            Approval notification
/api/email/submission-confirmation  Submission confirmation
/api/admin/*                   Admin API routes
```

### Hidden:
```
/publication-render/[token]    Puppeteer render template
```

---

## 4. CAPSULE LIFECYCLE

```
Free tier created   → page_state: active (immediately live)
Paid tier created   → page_state: pending_payment
Stripe pays         → page_state: active (via webhook)
Admin suspends      → page_state: suspended
```

**Valid page_state values:**
`pending_verification` · `pending_payment` · `active` · `suspended` · `expired`

**`tribute_collection` is RETIRED AND INVALID. Never use it.**
Any code using `tribute_collection` must be corrected to `active`.

---

## 5. PACKAGE TIERS

| Tier | lc_pricing key | EUR | NGN |
|---|---|---|---|
| Free | — | €0 | — |
| Legacy Honour | `capture_preserve_base` | €50 | ₦40,000 |
| Legacy Premier | `full_platform_base` | €80 | ₦70,000 |

Free tier: `page_state: active` immediately. `free_tier_expires_at` = NOW() + 90 days.
Paid tier: `page_state: pending_payment` → Stripe checkout → webhook → `active`.

---

## 6. BUILD STATUS

### Complete and live:

- Full premium homepage — animated world map, rotating capability lines
- Booking flow — all 5 screens, free/honour/premier paths
- All audience pages
- Organiser manage page — `app/manage/[slug]/page.tsx`
- LCAdmin — full 10-screen suite with all editors
- Email verification flow
- Organiser welcome email
- Publication Engine — all 17 files, PDF pipeline, editor
- `lib/eventLabels.ts` — public-facing dynamic labels
- `lib/tributeWallHelpers.ts` — shared utilities
- `lib/publication/*` — types, autoArrange, layoutHelpers
- `lib/imageUtils.ts` — image dimension capture
- `components/TributeMap.tsx` — Leaflet map
- `components/publication/*` — full editor suite
- Database — all tables including Phase 3 and 4 additions
- lc_content — 33 rows seeded
- lc_pricing_zones — 8 zones seeded
- Resend domain verified
- Vercel deployed — 51 routes building clean

### In progress (active AI sessions):

| Session | Scope | Status |
|---|---|---|
| Tribute Wall AI | `/for/[slug]` rebuild + `/submit` + emails | Block 7 writing |
| Stripe AI | Payment integration | Correcting paths after D44 |

### Not yet built:

| Item | Priority |
|---|---|
| `/for/[slug]/profile` — subject profile page | HIGH |
| Submission confirmation email wired | HIGH |
| Regional price detection `useRegionalPrice` hook | MEDIUM |
| Honouree Reveal button on manage page | MEDIUM |
| Publication card on manage page | MEDIUM |
| imageUtils wired into upload flow | MEDIUM |
| About page — real copy | LOW |
| Examples page — real demo slugs | LOW |

---

## 7. ALL CONFIRMED DECISIONS

| # | Decision |
|---|---|
| D9 | No hardcoded prices or copy — all from lc_pricing and lc_content |
| D10 | page_state: pending_verification (free) or pending_payment (paid) on creation |
| D11 | Package names: Legacy Honour / Legacy Premier |
| D12 | Single currency per user by IP. Never dual currency. |
| D13 | auto_approve_tributes = FALSE on production always |
| D14 | Event date removed from booking — collected post-creation |
| D15 | Launch pricing: Honour €50/₦40k · Premier €80/₦70k |
| D16 | Brand line: "Events end. Legacies don't." |
| D17 | All uploads compressed client-side to under 1MB |
| D18 | "Ways to Honour" — event-type labels via lib/eventLabels.ts |
| D19 | Subject portal — token link, 30-day session, paid tier only |
| D20 | Support acknowledgement — tick → recorded → thank-you email |
| D21 | Broadcast limit — one per 7 days per capsule |
| D22 | Premium lock UI — paid features visible but locked on free |
| D23 | Moderation = organiser via /manage/[slug]. LCAdmin = platform only. |
| D24 | "Honouree" is internal only — never in public UI or emails |
| D25 | Free tier: €0, 50 contributors, 90 days, tribute wall only |
| D26 | Screen 3 — three cards: Free / Legacy Honour / Legacy Premier |
| D27 | Contributor emails: submission confirmation + Keepsake Card |
| D28 | Submission form at `/for/[slug]/submit` — separate route |
| D29 | Sticky bar with TributeMap — freezes on scroll |
| D30 | Ambient photo backdrop — opacity 0.07, parallax desktop |
| D31 | Ivory tribute cards — `#F5F3EE` with box shadow |
| D32 | No organiser link on public wall — email link only |
| D33 | One colour palette, event-type texture variations |
| D34 | Phone not collected Phase 1 |
| D35 | Form fields: Name* City* Country* Tribute* · Relationship · Email · Photo |
| D36 | Manage page URL: `/manage/[slug]?email=[encoded]` |
| D37 | Stripe under RevoWorldTech for test. Valnex when bank ready. |
| D38 | 16 rotating homepage capability lines at 4200ms |
| D39 | admin.revoworldtech.uk as admin subdomain |
| D40 | lc_content and lc_pricing_zones editors built in Phase 1 LCAdmin |
| D41 | Dashboard stats from capsules table not communities |
| D42 | Route: /capsule/ → /for/ |
| D43 | Tribute wall: server component fetch + TributeWallClient.tsx island |
| D44 | Route structure: /for/ = public · /manage/ = organiser private |
| D45 | generation_status: idle/queued/rendering/complete/failed |
| D46 | TributeSection onSetOrderMode as separate prop |
| D47 | HTML5 drag API for tribute reordering |
| D48 | PublicationEditor pre-fetches all contributions in single query |
| P01 | Full PaymentService built Phase 1.5 |
| P02 | StripeAdapter object method pattern |
| P03 | Subscription stubs in StripeAdapter — activate Phase 2 |
| P04 | payment_id in Stripe metadata |
| P05 | cancel_url includes slug + pid — retry reuses existing capsule |
| P06 | Free: active. Paid: pending_payment. Webhook: active. tribute_collection = INVALID |
| P07 | Webhook returns 200 on handler error |
| P08 | Zero-decimal currency Set in priceFetcher |

---

## 8. DATABASE — CRITICAL NOTES

- `contributions.contributor_name` — was `name`, renamed. **Always use `contributor_name`.**
- `capsules.page_state` — see Section 4. `tribute_collection` is INVALID.
- `capsules.tier` — values: `free`, `honour`, `premier`
- Storage buckets: `tribute-photos` (public) · `capsule-publications` (private, PDF)

### Tables added beyond original spec:
`lc_content` · `lc_pricing_zones` · `capsule_profile_sections` · `capsule_featured_photos` · `capsule_gallery` · `honouree_portal_tokens` · `capsule_support_accounts` · `support_acknowledgements` · `honouree_email_templates` · `honouree_broadcasts`

### Capsules table additions:
`tier` · `pricing_key` · `visitor_type` · `free_tier_expires_at` · `organiser_email`

### Publications table additions (Phase 4):
`layout_config` · `page_map` · `arrangement_source` · `pdf_url` · `pdf_size_bytes` · `generation_status` · `generation_started_at` · `generation_completed_at` · `generation_error` · `version` · `render_token`

---

## 9. ENVIRONMENT VARIABLES

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        ← server-side only, never expose to client
RESEND_API_KEY
NEXT_PUBLIC_APP_URL              ← preview URL until itslegacycapsule.com resolves
LCADMIN_PASSWORD
LCADMIN_SESSION_SECRET
STRIPE_SECRET_KEY                ← server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET            ← server-side only
```

---

## 10. PHASE ROADMAP

| Phase | Status | Gate |
|---|---|---|
| **1** — Core platform | ~92% | Tribute wall rebuild + submit page |
| **1.5** — Stripe payments | In build | Stripe test → 3 paying clients |
| **2** — Platform expansion | Not started | 10 paying clients |
| **3** — Six Experiences | DB ready | Phase 3 activation |
| **4** — Publication Engine | Built, not activated | Vercel Pro + manage page card |
| **5** — Globe upgrade | Not started | globe.gl |
| **6** — Communiva | Not started | — |

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*
*CURRENT_STATE.md — 16 May 2026 — Confidential*
