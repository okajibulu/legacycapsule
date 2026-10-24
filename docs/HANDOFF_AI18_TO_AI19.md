# HANDOFF_AI18_TO_AI19.md
# LegacyCapsule — Session Handoff
# From: AI18 (Claude Opus 4.6 / Sonnet 4.6)
# To: AI19
# Date: 7 August 2026
# Platform Version: v2.11.64
# Days to Pa Ajibulu Event: 14 (21 August 2026)

---

## CRITICAL: READ BEFORE BUILDING ANYTHING

1. Read `PROJECT_RULES.md` — standing founder rules
2. Read `LC09_AI_COLLABORATION_WORKFLOW.md` — AI workflow
3. Read `CURRENT_STATE_v7.md` (this session's state doc — use this, not v6)
4. Never edit a file without reading it first in full
5. Never hardcode participation language — always use `getParticipationLanguage(event_type)`
6. Never chain `.catch()` on Supabase — always `try/catch`
7. All storage operations use direct REST fetch — never Supabase JS client for uploads
8. Surgical find/replace edits only — no blind rewrites

---

## MODEL RECOMMENDATION FOR AI19

- **Sonnet 4.6** — API routes, targeted fixes, documentation, email copy
- **Opus 4.6** — Publication layout redesign, complex multi-file architecture, premium UI components, Guest Coordination UI build

---

## WHAT AI18 COMPLETED THIS SESSION

### v2.11.51 — Publication: Banner removed, print button, cover height
- Removed instruction banner from publication render page
- Added floating print button (screen only, hidden on print)
- Fixed cover page height from `min-height:100vh` to `height:297mm`

### v2.11.52 — Publication: A4 body wrapper, photo crop fix, phantom row fix
- Body width set to `210mm` so mm units resolve correctly on screen
- `html` background `#E8E8E8` for paper-on-desk screen appearance
- `object-position:top center` on official photography and profile gallery images
- `break-inside:avoid` added to photo grid rows
- Filler div set to `visibility:hidden`

### v2.11.53 — Publication: Lightbox
- Vanilla JS lightbox — all images clickable to full-screen overlay
- Screen only — hidden on print
- Escape key closes, click outside closes

### v2.11.54 — Publication: World map + Collection Intelligence + Editor redesign
- `renderWorldMap()` — SVG dot map, server-side, no JS dependency
- `renderCollectionIntelligence()` — metrics page before tributes
- `SectionNavigator` — mobile horizontal scroll strip added
- `PublicationEditor` — mobile-responsive 3-panel layout
- New section types added to `lib/publication/types.ts`
- `world_map`, `official_photography`, `guest_captures`, `memories`, `community_stories` all typed

### v2.11.55 — Publication: Tiered distribution system
- `app/api/publication/family-preview/route.ts` — NEW (Tier 1)
- `app/api/publication/named-send/route.ts` — NEW (Tier 2)
- Full distribution upgraded: version-aware, Option C resend logic
- `app/api/publication/save/route.ts` — version bump on layout hash change
- `PublicationEditor` — tiered distribution panel

### v2.11.56 — Tribute character limit: 500 → 2000
- `app/for/[slug]/submit/page.tsx`
- `app/for/[slug]/edit/[token]/page.tsx`
- `components/TributeWallClient.tsx`
- `app/help/page.tsx`
- `lib/content/serviceDetails.ts`
- Counter colour threshold adjusted to 1800 (90% of 2000)

### v2.11.57 — DB constraint fix
- `contributions_status_check` constraint updated to include `pending_review`
- No code changes — DB migration only

### v2.11.58 — Highlights page: voice metrics + Collection Intelligence in publication
- `computeVoiceMetrics()` — server-side computation in `app/for/[slug]/legacy/page.tsx`
- `VoiceMetrics` and `ActivityItem` exported types in `LegacyRoomClient.tsx`
- New components: `MetricRow`, `DistributionBar`, `RankedBar`
- New sections: Inside the Voices, Where the World Showed Up, Who Showed Up
- Multi-source activity feed (voices + memories + moments), last 3, with type pills
- Live publication status (3 states: distributed / ready / pending)
- Participation language engine wired throughout
- 60s polling updated to all 3 sources

### v2.11.59 — Publication Editor: deliberate regeneration
- `handlePreviewPrint` retired
- `handleRegenerate` — deliberate organiser action, stores token permanently
- "Open Publication ↗" button uses stored `render_token`
- `GenerateButton` component removed from editor

### v2.11.60 — Publication closing page redesign
- Premium LC brand page with emotional mission copy
- Radial glow background texture
- Version number in tiny print at bottom
- Generated date shown
- Uses `styles.coverBg` to match cover page (bookend effect)

### v2.11.61 — Emotional communication upgrade (Tier 1 files)
- `lib/email.ts` — keepsake card + organiser welcome rewritten
- `app/api/email/submission-confirmation/route.ts` — new copy, bug fix
- LC marketing end notes added to all emails
- Bug fixed: `'Your ${lang.singular}'` was unresolved template literal in string

### v2.11.62 — Publication fixes + OG metadata + distribution intelligence
- World map: full country-name-to-ISO lookup (was broken — `slice(0,2)` never matched)
- Section padding: `SECTION_WRAP` constant applied to all section renderers
- "Collection Intelligence" renamed to "Capsule Highlights"
- "Length Distribution" renamed to "Message Character Lengths Breakdown"
- "Top Countries" renamed to "Contribution Countries Breakdown" — shows ALL countries
- `DistributionSummary` component added to publication editor right panel
- Version number now prominently displayed in editor
- OG metadata: `event_tag` now included in title and description

### v2.11.63 — S/Profile save button feedback
- `SectionEditor` Save button: idle → Saving… → ✓ Saved (2.5s) → idle
- `AppreciationButton` component: same pattern
- `DeleteSectionButton` — existing tap-to-confirm retained

### v2.11.64 — Stat card tooltips + route fix
- `StatCard` — tap-to-reveal tooltip with ⓘ indicator
- `StatTooltip` component — fadeIn animation, gold accent
- Tap outside to close — wired to outer container
- `app/api/og/[slug]/generate/route.ts` moved to `app/api/og/generate/route.ts`
- Next.js 15 validator error resolved

---

## PENDING ISSUES FOR AI19 — PUBLICATION (HIGHEST PRIORITY)

These were identified in founder testing after the session but attachment limit was reached:

### PUB-LAY-001 — Family Appreciation section wrong position
**Problem:** Family Appreciation (`section_type: 'appreciation'`, `sort_order: 60`) should be before the back page in the publication
**File:** `app/publication-render/[token]/page.tsx` — `renderHonoureeProfile()`
**Fix:** Sort `profileSections` so `section_type === 'appreciation'` always renders first, regardless of `sort_order`.

### PUB-LAY-002 — Some pages still spilling
**Problem:** Certain sections still overflow A4 page boundaries in print. The `height:297mm` cover fix helped but other sections with dynamic content (long tribute texts, large photo grids) still spill.
**Fix needed:** Add `page-break-inside:avoid` more aggressively, and consider `max-height` constraints on tribute cards with overflow handling.

### PUB-LAY-003 — Tribute card padding too much
**Problem:** Founder noted tribute card padding is excessive. The padding applied via `SECTION_WRAP` combined with existing card padding creates too much whitespace.
**Fix:** Reduce `SECTION_WRAP` from `padding:0 24px` to `padding:0 12px` and review tribute card inner padding.

### PUB-LAY-004 — Section headers still close to edges
**Problem:** Despite `SECTION_WRAP`, some section headers are still close to edges. The `renderSectionHeader` function itself may need padding.
**File:** `app/publication-render/[token]/page.tsx` — `renderSectionHeader()`
**Fix:** Read the current `renderSectionHeader` function and add consistent horizontal padding.

### PUB-LAY-005 — Publication Editor control page edge padding
**Problem:** Text in the publication editor (section names, right panel content) leans against screen edges on mobile.
**Fix:** Review `PublicationEditor.tsx` main panel and right panel for missing `px-4` or `mx-4` on mobile.

### PUB-INIT-001 — Existing publications missing new section types
**Problem:** When `layout_config` is reset to null for the Prof. Adesina capsule, the init route regenerates it — but it may not include `world_map`, `collection_intelligence`, `official_photography` etc. if they weren't in the original section registry.
**File:** The publication init route (find via: `Select-String -Pattern "layout_config.*init\|init.*layout" --include="*.ts"`)
**Fix:** Init route needs section reconciliation — check stored config for missing section types and add them without disturbing existing manual arrangements.

---

## PENDING ISSUES FOR AI19 — OTHER AREAS

### EMAIL-TIER2 — Remaining email emotional communication audit
AI18 completed Tier 1 (keepsake card, submission confirmation, organiser welcome). Still pending:

**Tier 2 (high priority):**
- `lib/honoureeEmail.ts` — appreciation emails (individual + collective + broadcast + support thank-you)
- `lib/portalAuth.ts` — family rep OTP email
- `app/api/publication/distribute/route.ts` — `publicationEmailHtml` function
- `app/api/publication/family-preview/route.ts` — already has good copy (AI18 wrote it fresh)
- `app/api/publication/named-send/route.ts` — already has good copy (AI18 wrote it fresh)

**Tier 3 (functional but needs LC warmth):**
- `app/api/email/correction-request/route.ts`
- `app/api/email/eoh-digest/route.ts`
- `app/api/email/gift-notification/route.ts`
- `app/api/email/gift-schedule/route.ts`
- `app/api/access-codes/send/route.ts`
- `app/api/checkout/send-payment-link/route.ts`
- `app/api/rep/resend/route.ts`
- `app/api/email/verify-contributor/route.ts`
- `app/api/email/verify-organiser/route.ts`
- `app/api/email/approval/route.ts`

**Email principles (LC brand voice — established AI18):**
- Never use "approved" — use "published", "live", "now part of the record"
- Never use "tribute wall" — use "permanent record" or "collection of voices"
- Every email ends with an LC marketing note (varies — never repeat same sentence)
- Speak to the human moment, not the product action
- Subject lines feel like letters, not support tickets

### BUG-CIRCLE-001 — Circle Leader RSVP endpoint
Circle Leader portal at `app/portal/circle/[token]/page.tsx` — RSVP endpoint may be missing or returning 404. Needs verification and fix.

### BUG-003 — Family Rep invite email: plain URL, not button
`app/api/rep/resend/route.ts` — the invite email sends a raw URL instead of a styled CTA button. Low effort fix.

### PUB-004 — approved_contrib_count drift
```sql
UPDATE capsules 
SET approved_contrib_count = (
  SELECT COUNT(*) FROM contributions 
  WHERE capsule_id = capsules.id 
  AND status = 'approved' 
  AND deleted_at IS NULL
);
```
Also needs trigger fix — the drift recurs on deletion. Defer trigger fix until post-launch.

### HIGHLIGHTS-001 — Section D "Who Showed Up" wording
The `attributionCount` stat shows "N voices arrived through a shared link". Confirm with founder whether this is the right framing or whether it should say "N voices were brought in by Legacy Builders."

---

## DATABASE MIGRATIONS RUN THIS SESSION

All of these are live in production Supabase:

```sql
-- publications table
ALTER TABLE publications ADD COLUMN IF NOT EXISTS distributed_layout_hash text;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS family_preview_sent_at timestamp with time zone;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS family_preview_version integer;

-- publication_subscribers table  
ALTER TABLE publication_subscribers ADD COLUMN IF NOT EXISTS version_sent integer;

-- New table
CREATE TABLE IF NOT EXISTS publication_named_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  capsule_id uuid NOT NULL,
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  version_sent integer NOT NULL DEFAULT 1,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  added_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- contributions constraint fix
ALTER TABLE contributions DROP CONSTRAINT contributions_status_check;
ALTER TABLE contributions ADD CONSTRAINT contributions_status_check 
CHECK (status = ANY (ARRAY[
  'pending_review'::text, 'pending'::text, 'approved'::text,
  'declined'::text, 'flagged'::text, 'pending_correction'::text, 'removed'::text
]));
```

---

## NEW FILES CREATED THIS SESSION

| File | Purpose |
|------|---------|
| `app/api/publication/family-preview/route.ts` | Tier 1 — family preview send |
| `app/api/publication/named-send/route.ts` | Tier 2 — named individual send |
| `app/api/og/generate/route.ts` | Moved from `app/api/og/[slug]/generate/route.ts` |

---

## KEY ARCHITECTURAL FACTS CONFIRMED/ADDED THIS SESSION

| Fact | Detail |
|------|--------|
| `contributions.status` values | `pending_review`, `pending`, `approved`, `declined`, `flagged`, `pending_correction`, `removed` |
| Publication render | Live server-rendered HTML — always fresh on token access |
| Version bump trigger | Layout hash change vs `distributed_layout_hash` on `publications` row |
| `render_token` | Stored permanently on `publications` row — not ephemeral |
| Country field | Full country names ("Nigeria") not ISO codes — use `COUNTRY_NAME_TO_ISO` lookup |
| `og/[slug]/generate` route | MOVED to `app/api/og/generate/route.ts` — update any callers |
| Family Appreciation | `section_type: 'appreciation'`, `sort_order: 60` in Prof. Adesina capsule |
| World map | Uses `COUNTRY_CENTROIDS` Record keyed by ISO 2-letter codes |
| `SECTION_WRAP` | Constant `padding:0 12px` (needs reduction from 24px — see PUB-LAY-003) |

---

## COMPONENT MAP ADDITIONS THIS SESSION

| Component | File | Change |
|-----------|------|--------|
| `VoiceMetrics` | `components/LegacyRoomClient.tsx` | NEW exported type |
| `ActivityItem` | `components/LegacyRoomClient.tsx` | NEW exported type |
| `MetricRow` | `components/LegacyRoomClient.tsx` | NEW — label/value pair |
| `DistributionBar` | `components/LegacyRoomClient.tsx` | NEW — CSS bar chart row |
| `RankedBar` | `components/LegacyRoomClient.tsx` | NEW — ranked list with bar |
| `StatTooltip` | `components/LegacyRoomClient.tsx` | NEW — tap-to-reveal tooltip panel |
| `StatCard` | `components/LegacyRoomClient.tsx` | Updated — tooltip props, ⓘ indicator |
| `ActivityRow` | `components/LegacyRoomClient.tsx` | Updated — type pills (VOICE/MEMORY/MOMENT) |
| `DistributionSummary` | `components/publication/PublicationEditor.tsx` | NEW — persistent email stats panel |
| `AppreciationButton` | `app/manage/[slug]/page.tsx` | NEW — loading/saved states |
| `SectionEditor` | `app/manage/[slug]/page.tsx` | Save button: Saving/Saved states |
| `renderWorldMap` | `app/publication-render/[token]/page.tsx` | NEW — SVG dot map |
| `renderCollectionIntelligence` | `app/publication-render/[token]/page.tsx` | NEW — renamed Capsule Highlights |
| `renderClosingMessage` | `app/publication-render/[token]/page.tsx` | Redesigned — premium LC brand page |
| `computeVoiceMetrics` | `app/for/[slug]/legacy/page.tsx` | NEW — server-side metrics computation |
| `COUNTRY_NAME_TO_ISO` | `app/publication-render/[token]/page.tsx` | NEW — full country name to ISO lookup |
| `countryToIso` | `app/publication-render/[token]/page.tsx` | NEW — resolver function |
| `SECTION_WRAP` | `app/publication-render/[token]/page.tsx` | NEW — horizontal padding constant |

---

## PUBLICATION SECTION ORDER (CONFIRMED)

The publication renders sections in this order:
1. Cover
2. Honouree Profile (profile sections + custom sections + appreciation)
3. Profile Gallery
4. World Voices Map
5. **Capsule Highlights** (Collection Intelligence — auto-injected before tributes)
6. Voices/Tributes
7. Official Photography
8. Guest Captures (In The Room)
9. Community Stories (Same as Memories)
10. Family Appreciation
11. Closing Page(LC Sign off and emotional marketing)

---

## PROF. ADESINA CAPSULE — SPECIFIC NOTES

- Slug: `prof-adesina`
- Event type: `retirement`
- Participation language: "Appreciation" (singular), "Appreciations" (plural)
- 83 approved contributions as of session end
- Countries: Nigeria (53), Canada (12), United States (7), United Kingdom (6), Ireland (2), Australia (1), Finland (1)
- `layout_config` was reset to null this session — init route will regenerate on next editor open
- Family Appreciation section: `id: 1ec3e499...`, `sort_order: 60` — currently renders last, should render first (PUB-LAY-001)
- Publication has been generated — `render_token` stored on publications row

---

## WHAT TO DO FIRST IN AI19 SESSION

**Recommended order:**

1. **Read this handoff + CURRENT_STATE_v7.md** (this doc)
2. **Fix PUB-LAY-001** (Family Appreciation position) — quick surgical fix, high visual impact
3. **Fix PUB-LAY-003** (Tribute padding) — reduce `SECTION_WRAP` to `padding:0 12px`
4. **Fix PUB-LAY-004** (Section headers padding) — read `renderSectionHeader` first
5. **Fix PUB-LAY-002** (Page spilling) — read full render page before touching
6. **Fix PUB-LAY-005** (Editor mobile padding) — read PublicationEditor first
7. **PUB-INIT-001** (Section reconciliation in init route) — read init route first
8. **EMAIL-TIER2** (Emotional communication remaining emails) — Sonnet 4.6
9. **BUG-003** (Family Rep email button) — quick fix

**Do NOT start Guest Coordination UI without:**
- Founder approval
- Full reading of `ETH-GM-001` spec
- Dedicated Opus 4.6 session

---

## VERSION HISTORY THIS SESSION

| Version | Key change |
|---------|-----------|
| v2.11.51 | Publication banner removed, print button, cover height fix |
| v2.11.52 | A4 body wrapper, photo crop, phantom row fix |
| v2.11.53 | Lightbox — all images clickable |
| v2.11.54 | World map, Collection Intelligence, editor mobile layout |
| v2.11.55 | Tiered distribution (Family Preview, Named Send, Full Distribution) |
| v2.11.56 | Tribute limit 500→2000 across all files |
| v2.11.57 | DB constraint: pending_review added |
| v2.11.58 | Highlights page: voice metrics, multi-source activity, live pub status |
| v2.11.59 | Deliberate regeneration button, stored token approach |
| v2.11.60 | Premium closing page with emotional mission copy |
| v2.11.61 | Emotional communication Tier 1: keepsake card, submission confirmation, organiser welcome |
| v2.11.62 | World map ISO fix, section padding, country labels, OG metadata, distribution intelligence |
| v2.11.63 | S/Profile save buttons: Saving/Saved feedback states |
| v2.11.64 | Stat card tooltips, og/generate route moved |

---

*Handoff compiled by AI18 — Claude Opus 4.6 / Sonnet 4.6 — 7 August 2026*
*Platform: v2.11.64 | Branch: main | Deployed: Vercel*
