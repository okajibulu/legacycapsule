# HANDOFF_AI19_TO_AI20.md
# LegacyCapsule — Session Handoff
# From: AI19 (Claude Sonnet 4.6)
# To: AI20
# Date: 9 August 2026
# Platform Version: AI19v2.11.87
# Days to Prof. Adesina Event: 12 (21 August 2026)

---

## CRITICAL: READ BEFORE BUILDING ANYTHING

1. Read `PROJECT_RULES.md` — standing founder rules
2. Read `LC09_AI_COLLABORATION_WORKFLOW.md` — AI workflow
3. Read `LC_EMOTIONAL_COMMUNICATION_STANDARD.md` — governs ALL user-facing copy
4. Read `CURRENT_STATE_v8.md` (this session's state doc)
5. Never edit a file without reading it first in full
6. Never hardcode participation language — always use `getParticipationLanguage(event_type)`
7. Never chain `.catch()` on Supabase — always `try/catch`
8. Surgical find/replace edits only — no blind rewrites
9. Git commit format: `AI20v2.11.xx - description`
10. Always read the current uploaded file before writing any directive

---

## MODEL RECOMMENDATION FOR AI20

- **Sonnet 4.6** — API routes, targeted fixes, documentation, email copy, surgical edits
- **Opus 4.6** — Complex multi-file architecture, premium UI, Guest Coordination build,
  email suite emotional rewrite (multiple files at once)

---

## WHAT AI19 COMPLETED THIS SESSION

### AI19v2.11.65 — Publication spill fix + Who Attended removal
- Cover and closing page spill fixed via named `@page` CSS rules (`cover-page`, `closing-page`)
- `@page cover-page { margin: 0mm }` — bypasses body margin that was causing spill
- `who_attended` section removed from: render page, types, SectionNavigator, autoArrange
- `box-sizing: border-box` added to closing page (was adding padding on top of height)

### AI19v2.11.66 — Regenerate button content refresh
- `handleRegenerate` now calls `/api/publication/init` first (reconciliation), then preview-token
- Local `layout` and `autoLayout` state updated from init response after regenerate
- `setPubVersion` now updates from token response

### AI19v2.11.67 — Init route reconciliation + version bump intelligence
- `reconcileLayoutConfig()` function added to init route — runs every time init is called
- Reconciliation: adds missing `world_map`, rebuilds auto phase sections, ensures closing last
- `preview-token` route: intelligent version bump via MD5 hash of `layout_config`
- Version only bumps when content has actually changed vs `distributed_layout_hash`
- TypeScript fixes: `existingPhaseIds` cast, `PhasePhotosSection` missing properties

### AI19v2.11.68 — World map SVG + ip_country as primary + appreciation page break
- World map SVG continent paths replaced with accurate equirectangular projection paths
- `ip_country` used as primary country source (over contributor-typed `country`)
- `renderAppreciationBlock` function added — appreciation now renders just before closing page
- Appreciation filtered out of `renderHonoureeProfile` loop
- Duplicate `renderAppreciationBlock` removed (was at both SECTION 5B and 6B)
- `autoArrange.ts` now includes `world_map` in default section order
- `SectionNavigator`: `who_attended` removed from labels/icons

### AI19v2.11.69 — Engagement breakdown + renderCollectionIntelligence
- Engagement breakdown added to `renderCollectionIntelligence` (inside function scope)
- `escapeHtml` and `formatEventDate` hoisted to SECTION 3B (before all renderers)
- Duplicate appreciation render in `sectionHtml` removed

### AI19v2.11.70 — renderPhasePhotos rewrite
- **Critical fix:** `renderPhasePhotos` was reading `slot.gallery_item_id` — field doesn't exist
- Rewritten to read correct slot schema: `slot.slot_type`, `slot.photo_id`, `slot.photos[n].photo_id`
- Feature/double/triple slot types all handled correctly
- Photos now actually render in publication Event Moments sections

### AI19v2.11.71 — Countries + engagement breakdown placement
- Countries breakdown moved from Capsule Highlights to World Map page (below bubble chart)
- Countries table: ranked, with percentage bar — same style as existing metric rows
- Engagement breakdown finalised in `renderCollectionIntelligence`

### AI19v2.11.72 — World map redesign (Option C) + relationship pills
- World map replaced with abstract bubble chart (circles sized by count) — no continent SVG
- Relationship categories added to right column of Capsule Highlights (metricRow style)
- `buildPhaseSection` exported from `autoArrange.ts`
- `reconcileLayoutConfig` v2: rebuilds auto phase slots from current gallery_items
- Duplicate phase sections filtered via `seenPhaseIds` cleanup

### AI19v2.11.73 — Foreword page (Page 2)
- `renderForeword()` function added — SECTION 5C
- Emotional intro copy (punchy, ~100 words)
- Dynamic participation language (retirement → appreciations, etc.)
- "Capsule Digital Publication Content" TOC with section descriptions
- Renders immediately after cover (page 2 via page-break-after on cover)
- Wired into main render pipeline after cover section

### AI19v2.11.74 — Three-layer LC branding
- `SECTION_FOOTER` constant — `itslegacycapsule.com` watermark on every section page
- Applied to all section renderers: profile, gallery, tributes, phases, world map, highlights, appreciation, foreword, closing, official, captures, stories, memories
- Foreword: LC closing sentence + URL added below TOC
- Closing page: CTA tagline "Captures and Preserves Memories for ALL your events" + URL more prominent

### AI19v2.11.75 — Cover label + section renames + relationship metricRow
- Cover page: "DIGITAL PUBLICATION / by LegacyCapsule" label added
- World map section renamed: "Contributors Country Spread"
- Relationship categories: pills → metricRow style in right column below character lengths
- Official Photography count label removed from photo pages

### AI19v2.11.76 — Country count stabilised
- Root cause found: `ip_country` stores full country names (not ISO codes) — Cloudflare resolves before storage
- `renderWorldMap` and `renderCollectionIntelligence` updated to treat `ip_country` as full name
- Duplicate `COUNTRY_NAME_TO_ISO` keys removed; missing entries added (Greece, Romania, Hungary, etc.)

### AI19v2.11.77 — Named Send route + multi-recipient UI + purge-section route + editor padding
- `app/api/publication/named-send/route.ts` — CREATED (was missing, causing JSON parse error)
- Multi-recipient Named Send: add multiple recipients before sending, stage them in list
- `app/api/publication/purge-section/route.ts` — CREATED
- Purge & Rebuild button added to `PhotoSection.tsx` with two-step confirm
- `onPurged` callback wired into `PublicationEditor` to refresh layout state
- `who_attended` now purged from stored layout_config via reconciliation step 0
- Editor aside: inline styles for padding (Tailwind JIT not picking up classes)

### AI19v2.11.78 — Phase section headers + caption removal + Promise.all fix
- Phase section headers now show event date and venue (fetched from `capsule_phases`)
- `buildPhaseSection` carries `phase_date` and `phase_venue` into layout_config
- "Official Photography" caption labels removed from all photo slot renderers
- Promise.all query order fixed (gallery before phases — was causing type mismatch)
- `autoArrange.ts` uses spread to add phase_date/phase_venue without TypeScript errors

### AI19v2.11.79 — Community stories page_state gate removed
- `app/api/community-topics/submit/route.ts` no longer checks `page_state`
- Capsule existence check only — contributor-facing routes must never block on activation status
- This fixes "Something went wrong" on community story submission for non-active capsules

### AI19v2.11.80 — story_topic_id FormData null string fix
- `story_topic_id` was being passed as string `"null"` from FormData
- Route now correctly coerces `"null"` string to actual `null`

### AI19v2.11.81 — Community stories submit: Content-Type dual support
- Route was calling `req.formData()` but client was sending JSON
- Route now accepts both `multipart/form-data` and JSON content types
- Email field name corrected: `contributor_email` → `email`
- `capsule_slug` added to submit body for confirmation email

### AI19v2.11.82 — New topic category preservation
- `SubmitStoryPanel` receives `defaultCategory` prop
- New topic proposed from within a category now stays in that category
- Was always defaulting to "General" — now uses active category context

### AI19v2.11.83 — Voices page: community stories excluded
- `app/for/[slug]/page.tsx` contributions query now adds `.is('story_topic_id', null)`
- Stories no longer appear on the Voices/Tributes wall
- This is the server-side (ISR) fix

### AI19v2.11.84 — Memories tab renamed to Stories
- `CapsuleBottomNav.tsx`: "Memories" label → "Stories"
- `app/for/[slug]/stories/page.tsx`: metadata title updated
- `renderCommunityStories`: section header → "Community Stories"

### AI19v2.11.85 — Foreword TOC fixes + reconciliation cleanup + editor padding
- Foreword TOC: "Contributors Country Spread", event-aware Tributes label, Capsule Highlights + Family Appreciation added
- Heading: "Capsule Digital Publication Content"
- Reconciliation now removes `official_photography` and `guest_captures` from stored layout
- Editor aside: `md:min-w-[256px]` added; inline styles applied definitively

### AI19v2.11.86 — Highlights counters + stories filter
- `storiesCount` now reads from `contributions` where `story_topic_id IS NOT NULL`
  (was reading from `community_stories` table which is empty)
- `photo_count` computed live from `gallery_items` bypassing stale `participation_summary`
- `momentsCount` filter adds `deleted_at` guard

### AI19v2.11.87 — TributeWallClient poll filter
- `poll()` function in `TributeWallClient` now adds `.is('story_topic_id', null)`
- Prevents community stories appearing in Voices wall on 60-second refresh cycle
- This is the client-side companion fix to v2.11.83

---

## PENDING ISSUES FOR AI20

### HIGH PRIORITY

**EMAIL-SUITE** — Emotional communication audit not completed
The `LC_EMOTIONAL_COMMUNICATION_STANDARD.md` was created this session but the email
suite was not audited. Files to rewrite in priority order:

| File | Priority | Notes |
|------|----------|-------|
| `app/api/email/submission-confirmation/route.ts` | 🔴 Highest | Most volume — every contributor sees this |
| `app/api/email/approval/route.ts` | 🔴 High | Emotional moment — voice is now permanent |
| `app/api/email/appreciation/route.ts` | 🟡 Medium | Family rep communication |
| `app/api/email/verify-contributor/route.ts` | 🟡 Medium | First touch with contributor |
| `app/api/email/verify-organiser/route.ts` | 🟡 Medium | Organiser onboarding |
| `app/api/email/contact/route.ts` | 🟢 Low | General contact |
| `app/api/email/eoh-digest/route.ts` | 🟢 Low | EOH/Gift digest |

Read `LC_EMOTIONAL_COMMUNICATION_STANDARD.md` before touching any of these.

**PURGE BUTTON VISIBILITY** — Purge & Rebuild button exists but is visually hidden
The button was confirmed working but "tucked away and very hidden" in the PhotoSection
toolbar. Needs redesign — move below the photo grid, make it more prominent. The
purge button should be clearly visible when a phase section is selected in the editor.

**EDITOR RIGHT PANEL PADDING** — Still not definitively resolved
Multiple attempts have been made. The inline style approach (AI19v2.11.77) is the
current state. Verify on production after hard refresh. If still hitting edges, the
issue may be in the mobile layout of the overall editor (the aside is `w-full` on
mobile with no outer margin).

**PROF. ADESINA EVENT — 12 DAYS**
- Regenerate Publication → confirm new phases (At The Inaugural Lecture, At the Reception) appear
- Purge stale photos via the new Purge & Rebuild button
- Verify Family Appreciation appears just before closing page
- Verify World Map (bubble chart) renders correctly
- Confirm engagement breakdown shows correct counts
- Run full distribution test before 21 August

### MEDIUM PRIORITY

**Community Stories — topic goes to General on new topic propose**
Partially fixed (AI19v2.11.82) — `defaultCategory` prop added. But the `SubmitStoryPanel`
also has a separate path where new topics proposed from the main form (not inside a category)
still default to General. This is actually correct behaviour for community-proposed topics —
they go to General until the organiser recategorises. Not a bug but worth confirming with founder.

**`ip_country` vs `country` uniformity**
`ip_country` stores full country names (Cloudflare resolves ISO before storage).
The `contributions` table has both fields populated for all 83 Prof. Adesina entries.
Standing rule added: always use `ip_country` as primary, `country` as fallback.
Document this in `LC08_DATA_ARCHITECTURE.md` as a standing schema fact.

**Collection Intelligence section title**
Currently says `Capsule Highlights` in the publication. The foreword TOC and all
section headers use this name correctly. Verify all references are consistent.

**Publication TOC: `collection_intelligence` section type**
The `renderForeword` TOC lists sections from `layout.sections`. The `collection_intelligence`
section doesn't appear in `layout_config` sections — it's auto-injected before tributes.
This means it won't show in the TOC. Consider adding it as a synthetic entry in
`renderForeword` alongside the `appreciation` section.

### LOW PRIORITY

**Preexisting TypeScript error** — `validator.ts .next/types`
`Type "/api/og/[slug]/generate" does not satisfy AppRouteHandlerRoutes`
This is a preexisting error not introduced by AI19. Not blocking builds.
Investigate `app/api/og/[slug]/generate/route.ts` — may need to be fully removed
if the route was moved to `app/api/og/generate/route.ts` by AI18.

**`community_stories` table**
The `community_stories` table appears to exist in the DB but stories are actually stored
in `contributions` with `story_topic_id IS NOT NULL`. The `recentStories` fetch in
`legacy/page.tsx` still queries `community_stories` table (line 312-318). This will
return empty results. Fix: change that fetch to query `contributions` with `story_topic_id IS NOT NULL`.

---

## KEY ARCHITECTURAL FACTS CONFIRMED/ADDED THIS SESSION

| Fact | Detail |
|------|--------|
| `ip_country` field | Stores full country names (e.g. "Nigeria"), NOT ISO codes — Cloudflare resolves before storage |
| Phase slot schema | `slot_type: 'feature'/'double'/'triple'`, `photo_id` (feature), `photos[n].photo_id` (double/triple) |
| `renderPhasePhotos` | Must read `slot.photo_id` / `slot.photos[n].photo_id` — NOT `gallery_item_id` |
| `community_stories` table | Empty — stories live in `contributions` where `story_topic_id IS NOT NULL` |
| Reconciliation trigger | Called on every `handleRegenerate` click via init route |
| `page_state` check | Must NOT be in contributor-facing routes — only admin/organiser routes |
| Named Send route | Lives at `app/api/publication/named-send/route.ts` — sends URL (not PDF) |
| Purge section route | Lives at `app/api/publication/purge-section/route.ts` |
| Section footer | `SECTION_FOOTER` constant in render page — appended to every section renderer |
| `@page` named rules | `cover-page` and `closing-page` both have `margin: 0mm` — prevents spill |
| `box-sizing: border-box` | Required on closing page — otherwise padding adds to 297mm height |
| World map | Abstract bubble chart (Option C) — no SVG continent paths |
| `COUNTRY_NAME_TO_ISO` | Full country name → ISO 2-letter. Used for world map dot positioning |
| Publication section order | Cover → Foreword → Profile → World Map → Highlights → Tributes → Phase Photos → Family Appreciation → Closing |

---

## NEW FILES CREATED THIS SESSION

| File | Purpose |
|------|---------|
| `app/api/publication/named-send/route.ts` | Named send — multi-recipient, emotional email template |
| `app/api/publication/purge-section/route.ts` | Purge & rebuild phase section slots from current gallery_items |
| `LC_EMOTIONAL_COMMUNICATION_STANDARD.md` | Applied tone & copy guide — governs all user-facing copy |

---

## PUBLICATION SECTION ORDER (CONFIRMED AS OF AI19)

1. Cover (with "DIGITAL PUBLICATION by LegacyCapsule" label)
2. **Foreword** (Page 2 — NEW: emotional intro + Capsule Digital Publication Content TOC)
3. Honouree Profile (appreciation filtered OUT — renders separately)
4. World Map (bubble chart — "Contributors Country Spread")
5. **Capsule Highlights** (auto-injected before tributes — engagement breakdown in left column)
6. Tributes/Voices (event-aware label)
7. Phase Photos (with date/venue sub-header)
8. Official Photography (auto-included — NOT in layout_config stored sections)
9. Guest Captures (auto-included — NOT in layout_config stored sections)
10. Community Stories
11. Memories
12. **Family Appreciation** (just before closing — NEW position)
13. Closing Message (always last — "Events end. Legacies don't.")

**Removed from section order:** Who Attended (retired)

---

## PROF. ADESINA CAPSULE — SPECIFIC NOTES

- Slug: `prof-adesina`
- Event type: `retirement`
- Participation language: "Appreciation" (singular), "Appreciations" (plural)
- 83 approved contributions
- Countries (from `ip_country`): Nigeria (43+4+1+1), Canada (11+4), UK (6+3), US (4+1+3), Spain (3+1), Finland (1), Netherlands (1), Australia (1), France (1), Malaysia (1)
- Two Event Moments phases: "At The Inaugural Lecture", "At the Reception"
- Official Photography: 64 photos from photographer portal
- `layout_config` stored sections: cover, honouree_profile, world_map, tributes, phase_photos (×2), closing_message
- `official_photography` and `guest_captures` confirmed removed from stored layout_config via SQL
- Publication v6 as of session end — next regenerate will produce v7

---

## COMPONENT MAP ADDITIONS THIS SESSION

See `COMPONENT_MAP_v2.md` for full updated map.

New/changed components this session:

| Component/Function | File | Change |
|-------------------|------|--------|
| `renderForeword` | `app/publication-render/[token]/page.tsx` | NEW — SECTION 5C |
| `renderAppreciationBlock` | `app/publication-render/[token]/page.tsx` | NEW — SECTION 5B |
| `SECTION_FOOTER` | `app/publication-render/[token]/page.tsx` | NEW — LC watermark constant |
| `renderPhasePhotos` | `app/publication-render/[token]/page.tsx` | REWRITTEN — correct slot schema |
| `renderWorldMap` | `app/publication-render/[token]/page.tsx` | REWRITTEN — abstract bubble chart |
| `reconcileLayoutConfig` | `app/api/publication/init/route.ts` | NEW — full reconciliation function |
| `buildPhaseSection` | `lib/publication/autoArrange.ts` | NOW EXPORTED |
| `named-send` route | `app/api/publication/named-send/route.ts` | NEW FILE |
| `purge-section` route | `app/api/publication/purge-section/route.ts` | NEW FILE |
| Purge & Rebuild button | `components/publication/PhotoSection.tsx` | NEW — two-step confirm |
| Multi-recipient Named Send | `components/publication/PublicationEditor.tsx` | UPDATED |
| `poll()` filter | `components/TributeWallClient.tsx` | UPDATED — story_topic_id IS NULL |
| Voices page query | `app/for/[slug]/page.tsx` | UPDATED — story_topic_id IS NULL |
| `storiesCount` source | `app/for/[slug]/legacy/page.tsx` | FIXED — reads contributions not community_stories |
| `livePhotoCount` | `app/for/[slug]/legacy/page.tsx` | NEW — bypasses stale participation_summary |
| `SubmitStoryPanel` | `components/CommunityStoriesClient.tsx` | UPDATED — defaultCategory prop |
| Stories submit route | `app/api/community-topics/submit/route.ts` | FIXED — JSON+FormData, no page_state check |
| `LC_EMOTIONAL_COMMUNICATION_STANDARD.md` | `/mnt/project/` | NEW DOCUMENT |

---

## VERSION HISTORY THIS SESSION

| Version | Key change |
|---------|-----------|
| AI19v2.11.65 | Cover+closing spill fixed via named @page; who_attended removed |
| AI19v2.11.66 | Regenerate calls init first; layout state refreshes after regenerate |
| AI19v2.11.67 | Init reconciliation; intelligent version bump via hash comparison |
| AI19v2.11.68 | World map SVG paths; ip_country primary; appreciation page break |
| AI19v2.11.69 | Engagement breakdown in renderCollectionIntelligence; escapeHtml hoisted |
| AI19v2.11.70 | renderPhasePhotos rewritten for correct slot schema |
| AI19v2.11.71 | Countries to world map page; engagement breakdown finalised |
| AI19v2.11.72 | World map → abstract bubble chart; relationship pills; phase reconciliation |
| AI19v2.11.73 | Foreword page (Page 2) with emotional copy and TOC |
| AI19v2.11.74 | Three-layer LC branding: section footer, foreword LC line, closing CTA |
| AI19v2.11.75 | Cover label; world map renamed; relationship→metricRow; captions removed |
| AI19v2.11.76 | Country count stabilised; ip_country as full name; duplicate ISO keys fixed |
| AI19v2.11.77 | Named Send route created; multi-recipient UI; purge-section route; editor padding |
| AI19v2.11.78 | Phase headers show date+venue; caption labels removed; Promise.all order fixed |
| AI19v2.11.79 | Community stories: page_state gate removed |
| AI19v2.11.80 | story_topic_id null string coercion fix |
| AI19v2.11.81 | Stories submit: JSON+FormData dual support; email field name fixed |
| AI19v2.11.82 | New topic category preserved from active category context |
| AI19v2.11.83 | Voices page excludes stories (story_topic_id IS NULL filter) |
| AI19v2.11.84 | Memories tab renamed to Stories |
| AI19v2.11.85 | Foreword TOC event-aware labels; reconciliation removes official_photography |
| AI19v2.11.86 | Highlights counters fixed; storiesCount from contributions; live photo count |
| AI19v2.11.87 | TributeWallClient poll filters story_topic_id — definitive stories/voices separation |

---

## WHAT TO DO FIRST IN AI20 SESSION

**Recommended order:**

1. **Read this handoff + CURRENT_STATE_v8.md + LC_EMOTIONAL_COMMUNICATION_STANDARD.md**
2. **Regenerate Publication for Prof. Adesina** — verify all sections correct, 12 days to event
3. **Purge & Rebuild both phase sections** — remove stale photos from old phase
4. **EMAIL-SUITE** — Start with `submission-confirmation/route.ts` (highest volume)
5. **Purge button visibility** — redesign placement in PhotoSection
6. **Editor right panel padding** — verify current state on production, fix definitively if still broken
7. **`recentStories` fetch in legacy/page.tsx** — fix to query contributions not community_stories table

**Do NOT start without founder approval:**
- EventToolsHub Phase 2A (ETH-GM-001, ETH-AC-001 specs require approval)
- Attire Coordination module (requires dedicated architecture doc LC11)
- Supabase RLS security hardening (requires dedicated session)

---

*Handoff compiled by AI19 — Claude Sonnet 4.6 — 9 August 2026*
*Platform: AI19v2.11.87 | Branch: main | Deployed: Vercel*

**IMPORTANT CORRECTION:** Prof. Adesina's inaugural lecture/retirement event took place on
8 June 2026 — it has already happened. The publication is a POST-EVENT keepsake being
assembled from 83 voices, official photography, and event moments. No hard deadline.
Quality is the priority. Distribution goes to 70 emails as a permanent keepsake.
