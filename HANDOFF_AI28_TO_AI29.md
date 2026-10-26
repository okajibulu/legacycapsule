HANDOFF_AI28_TO_AI29.md
LegacyCapsule — Session Handoff
FROM: AI28 · TO: AI29
DATE: 25 September 2026
SESSION FOCUS: RLS security hardening (critical item from AI27's audit)

Note: this document is compiled from the project record rather than
from AI28's own session transcript. Exact commit hashes/version
numbers for AI28's work should be confirmed against AI28's own
Component Map addendum if one exists — cross-check before treating
any version number below as authoritative.

═══════════════════════════════════════════════════════════════
SECTION 1 — What AI28 completed
═══════════════════════════════════════════════════════════════

RLS hardening — SETTLED. All 30 previously-unprotected tables
flagged in AI27's audit now have Row Level Security enabled with
policies, not just a blanket toggle:

  - The 6 tables confirmed actively exploitable via anon key
    (gift_credentials, gift_entitlements, gift_credential_visits,
    gift_stand_sessions, capsule_accounts, contributor_gallery_photos)
    are fully locked down:
      - capsule_accounts blocked from anon entirely (table contains
        password_hash) — authenticated role scoped to capsule owner
      - contributor_gallery_photos anon-visible only where
        status = 'visible'
      - GCS-related tables blocked from anon entirely (no live
        customers yet, so no legitimate anon read need currently)
  - Remaining 24 lower-urgency tables (not touched by browser code)
    also received RLS + policies as part of the same pass.

This closes the critical, actively-exploitable gap flagged in
HANDOFF_AI27_TO_AI28.md Section 2. No live customer data was ever
exposed — confirmed no live customers existed for the duration this
gap was open.

═══════════════════════════════════════════════════════════════
SECTION 2 — UNRESOLVED: RLS Phase 2 — tighten wide-open policies
═══════════════════════════════════════════════════════════════

MODEL RECOMMENDATION: Opus 4.6. Same reasoning as Phase 1 — writing
a database access policy wrong in either direction has real
consequences (data leak vs. broken flow), not a routine fix-up task.

FINDING: AI28's pass closed the "no policy at all" gap, but left a
second-order issue: `capsules`, `contributions`, and `gallery_items`
now have RLS enabled with policies that evaluate `true` for `ALL`
actions — i.e. technically "protected" but functionally as open as
having no RLS at all. These three are likely the highest-traffic
tables in the schema (every guest-facing page touches them), so this
is the natural next tightening pass.

RECOMMENDED APPROACH FOR AI29:
  1. Confirm via Supabase advisor (`get_advisors`, type: security)
     that these three are still flagged as overly-permissive —
     re-verify rather than assume the list from AI27's original pass
     is still current.
  2. For each, trace what the real access pattern should be — e.g.
     `capsules`: public read likely legitimate for published capsules
     via slug, but should not allow arbitrary writes; `contributions`
     and `gallery_items`: similar — public read of approved/visible
     rows, writes should be scoped to the submitting flow only.
  3. Draft policies, get founder sign-off (SETTLED/CONSEQUENCE/
     RECOMMENDATION/UNRESOLVED), apply via migration, re-test every
     guest-facing flow that touches these three tables before closing
     (capsule display pages, tribute wall, gallery, publication
     render — all touch at least one of the three).

═══════════════════════════════════════════════════════════════
SECTION 3 — UNRESOLVED: Introductory pricing / promo schema
═══════════════════════════════════════════════════════════════

MODEL RECOMMENDATION: Opus 4.6 for the design pass; can drop to
Sonnet 4.6 once the schema is settled and it's just admin-UI wiring.

Carried forward from AI27 — design was started, then deliberately
shelved for its own session before any schema was written (per
PROJECT_RULES: full specification before code). Proposed design
already drafted in AI27's session (see that session's transcript or
ask founder to relay): a separate `lc_pricing_promotions` table,
never overwriting the base price in `lc_pricing`, auto-expiring by
`starts_at`/`ends_at`, selectable per currency (EUR/NGN
independently, since NGN pricing is already independent of the
EUR-based zone multiplier system).

FOUNDER DECISIONS STILL OPEN (ask before designing further):
  1. Default introductory window length (7 / 14 / 21 / 30 days, or
     other)
  2. Which products get the first promo — all active add-ons, core
     only (capsule creation + publication), or founder picks once
     schema is live
  3. Discount style — flat override price, percentage off, or
     support both and decide per-promo

═══════════════════════════════════════════════════════════════
SECTION 4 — Minor open items (low effort, low urgency)
═══════════════════════════════════════════════════════════════

MODEL RECOMMENDATION: Sonnet 4.6 — all mechanical, no architecture
decisions involved.

  - `prevent_auth_user_delete()` is a SECURITY DEFINER function
    callable directly by anon/authenticated via RPC. Name suggests
    it should be an internal trigger only. Confirm intent, then
    revoke EXECUTE from anon/authenticated if unintentional.
  - 7 functions have mutable `search_path` (Supabase security
    advisor, WARN level) — apply `SET search_path = ''` (or the
    specific schema) to each per Supabase's own remediation doc.
  - Performance layer: 51 unindexed foreign keys, 57 unused indexes,
    123 redundant overlapping RLS policies (mostly `anon` + a
    "Service role full access" policy both matching the same
    action — the service-role policy is redundant since the service
    role bypasses RLS anyway). Natural to fold into the same pass as
    Section 2 above, since fixing the Phase 2 policies will touch
    several of these same tables.
  - Leaked password protection disabled in Supabase Auth — pure
    dashboard toggle (Authentication → Policies), not SQL-fixable.
    Founder action item, flag it to them directly rather than
    treating as a dev task.

═══════════════════════════════════════════════════════════════
SECTION 5 — Standing context AI29 should already have
═══════════════════════════════════════════════════════════════

- No live customers yet — still the safest window to finish
  hardening before real guest/organiser data is at stake.
- Paystack is on a personal/Starter Business account temporarily
  (RevoWorldTech Ventures' CAC registration lists Estate Management,
  not software — SCUML block — CAC correction in progress).
- Once Valnex Lda's account is active, Stripe activates for
  international zones (already architecturally wired per LC04 —
  Nigeria/Ghana/Kenya stay on Paystack regardless).
- Supabase connector, once authorized, covers both LegacyCapsule and
  RW-Ecosystem projects under one org (qxbzngzoflnicnephzkm) — no
  separate reconnect needed between them.
