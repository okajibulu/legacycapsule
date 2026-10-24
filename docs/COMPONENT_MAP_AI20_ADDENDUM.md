# COMPONENT_MAP — AI20 ADDENDUM
# AI20 — Claude Opus 4.6 — 15 August 2026
# Platform: AI20v2.11.90 → AI20v2.12.07
# Previous: COMPONENT_MAP_AI19_ADDENDUM.md

---

## SECTION A — Session Work Log

| Version | Files Changed | Summary | Status |
|---------|--------------|---------|--------|
| v2.11.90–92 | 11 email files | Full ECS rewrite of all transactional emails | ✅ |
| v2.11.93–94 | named-send/route.ts, distribute/route.ts | Subject lines use honouree name + event type | ✅ |
| v2.11.96 | PublicationEditor.tsx | Distribution send button: full state machine redesign | ✅ |
| v2.11.97 | PaystackAdapter.ts (NEW), paystack webhook (NEW), bundle/route.ts, featureUnlocker.ts | Paystack integration | ✅ |
| v2.11.98 | bundle/route.ts | Stripe null-guard, processor bug fix, lineItems any[] | ✅ |
| v2.11.99 | ServicesTab.tsx | coming_soon, preset buttons, LimitsBar | ✅ |
| v2.11.99b | app/book/page.tsx | Card grid event types, preset buttons, gift delivery picker | ✅ |
| v2.11.99c | lib/content/serviceDetails.ts | Validity copy fixed, COMING_SOON_SERVICES constant | ✅ |
| v2.12.00 | migrations/ai20_sprint1_commercial_model_v3.sql | 6 new tables, 9 capsule columns, 18 pricing rows | ✅ |
| v2.12.01 | featureUnlocker.ts, limits/route.ts, TributeWallClient.tsx, queue-submission/route.ts (NEW), queue-update-email/route.ts (NEW), TierUpgradePanel.tsx (NEW), for/[slug]/page.tsx | Sprint 2+3: tier enforcement, wall experience | ✅ |
| v2.12.02 | priceFetcher.ts, ServicesTab.tsx | KEY_MAP Sprint 1 keys, floating checkout bar | ✅ |
| v2.12.03–05 | ServicesTab.tsx, manage/page.tsx, limits/route.ts | Preset toggle, page header, FreeTierBar fixes, free tier detection fix | ✅ |
| v2.12.06 | orders/route.ts (NEW), help/layout.tsx (NEW), ServicesTab.tsx | Order history route, help nav removal, inline prices | ✅ |
| v2.12.07 | orders/route.ts | Filter abandoned pending payments, summary counts paid only | ✅ |

---

## SECTION B — New Files Created in AI20

| File | Path | Purpose | Version |
|------|------|---------|---------|
| PaystackAdapter.ts | lib/payments/adapters/PaystackAdapter.ts | Paystack checkout, verify, webhook signature | AI20v2.11.97 |
| paystack webhook | app/api/webhooks/paystack/route.ts | Receives charge.success/failed, calls featureUnlocker | AI20v2.11.97 |
| queue-submission route | app/api/capsule/queue-submission/route.ts | Autosaves contributor work at wall-hit | AI20v2.12.01 |
| queue-update-email route | app/api/capsule/queue-update-email/route.ts | Adds email to queued submission post wall-hit | AI20v2.12.01 |
| TierUpgradePanel.tsx | components/manage/TierUpgradePanel.tsx | Manage dashboard tier status + upgrade prompts | AI20v2.12.01 |
| limits route | app/api/capsule/limits/route.ts | Live free tier counters for dashboard | AI20v2.12.01 |
| orders route | app/api/capsule/orders/route.ts | Payment history for capsule | AI20v2.12.06 |
| help layout | app/help/layout.tsx | Removes global nav from help page | AI20v2.12.06 |
| Sprint 1 migration | migrations/ai20_sprint1_commercial_model_v3.sql | Commercial model DB foundation | AI20v2.12.00 |

---

## SECTION C — Modified Files

| File | Path | Version | Key Changes |
|------|------|---------|-------------|
| PublicationEditor.tsx | components/publication/PublicationEditor.tsx | AI20v2.11.96 | Distribution section: clean state machine (idle→previewing→confirming→sending→done\|error). existingPdfUrl dependency removed. |
| featureUnlocker.ts | lib/payments/featureUnlocker.ts | AI20v2.12.01 | All Sprint 1 keys: capsule_activation_base, tier upgrades, access code blocks, extend_6mo, reactivation_admin. logLifecycleEvent() helper. Max 6mo extension cap. |
| limits/route.ts | app/api/capsule/limits/route.ts | AI20v2.12.05 | Free tier detection by contribution_tier (not lifecycle_state). Combined voice count. wall_status. contribution_tier in response. |
| priceFetcher.ts | lib/payments/priceFetcher.ts | AI20v2.12.02 | All Sprint 1 keys added to KEY_MAP. Fallback skips platform_config for lc_pricing-only keys. |
| bundle/route.ts | app/api/checkout/bundle/route.ts | AI20v2.11.98 | Paystack routing. Essential/Signature preset resolution. Stripe null-guard. lineItems any[]. |
| ServicesTab.tsx | components/manage/ServicesTab.tsx | AI20v2.12.06 | Floating checkout bar. Inline price+Add on cards. Preset toggle-deselect. Page header. LimitsBar. |
| book/page.tsx | app/book/page.tsx | AI20v2.11.99b | Visual card grid event types. Presets. Gift delivery picker. Free strip corrected. |
| serviceDetails.ts | lib/content/serviceDetails.ts | AI20v2.11.99c | 90-day validity copy. 1-phase FAQ. COMING_SOON_SERVICES constant. BOOKING_SERVICE_ORDER reordered. |
| manage/page.tsx | app/manage/[slug]/page.tsx | AI20v2.12.02 | FreeTierBar plain English. Expand Capsule removed. Expiry conditional (≤30 days). FREE_TRIBUTE_LIMIT 30. |
| TributeWallClient.tsx | components/TributeWallClient.tsx | AI20v2.12.01 | Wall state vars. handleWallAutosave. Wall check in handleSubmit. Wall-hit modal. Warning banner. |
| for/[slug]/page.tsx | app/for/[slug]/page.tsx | AI20v2.12.01 | lifecycle_state, contribution_tier, voice_ceiling added to capsule select. |

---

## SECTION D — Database Changes

| Table | Change | Date |
|-------|--------|------|
| capsules | Added: lifecycle_state, dormant_at, purge_scheduled_at, contribution_tier, access_code_block, voice_ceiling, activated_at, validity_months, showcase_consent | 11 Aug 2026 |
| lc_pricing | 18 new pricing keys added with NGN + EUR prices | 11–15 Aug 2026 |
| free_tier_limits | voice_ceiling_free key added (value: 30) | 11 Aug 2026 |
| free_tier_limits | Public read RLS policy added | 15 Aug 2026 |
| contribution_tier_config | NEW TABLE — 5 tier rows | 11 Aug 2026 |
| access_code_block_config | NEW TABLE — 5 block rows | 11 Aug 2026 |
| queued_submissions | NEW TABLE — wall-hit autosave | 11 Aug 2026 |
| capsule_lifecycle_events | NEW TABLE — audit log | 11 Aug 2026 |
| dormant_reactivation_requests | NEW TABLE | 11 Aug 2026 |
| lc_showcase_archive | NEW TABLE — future gallery | 11 Aug 2026 |
| payments | No schema changes. Confirmed: NO expires_at column | 15 Aug 2026 |

---

## SECTION E — Design Decisions

| ID | Decision | Date |
|----|---------|------|
| DD-COMM-001 | Freemium model: same base activation fee for all event types. Activity tiers (V = voices) are the scaling mechanism. Not guest count — guest count assumes Access Codes. | 11 Aug 2026 |
| DD-COMM-002 | voice_ceiling = combined tributes + stories. Single ceiling, split display. One upgrade path. | 11 Aug 2026 |
| DD-COMM-003 | Estate-∞V/G: NULL in voice_ceiling/access_code_block columns = unlimited. Never treat as zero. | 11 Aug 2026 |
| DD-COMM-004 | Validity: 6 months from first tribute on paid tier. 90 days free. Max 6 months per extension. Annual archive max 1 year at a time. | 11 Aug 2026 |
| DD-COMM-005 | Event Moments: Option C soft cap. All photos stored, 20 display publicly on free. Upgrade shows full gallery. No mid-event cutoff. | 11 Aug 2026 |
| DD-COMM-006 | Preset buttons (Essential/Signature) are display convenience only. PRESET_FEATURES in bundle/route.ts is the canonical definition. ServicesTab and booking page both read from the same route. | 11 Aug 2026 |
| DD-COMM-007 | Pending payment records >24hrs are abandoned checkout sessions. Filter from order history. Show only succeeded, paid, and pending within 24hrs. | 15 Aug 2026 |
| DD-UX-001 | FreeTierBar expiry shown only when ≤30 days remain. Before that, it creates anxiety without any actionable context. | 14 Aug 2026 |
| DD-UX-002 | "Expand Capsule" button removed from FreeTierBar. Organiser reaches Services via nav tab. Redundant button = eye clutter. | 14 Aug 2026 |
| DD-UX-003 | Preset toggle behaviour: clicking a selected preset clears its selections. Clicking again reapplies. | 14 Aug 2026 |
| DD-PAY-001 | Stripe is optional — only initialises when STRIPE_SECRET_KEY present. International payments return 503 gracefully when key absent. | 11 Aug 2026 |
| DD-PAY-002 | PAYSTACK_WEBHOOK_SECRET falls back to PAYSTACK_SECRET_KEY in test mode. Separate secret only needed in live mode. | 14 Aug 2026 |

---

## SECTION F — Bugs Closed

| ID | Description | Fixed In |
|----|-------------|---------|
| DIST-SEND-001 | Distribution send button permanently disabled — existingPdfUrl guard, willReceiveNow=0, stale closure | AI20v2.11.96 |
| CHECKOUT-001 | "Something went wrong" — priceFetcher KEY_MAP missing Sprint 1 keys | AI20v2.12.02 |
| CHECKOUT-002 | 500 on bundle route — PAYSTACK_SECRET_KEY not in Vercel env vars | AI20v2.12.04 |
| LIMITS-404 | /api/capsule/limits 404 — SUPABASE_SERVICE_ROLE_KEY not in Vercel env | AI20v2.12.04 |
| LIMITS-FREETIER | limits route: lifecycle_state='active' incorrectly flagging free capsules as paid | AI20v2.12.05 |
| ORDERS-500 | orders route: selecting expires_at column that doesn't exist on payments table | AI20v2.12.06 |
| ORDERS-INFLATE | Order history showing 10+ orders including abandoned pending sessions | AI20v2.12.07 |
| SERVICES-DUPE | ServicesTab: presets and services appearing twice — orphaned JSX block outside component | AI20v2.12.02 |
| SERVICES-HIDDEN | Pay button hidden behind CapsuleBottomNav — floating bar now at bottom:72 | AI20v2.12.03 |
| SERVICES-NOPRICE | Price and Add button only visible on card expand — now always visible in header | AI20v2.12.06 |
| HELP-NAV | Global nav showing on help page — layout override added | AI20v2.12.06 |
| FREETIERBAR-VAGUE | "Expand Capsule" button — vague, redundant, wrong timing | AI20v2.12.02 |
| BOOKING-DURATION | Booking page: "6 Months Online", "2 Event Phases" hardcoded — now 90 days, 1 phase | AI20v2.11.99b |
| SERVICES-SUGGESTED | guest_management and attire in SUGGESTED_BY_EVENT — now removed | AI20v2.11.99b |

---

## SECTION G — Known Issues Remaining

| ID | Issue | Priority |
|----|-------|----------|
| WALL-RESTORE | ?restore= handler in TributeWallClient not built | 🔴 High |
| BATCH-NOTIFY | No batch email when organiser upgrades tier | 🔴 High |
| TIER-PANEL | TierUpgradePanel built but not wired into manage dashboard | 🔴 High |
| UX-AUDIT | Full app friction audit — plain English guidance throughout | 🔴 Founder mandate |
| HELP-COPY | Help page validity copy outdated (3mo/6mo, 2 phases) | 🟡 Medium |
| EMAIL-QUOTA | email_sends_log + Resend webhook + LCAdmin widget | 🟡 Medium |
| SHOWCASE | LC Showcase Gallery — homepage strip | 🟡 Medium |
| LIFECYCLE-CRON | Nightly expiry→dormancy→purge jobs | 🟡 Medium |
| RVQ | Repeat Visit Quotient metric | 🟡 Medium |
| VIDEO-AUDIO | Record+upload UI, duration enforcement | 🟡 Medium |

---

# END OF AI20 ADDENDUM
# AI20 — Claude Opus 4.6 — 15 August 2026
# Platform: AI20v2.12.07 | Branch: main
