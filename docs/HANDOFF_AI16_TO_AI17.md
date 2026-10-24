# HANDOFF_AI16_TO_AI17.md
## LegacyCapsule — Session Handoff
### AI16 → AI17 · Claude Opus 4.6 · 2–3 August 2026

---

## CRITICAL: READ THIS FIRST

**You are AI17.** Multiple AIs have worked on this project. Documents in the
project folder span different eras. This handoff tells you exactly what to trust,
what to ignore, and what the current state is.

**Model recommendation:** Use Opus 4.6 for complex organiser UI, architecture,
and Event Moments build. Use Sonnet 4.6 for API routes, documentation, copy,
and simple fixes.

---

## SECTION 1 — DOCUMENT TRUST HIERARCHY

### Trust fully (most current)
| Document | Status |
|----------|--------|
| `HANDOFF_AI16_TO_AI17.md` (this file) | Current — written 2 Aug 2026 |
| `CURRENT_STATE_v5.md` | Current — written by AI16 2 Aug 2026 |
| `COMPONENT_MAP_AI16_APPEND.md` | Current — append to COMPONENT_MAP.md |
| `LC12_EVENT_MOMENTS_SPEC.md` | Current — authoritative Event Moments spec |
| `LC12_EVENT_MOMENTS.md` | Current — architecture reference |
| `PROJECT_RULES.md` | Always current — standing rules |
| `LC_CONTEXT.md` | Always current — platform context |

### Trust with caution (partially outdated)
| Document | Issue |
|----------|-------|
| `COMPONENT_MAP.md` | Missing AI16 session entries — append AI16 block |
| `CURRENT_STATE_v4.md` | Superseded by v5 — ignore |
| `HANDOFF_AI14_26Jul2026.md` | Superseded — some tasks now complete |
| `HANDOFF_v2_1_1_TO_AI14.md` | Superseded |
| `LC_LAUNCH_BUILD_ROADMAP.md` | Check against CURRENT_STATE_v5 for actual status |

### Ignore entirely (obsolete)
| Document | Reason |
|----------|--------|
| `HANDOFF_v1_5_9_TO_v1_7_8_19Jul2026.md` | Very old — pre AI12 |
| `HANDOFF_v1_9_8_TO_NEXT_AI_22Jul2026.md` | Old — pre AI13 |
| `START_HERE.md` | May be outdated — cross-check with this doc |
| `HANDOVER_TRIBUTE_WALL_20MAY2026.md` (if exists) | Very old — ignore |

---

## SECTION 2 — FILES TO REMOVE FROM PROJECT FOLDER

These documents are safely obsolete. Their useful content has been extracted
into CURRENT_STATE_v5 and COMPONENT_MAP_AI16_APPEND. Removing them reduces
token waste for future AI sessions:

```
HANDOFF_v1_5_9_TO_v1_7_8_19Jul2026.md
HANDOFF_v1_9_8_TO_NEXT_AI_22Jul2026.md
HANDOFF_v2_1_1_TO_AI14.md
CURRENT_STATE_v4.md
```

Keep all LC0x architecture documents — they remain valid references.
Keep all ETH-GM documents — Guest Management system reference.
Keep all RW0x documents — ecosystem reference.

---

## SECTION 3 — PLATFORM STATE AT HANDOFF (v2.11.27)

### Git version: v2.11.27
### Branch: main (deployed to Vercel)
### Days to target event: 18 (21 August 2026)

### What is complete and working
- Full tribute wall (Voices) with event-aware participation language
- Community Memories & Stories with seeded topics (79 prompts, 33 capsules)
- Event Moments architecture (LC12) — phases, galleries, EventMomentsClient
- Official Photography Portal — token generation, photographer upload page
- EventPhasesSection — fully rebuilt with inline edit, Manage Photos, QR print
- EventMomentsManager — phase tabs, guest/official sections, curation UI
- CapsuleBottomNav — 'none' currentPage type added for phase/story pages
- PremiumsPanel — Event Moments section with per-phase links
- QR print page — `/manage/[slug]/phases/[phaseId]/print`
- PhaseQRPrintClient — premium print design, browser print/close
- Photographer token API routes — generate, revoke, validate, upload
- Phases PATCH handler — edit phase now works (was TODO stub)
- D-Day upload route — extended with phase_id, width_px, height_px, aspect_ratio
- All "Tribute" terminology migrated to event-aware language engine
- Serial numbers on Voices wall reversed (newest = highest)
- Memories room topics fix — 785 topics across 33 capsules
- WhatsApp share text updated across all pages
- Profile page custom nav removed — CapsuleBottomNav sole nav
- Event Story page — "← The Voices" link, correct bottom nav
- Memories page — "Back to The Voices" link
- Encomium terminology for birthday, chieftaincy, award_ceremony, ordination

### What is NOT working (known bugs at handoff)

**BUG-UPLOAD-001 — Official photo upload fails (PRIORITY)**
Location: `EventMomentsManager` → POST `/api/event-moments/[phaseId]/upload-official`
Symptom: "Upload failed. Please try again." on every attempt
Console: 500 Internal Server Error
Suspected cause: `aspect_ratio` column is type `numeric` in Supabase but we
pass a JavaScript float. May also be a sharp runtime issue on Vercel.

**Diagnostic steps for AI17:**
1. First — check Vercel function logs for the exact error from `[upload-official]`
2. Try removing `width_px`, `height_px`, `aspect_ratio` from the gallery_items
   insert in `upload-official/route.ts` temporarily. If upload succeeds, the
   issue is the numeric type mismatch.
3. If still failing — check whether the `gallery` storage bucket accepts uploads
   from the service role key (test with a simple D-Day upload to compare)
4. The D-Day upload route (`app/api/dday/upload/route.ts`) works correctly —
   compare its insert payload against upload-official to find the discrepancy
5. The `uploaded_by_name` column exists in gallery_items schema — our insert
   does not include it. Check if it has a NOT NULL constraint.

**gallery_items confirmed schema (from Supabase):**
`id, capsule_id, community_id, phase_id, image_url, video_url, caption,
sort_order, source, approved, uploaded_by_name, created_at, deleted_at,
width_px, height_px, aspect_ratio, device_token, storage_path,
contribution_id, is_official_photography, featured_in_publication,
display_order`

**The safest minimal insert to try:**
```ts
{
  capsule_id,
  phase_id:                phaseId,
  image_url:               urlData.publicUrl,
  caption:                 'Official Photography',
  source:                  'dday',
  approved:                true,
  is_official_photography: true,
  storage_path:            storagePath,
}
```
If this works, add back width_px/height_px/aspect_ratio one at a time.

**BUG-028 — Payment E2E live test not confirmed**
Webhook corrected — needs founder live test (founder action)

**BUG-CIRCLE-001 — Circle Leader RSVP endpoint missing**
Must build before circle portal is usable

**BUG-003 — Family Rep invite email — plain URL, no button**

### What is pending build
- Guest Coordination UI — 6 files still unbuilt (highest structural priority)
- Publication UI rearrangement
- Orientation-aware grid in EventMomentsClient (portrait 2-col, landscape full-width)
- Guest moderation toggle in Settings tab
- Publication assortment UI for Event Moments

---

## SECTION 4 — KEY FILE LOCATIONS

### Never edit without reading first
```
components/TributeWallClient.tsx          — Voices wall (very large, complex)
app/manage/[slug]/page.tsx                — Manage dashboard (very large)
components/manage/ServicesTab.tsx         — Services tab
lib/config/participationLanguage.ts       — ALL event-aware terminology
lib/utils/getParticipationLanguage.ts     — Lang engine
lib/email.ts                              — All transactional emails
```

### Event Moments files (LC12)
```
app/for/[slug]/story/[phaseId]/page.tsx           — Phase gallery server page
components/capsule/EventMomentsClient.tsx          — Guest gallery UI
components/manage/EventPhasesSection.tsx           — Organiser phase management
components/manage/EventMomentsManager.tsx          — Photo curation UI
app/api/event-moments/[phaseId]/route.ts          — GET public gallery
app/api/event-moments/[phaseId]/upload-official/route.ts  — POST official photos (BROKEN)
app/api/event-moments/[phaseId]/curate/route.ts   — PATCH curation actions
app/api/photographer/[token]/page.tsx              — Portal server page
components/capsule/PhotographerPortalClient.tsx    — Portal UI
app/api/photographer/[token]/route.ts              — Token validation GET
app/api/photographer/[token]/upload/route.ts       — Photographer upload POST
app/api/photographer/token/generate/route.ts       — Generate token
app/api/photographer/token/revoke/route.ts         — Revoke token
app/manage/[slug]/phases/[phaseId]/print/page.tsx  — QR print server page
components/manage/PhaseQRPrintClient.tsx           — QR print UI
```

### Participation language (terminology)
```
lib/config/participationLanguage.ts       — Event type → UI strings
lib/utils/getParticipationLanguage.ts     — The routing function
lib/eventLabels.ts                        — Legacy helpers (still in use)
```

### Database
```
LC operational project (Frankfurt)  — capsule/guest/contribution data
RW-Ecosystem project (Frankfurt)    — platform_config, feature flags
```

---

## SECTION 5 — STANDING RULES (never break these)

1. **Never hardcode tribute/appreciation/wishes strings** — always use
   `getParticipationLanguage(event_type)` for client-facing terminology
2. **"Tribute" is reserved for memorial events only** — all others use
   event-aware lang engine
3. **Never chain `.catch()` on Supabase queries** — always use try/catch
4. **`TributeMap` must use dynamic import with `ssr: false`**
5. **No hardcoded business values** — all commercial figures from `platform_config`
   in RW-Ecosystem via `getConfig()`
6. **Never assume file state** — always read current file before editing
7. **One file per pass** — batch all edits to the same file in one pass
8. **Discuss flow before building** — design decisions confirmed before code
9. **Half-builds are worse than no build** — A+++ modules must be complete or hidden
10. **D-Day upload route is the sole upload mechanism** — no parallel system
11. **Event Moments is photo-only** — no tribute form on phase pages ever
12. **Email capture is post-photo, value-first** — never pre-photo
13. **Official Photographs section hidden until content exists** — guest page only
14. **Organiser override is permanent** — no window lock-out for admin ever
15. **All photos compressed via sharp** — no raw images stored
16. **page_state: 'tribute_collection'** is retired — always use 'active'
17. **`honouree_portal_tokens`** validity by `expires_at` only — no `is_active` column
18. **Community Stories is free** — no toggle, no guard, no purchase required
19. **D-Day is photos only** on event day — no tribute text
20. **PowerShell**: semicolon-separated commands (not `&&`)
21. **Imports**: `@/` prefix — never `src/` prefix

---

## SECTION 6 — EVENT MOMENTS CURRENT STATE (LC12)

See `LC12_EVENT_MOMENTS_SPEC.md` for the full authoritative spec.

### What is built
- Phase gallery page redesigned (tribute form gone)
- EventMomentsClient — guest gallery with lightbox, load more, share, CTA
- D-Day upload extended with phase_id tagging
- Public GET route for paginated phase gallery
- Curate PATCH route (show/hide/reorder/feature) — auth simplified
- EventMomentsManager — organiser curation UI with phase tabs
- EventPhasesSection — fully rebuilt with all controls
- QR print page — premium print design
- Photographer token system — generate, revoke, upload portal
- Event Moments in PremiumsPanel with per-phase links

### What still needs building
| Item | File | Notes |
|------|------|-------|
| Fix upload-official | upload-official/route.ts | BUG-UPLOAD-001 above |
| Orientation-aware grid | EventMomentsClient.tsx | Portrait 2-col, landscape full-width |
| Guest moderation toggle | manage settings tab | Per-capsule setting |
| Publication assortment UI | publication editor | Select all/individual/drag |

### Key decisions (locked)
- Guest Eye View cap: 5 photos per guest per phase
- Official Photographs cap: 30 photos per phase
- Guest section always above Official Photographs
- Official section hidden from guests until content exists
- Capture window: 6am event day → 6am next day
- Admin override: always open regardless of window
- Instant post default (no approval queue)
- Publication: phase name → Guest Eye View → Official Photographs

---

## SECTION 7 — GUEST COORDINATION UI (highest structural priority)

Six files still unbuilt. API layer is complete. Use Opus 4.6.

| File | Purpose |
|------|---------|
| `app/manage/[slug]/guests/page.tsx` | Orchestrator — auth + component host |
| `components/manage/guests/CircleManager.tsx` | Circle CRUD, leader portal |
| `components/manage/guests/RSVPDashboard.tsx` | Send invitations, stats |
| `components/manage/guests/ActivityFeed.tsx` | Audit log timeline |
| `app/portal/circle/[token]/page.tsx` | Circle Leader portal |
| `components/manage/ServicesTab.tsx` (edit) | Wire Guest Management card |

Reference: `ETH-GM-001_GUEST_MANAGEMENT_SYSTEM.md`

---

## SECTION 8 — GIT FORMAT

```
git add .
git commit -m "vX.X.X - feat/fix: description
- file1: what changed
- file2: what changed"
git push origin main
```

Current version: **v2.11.27**
Next version: **v2.11.28**

---

## SECTION 9 — TECH STACK REMINDER

- Next.js App Router, TypeScript, Tailwind CSS v4
- Supabase PostgreSQL + RLS (service role for server, anon for client)
- Resend (email), Stripe (payments), Vercel Hobby
- sharp for server-side image compression
- Windows / VS Code / PowerShell
- Repo: `okajibulu/legacycapsule` · branch: `main`
- Domain: `itslegacycapsule.com` (Cloudflare)

---

## SECTION 10 — COMPONENT MAP UPDATE INSTRUCTIONS

1. Open `COMPONENT_MAP.md`
2. Scroll to the very bottom
3. Paste the entire contents of `COMPONENT_MAP_AI16_APPEND.md` after the last line
4. Save

Do not replace any existing content — append only.

---

## SECTION 11 — TIPS FOR AI17

1. **Always read Vercel function logs** before guessing at API failures
2. **The manage dashboard does NOT use organiser_session cookie** — it uses
   Supabase Auth. Any route called from the manage dashboard must not gate
   on `organiser_session` cookie.
3. **EventMomentsManager uses the public GET route** for photo fetching —
   this was intentional to bypass auth complexity
4. **The phases route has GET, POST, PUT, PATCH (alias of PUT), DELETE** —
   PATCH delegates to PUT which reads `id` from request body, not query string
5. **gallery_items has `uploaded_by_name` not `contributor_name`** — check
   schema before any gallery insert
6. **aspect_ratio is `numeric` type in Postgres** — JavaScript floats may
   need casting: `parseFloat(value.toFixed(3))`
7. **PremiumsPanel requires `phases` prop** from CapsuleBottomNav — all pages
   that render CapsuleBottomNav should pass `phases`
8. **`CapsulePage` type now includes `'none'`** — use for pages that don't
   correspond to a nav tab (phase pages, story pages)
9. **story_prompt_library must use lowercase event_type** — 'memorial' not
   'Memorial & Funeral'. All capsule event_types normalised to lowercase.
10. **The publication engine uses browser print** — Puppeteer workaround.
    Do not touch publication generation without understanding this.

---

*AI16 · Claude Opus 4.6 · 2–3 August 2026*
*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule v2.11.27*
