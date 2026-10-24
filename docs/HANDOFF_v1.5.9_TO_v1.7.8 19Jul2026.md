HANDOFF_CLAUDE_v1.5.9_TO_v1.7.8.md
LegacyCapsule — Session Handoff
v1.5.9 → v1.7.8
VALNEX, UNIPESSOAL LDA · RevoWorldTech
July 2026

═══════════════════════════════════════════════════════════════
READ FIRST
═══════════════════════════════════════════════════════════════

Architecture is frozen at CG05 baseline.
No architectural changes without founder review.
Implementation Clarification Rule is standing policy.

Before touching any file: read it first.
Before building any UI: discuss flow first.

Current authoritative documents:
    RW00  Platform Architecture Index
    RW01  Payment Services Platform
    RW03  Publication Platform
    RW04  Recognition Platform
    LC00–LC10 Product Architecture Library
    LC_LAUNCH_BUILD_ROADMAP.md
    COMPONENT_MAP.md
    CURRENT_STATE.md

═══════════════════════════════════════════════════════════════
SECTION 1 — VERSION SUMMARY
═══════════════════════════════════════════════════════════════

v1.5.9  Access Code System: 6 DB tables, all API routes
v1.6.0  Access Code components + usher check-in page
v1.6.1  Sprint B: overview read-only, EOH→Gift of Honour,
        feature page 404 fix, programme exports description
v1.6.2  lc_pricing cleaned — 16 canonical rows
v1.6.3  ServicesTab cart flow (replaced by price column in v1.6.8)
v1.6.4  Community Memories & Stories rebuilt — dark theme,
        truncation, EOH section, schema fixes, admin response
v1.6.5  Publication render upgraded — honouree profile,
        community stories, D-Day section, improved tribute cards
v1.6.6  D-Day upload portal, context-aware QR redirect,
        EventPhasesSection QR update
v1.6.7  Correction request templates, edit_token in approval
        email, moderation queue extended, contributions status
        schema fixed (pending_review → pending)
v1.6.8  ServicesTab two-column layout — price column with
        checkboxes replaces cart bar
v1.6.9  Phase limit gate — free=1, paid=2, +1 per
        additional_phase purchase. Phases API updated.
v1.7.0  Live Contributor Wall — display page, Realtime broadcast
        added to approval route, redundant fast-approve removed
v1.7.1  Live Wall surfaced in ServicesTab with QR + preview link
v1.7.2  priceFetcher reads lc_pricing directly — fixes all
        add-on prices in ServicesTab and booking flow
v1.7.3  Stripe bundle checkout fixed — correct currency/amount
        fields, auto-fetch organiser email
v1.7.4  Booking flow: pending capsule state, correct
        confirmation copy, free services listed, community_stories
        free by default, Other Event input, Gift of Honour rename
v1.7.5  Tribute limit 500, community stories nudge, Cloudflare
        IP detection for currency
v1.7.6  Path-aware welcome emails (free vs pre-booked),
        verify-code route v4, serviceDetails EOH copy cleaned
v1.7.7  Help page v2 — all services documented, deep links,
        context banner; booking flow learn more links;
        ServicesTab full details links to help page
v1.7.8  Help page Suspense boundary fix, ServicesTab
        learnMoreUrl corrected

═══════════════════════════════════════════════════════════════
SECTION 2 — FILES SIGNIFICANTLY MODIFIED SINCE v1.5.8
═══════════════════════════════════════════════════════════════

These files have changed substantially. Always read current
state before touching them.

components/manage/ServicesTab.tsx
    — Two-column layout (service cards left, price column right)
    — PriceColumn component with checkboxes
    — LiveWallSection component added
    — learnMoreUrl props point to /help?section=[id]&ref=dashboard
    — All "Full details" links open in new tab

components/manage/GuestManagementSection.tsx
    — Now requires capsuleSlug prop (breaking change)
    — Has four inner tabs: Guest List / Access Codes / Ushers / Metrics
    — Imports AccessCodeSetup, UsherSessionManager,
      AccessMetricsDashboard from access-codes subfolder

app/manage/[slug]/page.tsx (manage dashboard)
    — AddOnsTable read-only (no unlock buttons)
    — LC_SERVICES array updated with correct service list
    — "Manage & Unlock Services" button routes to ServicesTab
    — community_stories removed from purchasable list

app/for/[slug]/stories/page.tsx
    — Fixed: event_name→honouree_name, tagline→event_tag
    — Uses CapsuleBottomNav with Suspense wrapper
    — Fetches EOH accounts for Gift of Honour section

components/CommunityStoriesClient.tsx
    — Completely rebuilt — dark premium theme
    — Story truncation (3 lines + Read More)
    — Gift of Honour section (conditional)
    — Admin response display
    — Share strip

app/publication-render/[token]/page.tsx
    — renderHonoureeProfile() now fetches capsule_profile_sections
    — renderCommunityStories() NEW — topic chapters
    — renderDdayCaptures() NEW — D-Day photos + tributes
    — Fetches: profile sections + story topics

app/for/[slug]/dday/page.tsx (NEW)
    — Mobile-first D-Day upload portal
    — 4-step flow: choose / identity / capture / success
    — Photos → gallery_items (source='dday')
    — Tributes → contributions (is_dday=true)

app/api/qr/[token]/route.ts (NEW)
    — Context-aware QR redirect
    — Before event → tribute wall
    — Event day + window open → /dday portal
    — After → tribute wall

app/api/access-codes/* (ALL NEW)
    — config, sections, generate, validate, list, send,
      metrics, manual-checkin, revoke, walkin

app/api/usher/* (ALL NEW)
    — session (POST/GET/DELETE), verify

app/manage/[slug]/checkin/page.tsx (NEW)
    — Standalone usher check-in interface
    — No nav, no sidebar — phone-first
    — PIN entry → scan/type → result → walk-in

app/for/[slug]/display/page.tsx (NEW)
    — Full-screen Live Contributor Wall
    — Supabase Realtime subscription
    — Spotlight animation for new arrivals
    — D-Day photo strip

app/api/email/approval/route.ts
    — Generates edit_token on approval
    — Sends edit link in Keepsake Card email
    — Fires Realtime broadcast to Live Wall display

app/api/email/verify-code/route.ts (v4)
    — Path-aware welcome email (free vs pre-booked)
    — 'path' param now passed from booking page PUT call
    — listUsers() instead of getUserByEmail()

app/api/email/correction-request/route.ts (NEW)
    — 4 correction templates
    — Max 2 per contribution before flagging

app/api/email/gift-notification/route.ts
    — No changes needed — already correct

app/api/phases/route.ts
    — Phase limit now tier-aware:
      free=1, paid=2, +1 per additional_phase in components
    — computePhaseLimit() function

app/api/checkout/bundle/route.ts
    — Fixed: currency/amount field names corrected
    — Auto-fetches organiser email from capsule if not provided
    — Ways_to_honour label updated to Gift of Honour

lib/payments/priceFetcher.ts
    — Now reads lc_pricing first (canonical)
    — Falls back to KEY_MAP/platform_config for legacy tier keys
    — Fixes all add-on prices across ServicesTab and booking flow

lib/content/serviceDetails.ts
    — EOH renamed to Gift of Honour throughout
    — All apostrophes in strings use double-quote delimiters

app/book/page.tsx
    — page_state = 'pending' for free capsules (not 'active')
    — page_state = 'pending_payment' for booked capsules
    — community_stories added to default components array
    — community_stories removed from ALL_SERVICES purchasable list
    — Other Event custom input field added
    — Free services listed with FREE badge in Step 3
    — Confirmation copy: "reserved" not "live"
    — Learn more links open /help in new tab
    — path passed to verify-code PUT for welcome email routing

app/help/page.tsx (v2 — complete rebuild)
    — All services documented (free + premium)
    — ?section=[id] deep linking
    — ?ref=booking|dashboard context banner
    — "Close this tab" button
    — Search across all content
    — Suspense boundary wrapping useSearchParams

app/api/regional-prices/route.ts
    — Cloudflare cf-connecting-ip header used first
    — Falls back to x-real-ip then x-forwarded-for

app/api/contributions/pending/route.ts (NEW)
    — Fetches pending contributions for manage dashboard

═══════════════════════════════════════════════════════════════
SECTION 3 — NEW DATABASE TABLES (all in LC Supabase)
═══════════════════════════════════════════════════════════════

event_access_config      Hall configuration per capsule
event_sections           Tables/zones/sections
event_usher_sessions     Temporary usher PIN sessions
event_access_codes       One code per guest (numeric + QR)
event_checkin_log        Append-only check-in audit log
event_access_cards       Card generation batch records

Altered: contributions
    + admin_response        TEXT NULL
    + admin_response_at     TIMESTAMPTZ NULL
    + edit_token            UUID NULL (populated on approval)
    + correction_count      INTEGER DEFAULT 0
    + correction_note       TEXT NULL
    status constraint updated: added 'pending_correction',
    'flagged', 'removed'; 'pending_review' → 'pending'

Altered: guests
    + participant_type   TEXT DEFAULT 'general'
    + vendor_company     TEXT
    + vendor_role        TEXT
    + valid_from         TIMESTAMPTZ
    + special_note       TEXT

═══════════════════════════════════════════════════════════════
SECTION 4 — NEW FOLDERS/COMPONENTS
═══════════════════════════════════════════════════════════════

components/manage/access-codes/
    AccessCodeSetup.tsx       Hall config wizard
    GuestCodeList.tsx         View/send/revoke codes
    UsherSessionManager.tsx   PIN generation + management
    AccessMetricsDashboard.tsx Live arrival metrics

app/manage/[slug]/checkin/    Standalone usher check-in page
app/for/[slug]/dday/          D-Day upload portal
app/for/[slug]/display/       Live Wall display page
app/api/access-codes/         All access code API routes
app/api/usher/                Usher session + verify routes
app/api/dday/                 D-Day upload route
app/api/qr/                   Context-aware QR redirect
app/api/contributions/        pending/ route added

═══════════════════════════════════════════════════════════════
SECTION 5 — ARCHITECTURE CHANGES (CG05 Programme)
═══════════════════════════════════════════════════════════════

CG05 Platform Realignment completed. Architecture frozen.

New platform documents (in project folder):
    RW00_PLATFORM_ARCHITECTURE_INDEX.md
    RW01_PAYMENT_SERVICES_PLATFORM.md
    RW03_PUBLICATION_PLATFORM.md
    RW04_RECOGNITION_PLATFORM.md

Updated product documents:
    LC00_ARCHITECTURE_INDEX.md  (v3.0)
    LC04_PAYMENT_ENGINE.md      (consumes RW01)
    LC05_LEGACY_CONTINUITY_ENGAGEMENT_ENGINE.md (renamed)
    LC06_LEGACY_RECOGNITION_ENGINE.md (consumes RW04)
    LC03 surgically patched (sections 20-25 added)

Retired: LC07_ECOSYSTEM_ALIGNMENT.md → replaced by RW00

═══════════════════════════════════════════════════════════════
SECTION 6 — LOCKED DECISIONS THIS SESSION
═══════════════════════════════════════════════════════════════

Community Stories
    — Always free, included in all capsules by default
    — Not purchasable. Removed from lc_pricing published list.
    — Backend IDs unchanged: community_stories

Gift of Honour
    — Client-facing name for "Expression of Honour"
    — Backend IDs unchanged: ways_to_honour,
      capsule_support_accounts, WaysToHonourSection

Phase limits
    — Free: 1 phase
    — Paid/booked: 2 phases
    — Additional: +1 per 'additional_phase' in components array
    — D-Day window: fixed 6am–6am, not organiser-adjustable

Capsule activation
    — Free capsule: page_state='pending', activates on first tribute
    — Pre-booked: page_state='pending_payment', stays pending
      until organiser chooses to activate
    — Gift capsule: same as pre-booked
    — NOT auto-activated on payment (pre-booked is what it says)

Tribute character limit
    — 500 characters for new submissions
    — Existing tributes over 500 chars preserved as-is
    — Placeholder directs to Community Stories for longer content

Correction requests
    — Max 2 per contribution
    — Third request flags contribution instead of sending email
    — 4 templates: minor_edit, length_adjustment,
      clarity_request, photo_quality

Access code uniqueness
    — Numeric code unique PER CAPSULE (composite index)
    — Not globally unique

event_checkin_log
    — Append-only. Never update or delete rows.

Checkout
    — All amounts in minor currency units (NGN = kobo)
    — NGN is NOT zero-decimal
    — Cloudflare cf-connecting-ip used for region detection

Live Wall
    — Display page: /for/[slug]/display
    — Realtime broadcast fires from approval route
    — No separate fast-approve interface (existing flow sufficient)

EventToolsHub
    — Subdomain: eventtools.revoworldtech.uk (for now)
    — Eventually: eventtoolshub.com
    — Planning in progress — not yet built

═══════════════════════════════════════════════════════════════
SECTION 7 — OUTSTANDING BUILD ITEMS (pre-launch priority)
═══════════════════════════════════════════════════════════════

M1 — Commercial Flow (partially done)
    □ Stripe live test — real card, real payment (founder action)
    □ Paystack live test (founder action — needs business account)
    □ Feature activation end-to-end verified post-payment
    □ Webhook reliability confirmed

M2 — Booking Flow Premium Pass (mostly done)
    □ Step 3 services: currency showing EUR for Nigerian IPs
      (Cloudflare header fix deployed — needs test)
    □ Step 3: checkbox alignment on scroll
    □ "Coming soon" on Voice/Video — check after price publish
    □ Return URL from feature detail page corrected

M3 — Manage Dashboard Premium Pass
    □ M3.1 ServicesTab price column alignment on mobile
    □ M3.2 Phase limit UX — "purchase additional" link
    □ M3.3 Access Code tabs in GuestManagement — test on device
    □ M3.4 Live Wall URL/QR in ServicesTab — done, test
    □ M3.5 Publication Editor back navigation, theme alignment
    □ M3.6 Overview page states verified

M4 — Contributor Experience
    □ Tribute wall 500 char limit — deployed, test on device
    □ Community Stories room — test on device
    □ D-Day portal — test on actual phone
    □ Submit flow field copy warmth review

M5 — Publication
    □ Publication browser-print test on live capsule
    □ Honouree profile section renders (not empty)
    □ Distribution email tested

M6 — Access Code System
    □ End-to-end test: generate → send → scan → check-in
    □ Usher PIN flow on actual phone
    □ Live metrics dashboard auto-refresh

M7 — Data Integrity
    □ Account deletion scoped to single capsule (not by email)
    □ Soft delete with 60-day recovery — not built
    □ render_token column in publications table — verify

M8 — Live Wall
    □ Display page test on large screen
    □ Realtime broadcast verified end-to-end

M9 — Platform Quality Pass
    □ Copy audit — no "Expression of Honour" anywhere
    □ No "Coming soon" on active features
    □ Error states all warm and actionable
    □ Empty states all present

M10 — Launch Readiness (founder actions)
    □ Stripe + Paystack live
    □ Feature prices all published
    □ Resend domains verified
    □ Vercel env vars for production
    □ Domain + SSL confirmed

═══════════════════════════════════════════════════════════════
SECTION 8 — PERMANENT RULES (never violate)
═══════════════════════════════════════════════════════════════

1.  Read every file before editing it
2.  params awaited as Promise<{slug:string}> — Next.js 16
3.  Never .catch() on Supabase — always try/catch
4.  TributeMap: dynamic import ssr:false always
5.  All imports @/ aliases, never src/
6.  No hardcoded prices — platform_config via priceFetcher
7.  NEXT_PUBLIC_APP_URL for links, never window.location.origin
8.  Satori: fully inline JSX, no component imports, no woff2
9.  event_checkin_log: append-only, never update/delete
10. numeric_code unique per capsule (composite), not globally
11. access_codes component key is 'access_codes'
12. Usher check-in page: NO navigation, NO sidebar
13. contributor_name not name; tribute_text not content
14. lat/lng not latitude/longitude (TributeMap)
15. capsule_support_accounts uses: method_label, account_holder,
    reference_guide, is_active
16. support_acknowledgements uses: supporter_name, supporter_email
17. GuestManagementSection requires capsuleSlug prop
18. community_stories free — never in purchasable list
19. D-Day photos: gallery_items (source='dday')
    D-Day tributes: contributions (is_dday=true)
20. page_state='tribute_collection' is RETIRED — use 'active'
21. Monetary values in minor units — NGN is NOT zero-decimal
22. Cloudflare cf-connecting-ip for region/currency detection
23. Architecture frozen at CG05 — no changes without review
24. Flow and UX discussed before any build begins
25. Multi-tenancy: all capsule_support_accounts queries
    must include capsule_id filter

═══════════════════════════════════════════════════════════════
SECTION 9 — STACK REMINDER
═══════════════════════════════════════════════════════════════

Next.js 16.2.6 · TypeScript · Tailwind CSS v4 · Supabase
Resend · Stripe (Paystack placeholders) · Vercel Hobby
Node 20.x on Vercel (not 24.x)
Repo: okajibulu/legacycapsule · main → Vercel
Domains: itslegacycapsule.com (Cloudflare) · revoworldtech.uk
LC Supabase: Frankfurt (operational)
RW-Ecosystem Supabase: Frankfurt (shared platform config)
