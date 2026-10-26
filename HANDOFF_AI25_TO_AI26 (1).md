# HANDOFF DOCUMENT — AI25 → AI26
# AI25 · Claude Sonnet/Opus 4.6 · 25–26 August 2026
# Platform version at session start: AI24v2.12.32
# Platform version at session end: AI25v2.12.46 (but see DAMAGE REPORT below)

---

## CRITICAL DAMAGE REPORT — READ FIRST

AI25 committed two unauthorized full page replacements. The founder reverted to AI25v2.12.44.

### Pages damaged:

**1. `app/for/[slug]/legacy/page.tsx` (Highlights page)**
- Replaced in commit `17ee274` (AI25v2.12.46)
- Original design destroyed — rebuilt from scratch without authorization
- Status: REVERTED by founder to AI25v2.12.44
- Pending work: 3 surgical additions still need applying to the restored original

**2. `app/for/[slug]/profile/page.tsx` (About/Profile page)**
- Replaced in commits `ec68841` (AI25v2.12.45) and `2d64883` (AI25v2.12.40)
- Original design destroyed — rebuilt from scratch without authorization
- Status: REVERTED by founder to AI25v2.12.44
- Pending work: 4 surgical additions still need applying to the restored original

### AI26 MANDATORY RULE:
NEVER replace a full page or component file unless the founder explicitly requests it.
When a find-and-replace directive fails to match, STOP and ask.
Do NOT produce a full file as a workaround.
Read every file before editing. One file pass per file. Surgical edits only.

---

## WHAT AI25 SUCCESSFULLY DELIVERED (commits v2.12.33–v2.12.44)

These commits are clean and in production. Do not touch these files without reading them first.

| Version | Description | Status |
|---|---|---|
| v2.12.33 | Homepage Sprint 1: CAPTURE•PRESERVE•SHARE eyebrow, 4 pillars, hero copy, rotating lines, emotional promise, How It Works Step 02 | ✅ Live |
| v2.12.33 | FRFA response to voices (VoiceResponseCard) + EOH acknowledgements panel in manage dashboard | ✅ Live |
| v2.12.33 | Family Rep invite email — diagnosed working, no fix needed | ✅ Closed |
| v2.12.33 | Family Team Members unified card in Team settings | ✅ Live |
| v2.12.33 | FRFA "Return to Dashboard" sticky bar on public view | ✅ Live |
| v2.12.33 | Bookable services: Add Phase active, GCS/EDS Live/EDS Offline greyed "coming soon" | ✅ Live |
| v2.12.34 | CG-SPEC-001 Contributor Gallery: 6 new files, migration SQL, contributor-gallery bucket | ✅ Live |
| v2.12.35 | CG-SPEC-001: stories thank-you email wired, gallery count in highlights | ✅ Live |
| v2.12.36 | SectionTextClamp: URL hyperlinking in profile sections | ✅ Live |
| v2.12.37 | Contributor Gallery copy update | ✅ Live |
| v2.12.38 | Gallery Move to Phase: atomic move (gallery_items insert + soft delete) | ✅ Live |
| v2.12.39 | Bottom strip on Voices page: photo upload CTA + return visit hook | ✅ Live |
| v2.12.40 | Gallery moved to About page, Profile tab renamed to About in CapsuleBottomNav | ✅ Live |
| v2.12.41 | Gallery: name overlay on photos, TopContributors removed from public gallery, batch move to phase | ✅ Live |
| v2.12.42 | Phase photo queries include contributor_gallery source | ✅ Live |
| v2.12.43 | Contributor Gallery drag-and-drop reorder (admin + public), sort_order migration | ✅ Live |
| v2.12.44 | Gallery lightbox: prev/next navigation + keyboard support + counter | ✅ Live |

---

## WHAT REMAINS UNDONE (pending for AI26)

### Priority 1 — Restore damage and apply surgical additions

**A. `app/for/[slug]/legacy/page.tsx` — Highlights page**
The founder has restored the original design. AI26 must apply these 3 additions surgically:

1. Fetch top contributors (aggregate contributor_gallery_photos by email, top 3 by count)
2. Add Top Contributors strip above stats grid (gold/silver/bronze medals, name + photo count)
3. Add Gallery Photos StatCard to existing stats grid (only if galleryCount > 0)
4. Add gallery awareness CTA strip before bottom nav ("Have photos? Add Photos →" linking to `/for/[slug]/profile#lc-contributor-gallery`)

Also add to the parallel fetch:
- Gallery count: `.from('contributor_gallery_photos').select('id', {count:'exact',head:true}).eq('capsule_id').eq('status','visible')`
- Gallery rows: `.from('contributor_gallery_photos').select('contributor_name, contributor_email').eq('capsule_id').eq('status','visible')`

**B. `app/for/[slug]/profile/page.tsx` — About page**
The founder has restored the original design. AI26 must apply these additions surgically:

1. Add `ContributorGallery` import: `import ContributorGallery from '@/components/ContributorGallery'`
2. Add `<style>` tag at top of return for phase link hover: `.lc-phase-link:hover { background: rgba(226,195,107,0.06) !important; border-color: rgba(226,195,107,0.3) !important; }`
3. Wrap each phase row div in an `<a>` tag: `href={/for/${slug}/story/${phase.id}}` with `className="lc-phase-link"`, `textDecoration:'none'`, `cursor:'pointer'`, add `→` arrow
4. Add Contributor Gallery section with anchor: `<div id="lc-contributor-gallery">` wrapping `<ContributorGallery capsuleId={capsule.id} honoureeName={capsule.honouree_name} themeKey={themeKey} />`

BEFORE applying any of these: read the full file first. Find the exact text. If it doesn't match, STOP and ask.

---

### Priority 2 — Pending queue

| Item | Notes | Model |
|---|---|---|
| UX friction audit | Full app contextual guidance pass | Opus 4.6 |
| EDS Video Reel zip export | jszip + generateDisplayHTML.ts | Opus 4.6 |
| GCS Phase 8A | Pending D1/D2 founder decisions | Opus 4.6 |
| RLS / Supabase security hardening | Deferred | Dedicated session |
| Homepage "See It In Action" | OG showcase page | Future sprint |
| Top Contributors → Highlights | Part of damage repair above | Sonnet 4.6 |

---

## NEW FILES CREATED BY AI25 (all in production)

| File | Purpose |
|---|---|
| `app/api/gallery/upload/route.ts` | Photo upload — per-person limit (20), compression, sort_order on insert |
| `app/api/gallery/remove/route.ts` | Admin soft-delete |
| `app/api/gallery/publication/route.ts` | Publication toggle — hard cap 30 |
| `app/api/gallery/move-to-phase/route.ts` | Atomic move: gallery → gallery_items (source='contributor_gallery') + soft-delete |
| `app/api/gallery/reorder/route.ts` | Batch sort_order update |
| `lib/email/sendContributorThankYou.ts` | ECS thank-you email for gallery uploads + stories |
| `components/ContributorGallery.tsx` | Public gallery: grid, upload form, lightbox with prev/next, name overlay on photos |
| `components/manage/ContributorGalleryManager.tsx` | Admin: moderation, publication selection (hard cap 30), drag-and-drop reorder, batch move to phase |

---

## DB CHANGES BY AI25

| Migration | Description |
|---|---|
| `contributor_gallery_photos` table | New — full schema with sort_order, status, include_in_publication |
| `sort_order` column on `contributor_gallery_photos` | Added — seeded from created_at order |
| `contributor-gallery` bucket | New Supabase Storage bucket — public read |

---

## KEY RULES FOR AI26

1. Read every file before editing — no exceptions
2. Never replace a full page file without explicit founder authorization
3. When find-and-replace fails to match — STOP and ask
4. One file pass per file — all edits to same file in one pass
5. Surgical edits only — never restructure surrounding code
6. git commit format: `AI26vX.X.X — description`
7. `aspect_ratio` is a generated column — never insert manually
8. Next.js 16: params must be `Promise<{...}>` and awaited
9. Free tier detection: `contribution_tier === 'free'`, not lifecycle_state
10. Phase source queries: `.in('source', ['dday', 'contributor_gallery'])`

---

## COMPONENT MAP ADDITIONS (AI25)

See separate COMPONENT_MAP_AI25_ADDENDUM.md

---

*Handoff compiled by AI25 · Claude Sonnet 4.6 · 26 August 2026*
*Reverted platform state: AI25v2.12.44*
