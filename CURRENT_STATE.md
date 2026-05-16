# CURRENT_STATE.md
## LegacyCapsule — Build Session Handoff
**Date:** 14 May 2026
**Prepared by:** Claude (Anthropic) for session continuity
**Read this file first before touching any code.**

---

## 1. WHO WE ARE

| Field | Value |
|---|---|
| Legal entity | VALNEX, UNIPESSOAL LDA (Portugal) |
| Trading name | RevoWorldTech |
| Flagship app | LegacyCapsule |
| Domain | itslegacycapsule.com |
| DNS | Cloudflare — nameserver fix pending Cloudflare support response |
| Vercel | Live — okajibulu-legacycapsule-git-main-okajibulus-projects.vercel.app |
| Stack | Next.js 16.2.4 · TypeScript · Supabase · Tailwind CSS v4 · Shadcn/UI · Resend · Vercel |
| Dev environment | VS Code with Claude Code extension · PowerShell on Windows |
| Package manager | npm only |
| Repo | GitHub → okajibulu/legacycapsule → connected to Vercel auto-deploy |
| Email sender | noreply@itslegacycapsule.com via Resend — domain VERIFIED ✅ |

---

## 2. ECOSYSTEM CONTEXT

| App | Status | Role |
|---|---|---|
| **Valnex** | Active | Holding company |
| **RevoWorldTech** | Active | Digital app arm |
| **LegacyCapsule** | In build | Flagship — event tribute and memory preservation |
| **Communiva** | Planned | Community management hub |
| **SMSProvince** | Planned | Bulk SMS — Phase 2 contributor outreach integration |
| **CDLS** | Planned | Digital library |
| **RevoRent** | Planned | Property management |

**Rule:** LegacyCapsule must be designed to operate as a Communiva module in future. No tight coupling.

---

## 3. CURRENT BUILD STATUS — PHASE 1

**Overall: ~90% complete**

### ✅ COMPLETE

| Item | Notes |
|---|---|
| Full premium homepage | Animated world map, "Events end. Legacies don't." headline, 16 rotating capability lines, all 8 sections |
| Booking flow — all 5 screens | Dark gradient, premium treatment. Screen 3 has free/honour/premier three-card layout |
| Free tier path | Go Live Free → tribute wall active immediately, 90-day expiry, `free_tier_expires_at` column |
| Capsule creation | Writes to Supabase — tier, pricing_key, visitor_type, page_state: pending_verification |
| Organiser verification email | Sent via Resend from noreply@itslegacycapsule.com on capsule creation |
| Email verification flow | Organiser clicks link → page_state: active → redirects to manage page |
| Organiser manage page | `/capsule/[slug]/manage` — moderation queue, approve/decline, stats, share buttons |
| Navigation + Footer | Wrapper system — hides on /capsule/ /admin /book |
| LogoCapsule component | Single source of truth SVG logo |
| AnimatedWorldMap | Homepage hero — 59 cities, 9 stages, Lisbon origin |
| TributeMap component | Leaflet map — dark tiles, gold CircleMarker pins |
| LCAdmin hub | `/admin` — server-side password protection |
| LCAdmin pricing | Reads/writes lc_pricing table |
| LCAdmin feature flags | Reads/writes lc_feature_flags table |
| All audience pages | for-you, for-planners, start-planning, gift, resellers |
| API routes | verify, geocode, email/verify-organiser, email/approval |
| Supabase schema | All tables present. See Section 4. |
| lc_content table | 33 rows — all tier names, features, booking copy admin-editable |
| lc_pricing_zones table | Regional pricing zones with multipliers |
| lib/eventLabels.ts | Public-facing dynamic labels — no "honouree" in public UI |
| lib/tributeWallHelpers.ts | Shared tribute wall utilities |
| Resend domain | Verified ✅ May 12 2026 |
| Vercel deployment | Live and building on push to main |
| localStorage hydration fix | Tribute wall — all window/localStorage calls browser-guarded |
| Nested useEffect fix | Tribute wall — auto_approve flag useEffect moved to top level |
| page_state fix | Verify route sets active correctly |
| auto_approve_tributes | Set to FALSE in Supabase — all tributes require organiser approval |

### 🔄 IN PROGRESS

| Item | Status | Notes |
|---|---|---|
| Tribute wall premium rebuild | In progress | `app/capsule/[slug]/page.tsx` — syntax error being fixed. New design: ivory cards, sticky bar with map, ambient backdrop, no admin controls |
| TributeMap component | Created | Needs leaflet CSS import confirmed working on Vercel |

### ⚠️ NOT YET BUILT

| Item | Priority | Notes |
|---|---|---|
| `/capsule/[slug]/submit` | HIGH | Submission form — separate route, premium dark treatment |
| `/capsule/[slug]/profile` | HIGH | Subject profile page — basic sections only for Phase 1 |
| `/capsule/[slug]/edit/[token]` | MEDIUM | Contributor edit page — token-based |
| Submission confirmation email | HIGH | Path A — sent immediately on submit if email given |
| Keepsake Card email | HIGH | Sent on organiser approval — replaces plain approval email |
| Stripe integration | HIGH — Phase 1.5 | Stripe account being set up under RevoWorldTech |
| LCAdmin — lc_content editor | MEDIUM | Edit tier names, features, copy from admin |
| LCAdmin — lc_pricing_zones editor | MEDIUM | Edit regional multipliers from admin |
| Regional price detection | MEDIUM | useRegionalPrice hook — detect by IP, show single currency |
| Honouree Reveal button | MEDIUM | Add to manage page — Experience 5 |
| About page | LOW | Real copy needed |
| Examples page | LOW | Real demo capsule slugs needed |

---

## 4. DATABASE — SUPABASE CURRENT STATE

All tables exist. RLS enabled on all with permissive open policies for Phase 1.

### Core tables:
- `capsules` — includes: tier, pricing_key, visitor_type, free_tier_expires_at, page_state, organiser_email
- `contributions` — **`contributor_name` not `name`** — also: email_verified, status, latitude, longitude
- `email_verifications` — organiser + contributor tokens
- `lc_pricing` — 17 rows. **All prices here. Never hardcode.**
- `lc_feature_flags` — 8 flags. `auto_approve_tributes` = FALSE
- `lc_content` — 33 rows. Tier names, features, booking copy. All admin-editable.
- `lc_pricing_zones` — 8 zones with currency codes, symbols, multipliers, country arrays

### Profile and engagement tables (built, not yet wired):
- `capsule_profile_sections`
- `capsule_featured_photos`
- `capsule_gallery`
- `honouree_portal_tokens`
- `capsule_support_accounts`
- `support_acknowledgements`
- `honouree_email_templates`
- `honouree_broadcasts`

### Phase 3 tables (built ahead of schedule):
- `capsule_milestones`
- `contribution_keepsakes`
- `anniversary_queue`

### Other tables:
- communities, community_members, payments, profiles, publications
- guests, event_tables, gallery_items, geocode_cache
- capsule_phases, capsule_admins, attire_orders, attire_payments, attire_variants
- subscriptions, admin_audit_log

### Critical column notes:
- `contributions.contributor_name` — was `name`, renamed. Always use `contributor_name`.
- `capsules.page_state` values: `pending_verification` → `active` → (future: `expired`, `suspended`)
- `capsules.tier` values: `free`, `honour`, `premier`

---

## 5. CONFIRMED DECISIONS — ALL SESSIONS

These are locked decisions. Do not reopen without explicit founder confirmation.

| # | Decision | Detail |
|---|---|---|
| D1–D8 | Original spec deviations | See Build Handoff doc |
| D9 | Admin control over all pricing | No price, tier name, feature list, or commercial copy may be hardcoded. All from lc_pricing or lc_content. |
| D10 | page_state on creation/payment | Free tier: `active` immediately on creation. Paid tiers: `pending_payment` on creation, then `active` after webhook confirms payment. |
| D11 | Package names | Tier 1 = Legacy Honour (lc_pricing key: capture_preserve_base). Tier 2 = Legacy Premier (lc_pricing key: full_platform_base) |
| D12 | Single currency display | One currency per user based on geographic location. No dual currency shown. Regional detection via IP. |
| D13 | Tribute moderation — always manual | auto_approve_tributes = FALSE on production always. Any change requires LCAdmin with reason logged. |
| D14 | Event date removed from booking | Collected post-creation via organiser dashboard. All lifecycle triggers check for null before firing. |
| D15 | Launch pricing | Legacy Honour: €50 / ₦40,000. Legacy Premier: €80 / ₦70,000. |
| D16 | Homepage value proposition | "Go Live in minutes for free" — replaces "Free to start" everywhere. |
| D17 | Image processing rule | All uploads compressed client-side to under 1MB. No raw uncompressed image stored. |
| D18 | "Ways to Honour" naming | Never "Donate" or "Gift Fund". Framing puts initiative on the guest. Event-type-appropriate labels from lib/eventLabels.ts |
| D19 | Subject portal access | Unique token link. 30-day session. No password. Paid tier only — visible but locked on free. |
| D20 | Support acknowledgement flow | Guest ticks "I've sent a gift" → recorded → thank-you email fires → appears in subject portal. |
| D21 | Broadcast limit | One broadcast per 7 days per capsule. Admin-overridable. |
| D22 | Premium lock UI | All paid features visible on free tier with semi-transparent gold padlock overlay. Nothing hidden — access gated. |
| D23 | Moderation responsibility | Tribute moderation = organiser via /manage. LCAdmin = platform-level only. ADMIN_EMAIL check removed from public tribute wall. |
| D24 | "Honouree" is internal only | Never appears in public UI, emails, or copy. All public references use subject's name or event-type phrase from lib/eventLabels.ts |
| P06 | page_state flow | Free tier: active immediately on creation. Paid tiers: pending_payment on creation, active after webhook confirms payment. 'tribute_collection' is a retired invalid value — never use. |
| P09 | Route map locked (post-handoff update) | Public wall: /for/[slug] · Submit: /for/[slug]/submit · Manage: /manage/[slug] · All success_url and cancel_url references use these paths. |

---

## 6. FILE STRUCTURE — CURRENT STATE

```
legacycapsule/
├── app/
│   ├── page.tsx                    ✅ Full premium homepage
│   ├── layout.tsx                  ✅ NavigationWrapper + FooterWrapper
│   ├── globals.css                 ✅ Full design system tokens
│   ├── book/page.tsx               ✅ All 5 screens premium — free/honour/premier flow
│   ├── capsule/[slug]/
│   │   ├── page.tsx                🔄 Premium rebuild — syntax error being fixed
│   │   ├── manage/page.tsx         ✅ Organiser control panel
│   │   ├── submit/page.tsx         ❌ NOT YET BUILT
│   │   ├── profile/page.tsx        ❌ NOT YET BUILT
│   │   └── edit/[token]/page.tsx   ❌ NOT YET BUILT
│   ├── admin/
│   │   ├── page.tsx                ✅ LCAdmin hub
│   │   ├── pricing/page.tsx        ✅ lc_pricing editor
│   │   └── flags/page.tsx          ✅ Feature flags
│   ├── api/
│   │   ├── verify/route.ts         ✅ Token verification → page_state: active
│   │   ├── email/verify-organiser/ ✅ Welcome + verification email
│   │   ├── email/approval/         ✅ Approval notification
│   │   └── geocode/route.ts        ✅
│   ├── for-you/                    ✅
│   ├── for-planners/               ✅
│   ├── start-planning/             ✅
│   ├── gift/                       ✅
│   ├── resellers/                  ✅
│   ├── examples/                   ⚠️ Needs real demo slugs
│   ├── pricing/                    ⚠️ Confirm from Supabase
│   └── about/                      ⚠️ Needs real copy
│
├── components/
│   ├── LogoCapsule.tsx             ✅ Single source of truth
│   ├── AnimatedWorldMap.tsx        ✅ Homepage hero map
│   ├── TributeMap.tsx              ✅ Leaflet — gold pins, dark tiles
│   └── layout/
│       ├── Navigation.tsx          ✅
│       ├── Footer.tsx              ✅
│       ├── NavigationWrapper.tsx   ✅
│       └── FooterWrapper.tsx       ✅
│
├── lib/
│   ├── mapCities.ts                ✅ 59 cities, 9 stages
│   ├── email.ts                    ✅ FROM: noreply@itslegacycapsule.com
│   │                                  sendOrganiserWelcome — called via API route
│   ├── verification.ts             ✅ FROM: noreply@itslegacycapsule.com ✅ fixed
│   │                                  /capsule/ links use /capsule/ not /event/ ✅ fixed
│   ├── supabase.ts                 ✅
│   ├── eventLabels.ts              ✅ Public-facing labels — no "honouree" in public
│   ├── tributeWallHelpers.ts       ✅ COUNTRIES list, formatTributeDate, getInitials
│   └── utils.ts                    ✅
│
└── public/
    └── world-map-simple.svg        ✅
```

---

## 7. TRIBUTE WALL — DESIGN SPEC (for current rebuild)

The tribute wall (`app/capsule/[slug]/page.tsx`) is being rebuilt. The complete design is locked:

### Page zones top to bottom:

**Zone 1 — Hero (scrolls away)**
- Deep purple `#2D1B69` background
- LogoCapsule size="sm" centred
- Event type emoji ornament
- Subject name — large Playfair Display, links to /profile
- Event tag — antique gold, generous letter-spacing
- Gold threshold rule at bottom

**Zone 2 — Sticky bar (freezes on scroll)**
- `position: sticky; top: 0; z-index: 50`
- Left 60%: TributeMap — dark tiles, gold pins, live-updating. "Powered by LegacyCapsule" overlay
- Right 40%: Event type · Subject name · Event tag · Tribute count · Copy link · WhatsApp share
- Height: 180px desktop, 140px mobile

**Zone 3 — Tribute section (scrolls under sticky bar)**
- Section header: `──── ✦ TRIBUTE WALL ✦ ────` + count
- Subject photo as ambient backdrop — very faded, `background-attachment: fixed` (parallax desktop, scroll mobile)
- Tribute cards: warm ivory `#F5F3EE`, box shadow, gold top rule per card
- Card content: initials avatar or photo · name · city ✦ country · relationship (if given) · date · tribute text · expand toggle
- No edit, no delete, no admin controls — public wall is clean
- Profile link card at bottom of tributes section

**Zone 4 — Sticky Add Your Tribute CTA**
- Gold background, deep purple text, links to /submit

**Zone 5 — Footer**
- Deep purple. VALNEX attribution. "Planning your own event? Start here →" linking to /book

### Submission form (`/capsule/[slug]/submit` — not yet built):
Fields: Name* · City* · Country* (dropdown) · Tribute message* (20–1000 chars, live counter) · Relationship · Email · Photo
Below email: "Leave your email to receive a keepsake of your tribute when it's approved"
Preview step before submit. Post-submission confirmation screen with WhatsApp share.

---

## 8. KNOWN ISSUES — OPEN BUGS

| # | Issue | Location | Status |
|---|---|---|---|
| B1 | Syntax error line 314 — missing `<a` tag | app/capsule/[slug]/page.tsx | Being fixed |
| B2 | Cloudflare nameserver — domain not fully resolving | DNS | Awaiting Cloudflare support |
| B3 | NEXT_PUBLIC_APP_URL in Vercel points to preview URL not real domain | Vercel env vars | Update when B2 resolved |
| B4 | Pricing page — confirm not hardcoded | app/pricing/page.tsx | Needs check |
| B5 | admin/dashboard/[slug] — redundant, repurpose or remove | app/admin/dashboard | Low priority |

---

## 9. NEXT SESSION — IMMEDIATE TASKS

**For tribute wall + submission (current session continuing or next session):**

1. Fix syntax error in `app/capsule/[slug]/page.tsx` — missing `<a` tag and encoding corruption
2. Confirm `npm run build` clean with TributeMap + eventLabels imports
3. Build `/capsule/[slug]/submit` — separate submission form page
4. Add submission confirmation email (Path A — immediate send if email given)
5. Update Keepsake Card email in `lib/email.ts` — replace plain approval email

**For LCAdmin + Stripe (separate session recommended):**

1. Add `lc_content` editor to LCAdmin — edit tier names, features, copy
2. Add `lc_pricing_zones` editor to LCAdmin — edit regional multipliers
3. Stripe account setup (RevoWorldTech — test keys ready to integrate)
4. Build PaymentService and Stripe checkout route
5. Wire booking flow Screen 3/4 paid paths to Stripe checkout
6. Stripe webhook → set page_state based on payment status
7. Add `pending_payment` page_state handling to tribute wall

---

## 10. ENVIRONMENT VARIABLES

### Required in both .env.local and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=  # http://localhost:3000 local | preview URL until domain live
LCADMIN_PASSWORD=
LCADMIN_SESSION_SECRET=

# Stripe — add when account ready
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

**Important:** `NEXT_PUBLIC_APP_URL` currently points to the Vercel preview URL because `itslegacycapsule.com` DNS is pending. Update to `https://itslegacycapsule.com` when Cloudflare support resolves the nameserver issue.

---

## 11. BOOKING FLOW — CURRENT STATE ✅

All 5 screens rebuilt premium. Dark gradient: `linear-gradient(160deg, #0D0820 0%, #1A0F3E 50%, #0D0820 100%)`.

**Screen 1:** Visitor type — Personal Organiser / Event Professional / Gift a Capsule. Gift → routes to /gift immediately.

**Screen 2:** Event type — 12 cards in 3×4 grid. Emoji + label. Gold border on select.

**Screen 3:** Three packages:
- Go Live Free — tribute wall instant, 50 contributors, 90 days, €0
- Legacy Honour — €50 / ₦40,000 — fetched from lc_pricing (capture_preserve_base)
- Legacy Premier — €80 / ₦70,000 — fetched from lc_pricing (full_platform_base)
- All tier names and features fetched from lc_content table

**Screen 4:** Capsule details — subject name (dynamic label per event type), event tag, organiser email, slug (auto-generated, editable). Live URL preview. Order summary (paid tiers only). Free tier shows "active for 90 days" note. Event date REMOVED — collected post-creation.

**Screen 5:** Confirmation — "Your capsule is live". Capsule link. Check email note.

**Email on creation:** POST to `/api/email/verify-organiser` → sends verification + welcome email from noreply@itslegacycapsule.com with manage link embedded.

**Manage link format:** `/capsule/[slug]/manage?email=[encoded_email]`

---

## 12. ORGANISER MANAGE PAGE — CURRENT STATE ✅

**Route:** `/capsule/[slug]/manage`

**Access:** Email parameter in URL OR localStorage `lc_organiser_email`. Email written to localStorage on arrival. Access denied screen if neither matches capsule.organiser_email.

**Redirect from verification:** `/capsule/[slug]/manage?activated=true&email=[encoded_email]`

**Features:**
- Stats strip: total tributes / pending / approved
- Share link with copy + WhatsApp buttons (pre-filled warm message)
- Moderation queue: All / Pending / Approved filter tabs
- Each tribute card: contributor name, city/country, date, tribute text, status badge
- Approve / Decline buttons — instant local state update on action

**Not yet on manage page:**
- Honouree Reveal button (Experience 5)
- World map widget of contributor locations
- Capsule settings (event date, event tag edit)

---

## 13. HOMEPAGE HERO — CURRENT STATE ✅

Headline: **"Events end. Legacies don't."**
- "Events end." — same size, weight 700, `rgba(255,255,255,0.62)`
- "Legacies" — gold `#D4AE2A`
- " don't." — white `#FFFFFF`

Rotating lines: 16 capability lines at 4200ms interval. Full list in app/page.tsx ROTATING_LINES array.

Trust line: `NO TECHNICAL EXPERIENCE REQUIRED · YOUR TRIBUTE WALL LIVE IN MINUTES FOR FREE`
- Muted white base text
- Gold `#D4AE2A` for the offer clause

Subline: `captured, preserved, and digitally shared`

---

## 14. EMAIL FLOW — CURRENT STATE

### Organiser emails:
- **Verification + welcome** — sent via `/api/email/verify-organiser` → `lib/verification.ts` `sendOrganiserVerification`. Contains verify link + manage link (with email param).
- **FROM:** `noreply@itslegacycapsule.com` ✅ confirmed in lib/verification.ts

### Contributor emails:
- **Submission confirmation** — NOT YET BUILT. Must be built alongside /submit page.
- **Approval notification** — exists in `lib/email.ts` `sendApprovalNotification`. Plain email. Must be upgraded to Keepsake Card.
- **Collective Belonging** — Phase 3
- **Anniversary** — Phase 3

### Keepsake Card:
Full HTML template exists in `LegacyCapsule_Six_Engagement_Experiences.docx`. Wire into approval flow when building contributor email (next task).

---

## 15. PHASE ROADMAP

| Phase | Name | Status | Gate |
|---|---|---|---|
| **1** | Core platform | ~90% | Tribute wall rebuild + submit page |
| **1.5** | Stripe payment integration | Next | Stripe account → test → 3 paying clients |
| **2** | Platform expansion + Coordinate | Not started | 10 paying clients |
| **3** | Six Engagement Experiences | DB ready | Phase 3 start |
| **4** | Publication Engine | Not started | Organiser dashboard |
| **5** | Globe upgrade | Not started | globe.gl |
| **6** | Communiva integration | Not started | — |

---

## 16. HOW TO START A NEW SESSION

1. Read `CURRENT_STATE.md` fully
2. Read `AGENTS.md`
3. Search project knowledge for context relevant to today's task
4. State which task you are working on (max 3 items)
5. Check Section 9 for immediate next tasks
6. If touching spec-governed areas, search project knowledge first
7. Commit to GitHub at end of session

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*
*CURRENT_STATE.md — 14 May 2026 — Confidential*
