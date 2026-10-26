HANDOFF_AI29_TO_AI30.md
LegacyCapsule — Session Handoff
FROM: AI29 · Claude Opus 4.6 (security/schema) → Sonnet 4.6 (wiring/UI)
TO:   AI30
DATE: 25 September 2026
SESSION FOCUS: RLS Phase 2 hardening + Launch Promo system (schema, API, UI)

═══════════════════════════════════════════════════════════════
SECTION 0 — BEFORE BUILD COMMENCES (AI30 first priorities)
═══════════════════════════════════════════════════════════════

TWO THINGS BEFORE ANY CODE:

1. REPOSITORY CONNECTION
   Founder wants AI30 connected directly to the GitHub repository
   (okajibulu/legacycapsule) via the GitHub MCP server before any
   build work begins. This eliminates the collect → upload → edit →
   download → overwrite cycle and allows direct file inspection,
   surgical edits and commit without founder acting as intermediary.

   Setup path: GitHub publishes an official MCP server at
   github.com/github/github-mcp-server. Requires a GitHub Personal
   Access Token with repo scope. Once configured in Claude.ai custom
   connectors, AI30 can read and write files directly.

   AI30 should prompt the founder to confirm the connector is live
   before proceeding to any file work.

2. FOUNDER DISCUSSION FIRST
   Founder has concerns to discuss before build commences.
   AI30 must open with: "What would you like to discuss before
   we begin?" and work through those concerns fully before
   touching any file or database.

═══════════════════════════════════════════════════════════════
SECTION 1 — What AI29 completed
═══════════════════════════════════════════════════════════════

── RLS Phase 2 — SETTLED ✅
   Migration: rls_phase2_tighten_core_table_reads (applied to DB)

   capsules:      SELECT filtered to deleted_at IS NULL
   contributions: SELECT filtered to deleted_at IS NULL AND status = 'approved'
   gallery_items: SELECT filtered to deleted_at IS NULL AND approved = true

   Verified: 1 soft-deleted capsule hidden, 9 pending contributions
   hidden, 35 unapproved gallery items hidden. All service-role
   (manage dashboard) flows unaffected — service role bypasses RLS.

── Dead service_role policies — CLEARED ✅
   Migration: rls_phase2_drop_redundant_service_role_policies
   45 policies explicitly targeting {service_role} dropped.
   Service role bypasses RLS entirely — these were never evaluated.
   5 correctly-functioning public-role "Service role..." policies
   left untouched (capsule_milestones, capsule_share_events,
   tribute_responses).

── Security pre-checks — CLEARED ✅
   prevent_auth_user_delete(): confirmed trigger-only, EXECUTE
   restricted to postgres + service_role. No action needed.
   Mutable search_path: all 12 public functions already have
   SET search_path TO 'public'. No action needed.

── Leaked password protection — DEFERRED ⏳
   Requires Supabase Pro plan. Not currently available.
   Revisit when plan upgrades.

── Launch Promo System — COMPLETE (DB side) ✅
   Migration: lc_pricing_promotions_launch_promo

   Tables created:
     lc_pricing_promotions — promo definitions (quantity + time gated)
     lc_promo_claims — claim ledger (one row per email per promo)

   DB function created:
     lc_claim_promo_slot() — atomic slot claim, SECURITY DEFINER,
     service_role only, FOR UPDATE row lock prevents race conditions.
     Returns JSONB: { claimed, slot, reason, promo_id, discount_pct }

   Seed row: "Launch — Next 50"
     50% off, first 50 paying customers, all published products,
     EUR + NGN, no expiry date, orders_claimed = 0

   "Paying customer" definition: unique organiser_email with a
   completed payment. Prevents same person consuming multiple slots.
   Slot consumed AFTER payment verification in webhook handler.

── New files delivered (in repo) ✅
   app/api/promo/counter/route.ts
     Public GET endpoint. Returns live counter with 60s edge cache.
     Response: { active, label, claimed, limit, remaining, pct,
                 discount_pct, sold_out }
     Fails silently — never breaks page if DB unreachable.

   lib/payments/promoResolver.ts
     resolvePromoPrice() — single price resolution
     resolvePromoPrices() — batch resolution for API routes
     getActivePromo() — raw promo fetch with 60s in-memory cache
     invalidatePromoCache() — called after successful slot claim

   lib/payments/promoClaim.ts
     tryClaimPromoSlot() — calls lc_claim_promo_slot() DB function
     isFirstTimeCustomer() — optional pre-check helper
     Non-fatal: wrapped in try/catch, never blocks payment activation

   components/promo/LaunchPromoBanner.tsx
     LaunchPromoBanner — full banner with live counter + progress bar
     LaunchPromoInline — compact chip for ServicesTab heading
     Uses LC inline-style system (no Tailwind classes)
     style?: React.CSSProperties (not className)
     Copy: "Experience a new way to capture, preserve and share your
            premium event memories. Be part of the 50% off offer for
            the next 50 bookings."
     Urgency copy escalates as slots reduce (≤15 → ≤5 remaining)

── Surgical edits applied (in repo) ✅
   app/api/webhooks/stripe/route.ts
     tryClaimPromoSlot() call added after unlockCapsuleFeatures()
     organiser_email sourced from Stripe session metadata

   app/api/webhooks/paystack/route.ts
     tryClaimPromoSlot() call added after unlockCapsuleFeatures()
     organiser_email fetched via payments→capsules DB join
     (not available in Paystack webhook payload directly)

   app/page.tsx
     LaunchPromoBanner placed between hero and Section 2
     Section 2 emotional promise text: lc-charcoal → lc-gold
     (contrast fix — dark purple background rendered charcoal invisible)

   app/book/page.tsx
     LaunchPromoBanner placed above GoldRule in Screen 3
     services selector

   components/manage/ServicesTab.tsx
     LaunchPromoBanner placed below page header (above LimitsBar)
     LaunchPromoInline chip placed beside "Services & Add-ons" heading

── Last git commit
   AI29v2.12.66 — homepage Section 2 text: charcoal → gold for contrast

═══════════════════════════════════════════════════════════════
SECTION 2 — PRIMARY AI30 BUILD WORK
═══════════════════════════════════════════════════════════════

MODEL RECOMMENDATION: Sonnet 4.6 — the schema and resolver are
already built. This is wiring and UI work.
Switch to Opus 4.6 only if a design decision arises that has
downstream architectural consequence.

── TASK 1: Wire promo prices into regional-prices API
   File: app/api/regional-prices/route.ts
   Currently returns base prices from lc_pricing only.
   Needs to call resolvePromoPrices() from promoResolver.ts and
   return both base_price and promo_price in the response shape.

   Current response shape (approximate):
     { key, label, eur_price, ngn_price, ... }

   Required new shape:
     { key, label,
       eur_price, eur_promo_price, eur_has_promo,
       ngn_price, ngn_promo_price, ngn_has_promo,
       discount_pct, promo_label }

   IMPORTANT: Read the file first via GitHub connector before
   touching. Do not assume the current shape — verify.

── TASK 2: Strikethrough pricing display
   Files: app/book/page.tsx (Screen 3 services selector)
          components/manage/ServicesTab.tsx (services list)

   When has_promo = true for a product:
     - Show original price with strikethrough (muted, smaller)
     - Show promo price in gold, prominent
     - Do NOT show a % label — the banner already communicates the offer
     - Keep layout compact — price column should not reflow the grid

   Pattern to use (LC inline styles, no Tailwind):
     <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
       €{formatPrice(base_price)}
     </span>
     <span style={{ color: 'var(--lc-gold)', fontWeight: 700 }}>
       €{formatPrice(promo_price)}
     </span>

   IMPORTANT: Read both files via GitHub connector before touching.
   The price render is inside a grid — changes must preserve layout.

── TASK 3: Paystack Live switch
   This is an environment variable swap, not a code change.

   Step 1: Confirm keys are not hardcoded anywhere in the repo
     grep -r "sk_test\|pk_test" --include="*.ts" --include="*.tsx"
     Should return zero results. If any found, flag immediately.

   Step 2: In Vercel dashboard (itslegacycapsule.com project):
     Replace:
       NEXT_PUBLIC_PAYSTACK_KEY  — swap test key for live key
       PAYSTACK_SECRET_KEY       — swap test key for live key

   Step 3: In Paystack dashboard:
     Confirm webhook URL is registered under live settings:
     https://itslegacycapsule.com/api/webhooks/paystack

   Step 4: Smoke test
     One real small transaction (lowest priced add-on, NGN)
     Verify: payment completes → features unlock → promo slot
     claimed → confirmation email received

   Step 5: Confirm Stripe test vs live status
     Stripe is currently wired but pending Valnex Lda account
     activation. Do not switch Stripe keys until that is resolved.
     Flag if test keys are expiring.

═══════════════════════════════════════════════════════════════
SECTION 3 — CARRY-OVER ITEMS (lower priority)
═══════════════════════════════════════════════════════════════

These have been carried across multiple sessions. Not urgent but
should not be forgotten permanently.

  - Profile page section reorder: Event Phases before Contributor
    Gallery. Manual cut-paste once file is read.

  - "2 of 10" hardcoded cap: source file not yet identified.
    Needs grep across repo: grep -r "2 of 10\|2\/10" --include="*.tsx"

  - Public Event Moments photo count: app/for/[slug]/story/[phaseId]/page.tsx
    Currently shows all photos. Should show a capped public count.

  - EDS Video Reel zip export: jszip is installed, implementation
    pending. Refer to EDS-SPEC-001-AMD-001-v1_1.md for spec.

  - GCS Phase 8A: blocked on two founder decisions (D1 + D2).
    Do not proceed without those decisions confirmed.

  - Unused index audit: 107 flagged by Supabase performance advisor.
    Do NOT act on these pre-launch (zero traffic = zero usage stats).
    Re-run advisor 30 days after first live customer.

  - Checkout success "slot N" message: show founding customer slot
    number on payment success page. e.g. "You are booking #7 —
    thank you for being one of our first 50."

  - Payment confirmation email promo line: one line in the
    confirmation email body noting the launch pricing applied.

═══════════════════════════════════════════════════════════════
SECTION 4 — TECHNICAL RULES REMINDER FOR AI30
═══════════════════════════════════════════════════════════════

  - All prices stored in minor currency units (kobo/cents).
    Convert before display: divide by 100.

  - LC uses inline styles exclusively — no Tailwind className
    in manage dashboard or booking flow components.
    Homepage uses a mix (both className and inline style).

  - GCS architecture is locked — do not modify without reading
    GCS-SPEC-001.md and all amendments first.

  - Every file touched must have:
    1. File path at top as a comment
    2. AI session + model + date added to update history
    3. No # separator characters — use // for all comments

  - Surgical edits preferred over full file replacement.
    Full file replacement only when GitHub connector confirms
    the working copy matches the repo exactly.

  - Component Map: append AI30 addendum to COMPONENT_MAP.md
    after each session. Do not overwrite previous entries.

  - Git commit format:
    AI30v2.12.XX — brief description of what changed
    Increment version from AI29v2.12.66.

═══════════════════════════════════════════════════════════════
SECTION 5 — STANDING CONTEXT
═══════════════════════════════════════════════════════════════

  - No live customers yet — promo counter at 0/50.
  - Paystack on test mode — switch to live is AI30 Task 3.
  - Stripe pending Valnex Lda account activation (SCUML/CAC
    registration issue — Estate Management vs software category).
    International zones stay on Stripe once resolved.
  - Supabase project ID: zclmllbfuekyeshiihgt (LegacyCapsule)
  - RW-Ecosystem project ID: njgwunzphbflivqnyrjs
  - Both under org: qxbzngzoflnicnephzkm
  - Live domain: itslegacycapsule.com
  - Leaked password protection: deferred (Supabase Pro required)
