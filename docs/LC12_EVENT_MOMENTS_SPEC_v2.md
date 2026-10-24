# LC12_EVENT_MOMENTS_SPEC.md — UPDATED
## Event Moments — D-Day Guest Capture
## Full Service Specification · Build Status · Reference Guide
### LegacyCapsule · VALNEX, UNIPESSOAL LDA · RevoWorldTech

---

| Field | Value |
|-------|-------|
| Document | LC12-SPEC v2.0 |
| Title | Event Moments — D-Day Guest Capture |
| Status | Partially built — BUG-UPLOAD-001 outstanding |
| Author | AI16 · Claude Opus 4.6 |
| Date | 2 August 2026 |
| Supersedes | LC12_EVENT_MOMENTS_SPEC.md v1.0 |

---

## SECTION 1 — CONCEPT

Event Moments — D-Day Guest Capture is LegacyCapsule's live venue
presence layer. It answers: **who was in the room for this moment?**

Two layers per phase:

**Guest Eye View** — spontaneous guest photos from the venue.
Live, instant, unfiltered. The human energy of the room.

**Official Photographs** — organiser or photographer-uploaded formal shots.
The professional record. Feeds directly into the digital publication.

Event Moments IS D-Day, phase-tagged. One upload system. Many entry points.

---

## SECTION 2 — TERMINOLOGY

| Context | Term |
|---------|------|
| Feature name (organiser) | Event Moments |
| Full service name | Event Moments — D-Day Guest Capture |
| Guest section | Guest Eye View |
| Official section | Official Photographs |
| Guest CTA (window open) | "I Was There — Add My Photo" |
| Window-closed upload message | "Photo uploads are only available on the event day. You can still view and share this gallery." |
| Window-closed display | "This moment is now preserved." |
| Photographer portal name | Official Photography Portal |
| Hover tips / order page | "I Was There" |
| Publication main heading | Phase name (e.g. "Inaugural Lecture") |
| Publication sub-headings | "Guest Eye View" · "Official Photographs" |
| Retired term | "D-Day Captures" — removed from all UI |

---

## SECTION 3 — CAPTURE WINDOW

- Opens: 6:00 AM on event date
- Closes: 6:00 AM next day (24-hour window)
- After window: gallery read-only, gallery always accessible
- Organiser override: add/remove/reorder at any time regardless of window

---

## SECTION 4 — PHOTO PARAMETERS

### Guest Eye View
| Parameter | Value |
|-----------|-------|
| Cap | 5 photos per guest per phase |
| Enforcement | Device fingerprint (hashed IP + UA) |
| Moderation | Instant post (default); organiser can toggle to approval |
| Compression | sharp · 1200px · JPEG 82 · progressive |
| Orientation | width_px + height_px + aspect_ratio stored |

### Official Photographs
| Parameter | Value |
|-----------|-------|
| Cap | 30 photos per phase |
| Upload access | Organiser (manage dashboard) + Photographer (token portal) |
| Bulk upload | Multi-file, processed individually |
| Moderation | Auto-approved, no queue |
| Compression | Same pipeline as Guest Eye View |
| Ordering | Upload order default; organiser can drag to reorder |

---

## SECTION 5 — PHOTOGRAPHER TOKEN

- Organiser generates per phase from EventPhasesSection
- URL: `/photographer/[token]`
- Expiry: 7 days from generation
- One active token per phase
- Revocable at any time
- Photographer sees: event info + existing uploads + upload interface
- No organiser account access — upload only
- No notification to organiser when photographer uploads (silent)

---

## SECTION 6 — DISPLAY RULES

- Guest Eye View always shown first
- Official Photographs section hidden until at least one photo exists
- Guest photos: orientation-aware grid (portrait 2-col, landscape full-width) — PENDING BUILD
- Official photos: same grid
- Lightbox: tap any photo for full-screen view
- Live counter: "X people were here for this moment" (when count > 0)

---

## SECTION 7 — PUBLICATION INTEGRATION

Structure per phase:
```
[Phase Name]
  Guest Eye View
    [photos]
  Official Photographs  (only if photos exist)
    [photos]
```
All official photos auto-include. Organiser does final assortment:
select all / deselect all / individual toggles / drag to reorder.

---

## SECTION 8 — FILES (current as of v2.11.27)

### Guest-facing
| File | Status |
|------|--------|
| `app/for/[slug]/story/[phaseId]/page.tsx` | ✅ Built — server component |
| `components/capsule/EventMomentsClient.tsx` | ✅ Built — gallery UI |

### Organiser-facing
| File | Status |
|------|--------|
| `components/manage/EventPhasesSection.tsx` | ✅ Built — phase management |
| `components/manage/EventMomentsManager.tsx` | ✅ Built — photo curation |
| `app/manage/[slug]/phases/[phaseId]/print/page.tsx` | ✅ Built — QR print |
| `components/manage/PhaseQRPrintClient.tsx` | ✅ Built — print UI |

### Photographer Portal
| File | Status |
|------|--------|
| `app/photographer/[token]/page.tsx` | ✅ Built |
| `components/capsule/PhotographerPortalClient.tsx` | ✅ Built |
| `app/api/photographer/[token]/route.ts` | ✅ Built — token validation |
| `app/api/photographer/[token]/upload/route.ts` | ✅ Built — photographer upload |
| `app/api/photographer/token/generate/route.ts` | ✅ Built |
| `app/api/photographer/token/revoke/route.ts` | ✅ Built |

### API Routes
| Route | Status |
|-------|--------|
| `GET /api/event-moments/[phaseId]` | ✅ Built — public gallery |
| `POST /api/event-moments/[phaseId]/upload-official` | ⚠️ Built but BROKEN — BUG-UPLOAD-001 |
| `PATCH /api/event-moments/[phaseId]/curate` | ✅ Built — curation actions |

### Database
| Column | Status |
|--------|--------|
| `gallery_items.phase_id` | ✅ Added |
| `gallery_items.is_official_photography` | ✅ Added |
| `gallery_items.featured_in_publication` | ✅ Added |
| `gallery_items.display_order` | ✅ Added |
| `gallery_items.width_px` | ✅ Existed |
| `gallery_items.height_px` | ✅ Existed |
| `gallery_items.aspect_ratio` | ✅ Existed (type: numeric) |
| `capsule_phases.photographer_token` | ✅ Added |
| `capsule_phases.photographer_token_expires_at` | ✅ Added |

---

## SECTION 9 — BUG-UPLOAD-001 (outstanding)

**Symptom:** Official photo upload returns 500 "Upload failed. Please try again."

**File:** `app/api/event-moments/[phaseId]/upload-official/route.ts`

**Investigation completed:**
- Auth gate removed — not the cause
- `contributor_name` column removed from insert — not the cause
- Network disconnection ruled out (separate incident)
- Sharp compression pipeline — unknown if issue

**Suspected causes (in order of likelihood):**
1. `aspect_ratio` is `numeric` type in Postgres — JS float may need
   explicit casting: `parseFloat(value.toFixed(3))`
2. `uploaded_by_name` column may have NOT NULL constraint —
   not included in insert
3. Sharp runtime issue on Vercel Hobby (unlikely — works for D-Day)
4. Storage bucket RLS (unlikely — service role used)

**Diagnostic steps:**
1. Check Vercel function logs for exact error from `[upload-official]`
2. Try minimal insert (remove width_px, height_px, aspect_ratio):
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
3. If minimal insert works, add dimensions back with explicit cast:
```ts
  aspect_ratio: parseFloat(compressed.aspect_ratio.toFixed(3)),
```
4. Check `uploaded_by_name` column constraints in Supabase

**The D-Day upload route works** — compare its insert payload against
upload-official to find the discrepancy. The D-Day route is the reference.

---

## SECTION 10 — REMAINING BUILD ITEMS

| Item | Priority | File |
|------|----------|------|
| Fix BUG-UPLOAD-001 | Critical | upload-official/route.ts |
| Orientation-aware grid | High | EventMomentsClient.tsx |
| Guest moderation toggle | Low | manage settings tab |
| Publication assortment UI | Low | publication editor |

---

## SECTION 11 — STANDING RULES

1. No tribute form on phase pages — ever. Photos only.
2. D-Day upload route is the sole upload mechanism.
3. Email capture is post-photo, value-first. Never pre-photo.
4. Curation is non-destructive. Hide ≠ delete.
5. Instant post is default. Moderation is opt-in.
6. Official Photographs hidden from guests until content exists.
7. Guest Eye View always above Official Photographs.
8. Organiser override is permanent — no window lock-out.
9. All photos compressed before storage.
10. Guest cap: 5 per device per phase.
11. Official cap: 30 per phase (shared: organiser + photographer).
12. Photographer token: per-phase, 7-day expiry, one active at a time.
13. "D-Day Captures" as a service label is retired.

---

*LC12-SPEC v2.0 · AI16 · Claude Opus 4.6 · 2 August 2026*
*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule v2.11.27*
