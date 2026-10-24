# LC-PUBLICATION-REVIEW-001.md
## Publication Engine — Commercial Readiness Assessment

**Path:** docs/reviews/LC-PUBLICATION-REVIEW-001.md
**Compiled by:** AI8 · June 2026
**Status:** Assessment Document — findings only, no redesign
**Sources read:** LC_CONTEXT.md · LC03_PUBLICATION_ENGINE · LegacyCapsule_Publication_Engine_Build_Guide · CURRENT_STATE.md · HANDOFF.md · Master Build Plan v1.0 · Six Engagement Experiences · LC-PARTICIPATION-001 v2.1 · LC-EVENTSTORY-002

---

## EXECUTIVE SUMMARY

The Publication Engine is the platform's strongest commercial differentiator. It is also the feature furthest from a state where a paying client can use it end-to-end without hand-holding.

**The code is built. The pipeline is not connected.**

All 17 publication files build cleanly. The auto-arrangement algorithm exists. The PDF pipeline exists. The editor exists. But the organiser has no way to reach any of it from their manage page. The distribution email is not wired. The `page_map` that makes distribution personal is not confirmed as populated. Image dimension capture is not wired into the upload flow. The Vercel Pro timeout question is unanswered on production.

The gap between "built" and "commercially usable" is a set of specific, bounded connections — not rebuilds. This document maps every gap with severity.

---

## FINDINGS LEGEND

| Category | Meaning |
|---|---|
| **CRITICAL** | Prevents any organiser from completing a publication. Blocks commercial activation entirely. |
| **HIGH** | Degrades the publication significantly or blocks a major promised feature. |
| **MEDIUM** | Reduces quality or creates a friction point. Does not block completion. |
| **LOW** | Documentation gap, edge case, or future-facing concern. |

---

## SECTION 1 — WHAT PUBLICATION FUNCTIONALITY IS ALREADY BUILT

The following is confirmed as built, building cleanly, and code-complete as of the most recent HANDOFF.md:

**Database layer (confirmed DONE in Master Build Plan):**
- `publications` table — exists from Phase 1 schema
- Phase 3 columns added: `layout_config`, `page_map`, `arrangement_source`, `pdf_url`, `pdf_size_bytes`, `generation_status`, `generation_started_at`, `generation_completed_at`, `generation_error`, `version`
- `render_token` column — added per build guide
- `gallery_items.width_px`, `height_px`, `aspect_ratio` — specified as additions; confirmation of migration status unclear

**Code layer (confirmed in HANDOFF.md — "all 17 files building clean"):**
- `lib/publication/autoArrange.ts` — auto-arrangement algorithm
- `lib/publication/layoutHelpers.ts` — swap, replace, remove, promote, toggle, reset helpers
- `lib/publication/types.ts` — TypeScript types for `LayoutConfig`
- `app/api/publication/init/route.ts` — initialise layout, check for existing, upsert
- `app/api/publication/save/route.ts` — autosave on organiser interaction (debounced)
- `app/api/publication/generate/route.ts` — Puppeteer PDF pipeline
- `app/publication-render/[token]/page.tsx` — hidden render route with all 5 themes
- `app/manage/[slug]/publication/page.tsx` — publication entry point
- `components/publication/PublicationEditor.tsx` — main editor shell
- `components/publication/SectionNavigator.tsx` — left sidebar
- `components/publication/PhotoSection.tsx` — phase photo grid with drag
- `components/publication/PhotoSlot.tsx` — individual slot rendering
- `components/publication/ExcludedTray.tsx` — right tray for excluded photos
- `components/publication/TributeSection.tsx` — tribute ordering interface
- `components/publication/SectionToggle.tsx` — section enable/disable
- `components/publication/GenerateButton.tsx` — trigger with progress states

**Five themes implemented** in the render route: Classic, Soft, Romantic, Vibrant, Spiritual.

**autoPrint=1 support** — browser print-to-PDF path exists as the Puppeteer fallback.

**Distribution API route** — `app/api/publication/distribute/route.ts` — specified and coded in Six Engagement Experiences. Build status of this file is unconfirmed in HANDOFF.md; it may be specification-only.

---

## SECTION 2 — WHAT EXISTS ONLY IN DOCUMENTATION

The following is specified in detail across the source documents but has no confirmed build status:

- **Collective Belonging Email (`distribute` route)** — full code provided in Six Engagement Experiences. Not listed among confirmed built files in HANDOFF.md. Treat as documentation-only until confirmed.
- **Community Gallery sections in publication** — three new sections specified in LC-PARTICIPATION-001 H1: "The Community That Showed Up", "Legacy Builders", "How This Collection Grew". These require `capsule_participation_summary` and `capsule_legacy_builders` data. Not reflected in the current `layout_config` section types defined in `types.ts`.
- **`contributor_gallery_submissions` → `publication_eligible` pipeline** — the `publication_eligible` boolean on contributor gallery submissions is specified (D13) but the Publication Editor UI has no confirmed section or control for setting it.
- **Who Attended section** — specified as a publication section consuming `guests` table `checked_in_at`. The render route fetches `guests` data, but the `who_attended` section rendering is not confirmed as implemented.
- **Event Story chapters in publication** — LC-EVENTSTORY-002 Section M specifies one chapter per event phase consuming `capsule_event_phases`, `event_phase_media`, `event_phase_official_coverage`, `event_phase_contributions`. The Event Story Engine is not yet built, so these tables do not exist.
- **Version history with download links** — specified in Master Document Section 7 (Capsule Control Panel Publication module). Not present in current manage page.
- **Planner credit page** — specified as a publication section for registered planners. No build evidence.

---

## SECTION 3 — FIELD MISMATCHES

### 3.1 — CRITICAL: `gallery_items.width_px` and `height_px` not confirmed as migrated

**Severity:** CRITICAL

The auto-arrangement algorithm (`autoArrange.ts`) queries `gallery_items` selecting `width_px`, `height_px`, and `aspect_ratio` for slot assignment (landscape vs portrait decision). The Build Guide specifies the migration SQL to add these columns. However:

- HANDOFF.md activation checklist item O14 states: "`getImageMetadata()` wired into gallery upload component" — listed as **unchecked**.
- The Build Guide confirms these are new columns added via `ALTER TABLE`.
- If the migration has run but upload wiring has not, the columns exist but will be `null` for all existing gallery items.
- A `null` aspect_ratio causes the slot assignment algorithm to fall back to defaults — all photos become double-slot, no feature promotions, no triple slots. The publication layout degrades to a uniform grid with no visual hierarchy.

**Impact:** Every publication generated before `getImageMetadata()` is wired and existing photos are backfilled will have degraded photo layout. This affects the premium quality claim directly.

**Resolution needed:** Confirm migration status. Wire `getImageMetadata()` into upload flow. Backfill existing gallery items with a one-time script.

---

### 3.2 — CRITICAL: `publications` table missing `render_token` in original schema

**Severity:** CRITICAL

The original `publications` table schema (MVP Build Guide v2.0) does not include `render_token`. The Build Guide specifies: `ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS render_token text UNIQUE`. This migration must have run before any PDF generation is possible, as the generate route writes a token and the render route validates against it.

**Impact:** If the `render_token` migration has not been applied, every call to `/api/publication/generate` will fail at the `UPDATE publications SET render_token = ...` step. The PDF pipeline cannot start.

**Resolution needed:** Confirm `render_token` column exists in Supabase Table Editor before any end-to-end test.

---

### 3.3 — HIGH: `page_map` population unconfirmed

**Severity:** HIGH

The `page_map` column (jsonb) on the `publications` table is the mechanism that personalises the Collective Belonging Email — it maps each `contribution_id` to the page number where that tribute appears in the PDF. The Build Guide specifies that Puppeteer injects a script to read element positions after render and populate `page_map`. This is complex runtime logic dependent on Puppeteer completing successfully and element positions being stable at 96dpi.

The Master Build Plan records this as a known conflict: *"publications table exists but page_map column not confirmed"* — marked RESOLVED with a note to add the column. Whether the column was added and whether the population logic works on production is unconfirmed.

**Impact:** If `page_map` is empty, the Collective Belonging Email cannot personalise page references. The email still sends, but every recipient gets "Your tribute is inside" rather than "Your tribute appears on page 14." This eliminates the single most powerful sharing motivator in the platform.

**Resolution needed:** End-to-end test on Vercel with a real capsule, inspect `page_map` value in `publications` table after generation, confirm personalised page references render correctly in distribution email.

---

### 3.4 — HIGH: `guests.name` vs `guests` table column reference in render route

**Severity:** HIGH

The render route fetches: `adminClient.from('guests').select('id, name, tier, checked_in_at')`. However, the established column rename pattern in this project (the `name` → `contributor_name` rename on `contributions`) establishes that column naming conventions have shifted. The Master Document schema shows the `guests` table with a `name` column. This needs confirmation — if `guests.name` was also renamed or is stored differently, the Who Attended section will silently render empty.

**Resolution needed:** Confirm `guests.name` column name in Supabase Table Editor before testing the Who Attended publication section.

---

### 3.5 — MEDIUM: `layout_config` section types do not include participation sections

**Severity:** MEDIUM

The `SectionType` TypeScript type in `types.ts` defines: `'cover' | 'honouree_profile' | 'tributes' | 'phase_photos' | 'who_attended' | 'closing_message'`. The three new sections from LC-PARTICIPATION-001 (H1) — "The Community That Showed Up", "Legacy Builders", "How This Collection Grew" — are not in this type definition. When these sections are eventually added:

- The TypeScript compiler will reject them unless the type is extended.
- The `autoArrange.ts` algorithm does not include them in the section array it produces.
- The `SectionNavigator` will not list them.

**Impact:** These three sections cannot be added to any publication until `types.ts`, `autoArrange.ts`, and `SectionNavigator.tsx` are updated. This affects the publication's ability to acknowledge its own community — a key differentiator.

---

### 3.6 — MEDIUM: `organiser_email` vs `owner_user_id` in distribution route

**Severity:** MEDIUM

The distribution route in Six Engagement Experiences fetches `capsule.slug` and other fields but the capsule query may reference `owner_user_id` for organiser identification in some code paths. The Master Build Plan flags this explicitly: *"The Phase 3 code in Six Engagement Experiences uses owner_user_id to get organiser email via Supabase auth — adapt to use capsules.organiser_email directly since we do not have Supabase auth implemented."*

If the distribute route was built directly from the Six Engagement Experiences code without this adaptation, it will fail silently when trying to identify the organiser for notification.

**Resolution needed:** Review `app/api/publication/distribute/route.ts` for any `owner_user_id` → auth lookup. Replace with direct `capsules.organiser_email` read.

---

## SECTION 4 — EVENT STORY INTEGRATION GAPS

### 4.1 — HIGH: Event Story Engine does not exist — publication chapters cannot be populated

**Severity:** HIGH (known, scoped as future)

LC-EVENTSTORY-002 Section M specifies that the Publication Engine consumes `capsule_event_phases`, `event_phase_media`, `event_phase_official_coverage`, and `event_phase_contributions` to produce one publication chapter per event phase. None of these tables exist — the Event Story Engine is not yet built.

**Current impact:** Any capsule sold on the Full Platform tier that promises event phase coverage in the publication cannot deliver chapter-level event documentation. The publication will contain tributes and gallery photos from `gallery_items` (via the existing `capsule_phases` table connection) but will not have the richer Event Story chapter structure.

**Distinction from blocker:** This is not a blocker for the core publication flow (tributes + gallery + profile). It is a gap for any capsule that has active event phases. Launching the publication for tribute-only capsules is viable. Selling the full event chapter publication requires the Event Story Engine to be built first.

**Resolution needed:** Clearly define in organiser-facing language what the publication currently includes vs what Event Story phases add. Do not imply Event Story chapters are available until the engine is built.

---

### 4.2 — MEDIUM: `capsule_phases` vs `capsule_event_phases` — two phase table references

**Severity:** MEDIUM

The existing codebase uses `capsule_phases` (confirmed in Master Build Plan, Master Document schema, and the `autoArrange.ts` algorithm which queries `capsule_phases`). LC-EVENTSTORY-002 specifies a new table `capsule_event_phases` as the schema for the Event Story Engine. These are two different tables serving overlapping purposes.

The `autoArrange.ts` init route already queries `capsule_phases` for phase-based photo sections. When the Event Story Engine is built using `capsule_event_phases`, there will be two phase tables with no defined relationship or migration path between them. Any publication build that references phases will need to decide which table is authoritative.

**Resolution needed:** Before building the Event Story Engine, define explicitly: does `capsule_event_phases` replace `capsule_phases`, extend it, or exist alongside it? This decision affects the publication's phase section data source.

---

### 4.3 — LOW: Official Coverage has no upload path — publication priority cannot be assigned

**Severity:** LOW (deferred in LC-EVENTSTORY-002 as O3)

LC-EVENTSTORY-002 specifies Official Coverage as having publication priority. The upload workflow for Official Coverage is listed as Open Decision O3 — not yet resolved. Until this is resolved, official professional photography cannot be distinguished from guest uploads in the publication assembly, and priority placement cannot be implemented.

---

## SECTION 5 — LEGACY ROOM INTEGRATION GAPS

### 5.1 — HIGH: Publication Status section in Legacy Room has no download CTA wired

**Severity:** HIGH

LC-PARTICIPATION-001 Decision K1 states: *"Legacy Room persists post-publication as a living record. Publication Status section gains download CTA when publication is available."* The Legacy Room is built (confirmed HANDOFF.md). The `publications` table has a `pdf_url` column. But there is no confirmed code in the Legacy Room component that reads `pdf_url` and renders a download CTA.

**Impact:** After a publication is generated, the Legacy Room — which is the primary share destination for contributors — shows no indication that a publication exists. Contributors who return to see "what happened" find no download link. The viral loop that the Collective Belonging Email initiates (contributors returning to the Legacy Room) produces no payoff.

**Resolution needed:** Legacy Room component must query `publications` for the capsule and conditionally render a Publication Status section with download link when `pdf_url` is non-null and `generation_status = 'ready'`.

---

### 5.2 — HIGH: `contributor_gallery_submissions` table does not exist

**Severity:** HIGH

LC-PARTICIPATION-001 specifies a new table `contributor_gallery_submissions` (Section F3) with `publication_eligible` boolean. This table is the mechanism by which Community Memories (contributor photo uploads) flow into the publication (D13). The table is not listed among confirmed created tables in the Master Build Plan — only the original 16 core tables are confirmed. The `capsule_participation_summary` and `capsule_legacy_builders` tables from the Attribution Engine phase are confirmed. `contributor_gallery_submissions` is not.

**Impact:** The entire Community Memories → publication pipeline (D13) cannot function without this table. Community gallery photos cannot be marked `publication_eligible`. The Publication Editor has no contributor photos to surface for inclusion. The three new publication sections that reference community participation have no community photo data source.

---

### 5.3 — MEDIUM: Legacy Room `capsule_participation_summary` read not confirmed for Publication Status

**Severity:** MEDIUM

The Legacy Room is specified to read exclusively from `capsule_participation_summary` (D9, locked). The Publication Status section needs to know whether a publication exists and has a download URL. `capsule_participation_summary` does not currently include a `publication_url` or `publication_status` field. The Legacy Room would need to either: (a) query `publications` directly for this one piece of data — which violates D9 — or (b) `capsule_participation_summary` needs a `publication_status` and `publication_url` column added.

**Resolution needed:** Decide: add `publication_status` and `publication_url` to `capsule_participation_summary`, or carve out a specific exception to D9 for publication status only. This is an architectural decision that affects both the Legacy Room and the participation summary update logic.

---

### 5.4 — MEDIUM: Legacy Room gallery does not yet show Community Memories

**Severity:** MEDIUM

The Legacy Room gallery specification requires Featured Memories (from `capsule_gallery`, organiser-curated) above Community Memories (from `contributor_gallery_submissions`, contributor-approved). Since `contributor_gallery_submissions` does not exist, the Legacy Room gallery currently shows organiser photos only. The lower half of the gallery — Community Memories — is absent. Visitors see an incomplete experience that does not match the specified design.

---

## SECTION 6 — PUBLICATION QUALITY GAPS

### 6.1 — CRITICAL: No end-to-end production PDF test completed

**Severity:** CRITICAL

HANDOFF.md activation checklist item (unchecked): *"First Vercel Pro end-to-end PDF generation test on real capsule."* This is the single most important unverified item. Every part of the PDF pipeline depends on Puppeteer running successfully on Vercel infrastructure. Known failure modes:

- **Function timeout:** Default Vercel Hobby timeout is 10 seconds. The build guide specifies 120s timeout (`timeout: 120_000` in the Puppeteer `goto` call) and notes that 500+ tribute publications may need Vercel Pro's 300s timeout. Whether the current Vercel plan supports the required timeout is untested.
- **`@sparticuz/chromium` executable path:** The path resolution (`await chromium.executablePath()`) behaves differently on local vs Vercel cold start. An untested production deployment may produce a path error that crashes the route.
- **`serverComponentsExternalPackages` in `next.config.js`:** HANDOFF.md lists this as unchecked. Without this entry, Puppeteer is bundled client-side, causing the build to fail or the function size to exceed Vercel's limit.
- **Signed URL image loading:** Images in Supabase Storage require authentication. The render route must use signed URLs for all images. Whether signed URL generation and injection is working in the production render route is unconfirmed.

**Impact:** Until a complete PDF is successfully generated on production Vercel, the Publication Engine is not commercially usable regardless of how complete the code is.

---

### 6.2 — HIGH: Font loading in PDF not confirmed

**Severity:** HIGH

HANDOFF.md activation checklist item (unchecked): *"Font loading confirmed clean — self-host if Google Fonts slow at render time."* Puppeteer renders the hidden render route with `networkidle0` — it waits for all network requests to complete. If Google Fonts CDN is slow at render time (common in server environments), the publication renders with system fallback fonts rather than Cormorant Garamond and DM Sans. The premium typography that defines the publication's visual quality fails silently — the PDF generates but looks wrong.

**Impact:** A publication with fallback fonts delivered to a paying client is a support incident and a reputation risk. Font quality is not an aesthetic preference on this platform — it is the primary signal that the publication is premium.

**Resolution needed:** Self-host both fonts in the render route. Do not depend on Google Fonts CDN for Puppeteer renders.

---

### 6.3 — HIGH: Moderation queue must be live before any organiser demo

**Severity:** HIGH

HANDOFF.md activation checklist item (unchecked): *"Moderation queue live before organiser demo."* The publication draws from approved contributions only. An organiser accessing the Publication Editor without having moderated their contributions will see an empty or near-empty publication. If the moderation interface is not accessible or functional, the organiser cannot approve content and the publication remains empty.

**Impact:** Any organiser demo or first commercial client will encounter an empty publication if moderation is broken or inaccessible.

---

### 6.4 — HIGH: Publication card missing from manage page — no entry point for organisers

**Severity:** HIGH

HANDOFF.md activation checklist item (unchecked): *"Publication card added to manage page — links to `/manage/[slug]/publication`."* The publication entry page exists at `app/manage/[slug]/publication/page.tsx`. But the manage page (`app/manage/[slug]/page.tsx`) has no card, button, or link pointing to it. An organiser who has approved all their tributes, who is ready to create their publication, has no discoverable path to the Publication Editor.

**Impact:** The Publication Engine is fully built and completely invisible to organisers. This is the single most straightforward fix — a UI card on the manage page — but until it is in place, no organiser can access the publication workflow without a direct URL.

---

### 6.5 — HIGH: Distribution email (`distribute` route) not confirmed as wired

**Severity:** HIGH

The Collective Belonging Email is triggered when the organiser distributes the publication. The trigger mechanism — the organiser pressing a "Distribute" button — is not confirmed as existing on the manage page or Publication Editor. The `distribute` route may exist as code but there is no confirmed UI control that calls it.

**Impact:** Even after a PDF is successfully generated, the organiser has no way to send it to contributors. The publication exists in Supabase Storage but is not distributed. The Collective Belonging Email — one of the platform's six flagship engagement experiences — does not fire.

---

### 6.6 — MEDIUM: Page number estimate calibration unverified

**Severity:** MEDIUM

The build guide notes: *"The 1122px-per-page estimate assumes 96dpi. Puppeteer on some environments renders at different DPI. Calibrate by checking `window.devicePixelRatio`."* If DPI differs on production Vercel, `page_map` page numbers will be systematically wrong — every contributor receives a page reference that is off by a factor. A contributor told their tribute is on page 8 who finds it on page 12 is a small but real quality failure.

---

### 6.7 — MEDIUM: `autoPrint=1` path not connected to an organiser-facing control

**Severity:** MEDIUM

The platform's PDF generation uses a browser print-to-PDF path as an alternative to the Puppeteer pipeline (`autoPrint=1` query parameter, "Preview & Save as PDF" button in `PublicationEditor.tsx`). This is the correct approach given Vercel Hobby constraints. However, it is unclear whether this path is:
- Surfaced prominently as the primary option
- Positioned as a fallback when Puppeteer times out
- Documented for the organiser in any in-platform guidance

If Puppeteer fails on production and the organiser is not aware of the browser print path, they have no way to obtain their publication.

---

### 6.8 — LOW: Publication has no distribution access controls implemented

**Severity:** LOW

LC03_PUBLICATION_ENGINE specifies distribution rules: Public / Guest Restricted / Family Restricted / Organiser Only. Currently, any PDF generated appears to produce a public `pdf_url` stored in Supabase Storage. The `capsule-publications` bucket is marked Private (signed URLs only) in the storage bucket specification, which is correct. But the distribution route generates a plain URL, not a signed URL with expiry. Anyone with the URL has permanent access.

---

## SECTION 7 — WHAT PREVENTS COMMERCIAL ACTIVATION TODAY

The following items must all be resolved before the first paying client can complete a publication end-to-end without intervention. Listed in the order they block the flow.

---

### BLOCKER 1 — CRITICAL: No organiser entry point to Publication Editor

**The manage page has no publication card or link.** An organiser cannot discover or access the Publication Editor through the normal interface. This is the first step in the entire publication flow. Nothing else matters until this is in place.

**Fix:** Add a publication card to `app/manage/[slug]/page.tsx` linking to `/manage/[slug]/publication`.

---

### BLOCKER 2 — CRITICAL: `gallery_items.width_px` and `height_px` not wired at upload

**The auto-arrangement algorithm cannot assign layout slots correctly.** Without image dimensions, all photos default to double-slot. The publication looks like a uniform grid, not a premium designed document. This defeats the core value proposition.

**Fix:** Wire `getImageMetadata()` into the gallery upload component (O14). Run a one-time backfill script for existing gallery items.

---

### BLOCKER 3 — CRITICAL: `render_token` column migration must be confirmed

**The PDF pipeline cannot start without this column.** If the migration has not run, every generate call fails immediately.

**Fix:** Confirm column exists in Supabase. If not, run the `ALTER TABLE` from the Build Guide.

---

### BLOCKER 4 — CRITICAL: No end-to-end production PDF test

**The entire pipeline is unverified on Vercel.** Timeout configuration, Chromium executable path, signed image URLs, and font loading are all unconfirmed on production. Until a real PDF is generated successfully on the live environment, the engine's commercial readiness cannot be assessed.

**Fix:** Confirm `serverComponentsExternalPackages` in `next.config.js`. Deploy. Trigger `/api/publication/generate` with a real capsule. Inspect the resulting PDF. Fix any failures before any client demo.

---

### BLOCKER 5 — CRITICAL: Font loading must be verified or self-hosted

**A premium publication with system fallback fonts is a support incident.** Self-hosting both fonts in the render route is the only reliable solution.

**Fix:** Self-host Cormorant Garamond and DM Sans in `public/fonts/`. Update render route CSS to use local font paths.

---

### BLOCKER 6 — HIGH: No distribution mechanism for organiser

**Even after a successful PDF is generated, the organiser cannot distribute it.** There is no confirmed "Distribute" button or control anywhere in the manage page or Publication Editor.

**Fix:** Add a Distribution section to the Publication Editor or manage page. Wire it to `/api/publication/distribute`.

---

### BLOCKER 7 — HIGH: `page_map` must be confirmed as populating correctly

**The Collective Belonging Email is worthless without page numbers.** If `page_map` is empty, every contributor receives a generic notification. The personalisation that makes distribution emails shareable is lost.

**Fix:** After Blocker 4 is resolved, inspect `page_map` in the `publications` table. Verify contribution IDs are mapped to correct page numbers.

---

### COMMERCIAL ACTIVATION DEPENDENCY MAP

```
Manage page publication card (Blocker 1)
        ↓
Organiser opens Publication Editor
        ↓
gallery_items dimensions wired (Blocker 2) → Auto-arrangement produces quality layout
        ↓
render_token confirmed (Blocker 3) → Generate PDF initiated
        ↓
Production PDF test passes (Blocker 4) → PDF exists and is downloadable
        ↓
Fonts self-hosted (Blocker 5) → PDF looks premium
        ↓
page_map confirmed (Blocker 7) → Distribution personalised
        ↓
Distribute control exists (Blocker 6) → Collective Belonging Email fires
        ↓
COMMERCIAL ACTIVATION ACHIEVED
```

---

## SUMMARY TABLE

| Finding | Category | Section |
|---|---|---|
| No organiser entry point to Publication Editor | CRITICAL | §7 Blocker 1 |
| `gallery_items.width_px / height_px` not wired at upload | CRITICAL | §3.1, §7 Blocker 2 |
| `render_token` column migration unconfirmed | CRITICAL | §3.2, §7 Blocker 3 |
| No end-to-end production PDF test completed | CRITICAL | §6.1, §7 Blocker 4 |
| Font loading unverified — fallback fonts likely on production | CRITICAL | §6.2, §7 Blocker 5 |
| `contributor_gallery_submissions` table not confirmed as created | HIGH | §5.2 |
| Publication Status CTA missing from Legacy Room | HIGH | §5.1 |
| Distribution control not confirmed as wired | HIGH | §6.5, §7 Blocker 6 |
| `page_map` population unconfirmed | HIGH | §3.3, §7 Blocker 7 |
| Moderation queue must be live before first organiser demo | HIGH | §6.3 |
| Event Story chapters cannot be produced (engine not built) | HIGH | §4.1 |
| `organiser_email` vs `owner_user_id` in distribute route | MEDIUM | §3.6 |
| Legacy Room gallery missing Community Memories | MEDIUM | §5.4 |
| `capsule_participation_summary` missing publication status field | MEDIUM | §5.3 |
| `capsule_phases` vs `capsule_event_phases` collision risk | MEDIUM | §4.2 |
| `layout_config` types missing participation sections | MEDIUM | §3.5 |
| `page_map` DPI calibration unverified | MEDIUM | §6.6 |
| `autoPrint=1` path not surfaced as primary or fallback option | MEDIUM | §6.7 |
| `guests.name` column reference needs confirmation | HIGH | §3.4 |
| Publication distribution access controls not implemented | LOW | §6.8 |
| Official Coverage upload path unresolved | LOW | §4.3 |
STATUS UPDATE (AI7 — June 2026):
Browser print path added. Works on Vercel Hobby.
Puppeteer path intact for Pro upgrade.
See LC-PUBLICATION-CHANGE-001.md for full details.

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*
*LC-PUBLICATION-REVIEW-001 · June 2026 · Confidential*
*Assessment only. No redesign. No feature additions. Commercial readiness findings only.*
