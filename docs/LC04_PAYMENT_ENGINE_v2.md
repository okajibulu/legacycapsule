LC04_PAYMENT_ENGINE.md
LegacyCapsule Payment Engine
VALNEX, UNIPESSOAL LDA · RevoWorldTech

DOCUMENT INFORMATION
Document ID:    LC04
Owner:          LegacyCapsule Product Architecture
Status:         Authoritative Product Specification
Governance:     CG05 — RevoWorld Platform Realignment Directive

PLATFORM ALIGNMENT
Payment infrastructure is owned by RW01 Payment Services Platform.
LC04 describes how LegacyCapsule consumes that infrastructure
to support its commercial lifecycle.

Platform Dependencies:
    RW01  Payment Services Platform  (all payment infrastructure)

═══════════════════════════════════════════════════════════════
SECTION 1 — PURPOSE
═══════════════════════════════════════════════════════════════

The LegacyCapsule Payment Engine manages the commercial lifecycle
of all LegacyCapsule products and services.

Its purpose is not merely to collect payments. It is to support
the complete commercial journey of capsule creation, premium
upgrades and service activation — reliably, regionally and
without exposing payment complexity to organisers.

LegacyCapsule consumes the RevoWorld Payment Services Platform
(RW01) for all payment infrastructure. This document defines
how LegacyCapsule initiates, configures and responds to payment
activity — not how payments are processed.

═══════════════════════════════════════════════════════════════
SECTION 2 — FOUNDER PRINCIPLE
═══════════════════════════════════════════════════════════════

Customers should think about their purchase.
Never about the payment processor.

Payment infrastructure must be invisible.
The LegacyCapsule experience must remain visible.

═══════════════════════════════════════════════════════════════
SECTION 3 — DESIGN PRINCIPLES
═══════════════════════════════════════════════════════════════

1.  LegacyCapsule defines what is purchased. RW01 handles how.
2.  Payment flows must be invisible and frictionless to organisers.
3.  Features activate only after RW01 confirms payment verified.
4.  Regional pricing reflects the organiser's location automatically.
5.  LegacyCapsule never processes payments directly.
6.  All payment configuration is managed through platform pricing.
7.  Future RevoWorldTech products share the same payment infrastructure.

═══════════════════════════════════════════════════════════════
SECTION 4 — OWNERSHIP BOUNDARY
═══════════════════════════════════════════════════════════════

LegacyCapsule owns:

    · Product definitions (what is being sold)
    · Pricing entries in the platform pricing store
    · Feature activation logic (triggered by payment.verified)
    · Commercial decisions (what to charge and why)
    · Organiser-facing purchase experience
    · Payment purpose metadata

LegacyCapsule does NOT own:

    · Payment processing (owned by RW01)
    · Checkout orchestration (owned by RW01)
    · Transaction records (owned by RW01)
    · Provider abstraction (owned by RW01)
    · Refund mechanics (owned by RW01)
    · Invoice generation (owned by RW01)
    · Financial reporting (owned by RW01)

Single Source of Truth:
All commercial transactions are recorded and owned by RW01.
LegacyCapsule reads payment status from RW01 events only.

═══════════════════════════════════════════════════════════════
SECTION 5 — LEGACYCAPSULE PRODUCTS SUPPORTED
═══════════════════════════════════════════════════════════════

Active:
    · Capsule creation (pre-booked path)
    · Premium add-on activation (ServicesTab purchases)
    · Bundle checkout (multiple add-ons in one session)
    · Gift a Capsule (payment by one party for another)

Near Future:
    · Publication distribution packages
    · Hardcopy publication packages
    · Event services
    · Planner packages

Future:
    · Recognition products
    · Corporate packages
    · Ecosystem products (via RW01 shared infrastructure)

═══════════════════════════════════════════════════════════════
SECTION 6 — PRICING CONFIGURATION
═══════════════════════════════════════════════════════════════

LegacyCapsule pricing is stored in:

    LC Database:       lc_pricing table
                       Keys, labels, EUR and NGN amounts,
                       safe ranges, published status

    RW-Ecosystem:      platform_config table
                       Legacy tier pricing (base packages)
                       Ecosystem-wide configuration values

The lc_pricing table is the canonical source for all add-on
pricing. The priceFetcher library reads lc_pricing first,
falling back to platform_config for legacy tier keys only.

Pricing Principle:
All monetary values stored as integers in minor currency units.
NGN is not a zero-decimal currency — stored in kobo.
EUR, GBP, USD stored in cents or pence.
Display conversion applied at presentation layer only.

Regional Pricing:
Region detection via IP geolocation (Cloudflare cf-connecting-ip
header preferred, x-forwarded-for as fallback).

Zones and currencies:
    · Nigeria           → NGN (Paystack)
    · United Kingdom    → GBP (Stripe)
    · United States     → USD (Stripe)
    · Canada            → CAD (Stripe)
    · West Africa       → GHS band
    · East Africa       → KES band
    · Rest of World     → EUR (Stripe)

═══════════════════════════════════════════════════════════════
SECTION 7 — PAYMENT LIFECYCLE (LEGACYCAPSULE VIEW)
═══════════════════════════════════════════════════════════════

Organiser selects services or package
            ↓
LC determines product IDs and pricing entries
            ↓
LC initiates checkout via RW01 (bundle or single)
            ↓
RW01 routes to correct payment provider
            ↓
Organiser completes payment
            ↓
RW01 Verification Engine confirms receipt
            ↓
payment.verified event received by LC
            ↓
Feature Unlocker activates purchased services
            ↓
Organiser notified — services active

═══════════════════════════════════════════════════════════════
SECTION 8 — FEATURE ACTIVATION
═══════════════════════════════════════════════════════════════

The Feature Unlocker is LC's response to payment.verified.

On payment confirmed:
    · Purchased feature keys added to capsule.components array
    · Each key activates the corresponding service in ServicesTab
    · Capsule page_state updated if applicable
    · Organiser confirmation displayed

Feature Keys (canonical):
    audio_tributes        Voice Tributes
    video_tributes        Video Tributes
    ways_to_honour        Gift of Honour
    publication           Digital Publication
    guest_management      Guest Management & Seating
    access_codes          Access Code System
    attire                Fabric & Attire
    extended_validity     Extended Validity
    additional_phase      Additional Event Phase
    community_stories     Community Memories & Stories (free — not purchasable)

Activation Rules:
    · Features never activate before payment.verified
    · community_stories included in all capsules by default
    · additional_phase may appear multiple times in components
      (each occurrence = one additional phase purchased)
    · Capsule.page_state transitions on payment only for
      pre-booked capsules where explicit activation is required

═══════════════════════════════════════════════════════════════
SECTION 9 — CAPSULE LIFECYCLE AND PAYMENT STATES
═══════════════════════════════════════════════════════════════

Capsule States Related to Payment:

    pending_payment     Pre-booked capsule awaiting payment completion.
                        Capsule exists but is not yet active.

    pending             Free capsule. Created and awaiting first tribute.
                        Activates on first tribute received.

    active              Capsule is live and accepting tributes.

    draft               Internal draft. Not publicly accessible.

Payment States (owned by RW01, read by LC):
    Pending · Processing · Successful · Failed · Refunded
    Cancelled · Expired

LC responds only to Successful (payment.verified event).
All other states are informational for organiser communication.

═══════════════════════════════════════════════════════════════
SECTION 10 — PROVIDER CONFIGURATION
═══════════════════════════════════════════════════════════════

Provider selection is handled by RW01.
LC does not reference providers directly.

Current Providers (via RW01):
    Stripe    → International checkout (EUR, GBP, USD, CAD)
    Paystack  → Nigeria primary (NGN)

LegacyCapsule configuration requirements:
    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    PAYSTACK_SECRET_KEY       (placeholders in place)
    PAYSTACK_WEBHOOK_SECRET   (placeholders in place)
    NEXT_PUBLIC_APP_URL       (for checkout success/cancel URLs)

═══════════════════════════════════════════════════════════════
SECTION 11 — CHECKOUT TYPES
═══════════════════════════════════════════════════════════════

Single Feature Checkout
    One add-on purchased via /api/checkout/feature
    Used from ServicesTab individual unlock

Bundle Checkout
    Multiple add-ons in one Stripe session
    Used from booking flow Step 3 services selector
    Route: /api/checkout/bundle

Gift Checkout
    Payment made by one party for another's capsule
    Same bundle route with gift metadata
    book_mode: 'gift' in payment metadata

Pre-Booked Capsule Checkout
    Capsule creation + selected services in one flow
    book_mode: 'own' in payment metadata
    Capsule remains pending_payment until verified

═══════════════════════════════════════════════════════════════
SECTION 12 — RELATIONSHIPS
═══════════════════════════════════════════════════════════════

Consumes:
    RW01  Payment Services Platform  (all payment infrastructure)

Depends On:
    lc_pricing table                 (pricing configuration)
    platform_config (RW-Ecosystem)   (legacy tier pricing)
    Feature Unlocker                 (activation on payment.verified)

Supports:
    Capsule Engine          (capsule creation and activation)
    ServicesTab             (add-on unlock flow)
    Booking Flow            (pre-booked capsule journey)
    Publication Engine      (distribution payment)
    Event Services Engine   (event service payments)

Cross-References:
    RW00  Platform Architecture Index
    RW01  Payment Services Platform
    LC01  System Map
    LC02  Event Services Engine
    LC03  Legacy Publication System
