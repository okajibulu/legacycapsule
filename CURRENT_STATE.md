# CURRENT_STATE.md
## LegacyCapsule — Build Session Handoff
**Date:** 11 May 2026  
**Session:** claude.ai chat → migrating to VS Code Claude extension  
**Prepared by:** Claude (Anthropic) for session continuity  
**Read this file first before touching any code.**

---

## 1. WHO WE ARE

| Field | Value |
|---|---|
| Legal entity | VALNEX, UNIPESSOAL LDA (Portugal) |
| Trading name | RevoWorldTech |
| Flagship app | LegacyCapsule |
| Domain | itslegacycapsule.com (on Cloudflare) |
| Stack | Next.js 16.2.4 · TypeScript · Supabase · Tailwind CSS v4 · Shadcn/UI · Resend · Vercel |
| Dev environment | VS Code with Claude extension · PowerShell on Windows |
| Package manager | npm only (not yarn, not pnpm) |
| Dev server | `npm run dev` → localhost:3000 |
| Repo | GitHub → connected to Vercel for auto-deploy |
| Email sender | noreply@itslegacycapsule.com via Resend |

---

## 2. ECOSYSTEM CONTEXT

LegacyCapsule is the flagship app of a planned digital ecosystem. Every architectural decision must account for this.

| App | Status | Role |
|---|---|---|
| **Valnex** | Active (holding company) | Umbrella company — parent of all products |
| **RevoWorldTech** | Active (trading name) | Digital app arm of Valnex |
| **LegacyCapsule** | In build | Flagship. Event tribute and memory preservation platform. |
| **Communiva** | Planned | Community management hub. Other apps slot in as modules including LegacyCapsule. NOT YET BUILT. |
| **SMSProvince** | Planned | Bulk SMS — standalone and as Communiva module. NOT YET BUILT. |
| **CDLS** | Planned | Digital library — rent/sell books from publishing arm. NOT YET BUILT. |
| **RevoRent** | Planned | Property management. NOT YET BUILT. |

**Architectural rule:** LegacyCapsule must be designed so it can operate as a module inside Communiva in the future. Do not make decisions that create tight coupling preventing this.

---

## 3. DOCUMENT AUTHORITY MAP

When any question arises during build, consult the correct document. Never make decisions from memory when a document owns the answer.

| Question | Document | Section |
|---|---|---|
| What is the complete build sequence? | Master Build Plan v1.0 | Sections 5 and 7 |
| Full product specification — all features, flows, states | Master Document v3.0 | All sections |
| Full database schema — every column on every table | MVP Build Guide v2.0 | Section 2.3 |
| How does payment routing work? | Payment Integration Guide v1.0 | Section 4 |
| How does Stripe integrate? | Payment Integration Guide v1.0 | Section 5.1 |
| How does Paystack integrate? | Payment Integration Guide v1.0 | Section 5.2 |
| What are all the prices? | LCAdmin Build Guide v1.0 | Section 9 |
| How does the animated world map work? | Animated World Map Build Guide v1.0 | Sections 4–7 |
| How do the six engagement experiences work? | Six Engagement Experiences v1.0 | All sections |
| How is the publication built? | Publication Engine Build Guide | All sections |
| What is the admin console architecture? | LCAdmin Build Guide v1.0 | All sections |
| What is the reseller system? | EcoControl Spec v1.0 | Reseller Engine sections |
| What are the regional pricing multipliers? | EcoControl Spec v1.0 | Section 9.1 |
| What are the RLS policies? | MVP Build Guide v2.0 / LCAdmin Build Guide | Section 3 / Section 1.1 |
| What deviations were made from original specs? | LegacyCapsule_BuildHandoff_10May2026.docx | Sections 5–8 |

**The Build Handoff .docx** (already in project folder) is the deviation register. Every departure from the original spec documents is recorded there with reasons.

---

## 4. DATABASE — CURRENT STATE (Supabase)

All tables exist. RLS is enabled on all with permissive open policies for Phase 1.

### Tables confirmed present and working:
- `capsules` — core capsule records
- `contributions` — tribute submissions (**column is `contributor_name` not `name` — renamed**)
- `communities` — multi-tenant communities
- `community_members`
- `payments`
- `profiles`
- `publications`
- `guests`
- `event_tables`
- `gallery_items`
- `geocode_cache`
- `capsule_phases`
- `capsule_admins`
- `attire_orders`
- `attire_payments`
- `attire_variants`
- `lc_pricing` — 17 price rows seeded. **All prices must be read from here. Never hardcode.**
- `lc_feature_flags` — 8 flags seeded including `auto_approve_tributes`
- `admin_audit_log` — append-only, no update/delete RLS
- `email_verifications`
- `subscriptions` — Phase 2 ready
- `capsule_milestones` — Phase 3 ready
- `contribution_keepsakes` — Phase 3 ready
- `anniversary_queue` — Phase 3 ready

### Critical column notes:
- `contributions.contributor_name` — was `name`, renamed. All queries and inserts must use `contributor_name`.
- `contributions.contribution_type` — added, default `'text'`. Required for Phase 3 voice/video logic.
- `capsules.approved_contrib_count` — added with trigger `trg_contrib_count` to keep in sync.

### Known schema adaptations required for Phase 3:
- Six Engagement Experiences code uses `admin.auth.admin.getUserById(owner_user_id)` to get organiser email — **adapt to read `capsules.organiser_email` directly** (we have no Supabase auth).
- `publications.page_map` column not yet confirmed — add when building Publication Engine.
- Supabase Realtime not yet enabled on `contributions` — enable when building Experience 3 (Live Wall).

---

## 5. FILE STRUCTURE — CURRENT STATE

```
legacycapsule/
├── app/
│   ├── page.tsx                    ✅ Full premium homepage — animated world map hero
│   ├── layout.tsx                  ✅ NavigationWrapper + FooterWrapper (conditional rendering)
│   ├── globals.css                 ✅ Full design system tokens merged in
│   ├── book/page.tsx               ⚠️  PARTIAL — Screen 1 rebuilt premium. Screens 2/3/4 need same treatment.
│   ├── capsule/[slug]/page.tsx     ✅ Tribute wall — contributor_name fix applied
│   ├── admin/page.tsx              ✅ LCAdmin hub
│   ├── admin/pricing/page.tsx      ✅ Reads from lc_pricing table
│   ├── admin/flags/page.tsx        ✅ Feature flags management
│   ├── admin/dashboard/[slug]/     ⚠️  Redundant — repurpose or remove
│   ├── for-you/page.tsx            ✅ Audience page
│   ├── for-planners/page.tsx       ✅ Audience page
│   ├── start-planning/page.tsx     ✅ Audience page
│   ├── gift/page.tsx               ✅ Gift page
│   ├── resellers/page.tsx          ✅ Resellers page
│   ├── examples/page.tsx           ⚠️  Needs real demo capsule slugs wired in
│   ├── pricing/page.tsx            ⚠️  Must confirm reads from Supabase not hardcoded
│   ├── about/page.tsx              ⚠️  Placeholder copy — needs real narrative
│   ├── test-map/page.tsx           ❌  DELETE BEFORE DEPLOY — Remove-Item -Recurse app\test-map
│   └── api/
│       ├── email/approval/route.ts        ✅
│       ├── email/verify-contributor/      ✅
│       ├── email/verify-organiser/        ✅
│       ├── geocode/route.ts               ✅
│       └── verify/route.ts               ✅
│
├── components/
│   ├── LogoCapsule.tsx             ✅ SVG capsule logo — SINGLE SOURCE OF TRUTH for logo
│   ├── AnimatedWorldMap.tsx        ✅ Real SVG world map — showOverlay + mode props
│   └── layout/
│       ├── Navigation.tsx          ✅ Scroll-triggered, uses LogoCapsule size="sm"
│       ├── Footer.tsx              ✅
│       ├── NavigationWrapper.tsx   ✅ Hides nav on /capsule/ /admin /book
│       └── FooterWrapper.tsx       ✅ Hides footer on /capsule/ /admin /book
│
├── lib/
│   ├── mapCities.ts                ✅ 59 cities, 9 stages, Lisbon origin (stage 0)
│   ├── email.ts                    ✅ FROM: noreply@itslegacycapsule.com
│   ├── verification.ts             ✅
│   ├── supabase.ts                 ✅
│   └── utils.ts                    ✅
│
└── public/
    └── world-map-simple.svg        ✅ Downloaded from simplemaps.com
```

---

## 6. DESIGN SYSTEM — ACTIVE TOKENS

Defined in `app/globals.css`. Used across all marketing pages. Tribute wall and admin use Tailwind dark theme directly. Both coexist without conflict.

### Colours:
```css
--lc-purple:      #2D1B69   /* Primary brand purple */
--lc-purple-light:#3D2880
--lc-purple-dark: #1A0F3E
--lc-purple-deep: #0D0820   /* Deepest background */
--lc-gold:        #B8960C   /* Primary brand gold */
--lc-gold-light:  #D4AE2A
--lc-gold-dim:    #8A6F09
--lc-ivory:       #F5F3EE   /* Light section backgrounds */
--lc-charcoal:    #1C1C1E
```

### Typography:
```css
--font-display:  'Cormorant Garamond'  /* italic sublines, hero h1 */
--font-heading:  'Playfair Display'    /* h2, h3 */
--font-body:     'DM Sans'             /* body, labels, buttons */
--font-accent:   'Cormorant SC'        /* small caps labels */
```

**Google Fonts loaded via `app/layout.tsx` `<link>` tags — NOT via CSS @import** (Tailwind v4 throws CssSyntaxError with @import url() mixed with @import tailwindcss).

### Logo — `components/LogoCapsule.tsx`:
- Capsule pill shape split at centre
- Left half: deep purple gradient — "LEGACY" in gold (Playfair Display bold)
- Right half: gold gradient — "CAPSULE" in deep purple (Playfair Display bold)
- 3D effect: top gloss sheen, bottom inner shadow, gold rim, inner rim
- Drop shadow: `drop-shadow(0 3px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 6px rgba(184,150,12,0.3))`
- Sizes: sm (148×38) · md (188×50) · lg (248×66) · xl (330×90)
- Used in: Navigation (`size="sm"`) + booking flow (`size="md"`)

---

## 7. KEY DEVIATIONS FROM ORIGINAL SPEC DOCUMENTS

These are deliberate decisions made in this session. All are recorded in full in the Build Handoff .docx.

| # | Deviation | Original spec | What was done | Reason |
|---|---|---|---|---|
| 1 | Animated World Map built in Phase 1 | Phase 2 item | Built and integrated into homepage hero | Premium visual needed for stakeholder presentation |
| 2 | Full frontend homepage integrated | MVP simple homepage | All 8 sections, real map, audience routing | Build once not twice |
| 3 | LogoCapsule SVG component created | No logo spec existed | New SVG component, single source of truth | Navigation needed a real visual logo |
| 4 | `contributor_name` column renamed | Was `name` | Renamed in Supabase, all code updated | Phase 3 spec uses `contributor_name` throughout |
| 5 | Booking Screen 1 has 3 options | 2 options in spec | Added "Gift a Capsule" as 3rd option | Both /gift and booking flow converge to same gifting path |
| 6 | Nav/Footer in wrapper components | Each page imported directly | NavigationWrapper + FooterWrapper in layout.tsx | Single control point, no page-level duplication |
| 7 | Google Fonts in layout.tsx link tags | CSS @import at top of globals.css | Moved to `<link>` in layout.tsx `<head>` | Tailwind v4 rejects @import url() mixed with @import tailwindcss |
| 8 | Ocean colour — blue tint | Original CSS filter spec | Blue gradient background + adjusted filter | Client requested geographic blue ocean not grayscale |

---

## 8. WHAT NEEDS TO BE DONE — ORDERED BY PRIORITY

### 8.1 Before Deployment (do these first, in order)

- [ ] **Delete `app/test-map/` directory** — `Remove-Item -Recurse app\test-map`
- [ ] **Rebuild booking flow Screen 2** — event type selection. Same dark gradient premium treatment as Screen 1. Logo centred, gold progress bar, 11 event type cards in grid, generous spacing, gold borders.
- [ ] **Rebuild booking flow Screen 3** — package selection. TWO tiers clearly presented. **Prices must read from Supabase `lc_pricing` table not hardcoded.** Running total updates in real time.
- [ ] **Rebuild booking flow Screen 4** — form fields and summary. Honouree name, event tag, date, email, capsule URL with live preview, package summary, total. Gold bordered inputs. Same premium treatment.
- [ ] **Fix gift flow from Screen 1** — selecting "Gift a Capsule" on Screen 1 currently proceeds to Screen 2 (event type) which is wrong. Needs gift-specific branch or redirect to `/gift` page.
- [ ] **Confirm Resend domain verified** — check Resend dashboard. `itslegacycapsule.com` must show Verified before any email flow is tested on production.
- [ ] **Run `npm run build`** — must return zero errors. Current state: clean build, 1 CSS warning (acceptable).
- [ ] **Push to GitHub** — `git add . && git commit -m "Phase 1 complete — ready for production" && git push`

### 8.2 Vercel Deployment Checklist (in order)

1. All env vars added to Vercel project settings (see Section 9 below)
2. Deploy — GitHub repo already connected
3. Add custom domain `itslegacycapsule.com` in Vercel Domains settings
4. Update Cloudflare DNS — add Vercel CNAME or A record. **Proxy: DNS only (not proxied) for Vercel records**
5. Confirm SSL — https://itslegacycapsule.com loads with padlock
6. Update `NEXT_PUBLIC_APP_URL` to `https://itslegacycapsule.com` in Vercel env vars → Redeploy
7. Full end-to-end production test — book capsule → verify email → submit tribute → moderate → approve → approval email received
8. Test admin on production — /admin, /admin/pricing, /admin/flags all working

### 8.3 Phase 1.5 — Payment Integration (immediately after deployment)

**Critical warning from Animated World Map Build Guide:** The Start Your Capsule CTA on the homepage must NOT go live until Stripe is tested on the production URL. Keep "Payment coming — capsule created immediately" placeholder until then.

Build order per Payment Integration Guide v1.0 Section 11.1:
1. Create Stripe account — complete business verification for Valnex LDA
2. Add env vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
3. Build `lib/payments/regionDetector.ts`
4. Build `lib/payments/priceFetcher.ts` — reads from `lc_pricing` table
5. Build `lib/payments/adapters/StripeAdapter.ts`
6. Build `lib/payments/PaymentService.ts`
7. Build `lib/payments/featureUnlocker.ts`
8. Build `app/api/checkout/route.ts`
9. Build `app/api/webhooks/stripe/route.ts`
10. Wire booking flow Screen 4 checkout button to `/api/checkout`
11. Full end-to-end test on Vercel production URL
12. Update Stripe webhook endpoint to `https://itslegacycapsule.com/api/webhooks/stripe`

Paystack (Nigeria/Ghana/Kenya) is Phase 2. Flutterwave (cross-border Africa) is Phase 2.

### 8.4 Content — Needs Real Copy Before Launch

- [ ] `app/about/page.tsx` — placeholder copy. Needs founding story, mission, Valnex/RevoWorldTech narrative.
- [ ] `app/examples/page.tsx` — needs real demo capsule slugs created in Supabase (minimum 4: retirement, memorial, milestone birthday, wedding).
- [ ] `app/pricing/page.tsx` — confirm reads from Supabase not hardcoded.
- [ ] Legal documents — 5 needed: Terms, Privacy Policy, Cookie Policy, Refund Policy, GDPR. EU law applies (Portugal).
- [ ] First client testimonials — needed for homepage social proof block before launch.

### 8.5 Open Decisions — Must Be Made Before Specific Pages Build

| Decision | Blocks | Options |
|---|---|---|
| Package names | Pricing page, booking Screen 3, all tier references | Option A: The Record / The Chronicle — Option B: Remembrance / Legacy |
| Social proof model | Homepage Block 5 | Real live counts (requires API) OR curated milestone numbers at launch |
| Featured homepage example | Homepage Block 7 | Recommendation: retirement — most universally relatable |
| Gift voucher denominations | /gift page | Fixed amounts (EUR 25/50/75/120) OR custom OR tier-based |
| Voucher expiry | /gift page | 12 months (recommended) / 24 months / no expiry |
| Group gift shortfall | /gift page | Full refund OR unlock at collected amount OR initiator chooses |
| Reseller commission rate | /resellers page | Percentage not yet set |
| Planner directory launch state | /for-planners page | Launch empty with Coming Soon OR hold until first planners |
| About page narrative | /about | Must be written by founder |

---

## 9. ENVIRONMENT VARIABLES

All must be set in both `.env.local` (local dev) and Vercel project settings (production). Never hardcode any of these.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # Server-side only — never expose to client

# Resend
RESEND_API_KEY=

# App URL
NEXT_PUBLIC_APP_URL=               # http://localhost:3000 (dev) | https://itslegacycapsule.com (prod)

# Admin (already set)
NEXT_PUBLIC_ADMIN_PASSWORD=
LCADMIN_PASSWORD=
LCADMIN_SESSION_SECRET=

# Stripe — PENDING (add when Stripe account created)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PLANNER_MONTHLY=      # Phase 2 — Stripe Price ID
STRIPE_PRICE_ARCHIVE_ANNUAL=       # Phase 2 — Stripe Price ID

# Paystack — PENDING (Phase 2)
PAYSTACK_SECRET_KEY=

# Flutterwave — PENDING (Phase 2)
FLUTTERWAVE_SECRET_KEY=
```

---

## 10. BOOKING FLOW — DETAILED CURRENT STATE

**Location:** `app/book/page.tsx` — single file, multi-screen with state machine.

### Screen 1 — WHO ARE YOU? ✅ REBUILT PREMIUM
- Dark gradient background: `linear-gradient(160deg, #0D0820 0%, #1A0F3E 50%, #0D0820 100%)`
- LogoCapsule `size="md"` centred at top
- Gold progress bar (3px, glowing)
- "← Back to Home" link top left
- "Step 1 of 4" gold uppercase label
- Three option cards with gold borders on hover/select:
  1. Personal Organiser — "I am arranging an event for someone I love" 🤍
  2. Event Professional — "I use LegacyCapsule as part of my event services" ✦
  3. Gift a Capsule — "I want to give this experience as a gift" 🎁
- Gold divider rules above and below options
- Footer: "VALNEX, UNIPESSOAL LDA · RevoWorldTech" in dim text

### Screen 2 — WHAT IS THE OCCASION? ⚠️ NEEDS PREMIUM REBUILD
- Currently has basic grid of event type cards
- Needs: same dark gradient treatment, logo, gold progress bar, home link, generous spacing
- 11 event types: Retirement, Memorial & Funeral, Wedding, Milestone Birthday, Anniversary, Graduation, Ordination, Chieftaincy, Award Ceremony, Thanksgiving Service, Conference, Other Event
- Each card: emoji + label, centred, gold border, generous padding

### Screen 3 — CHOOSE YOUR PACKAGE ⚠️ NEEDS PREMIUM REBUILD
- Currently has basic two-tier display with hardcoded prices
- **Prices MUST be fetched from Supabase `lc_pricing` table**
- Two tiers: Capture & Preserve (tribute collection + publication) / Full Platform (all three pillars)
- Package names pending decision (see Open Decisions above)
- Running total updates in real time as tier selected

### Screen 4 — YOUR CAPSULE DETAILS ⚠️ NEEDS PREMIUM REBUILD
- Form fields: honouree name (80 char), event tag (80 char), event date, organiser email, capsule URL slug (60 char)
- Live URL preview box showing `itslegacycapsule.com/capsule/[slug]`
- Summary: package, event type, total price
- CTA: "Create Capsule →" (payment coming — capsule created immediately for now)
- **Payment integration placeholder** — capsule creates in Supabase, link goes live immediately

---

## 11. HOMEPAGE HERO — CURRENT STATE ✅

The hero is fully implemented with:
- Full viewport height (`100vh`, min `680px`)
- Real SVG world map from `public/world-map-simple.svg`
- CSS filter: `hue-rotate(220deg) saturate(2.2) brightness(0.5) contrast(1.3)` — purple landmasses
- Ocean background: `#0A1628` + `oceanGrad` linear gradient — blue ocean
- Gold city pins lighting up from Lisbon (stage 0) outward across 9 stages, 59 cities
- Pulse rings expanding from each city as it activates
- Loop: 9 seconds, resets and replays
- Text overlay (`showOverlay={false}` — map is pure background)
- Radial gold gloss sheen over centre
- Bottom fade to ivory (Section 2 background)
- "EVERY EVENT · PRESERVED" gold uppercase label
- Main headline: Cormorant Garamond, `clamp(2.2rem, 5.5vw, 5rem)`, white with gold drop-shadow
- "of your event" — gold italic span
- "— in one Capsule." — italic subline
- Rotating event type (RotatingEventType component, 2.8s interval, 11 types)
- Two CTAs: "Start Your Capsule" (gold filled) + "See It In Action" (glass ghost)
- Trust line: "No technical experience required · Live in minutes · Free to start"
- SCROLL + animated bounce arrow

---

## 12. NAVIGATION — CURRENT STATE ✅

- Component: `components/layout/Navigation.tsx`
- Transparent on load → solid purple on scroll (>20px)
- Quick access bar hidden until user scrolls past 1.5× viewport height
- Quick access bar has `opacity: 0; visibility: hidden` until threshold — no flash on load
- LogoCapsule `size="sm"` (148×38) in top-left
- Links: Examples · Pricing · For You · Help
- Right side: Sign In (ghost) · Start Your Capsule (gold pill, centred text, `whiteSpace: nowrap`)
- Hamburger menu for mobile
- **Wrapper:** `components/layout/NavigationWrapper.tsx` — hides nav on `/capsule/`, `/admin`, `/book`
- **Wrapper:** `components/layout/FooterWrapper.tsx` — hides footer on same paths

---

## 13. ANIMATED WORLD MAP — COMPONENT API

**File:** `components/AnimatedWorldMap.tsx`  
**Data:** `lib/mapCities.ts`

```tsx
<AnimatedWorldMap 
  mode="hero"          // "hero" | "idle"
  showOverlay={false}  // true shows "Every event. Preserved." text overlay
  className="w-full"
/>
```

**City stages (STAGE_DELAYS in lib/mapCities.ts):**
- Stage 0 (0ms): Lisbon — origin
- Stage 1 (800ms): Europe — 5 cities (London, Paris, Berlin, Stockholm, Rome)
- Stage 2 (1800ms): West Africa — 6 cities (Lagos, Accra, Abidjan, Dakar, Abuja, Freetown)
- Stage 3 (2600ms): East & Southern Africa — 5 cities
- Stage 4 (3400ms): North America — 8 cities
- Stage 5 (4200ms): South America — 5 cities
- Stage 6 (5000ms): Middle East & South Asia — 5 cities
- Stage 7 (5800ms): Asia Pacific — 6 cities
- Stage 8 (6600ms): Global coverage — 7 more cities
- Loop at 9000ms

---

## 14. PHASE ROADMAP — CONTEXT FOR DECISIONS

| Phase | Name | Status | Key gates |
|---|---|---|---|
| **1** | MVP — Tribute Page | 85% complete | Booking flow Screens 2/3/4, deploy, Resend verify |
| **1.5** | Payment Integration | Not started | Stripe account, 3 paying clients to graduate |
| **2** | Platform Expansion + Coordinate | Not started | 10 paying clients, Supabase auth, Paystack |
| **3** | Six Engagement Experiences + Publication | Not started | Phase 3 DB tables already exist — ahead of schedule |
| **4** | Publication Engine | Not started | Organiser dashboard must exist first |
| **5** | Globe Upgrade | Not started | d3.js + globe.gl replaces current SVG map |
| **6** | Communiva Integration | Not started | LegacyCapsule as Communiva module |

**Phase 3 note:** The six engagement experiences are emotionally powerful and serve as organic marketing. The database tables (`capsule_milestones`, `contribution_keepsakes`, `anniversary_queue`) are already built. When building Phase 3, adapt all `owner_user_id` auth lookups to use `capsules.organiser_email` directly.

**Payment note:** Stripe (EU/UK/US/CA/ROW) is Phase 1.5. Paystack (NG/GH/KE) and Flutterwave (cross-border Africa) are Phase 2. All revenue settles to Valnex LDA Portugal bank account regardless of processor — required for D2 Visa compliance.

---

## 15. HOW TO START THE NEW CLAUDE SESSION

Follow this exactly. Do not skip steps.

1. Claude reads `CURRENT_STATE.md` (this file) fully before any response
2. Claude reads `AGENTS.md` for behaviour rules
3. State which task you are working on today
4. If touching any spec-governed area, Claude checks the relevant document in project knowledge first
5. Claude Code handles execution in VS Code; Claude (chat) handles planning and direction
6. Any new deviation from spec documents must be stated explicitly and agreed before implementation
7. Commit to GitHub at the end of every session: `git add . && git commit -m "descriptive message" && git push`

**Immediate next task for the new session:**
> Rebuild booking flow Screen 2 (event type selection) with the same premium dark gradient treatment as Screen 1. Then Screen 3 (package selection, prices from Supabase). Then Screen 4 (form and summary). Then delete test-map. Then deploy to Vercel.

---

## 16. DEVIATION / RULE - Loggedfor all sessions:

Rule D9 — Admin Control Over All Pricing Components
No price, tier name, tier description, feature list item, or any user-facing commercial component may be hardcoded in the application. All such values must be readable from and modifiable via LCAdmin without a code change. This extends beyond base prices to include: package names, feature bullet points per tier, add-on labels, and any copy that affects a purchasing decision. When a component of this type is needed and no lc_pricing row exists for it yet, add the row to lc_pricing before wiring it to the UI.


Decision D10 — Capsule page_state on creation (Phase 1)
During Phase 1 (no payment integration), capsules created via the booking flow are set to page_state: 'active' immediately on creation. This is a deliberate phase-discipline exception. When Phase 1.5 (Stripe) is built, the default changes to page_state: 'pending_payment' and the feature unlocker webhook sets it to active on payment confirmation. This transition must be recorded as a code change at that time — not a schema change.


Decision D11 — Package Names (previously undocumented)
Tier 1 = Legacy Honour (maps to lc_pricing key capture_preserve_base, €75)
Tier 2 = Legacy Premier (maps to lc_pricing key full_platform_base, €120)
These names are decided and final. Remove all references to "The Record / The Chronicle" and "Remembrance / Legacy" from open decisions logs.

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*  
*CURRENT_STATE.md — May 2026 — Confidential*
