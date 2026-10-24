# HANDOFF_AI17_TO_AI18.md
# LegacyCapsule — AI Session Handoff
# From: AI17 (Claude Sonnet 4.6 / Opus 4.6)
# To: AI18
# Date: 5 August 2026
# Session Duration: Single extended session
# Platform Version at Handoff: v2.11.50

---

## 1. IDENTITY & CONTEXT

You are AI18, continuing from AI17 on the LegacyCapsule platform.
Read PROJECT_RULES.md, LC_CONTEXT.md, and START_HERE.md before doing anything.
The platform is built by VALNEX, Unipessoal LDA (Portugal) trading as RevoWorldTech.
Founder: Valnex. You report to him. All decisions require his confirmation before build.

**Target live event: Prof. Adesina's Inauguration — 21 August 2026**
**Days remaining at handoff: 16**
**Branch: main | Deployed on Vercel Hobby**

---

## 2. WHAT AI17 COMPLETED THIS SESSION

### BUG-UPLOAD-001 — Official Photo Upload (RESOLVED ✅)
The official photo upload route was failing with SharedArrayBuffer errors on Vercel.
Root cause chain:
1. `db.storage.upload()` (Supabase JS client) triggers SharedArrayBuffer restriction on Vercel Hobby
2. Fix: replaced with direct REST fetch to Supabase Storage API
3. Bucket name was wrong: `gallery` → `tribute-photos` (bucket doesn't exist)
4. `aspect_ratio` is a generated column — cannot be inserted manually (removed from INSERT)
5. `contributor_name` doesn't exist on `gallery_items` — correct column is `uploaded_by_name`

**Files modified:**
- `app/api/event-moments/[phaseId]/upload-official/route.ts` (v2.11.30–v2.11.32)

### D-Day Upload Route Fixes (RESOLVED ✅)
- Bucket corrected: `gallery` → `tribute-photos`
- SharedArrayBuffer fix: replaced Supabase JS storage client with REST fetch
- Sharp `.rotate()` added for EXIF orientation correction
- DELETE handler also uses REST fetch

**Files modified:**
- `app/api/dday/upload/route.ts` (v2.11.44)

### EventMomentsManager — Full Feature Build (COMPLETE ✅)
Major rebuild of the organiser photo management dashboard:

**Features added:**
- Drag-and-drop reorder for official photos (@dnd-kit installed)
- `SortablePhotoCard` wrapper with `⠿` drag handle
- `handleDragEnd` saves order via `/api/event-moments/[phaseId]/reorder`
- Optimistic UI update with DB revert on failure
- Delete button on every card (tap-to-confirm on mobile, text on desktop)
- Checkbox selection per card
- Select-all / Deselect-all toggle per section
- Sticky bulk action bar: Feature, Unfeature, Hide, Delete
- Responsive grid: 2-col mobile / 3-col desktop via `useGridCols` hook
- Icon-only buttons on mobile (`👁` `★` `🗑`), text on desktop
- `isMobile` state flag for responsive behaviour
- Batched upload with progress counter (batch 5, 800ms pause between batches)
- `uploadProgress` state: "Uploading X of Y…"
- `reorderMsg` state: "Order saved" / "Could not save order"
- EXIF orientation fix: `imageOrientation: 'from-image'` on all img tags
- Overflow:hidden moved from card outer div to image container only (reveals drag handle)

**Files modified:**
- `components/manage/EventMomentsManager.tsx` (v2.11.42–v2.11.45)

**New API routes created:**
- `app/api/event-moments/[phaseId]/reorder/route.ts` (v2.11.42) — POST, batch updates display_order
- `app/api/event-moments/[phaseId]/photos/[photoId]/route.ts` (v2.11.45) — DELETE, removes row + storage
- `app/api/event-moments/[phaseId]/bulk-curate/route.ts` (v2.11.45) — PATCH, bulk feature/hide/delete

### EventMomentsClient — Public Gallery Fixes (COMPLETE ✅)
- `GalleryPhoto` interface: `contributor_name` → `uploaded_by_name: string | null`
- Name overlay: hidden when `uploaded_by_name` is null/empty (no more "Guest" labels)
- Guest empty state: hidden when official photos exist (avoids double empty state)
- EXIF orientation: `imageOrientation: 'from-image'` on all img tags + lightbox
- Lightbox: `uploaded_by_name ?? 'Event photo'` as alt text

**Files modified:**
- `components/capsule/EventMomentsClient.tsx` (v2.11.41)

### Phase Gallery Page — Critical Bug Fix (COMPLETE ✅)
Public phase page was showing "No photos yet" despite 34 photos in DB.
Root cause chain:
1. `contributor_name` column doesn't exist on `gallery_items` — query was silently failing
2. Correct column: `uploaded_by_name`
3. Page was cached — `export const revalidate = 0` added
4. `getDb()` factory with `cache: 'no-store'` tried and reverted (caused issues)
5. Sequential fetches with explicit error logging used to diagnose
6. `display_order` ORDER BY removed (all values null → silent ordering issue)

**Files modified:**
- `app/for/[slug]/story/[phaseId]/page.tsx` (v2.11.34–v2.11.39)
- `app/api/event-moments/[phaseId]/route.ts` (v2.11.35–v2.11.37)

### Photo Ordering — `display_order` System (COMPLETE ✅)
- Official photos ordered by `display_order` ascending (nulls last) then `storage_path` as fallback
- After organiser reorders via drag-and-drop, `display_order` is written
- Organiser arrangement persists and always wins over default filename order

**Files modified:**
- `app/for/[slug]/story/[phaseId]/page.tsx`
- `app/api/event-moments/[phaseId]/route.ts`

### D-Day Guest Delete Bug Fix (COMPLETE ✅)
`PhotoThumb` in dday/page.tsx was passing `photo.id` as `capsule_id` to the delete endpoint.
Fixed to pass `capsule.id` correctly. `capsuleId` prop added to `PhotoThumb` component.

**Files modified:**
- `app/for/[slug]/dday/page.tsx` (v2.11.45)

### Publication Render — Major Overhaul (COMPLETE ✅)
Complete rebuild of `app/publication-render/[token]/page.tsx`:

**Changes:**
- All section backgrounds white — no coloured fills anywhere
- Section headers: 28px, 3px gold rule, 60px top margin, `page-break-after:avoid`
- Tribute cards: 28px/32px padding, 14px body text at 1.90 line-height
- Profile renderer rebuilt: all 5 section types labelled and styled distinctly
  - `biography` → standard prose with gold accent bar
  - `occasion` → info-block with left gold border
  - `story` → standard prose
  - `appreciation` → letter styling with floating label
  - `custom` → uses custom_title
- `renderOfficialPhotography()` — NEW: splits official photos from guest captures
  - 2-column premium grid, ordered by display_order, no repetitive captions
  - Appears BEFORE guest captures
- `renderGuestCaptures()` — renamed from D-Day renderer
  - 3-column grid, contributor name as caption, "In The Room" heading
- `renderCommunityStories()` — grouped by topic with sub-headings
- `renderMemories()` — NEW: reads `capsule_memories` table, grouped by era_label
  - Gracefully returns empty if table has no data
- `renderProfileGallery()` — NEW: reads `capsule_gallery` table
  - Groups by `section_index`, shows `section_title` if present
  - 3-column grid, appears after honouree profile text sections
- `getTributeHeading(eventType)` — NEW: routes section heading by event type
  - memorial → Tributes | wedding → Blessings | birthday → Birthday Wishes
  - graduation → Congratulations | chieftaincy → Royal Felicitations | default → Appreciations
- Tribute serial numbers: `1.` `2.` `3.` prefix on every card
- Closing message ALWAYS last — extracted from section loop
- `@page { size: 210mm 297mm }` — explicit mm instead of A4 keyword
- Screen-only A4 instruction banner — `position:sticky`, hidden on print via `.no-print`
- `bannerHtml` injected as HTML string (not JSX) to avoid layout interference
- `capsule_gallery` fetch added to parallel data fetch
- `capsule_memories` fetch added to parallel data fetch
- `renderTributes` now accepts `eventType: string` parameter

**Files created/modified:**
- `app/publication-render/[token]/page.tsx` — COMPLETE REPLACEMENT (v2.11.46–v2.11.50)
- `app/publication-render/layout.tsx` — NEW FILE (v2.11.48)

### Publication Render Layout — Site Chrome Fix (COMPLETE ✅)
Site footer/header was appearing in publication PDF.
Root cause: no `layout.tsx` in `publication-render/` route — root layout was wrapping it.
Fix: minimal standalone layout created that passes children through with no wrapping.

**File created:**
- `app/publication-render/layout.tsx` (v2.11.48)

---

## 3. FILES CREATED THIS SESSION (NEW)

| File Path | Purpose | Version |
|-----------|---------|---------|
| `app/api/event-moments/[phaseId]/reorder/route.ts` | Batch updates display_order for official photo reordering | v2.11.42 |
| `app/api/event-moments/[phaseId]/photos/[photoId]/route.ts` | DELETE single photo — removes row + storage file | v2.11.45 |
| `app/api/event-moments/[phaseId]/bulk-curate/route.ts` | Bulk PATCH: feature/unfeature/hide/show/delete multiple photos | v2.11.45 |
| `app/publication-render/layout.tsx` | Standalone layout — prevents site chrome in publication PDF | v2.11.48 |

---

## 4. FILES MODIFIED THIS SESSION

| File Path | What Changed | Final Version |
|-----------|-------------|--------------|
| `app/api/event-moments/[phaseId]/upload-official/route.ts` | REST fetch replaces Supabase JS client, correct bucket, aspect_ratio removed | v2.11.32 |
| `app/api/event-moments/[phaseId]/route.ts` | uploaded_by_name column, display_order sort, expanded SELECT | v2.11.37 |
| `app/api/dday/upload/route.ts` | REST fetch, correct bucket, Sharp .rotate(), DELETE handler fixed | v2.11.44 |
| `components/manage/EventMomentsManager.tsx` | Full rebuild: DnD, delete, select-all, bulk actions, responsive grid | v2.11.45 |
| `components/capsule/EventMomentsClient.tsx` | uploaded_by_name, name overlay logic, EXIF orientation, empty state | v2.11.41 |
| `app/for/[slug]/story/[phaseId]/page.tsx` | uploaded_by_name, revalidate=0, sequential fetches, display_order sort | v2.11.39 |
| `app/for/[slug]/dday/page.tsx` | capsule_id bug fix in PhotoThumb delete handler | v2.11.45 |
| `app/publication-render/[token]/page.tsx` | Complete replacement — all publication improvements | v2.11.50 |

---

## 5. CURRENT PLATFORM VERSION

**v2.11.50** deployed to main branch on Vercel Hobby.

**Storage buckets (confirmed):**
- `tribute-photos` — all gallery_items (official + guest D-Day)
- `tribute-audio` — voice recordings
- `tribute-video` — video tributes
- `capsule-publications` — PDF (50MB, application/pdf only)

**Key DB facts confirmed this session:**
- `gallery_items.uploaded_by_name` — NOT `contributor_name` (does not exist)
- `gallery_items.aspect_ratio` — GENERATED COLUMN (cannot insert)
- `gallery_items.source` — only value is `'dday'` (no 'profile' or other sources)
- `capsule_gallery` — profile photo gallery table (section_index, section_title, sort_order)
- `capsule_memories` — exists in schema but currently empty (no rows yet)
- `approved_contrib_count` on capsules — tracks contributions not gallery_items

---

## 6. PENDING ITEMS — PRIORITY ORDER

### IMMEDIATE (before publication send)

**PUB-001 — Publication content refresh mechanism**
The publication editor stores layout in `publications.layout_config`. Photos/tributes added after
initial publication creation are NOT automatically reflected. The organiser needs a
"Re-sync Content" button in the publication editor that calls `/api/publication/init`
to rebuild layout_config from current DB state.
- File to modify: `components/publication/PublicationEditor.tsx`
- Need to read: `app/api/publication/init/route.ts` before building

**PUB-002 — SectionNavigator modernisation**
The publication editor sidebar (`components/publication/SectionNavigator.tsx`) needs:
- Add missing section types to SECTION_LABELS and SECTION_ICONS:
  `official_photography`, `community_stories`, `memories`, `profile_gallery`
- Show auto-included sections as info items (non-toggleable)
- Visual modernisation: gold active state, better hierarchy

**PUB-003 — Publication further review (founder flagged)**
Founder has additional review notes to share with AI18 directly. Expect:
- Section spacing tweaks
- Photo section layout refinements
- Possible addition of table of contents page

**PUB-004 — Approved_contrib_count reset**
Run this SQL to correct the cached count:
```sql
UPDATE capsules
SET approved_contrib_count = (
  SELECT COUNT(*) FROM contributions
  WHERE capsule_id = capsules.id
  AND status = 'approved'
  AND deleted_at IS NULL
)
WHERE id = 'ac10d44a-4a33-4621-8acf-7b3ea5b50269';
```
Also need: trigger fix so deletions properly decrement the count.

### HIGH PRIORITY

**BUG-CIRCLE-001 — Circle Leader RSVP update endpoint missing**
The guest-facing circle portal (`/portal/circle/[token]`) cannot update RSVP status.
The backend API endpoint for circle leader RSVP update does not exist.
Files to check: `app/api/guests/` directory

**BUG-003 — Family Rep invite email: plain URL, no button**
The family rep invitation email renders a raw URL instead of a styled CTA button.
File: email template for family rep invitation

**Guest Coordination UI — 6 files still unbuilt**
Backend is complete (6 API routes, 3 tables). UI layer is the gap:
- `app/manage/[slug]/guests/page.tsx`
- `components/manage/guests/CircleManager.tsx`
- `components/manage/guests/RSVPDashboard.tsx`
- `components/manage/guests/ActivityFeed.tsx`
- `app/portal/circle/[token]/page.tsx`
- `components/manage/ServicesTab.tsx` (Guest Mgmt card wired)
**NOTE: Requires Opus 4.6. Discuss architecture before building.**

### DEFERRED (post-launch)

**SECURITY — Supabase RLS hardening**
Supabase Security Advisor flagged:
- 5 tables with RLS disabled: `eoh_digest_schedule`, `event_circles`, `event_rsvp_config`, `event_action_log`, `story_prompt_library`
- Numerous permissive `USING (true)` policies
- Public bucket listing on tribute-audio, tribute-photos, tribute-video
- Mutable search_path functions (5 functions)
- `prevent_auth_user_delete()` callable by anon role
**No immediate breach risk. Dedicate a full security session post-launch.**

**Option C — Client-side image compression**
Currently Sharp compresses server-side. For large uploads this risks Vercel timeout.
Option C: use `browser-image-compression` npm package to compress in browser before upload.
Flagged as post-launch improvement.

**Email distribution UI for publication**
Send publication PDF to all collected subscriber emails with option to add fresh emails
or send to select contributors. UI not yet built. Backend (publication_subscribers table,
Resend) exists. Deferred to dedicated session.

**Anniversary email cron** — frozen pending hosting tier decision

**Attire Coordination Engine (LC11)** — requires dedicated architecture session

**Paystack integration** — placeholder only, delegated separately

---

## 7. STANDING RULES FOR AI18

All standing rules from PROJECT_RULES.md apply. Key ones to watch:

1. **Read before writing** — never assume file state. Always request current file before editing
2. **Discuss before building** — confirm flow with founder before any code
3. **One pass per file** — all edits to same file in one operation
4. **PowerShell** — semicolons not `&&` for command chaining
5. **Imports** — always `@/` prefix, never `src/`
6. **Supabase** — `try/catch` not `.catch()`, never chain `.catch()`
7. **No hardcoded values** — all business values from `platform_config`
8. **column names** — `uploaded_by_name` not `contributor_name` on `gallery_items`
9. **Bucket name** — `tribute-photos` not `gallery` for all photo storage
10. **Participation Language** — never use "Tribute" except for memorial events
11. **`page_state: 'active'`** — `'tribute_collection'` is invalid and retired
12. **WhatsApp `<a>` tag** — known paste corruption point in `PhotographerTokenPanel`.
    After any full-file replacement of EventMomentsManager.tsx, manually verify the
    WhatsApp `<a href=...>` tag has its opening `<a` intact (it consistently gets dropped)
13. **Browser print is the PDF path** — NOT Puppeteer. Vercel Pro upgrade ruled out.
14. **`aspect_ratio`** — generated column on `gallery_items`, never insert it
15. **File headers** — every script needs: FILE PATH, PURPOSE, ARCHITECTURE, BUILT BY, UPDATED, VERSION, DATE
16. **Section headers** — `// ═══ SECTION N — Description ═══`
17. **Git format** — `git add . / git commit -m "vX.X.X - ..." / git push origin main`
18. **Model selection** — Opus 4.6 for complex multi-file builds; Sonnet 4.6 for targeted fixes

---

## 8. MODEL RECOMMENDATION FOR AI18

**Start on: Claude Sonnet 4.6** (briefing, reading, planning)

**Switch to Opus 4.6 for:**
- Guest Coordination UI build (6 files, high complexity)
- Publication further review and tweaking (multi-file, design judgment)
- Security hardening session (architectural decisions)
- Any new feature spanning 3+ files

**Drop back to Sonnet 4.6 for:**
- Single-file bug fixes
- SQL queries and data checks
- Documentation passes
- Git commits and deployment verification

---

## 9. KNOWN GOTCHAS AI18 MUST KNOW

**PowerShell bracket paths:**
Square brackets in file paths (`[phaseId]`, `[token]`) cause PowerShell errors.
Always use `-LiteralPath` flag or `Get-ChildItem -Recurse -Filter` to navigate to these.

**Publication render page:**
`app/publication-render/[token]/page.tsx` is large (~900 lines). When replacing it entirely,
use `Copy-Item -LiteralPath` to overwrite. Always run `Revert File` in VS Code after copy.
Do NOT do incremental find/replace on this file — too many interdependencies.

**EventMomentsManager WhatsApp link:**
Every full-file replacement drops the `<a` opening tag on the WhatsApp link in
`PhotographerTokenPanel`. Check line ~466 after any paste. The orphaned `href=` with no
opening `<a` tag is the symptom.

**`capsule_memories` table:**
The table exists in the schema but has zero rows for the Prof. Adesina capsule.
The publication memories renderer will silently return empty — this is correct.

**Signed URLs for publication:**
`toSignedUrl()` in the render page generates 300-second signed URLs for images.
If the PDF takes too long to render, images may expire. Not currently an issue.

**Publication layout_config:**
The publication editor auto-saves layout to `publications.layout_config`.
Photos uploaded AFTER publication was initialised will NOT appear in phase_photos slots
unless the organiser re-syncs. The Re-sync Content button (PUB-001) is needed urgently.

---

## 10. SESSION STATISTICS

- Version at start: v2.11.27
- Version at end: v2.11.50
- Versions incremented: 23
- Files created: 4 new files
- Files modified: 8 files
- Bugs resolved: BUG-UPLOAD-001 (critical), D-Day upload (critical), phase gallery display (critical), PhotoThumb capsule_id (medium)
- Features built: DnD reorder, delete, select-all, bulk actions, responsive grid, EXIF orientation, publication overhaul, profile gallery in publication, official/guest photo separation, tribute serial numbers, participation language in publication, standalone publication layout

---

*Handoff prepared by AI17 — Claude Sonnet 4.6 / Opus 4.6 — 5 August 2026*
*Next: AI18 reads this document, PROJECT_RULES.md, LC_CONTEXT.md, and awaits founder direction*
