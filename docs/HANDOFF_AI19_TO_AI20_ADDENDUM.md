# HANDOFF_AI19_TO_AI20_ADDENDUM.md
# LegacyCapsule — Session Handoff Addendum
# From: AI19 (Claude Sonnet 4.6)
# To: AI20
# Date: 10 August 2026
# Platform Version: AI19v2.11.89
# Days to Prof. Adesina Event: 11 (21 August 2026)
# NOTE: Read this ALONGSIDE HANDOFF_AI19_TO_AI20.md — this covers work done after that doc was compiled, and as well HANDOFF_AI16_TO_AI20
The way founder works is to still engage the AI agents even after they had done their handoffs so that they cn support in other areas rather than leaving all the fixes to just one AI that is currently focussed on.

---

## ADDITIONAL WORK COMPLETED AFTER HANDOFF COMPILATION

### AI19v2.11.88 — Section order + character limit + truncation fixes
- **Publication section order restored** via SQL on prof-adesina capsule
  (phase_photos had moved to positions 2&3 — reconciliation was inserting them out of order)
- **Canonical sort added to reconcileLayoutConfig** — step 4 enforces correct order on every reconciliation run. Order: cover(1) → honouree_profile(2) → world_map(3) → tributes(4) → phase_photos(5) → official_photography(6) → guest_captures(7) → community_stories(8) → memories(9) → closing_message(10)
- **Stories/Memories character limit**: 2000 → 3000 in `CommunityStoriesClient.tsx`
- **Topic name truncation removed**: `slice(0, 60)` hardcode removed from StoryCard Line 1 — full topic name now wraps naturally
- **TributeCard name+relationship row**: `flexWrap: 'wrap'` added — long names no longer truncate
- **StoryCard Line 2**: `flexWrap: 'wrap'` added — name + relationship wrap correctly

### AI19v2.11.89 — Purge section route created
- `app/api/publication/purge-section/route.ts` — file existed but was **0 bytes** (empty)
- Full route content written — was returning 404 causing "Unexpected token '<'" JSON parse error
- Purge & Rebuild button now functional

---

## UPDATED PENDING ISSUES FOR AI20

### STILL OUTSTANDING (unchanged from main handoff)
- **EMAIL-SUITE** — 7 email files not audited against `LC_EMOTIONAL_COMMUNICATION_STANDARD.md` 🔴
- **Purge button visibility** — works now but visually hidden in toolbar — needs redesign 🟡
- **Editor right panel padding** — verify on production after hard refresh 🟡
- **`recentStories` in legacy/page.tsx** — still queries empty `community_stories` table 🟡
- **`collection_intelligence` not in foreword TOC** — not in layout_config sections 🟢

### NEW ITEMS DISCOVERED
- **Audio/Video panel clipping in composer** — fixed in AI19v2.11.87 (`overflow: 'visible'` on composer-enter div) ✅
- **Publication section order** — fixed via SQL + canonical sort in reconciliation ✅
- **Purge & Rebuild 404** — fixed in AI19v2.11.89 ✅

---

## KEY ARCHITECTURAL FACTS ADDED AFTER HANDOFF

| Fact | Detail |
|------|--------|
| `reconcileLayoutConfig` canonical order | cover(1) → honouree_profile(2) → world_map(3) → tributes(4) → phase_photos(5) → official_photography(6) → guest_captures(7) → community_stories(8) → memories(9) → closing_message(10) |
| `purge-section` route | Was 0 bytes on disk — now has full content. POST only. Returns `{ ok, photo_count, slot_count, layout_config }` |
| Stories char limit | 3000 (was 2000). Threshold for counter colour: 2700 |
| Topic display in StoryCard | Full topic name — no slice. Wraps naturally via `whiteSpace: 'normal'` |
| TributeCard row | `flexWrap: 'wrap'` on name+relationship row |

---

## WHAT TO DO FIRST IN AI20 SESSION

**Revised priority order (supersedes main handoff):**

1. Read `HANDOFF_AI19_TO_AI20.md` + this addendum + `CURRENT_STATE_v8.md` + `LC_EMOTIONAL_COMMUNICATION_STANDARD.md`
2. **Verify Purge & Rebuild works** on prof-adesina — click both phase sections, purge, regenerate
3. **EMAIL-SUITE** — start with `submission-confirmation/route.ts` 🔴
4. **Fix `recentStories`** in `app/for/[slug]/legacy/page.tsx` — query contributions not community_stories
5. **Purge button redesign** — move below photo grid, more prominent
6. **Editor right panel padding** — verify, fix definitively if still broken

---

## VERSION SUMMARY (AI19 complete — AI19v2.11.65 to AI19v2.11.89)

| Version | Key change |
|---------|-----------|
| AI19v2.11.65 | Cover+closing spill fixed; who_attended removed |
| AI19v2.11.66 | Regenerate calls init first |
| AI19v2.11.67 | Init reconciliation; intelligent version bump |
| AI19v2.11.68 | World map SVG; ip_country primary; appreciation page break |
| AI19v2.11.69 | Engagement breakdown in renderCollectionIntelligence |
| AI19v2.11.70 | renderPhasePhotos rewritten — correct slot schema |
| AI19v2.11.71 | Countries to world map page |
| AI19v2.11.72 | World map → bubble chart; phase reconciliation |
| AI19v2.11.73 | Foreword page (Page 2) |
| AI19v2.11.74 | Three-layer LC branding |
| AI19v2.11.75 | Cover label; renames; metricRow relationships |
| AI19v2.11.76 | Country count stabilised |
| AI19v2.11.77 | Named Send route; multi-recipient UI; purge route; editor padding |
| AI19v2.11.78 | Phase headers date+venue; captions removed; Promise.all fix |
| AI19v2.11.79 | Community stories: page_state gate removed |
| AI19v2.11.80 | story_topic_id null string coercion |
| AI19v2.11.81 | Stories submit: JSON+FormData dual support |
| AI19v2.11.82 | New topic category preserved |
| AI19v2.11.83 | Voices page excludes stories |
| AI19v2.11.84 | Memories tab → Stories |
| AI19v2.11.85 | Foreword TOC event-aware; reconciliation removes official_photography |
| AI19v2.11.86 | Highlights counters fixed |
| AI19v2.11.87 | TributeWallClient poll filter; audio panel overflow fix |
| AI19v2.11.88 | Section order restored + canonical sort; 3000 char limit; truncation fixes |
| AI19v2.11.89 | purge-section route content written (was empty) |

---

*Addendum compiled by AI19 — Claude Sonnet 4.6 — 10 August 2026*
*Platform: AI19v2.11.89 | Branch: main | Deployed: Vercel*

**IMPORTANT CORRECTION:** Prof. Adesina's inaugural lecture/retirement event took place on
8 June 2026 — it has already happened. The publication is a POST-EVENT keepsake being
assembled from 83 voices, official photography, and event moments captured on the day.
There is NO hard deadline. Quality over speed. The publication will be distributed to
70 email addresses as a permanent keepsake. Get it right.
