# HANDOFF_v1_9_8_TO_NEXT_AI.md
# LegacyCapsule — AI Session Handoff Document
# FROM: AI12 · Claude Opus/Sonnet 4.6
# DATE: 21 July 2026
# VERSION: v1.9.8
# NEXT AI: Read this document IN FULL before touching any file.

---

## 1. PROJECT OVERVIEW

**Product:** LegacyCapsule (itslegacycapsule.com)
**Company:** VALNEX, UNIPESSOAL LDA · RevoWorldTech
**Founder / CG01:** Okajibulu (designated CG01 in multi-AI workflow)
**Repo:** okajibulu/legacycapsule · Deploys from `main` branch
**Stack:** Next.js 16.2.6 · TypeScript · Tailwind v4 · Supabase (PostgreSQL) · Resend · Stripe · Vercel Hobby
**Domains:** itslegacycapsule.com (Cloudflare) · revoworldtech.uk · admin.revoworldtech.uk

**Two Supabase projects (both Frankfurt):**
- LC operational: `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- RW-Ecosystem shared: `NEXT_PUBLIC_RW_ECOSYSTEM_URL` + `RW_ECOSYSTEM_SERVICE_ROLE_KEY`

**IDE:** VS Code on Windows. PowerShell terminal (use semicolons not && for chaining).

---

## 2. WHAT LEGACYCAPSULE IS

A premium digital event legacy platform. An organiser creates a capsule for an occasion (wedding, retirement, memorial, birthday, chieftaincy etc). Guests visit the capsule URL and leave written tributes, voice notes, video messages, photos as well as a community section called Memories section where people can add past stories about the honuree or event. The app has premium tools for organiser to use to moderate content, manage guests, coordinate event attire, generate an end digital publication, and distribute it after the event via email from the app. The platform is designed for:
- **Private individuals** organising their own family event
- **Professional event planners** serving clients
- **Aspiring coordinators** stepping up for the first time

Tagline: *Events end. Legacies don't.*

**Core design principle:** Rolls Royce approach — rugged, flexible, premium, intelligent communication, messages around the app to carry users along for the features that could need explanation in order to avoid ambiguity, non-technical interface requiring almost zero customer support.

---

## 3. MULTI-AI WORKFLOW

The Founder runs multiple AI instances in parallel atimes but at this near-launch phase a solo AI. Read the designated role before acting:
- **CG01** = Founder
- **AI1–AI12** = Build sessions (this was AI12)
- Always check `HANDOFF.md`, `CURRENT_STATE.md`, and `LC_CONTEXT.md` in the project folder before starting
- **Rule: Discuss and agree UX/flow first → Founder confirms → build**
- Never overwrite files without reading the current state first
- Execute all changes to a file in one pass
- Dont fail to advise of reasoning model to switch to for each task and the watch word is to save tokens so use sonnet .46 most times and only increase for higher tasks and revert after.
---

## 4. VERSION HISTORY — THIS SESSION (AI12)

| Version | What Changed |
|---------|-------------|
| v1.7.8 | Session start baseline |
| v1.8.0 | RW02 authored, service copy rewrite, booking flow Step 3 rebuilt, help page v3, brand positioning patches |
| v1.8.1 | GuestManagementSection: GuestCodeList wired, 3-scope selector, ticket/access pass generation (M6.6) |
| v1.8.2 | ServicesTab: access_codes added, durations fixed (60s), prop chain fixed |
| v1.8.3 | D-Day rebuilt (photos only, 6-photo limit, compression), publication subscribers, platform_config 24 keys seeded |
| v1.8.4 | D-Day unblocked (/api/capsule/public-info), Publication Dispatch Manager (2-step preview+send) |
| v1.8.5 | PublicationSubscribePanel in stories room, participant_category migration |
| v1.8.6 | PublicationSubscribePanel on tribute wall, email incentive copy |
| v1.8.7 | Event phases strip on profile + legacy pages |
| v1.8.8 | Phase strips on tribute wall + community stories, capacity packs in lc_pricing |
| v1.8.9 | Capacity Monitor in GuestManagementSection, capacity API route, capacity packs in ServicesTab |
| v1.9.0 | CapsuleBottomNav rebuilt (4+1 tabs), community_stories guard removed, Capsule Reveal removed, UpgradeCard replaced, serial numbers on tributes, duplicate share box removed |
| v1.9.1 | Profile page overflow fixed, inline nav buttons removed, phase strip added |
| v1.9.2 | Services tab checkbox alignment fixed (ResizeObserver height sync) |
| v1.9.3 | Currency detection fixed — Cloudflare cf-ipcountry header first, no more ipapi.co rate limit failures |
| v1.9.4 | Payment metadata enriched (feature_ids), ip_country in honouree page, country count fixed |
| v1.9.5 | Order history panel, capacity pack activation in featureUnlocker, orders API route |
| v1.9.6 | FEAT-001 Send Payment Link — modal in ServicesTab, API route, email template, serviceDetails entry |
| v1.9.7 | ServicesTab: D-Day Live Wall repositioned, cancel URL fix (dashboard returns to Services tab), apostrophes fixed |
| v1.9.8 | Tribute serial numbers in manage dashboard, name/relationship split to two lines (pending deploy) |

---

## 5. ALL FILES TOUCHED THIS SESSION

### New files created:
| File | Purpose |
|------|---------|
| `app/api/capsule/public-info/route.ts` | D-Day page capsule info + photo limit |
| `app/api/guests/capacity/route.ts` | Guest capacity usage vs allocation |
| `app/api/capsule/orders/route.ts` | Paid order history |
| `app/api/publication/subscribe/route.ts` | Publication subscriber registration |
| `app/api/publication/distribute/route.ts` | Multi-source deduped publication dispatch |
| `app/api/checkout/send-payment-link/route.ts` | FEAT-001 third-party payment link |
| `components/capsule/PublicationSubscribePanel.tsx` | Inline subscribe panel |
| `components/manage/OrderHistoryPanel.tsx` | Order history in Settings tab |

### Modified files (place these in VS Code):
| File | Location |
|------|---------|
| `app/book/page.tsx` | Booking flow Step 3 rebuild |
| `app/for/[slug]/dday/page.tsx` | D-Day photos only, 6-photo limit |
| `app/for/[slug]/profile/page.tsx` | Overflow fix, phases strip, nav cleanup |
| `app/for/[slug]/legacy/page.tsx` | Phases strip, subscribe panel |
| `app/for/[slug]/stories/page.tsx` | community_stories guard removed, currentPage=memories |
| `app/for/[slug]/honouree/page.tsx` | ip_country added to select |
| `app/for/[slug]/honouree/HonoureePortalClient.tsx` | ip_country in Tribute interface |
| `app/manage/[slug]/page.tsx` (Mpage) | Routing fixes, UpgradeCard→pointer, Reveal removed, OrderHistoryPanel |
| `app/admin/capsule/[id]/ComponentsPanel.tsx` | 8 changes: attire/access_codes/additional_phase added, community_stories removed, durations/labels fixed |
| `app/api/dday/upload/route.ts` | sharp compression, 6-photo limit, device token |
| `app/api/checkout/bundle/route.ts` | feature_ids in metadata, source param, cancel URL conditional |
| `app/api/regional-prices/route.ts` | Cloudflare header detection first |
| `components/TributeWallClient.tsx` | Serial numbers, name/relationship split, subscribe panel, phase strip |
| `components/manage/ServicesTab.tsx` | Alignment fix, FEAT-001 Send Link, D-Day position, capacity packs, source param |
| `components/manage/GuestManagementSection.tsx` | CapacityMonitor, 3-scope selector, GuestCodeList wired, ticket generation |
| `components/manage/TributeSection.tsx` | Serial numbers, name/relationship split |
| `components/CapsuleBottomNav.tsx` | 4+1 tab structure, Memories tab, Event Story removed |
| `lib/content/serviceDetails.ts` | Full rewrite + all new services + send_payment_link |
| `lib/payments/regionDetector.ts` | detectRegionFromHeaders() added |
| `lib/payments/featureUnlocker.ts` | Capacity packs added to FEATURE_MAP |

### SQL migrations run (both confirmed successful):
| File | Database | Status |
|------|---------|--------|
| `rw_ecosystem_config_seed_v4.sql` | RW-Ecosystem | ✅ 24 config keys |
| `lc_publication_subscribers.sql` | LC operational | ✅ Table + gallery_items columns |
| `guests_participant_category.sql` | LC operational | ✅ Column + backfill |
| `lc_pricing_capacity_packs_v4.sql` | LC operational | ✅ 3 capacity pack rows |

---

## 6. ARCHITECTURE — KEY DECISIONS MADE THIS SESSION

### Tab Navigation (CapsuleBottomNav)
**4 standard tabs + 1 conditional:**
- Tab 1: Tributes → `/for/[slug]` (always)
- Tab 2: Memories → `/for/[slug]/stories` (when `community_stories` in components)
- Tab 3: Profile → `/for/[slug]/profile` (always)
- Tab 4: Highlights → `/for/[slug]/legacy` (always)
- Tab 5: Attire → `/for/[slug]/attire` (when `attire` in components)

`CapsulePage` type: `'tribute' | 'memories' | 'profile' | 'legacy' | 'attire'`

Event Story (`/for/[slug]/story/[phaseId]`) has `currentPage="tribute"` — not in nav, accessed via phase strip.

### D-Day Capture
- Photos ONLY — no tribute text on D-Day page
- 6 photos per device per phase (config: `lc.dday.photos_per_device_per_phase`)
- Device identified by IP+UA hash → `device_token` column on `gallery_items`
- Server-side compression via `sharp` (max 1200px, JPEG quality 82)
- Tribute Wall link shown as secondary action on D-Day page

### Guest Capacity System
- Free capsule base: 150 guests (`lc.capacity.free_base`)
- Paid capsule base: 300 guests (`lc.capacity.paid_base`)
- Growth Pack: +250 guests (₦25,000 / €15)
- Celebration Pack: +750 guests (₦65,000 / €35)
- Grand Event Pack: +2,000 guests (₦175,000 / €75)
- `participant_category` column on `guests`: `'guest'` (counts) / `'event_team'` / `'organiser'`
- Grace window: 10% over allocation before hard stop
- Alert thresholds: 70% / 85% / 95%

### Community Stories
- **Free for all capsules** — not a purchasable component
- Not in ComponentsPanel toggles
- `community_stories` guard removed from stories page
- Appears as "Memories" tab in navigation

### Publication Dispatch (multi-source deduped)
Three recipient sources, deduped by email:
1. `contributions` table (tribute contributors with email)
2. `gallery_items` where `source='dday'` (D-Day photo contributors with email)
3. `publication_subscribers` table (self-registered or organiser-added)

Dispatch is always manual — organiser controls when it goes out. Two-step: preview recipient counts → confirm send.

### Currency Detection
`cf-ipcountry` Cloudflare header read first → instant, free, no rate limits.
Falls back to `x-vercel-ip-country` (Vercel) → then IP lookup via `ipapi.co` (rate limited — last resort only).
**All geographic data uses `ip_country` (IP-detected), never `country` (user-entered).**

### Payment Metadata
Bundle checkout now stores `feature_ids` array in both:
- Supabase `payments.metadata` (array)
- Stripe session metadata (comma-separated string, parse with `.split(',')`)

The `package_tier` field is the authoritative source for `featureUnlocker` — comma-separated feature keys.

### Cancel URL Logic
`source: 'dashboard'` param in bundle checkout → cancel returns to `/manage/[slug]?tab=services`
No source param (booking flow) → cancel returns to `/book`

### Capsule Reveal — DECOMMISSIONED
Removed from Settings tab. Family Rep Portal covers honouree access with multi-rep support, last-access tracking, and resend capability. The Family Rep access grants more than just reading tributes.

---

## 7. OPEN BUGS (as of v1.9.8)

| Ref | Bug | Status | Notes |
|-----|-----|--------|-------|
| BUG-005 | Services tab checkbox alignment | ⚠️ Verify after v1.9.8 deploy | `cardHeights` destructure fix may need manual VS Code confirm |
| BUG-023 | Memories tab | Error display of page can not be displayed
| BUG-024 | Stripe checkout shows EUR not NGN | 🟡 Partially fixed | v1.9.3 fixes new orders. Historical orders will always show EUR. |
| BUG-025 | No line item breakdown in Stripe checkout | 🟡 Low priority | Line items ARE sent — Stripe UI may not show them prominently |
| BUG-028 | Payment activation not triggering | ⚠️ Webhook URL fixed | Founder changed webhook to www. domain. Test payment needed to confirm |
| BUG-011 | Country count mismatch Family Rep | 🔄 Partially fixed | ip_country added to query. Interface fix applied. Confirm after deploy |

---

## 8. PENDING BUILD TASKS (priority order)

### High — should complete before launch:

**RSVP-to-registry pipeline (M6.2a)**
When a guest submits RSVP, auto-create/update their record in the guest registry. This is the bridge that makes access code generation scope filters work without manual re-entry. Files needed: RSVP submission route + GuestManagementSection.

**VVIP Protocol Layer (D-VVIP-001 approved)**
- PA contact field, entourage size, arrival protocol notes on guest record
- VVIP dashboard panel in Guest Management
- Priority arrival alert when VVIP checks in at Access Codes
- Shareable owner read-only link (D-OWN-002)

**Publication Dispatch Manager improvements**
- Manual recipient add by organiser from manage dashboard
- Guest list email import (if Guest Management active)
- `sent_at` tracking per subscriber

**Family Rep email facelift (BUG-003 follow-up)**
The Capsule Reveal had a nicer email (button, no raw URL). Family Rep invite email should be redesigned to match. Upload `/api/rep/invite/route.ts` to fix.

### Medium:

**Event Owner Loop (D-OWN-001 approved)**
Simplified Command Centre view for the family patriarch / chief host:
- Headline metrics only: guest count, VVIP status, attire summary, programme
- No operational tabs or controls
- Shareable read-only link (D-OWN-002)
- Push notifications at key milestones (RW06 dependency for WhatsApp — post-launch)

**Command Centre multi-view switcher (D-CMD-001 approved)**
Access & Arrivals view is M6 priority. Full multi-view switcher post-launch.

**BUG-006 — Order history improvements**
Currently shows paid orders only (correct). Needs: total spend summary, expiry dates, resend receipt option.

### Post-launch (documented, not blocking):

- Planning with LegacyCapsule knowledge base (CT-004)
- Anniversary email cron (frozen pending Vercel Pro upgrade)
- Honouree Appreciation Dispatch (Phase 3 Exp 5b)
- Planner Account Model (multi-capsule view per email)
- EventToolsHub planning
- Gift a Capsule flow
- Digital Ticket as standalone feature (currently bundled in access_codes)
- Commission system for select users in LCAdmin (BUG-017)

---

## 9. STANDING RULES — NEXT AI MUST FOLLOW

1. **Read all target files fully before writing any edit**
2. **Execute all changes per file in one pass** — no repeated passes on same file
3. **Discuss and agree UX/flow first → Founder confirms → build**
4. **Never hardcode commercial values** — always read from `platform_config` via `getConfig()`
5. **Monetary values in minor units** (kobo/cents) — never decimals. NGN is NOT zero-decimal
6. **All country/geographic data uses `ip_country`** — never `country` (user-entered)
7. **Community Stories is free** — never behind a component toggle, no `notFound()` guard
8. **D-Day page: photos only** — no tribute text input anywhere on that page
9. **`participant_category = 'guest'`** counts against capacity. `event_team` and `organiser` do not
10. **`str_replace` tool is unreliable with apostrophes** — use Python string replacement for multi-edit changes
11. **PowerShell on Windows** — semicolons not `&&` for command chaining
12. **No `src/` prefix** — all imports use `@/` aliases
13. **`page_state: 'tribute_collection'` is INVALID** — use `'active'`
14. **Never chain `.catch()` on Supabase query builders** — always use `try/catch`
15. **Always include full file path in fix instructions**
16. **Verify schema before writing any SQL** — check column names first with `information_schema.columns`
17. **`product_key` in RW-Ecosystem `platform_config` must be `'legacycapsule'`** (not `'lc'`)
18. **Cancel URL from ServicesTab must use `source: 'dashboard'`** to return to manage page not booking flow
19. **`CapsulePage` type**: `'tribute' | 'memories' | 'profile' | 'legacy' | 'attire'` — `'story'` and `'stories'` are retired
20. **Recommend → confirm → build** — never produce code for a feature without Founder approval

---

## 10. KEY SCHEMA NOTES

### `guests` table
- `participant_category`: `'guest'` | `'event_team'` | `'organiser'` (added this session)
- `tier`: `'VVIP'` | `'VIP'` | `'General'` | `'Reception Only'` | `'Staff'` | `'Media'` | `'Vendor'`

### `gallery_items` table
- `device_token`: IP+UA hash for 6-photo limit enforcement (added this session)
- `storage_path`: for cleanup on delete (added this session)
- `source`: `'dday'` for D-Day captures

### `publication_subscribers` table (new this session)
- `capsule_id`, `name`, `email`, `source`, `subscribed_at`, `sent_at`
- `source`: `'self'` | `'organiser'` | `'tribute'` | `'dday'` | `'stories'`
- Unique constraint: `(capsule_id, LOWER(email))`

### `payments` table
- `metadata`: JSONB — now includes `feature_ids` array (from v1.9.4)
- `package_tier`: comma-separated feature keys — authoritative for featureUnlocker
- `paid_at`: NULL until webhook confirms payment (filter with `.not('paid_at', 'is', null)`)

### `platform_config` in RW-Ecosystem
Columns: `config_key`, `product_key` (FK to `rw_products`), `category`, `label`, `description`, `value_type`, `value`, `default_value`
`product_key` for LC = `'legacycapsule'`

New keys seeded this session:
- `lc.dday.photos_per_device_per_phase` = 6
- `lc.dday.window_hours` = 24, `lc.dday.window_start_hour` = 6
- `lc.tribute.max_chars` = 500, `lc.stories.max_chars` = 2000
- `lc.capacity.free_base` = 150, `lc.capacity.paid_base` = 300
- `lc.capacity.pack_growth/celebration/grand` = 250/750/2000
- `lc.capacity.pack_*_price_eur/ngn` (in cents/kobo)
- `lc.capacity.alert_pct_1/2/3` = 70/85/95
- `lc.comms.rsvp_reminder_min_hours` = 48, etc.

---

## 11. ENVIRONMENT VARIABLES CONFIRMED

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | LC operational Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | LC operational service role |
| `NEXT_PUBLIC_RW_ECOSYSTEM_URL` | RW-Ecosystem Supabase (https://njgwunzphbflivqnyrjs.supabase.co) |
| `RW_ECOSYSTEM_SERVICE_ROLE_KEY` | RW-Ecosystem service role |
| `RESEND_API_KEY` | Email delivery |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `NEXT_PUBLIC_APP_URL` | https://www.itslegacycapsule.com |

**Stripe webhook URL (corrected this session):** `https://www.itslegacycapsule.com/api/webhooks/stripe`
Previous URL `https://itslegacycapsule.com` caused 307 redirects → webhook failures → no payment activation.

---

## 12. LINTING / BUILD NOTES

- `sharp` package installed — required for D-Day image compression
- `npm run build` must pass before every `git push origin main`
- Apostrophes in JSX string attributes MUST use escaped `\'` or switch to double quotes or template literals
- `str_replace` tool fails with apostrophes — use Python `content.replace()` instead
- `CapsulePage` type change means any file using `currentPage="story"` or `currentPage="stories"` will TypeScript error — all fixed in this session

---

## 13. COMMERCIAL MODEL

**Free capsule:** 1 phase, 3 months online, 150 guest base, community_stories included
**Pre-booked:** 2 phases, 6 months online, 300 guest base + chosen services

**Capacity packs** (cumulative, purchasable multiple times):
- Growth Pack: +250 guests · €15 / ₦25,000
- Celebration Pack: +750 guests · €35 / ₦65,000
- Grand Event Pack: +2,000 guests · €75 / ₦175,000

**Premium services** (in lc_pricing, all published):
audio_tributes, video_tributes, ways_to_honour, guest_management, access_codes, attire, publication, extended_validity, additional_phase, capacity packs

**Currency detection:** Cloudflare `cf-ipcountry` header → zone → lc_pricing_zones → regional price

---

## 14. WHAT TO DO FIRST IN NEXT SESSION

1. Check BUG-005 (checkbox alignment) and BUG-023 (Memories tab) visually
2. Confirm Stripe test payment now activates features (webhook URL was corrected)
3. If either of above fails, fix before proceeding
4. Upload `lib/payments/PaymentService.ts` and `app/api/rep/invite/route.ts` for Family Rep email facelift
5. Begin RSVP-to-registry pipeline (M6.2a) — no files needed to start, just discuss the flow first
6. VVIP Protocol layer — schema first, then UI

---

*HANDOFF_v1_9_8_TO_NEXT_AI.md*
*AI12 · Claude Opus/Sonnet 4.6 · 21 July 2026*
*To be place in project folder and shared with every new AI session alongside LC_CONTEXT.md and CURRENT_STATE.md*
