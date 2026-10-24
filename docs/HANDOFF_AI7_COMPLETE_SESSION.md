# HANDOFF — AI7 Complete Session
## LegacyCapsule — Full Build Log
## Session Date: June 2026
## Version Range: v1.2.7 → v1.3.4

---

## SESSION OVERVIEW

AI7 covered two major build phases plus multiple bug fixes and emergency recovery operations in a single extended session. All work is committed to `main` as of v1.3.4.

---

## BUILDS COMPLETED

### v1.2.8 — LC-PARTICIPATION-001 Phase 1: Attribution Engine

**Purpose:** Silent background engine that tracks how tributes are shared and referred, recognises top contributors, and sends milestone emails.

**Files Created:**
- `lib/participation/refCode.ts` — Core attribution engine
- `app/api/share/record/route.ts` — Share event recording API

**Files Modified:**
- `app/api/email/approval/route.ts` — Added 3 participation hooks on every tribute approval
- `components/TributeWallClient.tsx` — ref capture, consent checkbox, attribution insert, share tracking, share ref appending
- `lib/email.ts` — Added refCode to ApprovalEmailParams, ref-coded share CTA in keepsake card

**Database Changes:**
```sql
-- New tables
capsule_share_events
contribution_attribution
capsule_participation_summary
capsule_legacy_builders

-- New helper function
lc_utc_date(ts timestamptz) RETURNS date -- immutable, for dedup index

-- New columns
contributions.ref_code (text, UNIQUE)
contributions.legacy_builder_consent (boolean, default false)
capsules.legacy_builder_activation_threshold (integer, default 10)

-- Reserved for Phase 2 (no migration needed)
capsule_legacy_builders.diversity_score (numeric, default 0)
capsule_legacy_builders.ranking_score (numeric, default 0)
```

**Key behaviours:**
- Ref codes generated at approval time only (never submission)
- Ref code: 8-char alphanumeric, no I/O/0/1 ambiguous chars
- Attribution recorded client-side when contributor arrives via ?ref= link
- Legacy Builder threshold: 10 attributed approved contributions (configurable per capsule)
- Phase 1 ranking: ORDER BY ref_count DESC (raw count)
- Phase 2: diversity_score / ranking_score columns ready, no migration needed
- All hooks non-blocking — approval and keepsake email never delayed by participation logic
- IP hash: daily-rotating SHA-256, never stored in plain text
- Milestone emails: 3 tiers (Community Builder / Legacy Builder / Lead Legacy Builder), fire once per threshold

---

### v1.2.9 — LC-LEGACYROOM-001: Legacy Room

**Purpose:** Third room in the Three-Room Model. Public-facing community participation page showing collection stats, legacy builders, activity feed, gallery, and publication status.

**Files Created:**
- `app/for/[slug]/legacy/page.tsx` — Server component, ISR 60s
- `components/LegacyRoomClient.tsx` — Client component with 60s activity polling

**Files Modified:**
- `components/TributeWallClient.tsx` — Conditional Legacy Room nav link (only when approvedCount >= 1)
- `app/for/[slug]/profile/page.tsx` — Conditional Legacy Room link in bottom nav, participation summary fetch
- `app/for/[slug]/profile/page.tsx` — Auto-composed occasion block (shows when no organiser Introduction section exists)

**Route:** `/for/[slug]/legacy`

**Sections rendered (E3):**
1. Collection Overview — 4 stats from capsule_participation_summary
2. Legacy Builders — top 5 with tier badges (hidden below threshold)
3. Recent Activity — last 10 approved tributes, 60s polling
4. Featured Memories — organiser gallery (capsule_gallery table)
5. Publication Status — placeholder, future download CTA slot

**Conditional navigation:**
- "Legacy Room →" only appears when contributor_count >= 1
- "Profile →" only appears when profile sections or gallery photos exist

**Auto-composed occasion block:**
- Renders at top of Profile Page when no organiser-written Introduction section exists
- Event-type-aware copy (11 event types covered)
- Disappears automatically when organiser adds their own Introduction

---

### v1.3.0 — LC-SHARE-002 + Critical Fixes

**Includes:**
1. Dynamic Share Cards (LC-SHARE-002)
2. Account delete safety fix
3. RLS policy patch
4. Auth user deletion trigger

**Dynamic Share Cards:**

*File Created:*
- `app/api/og/[slug]/route.tsx` — OG image generation, 1200×630 PNG

*Files Modified:*
- `app/for/[slug]/page.tsx` — generateMetadata updated with og:image
- `app/for/[slug]/profile/page.tsx` — generateMetadata updated with og:image
- `app/for/[slug]/legacy/page.tsx` — generateMetadata updated with og:image

*Card design:*
- 1200×630 PNG via next/og ImageResponse (Satori)
- Hero image backdrop with gradient overlay (or event-type gradient if no hero)
- Honouree name in Playfair Display Bold
- Event type badge with emoji
- Event tag in gold
- Stats bar: "X Tributes · X Photos · X Countries" (only when contributor_count > 0)
- LegacyCapsule wordmark + domain in bottom bar
- Event-type colour schemes: 11 variants
- Fonts loaded from Google Fonts at edge: Playfair Display (800) + DM Sans (600)

*Account Delete Safety Fix:*

*File Modified:*
- `app/api/account/delete/route.ts` — Complete rewrite

*What changed:*
- Now accepts optional `capsuleId` parameter
- When capsuleId provided: only soft-deletes that specific capsule
- Only deletes auth user + profile when NO active capsules remain under the email
- Previously: deleted ALL capsules and auth user regardless — dangerous bug
- `DeleteAccountSection` in manage page updated to pass `capsuleId`

*RLS Patch:*
```sql
CREATE POLICY "profile_sections_insert_anon" ON capsule_profile_sections FOR INSERT WITH CHECK (true);
CREATE POLICY "profile_sections_update_anon" ON capsule_profile_sections FOR UPDATE USING (true);
CREATE POLICY "profile_sections_delete_anon" ON capsule_profile_sections FOR DELETE USING (true);
```

*Auth Deletion Trigger:*
```sql
CREATE OR REPLACE FUNCTION public.prevent_auth_user_delete()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.capsules
    WHERE organiser_email = OLD.email AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot delete account — active capsules exist under this email.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_prevent_auth_user_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_auth_user_delete();
```

*Publications unique constraint:*
```sql
ALTER TABLE publications
ADD CONSTRAINT publications_capsule_id_unique UNIQUE (capsule_id);
```

---

### v1.3.1 — Publication Print Preview + Submit Page Wiring

**Publication Print Preview (Hobby Plan workaround):**

*Files Created:*
- `app/api/publication/preview-token/route.ts` — Generates short-lived render token for browser print

*Files Modified:*
- `app/publication-render/[token]/page.tsx` — Added searchParams support, ?autoPrint=1 injects window.print() script
- `components/publication/PublicationEditor.tsx` — Added "Preview & Save as PDF" button in right panel

*How it works:*
1. Organiser clicks "Preview & Save as PDF"
2. Window opened immediately (before async — avoids popup blocker)
3. API generates fresh render token, updates publications.render_token
4. Window navigated to /publication-render/[token]?autoPrint=1
5. Render page loads full publication HTML, auto-triggers browser print dialog
6. Organiser saves as PDF from browser print dialog

*Submit Page Wiring (LC-PARTICIPATION-001):*

*File Modified:*
- `app/for/[slug]/submit/page.tsx`

*Changes:*
- Column names fixed: photo_url → thumbnail_url, latitude → lat, longitude → lng
- Legacy builder consent checkbox added
- ?ref= captured on page load, stored in sessionStorage
- Attribution row inserted after successful submission if arrived via ref link
- legacy_builder_consent included in contributions insert

---

### v1.3.2 — Publication & Profile Fixes

*Files Modified:*
- `app/publication-render/[token]/page.tsx` — Fixed dangerouslySetInnerHTML + children conflict on body tag
- `components/publication/PublicationEditor.tsx` — Fixed popup blocker issue in handlePreviewPrint
- `app/for/[slug]/profile/page.tsx` — publicationPdf duplicate variable removed, Download Publication button added
- `app/manage/[slug]/page.tsx` — Publication Editor card added to Overview tab

*Profile page Download button:*
- Fetches pdf_url from publications table
- Shows "⬇ Download Publication" button in bottom nav only when pdf_url exists
- Opens PDF in new tab

*Manage page Publication card:*
- Added to Overview tab
- Links directly to /manage/[slug]/publication
- Subtitle: "Arrange sections · Preview · Download PDF"

---

### v1.3.3 — OG Image URL Fix

*Files Modified:*
- `app/for/[slug]/page.tsx`
- `app/for/[slug]/profile/page.tsx`
- `app/for/[slug]/legacy/page.tsx`
- `components/TributeWallClient.tsx`

*Change:*
- All hardcoded `https://itslegacycapsule.com` replaced with `process.env.NEXT_PUBLIC_APP_URL`
- Share links in TributeWallClient now use `NEXT_PUBLIC_APP_URL` instead of `window.location.origin`
- Ensures OG images and share links always point to correct domain regardless of Vercel branch

---

### v1.3.4 — Programme Export Centre + Knowledgebase

**Knowledgebase `/help`:**

*File Created:*
- `app/help/page.tsx` — Public searchable knowledgebase

*Features:*
- Search-driven: no articles shown until user types or selects category
- Full-text search via Supabase textSearch on existing search_vector column
- 300ms debounce — searches as you type
- 6 category filter pills: All, Getting Started, Organisers, Contributors, Features, Billing
- Expandable article cards — 2-line preview collapsed, full content on tap
- Popular questions as clickable shortcuts (6 pre-written questions)
- Zero articles hardcoded — all from lc_knowledge table (16 articles confirmed present)
- "Still need help?" email CTA → hello@itslegacycapsule.com
- Route: /help

**Programme Export Centre:**

*Database Changes:*
```sql
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS include_in_publication boolean DEFAULT true;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS include_in_programme_export boolean DEFAULT false;
```

*File Modified:*
- `app/manage/[slug]/page.tsx` — 7 surgical edits

*Changes:*
- Tab type extended: added 'exports'
- BottomNav: added Exports tab (⬇ icon)
- handleToggleFlag: toggles include_in_publication or include_in_programme_export on a contribution
- Contributions fetch: includes new flag columns
- Approved tribute cards: two toggle buttons added (Publication ✓/✗, Programme Export ✓/✗)
- Exports tab render block added
- ExportsTab component added

*ExportsTab features:*
- Stats: Approved Tributes count + Programme Export count
- Copy All Approved Tributes → clipboard
- Copy Programme Export Tributes → clipboard (disabled if none flagged)
- Export format: --- / Name / Location · Relationship / blank line / tribute text / ---
- Format preview shown inline
- "Coming Soon" section: DOCX, PDF, Selected Contributors, Stories, Community Memories (clean extension points, not built)
- "Copied Successfully" feedback with 2.5s reset

---

## COMPONENT MAP — NEW ENTRIES (AI7)

| Component | File | Section | Purpose |
|---|---|---|---|
| `generateRefCode` | `lib/participation/refCode.ts` | Section 2 | 8-char safe alphanumeric ref code |
| `assignRefCode` | `lib/participation/refCode.ts` | Section 2 | Assigns ref code to contribution at approval |
| `updateParticipationSummary` | `lib/participation/refCode.ts` | Section 3 | Upserts 7 metrics on every approval |
| `recalculateLegacyBuilders` | `lib/participation/refCode.ts` | Section 4 | Top 5 by ref_count, tier assignment |
| `sendMilestoneEmail` | `lib/participation/refCode.ts` | Section 5 | Recognition emails at 3 milestone tiers |
| `ExistingBuilder` type | `lib/participation/refCode.ts` | Section 4 types | Module-scope type for builder map |
| `POST /api/share/record` | `app/api/share/record/route.ts` | Full file | Share event recording + IP dedup |
| `POST /api/og/[slug]` | `app/api/og/[slug]/route.tsx` | Full file | Dynamic 1200×630 OG share card |
| `POST /api/publication/preview-token` | `app/api/publication/preview-token/route.ts` | Full file | Browser print preview token |
| `LegacyRoomClient` | `components/LegacyRoomClient.tsx` | Full file | Legacy Room client component |
| `StatCard` | `components/LegacyRoomClient.tsx` | Component | Stat display card |
| `BuilderCard` | `components/LegacyRoomClient.tsx` | Component | Legacy builder row |
| `ActivityRow` | `components/LegacyRoomClient.tsx` | Component | Recent activity feed row |
| `GalleryLightbox` | `components/LegacyRoomClient.tsx` | Component | Gallery photo lightbox |
| Legacy Room page | `app/for/[slug]/legacy/page.tsx` | Full file | ISR server component |
| Help page | `app/help/page.tsx` | Full file | Searchable knowledgebase |
| `ArticleCard` | `app/help/page.tsx` | Component | Expandable knowledge article |
| `PopularQuestions` | `app/help/page.tsx` | Component | Pre-search question shortcuts |
| `ExportsTab` | `app/manage/[slug]/page.tsx` | Component | Programme Export Centre tab |
| `handleToggleFlag` | `app/manage/[slug]/page.tsx` | Handler | Toggles publication/programme flags |
| Auto-occasion block | `app/for/[slug]/profile/page.tsx` | Section | Event-type-aware auto content |
| Programme flag toggles | `app/manage/[slug]/page.tsx` | Tributes tab | ✓/✗ Publication + Programme Export |
| Share ref appending | `components/TributeWallClient.tsx` | handleCopy + WhatsApp | ?ref= on share links |
| Attribution recording | `components/TributeWallClient.tsx` | handleSubmit | Writes contribution_attribution row |
| Legacy Builder consent | `components/TributeWallClient.tsx` | Composer | Checkbox + state |

---

## ROUTES CREATED (AI7)

| Route | File | Access |
|---|---|---|
| `GET /api/og/[slug]` | `app/api/og/[slug]/route.tsx` | Public |
| `POST /api/share/record` | `app/api/share/record/route.ts` | Public |
| `POST /api/publication/preview-token` | `app/api/publication/preview-token/route.ts` | Organiser |
| `GET /for/[slug]/legacy` | `app/for/[slug]/legacy/page.tsx` | Public |
| `GET /help` | `app/help/page.tsx` | Public |

---

## KNOWN ISSUES / NOT YET VERIFIED

1. **OG image** — URL fix applied (v1.3.3) but not confirmed working in production. Test by sharing a capsule link on WhatsApp and checking the preview card appears.

2. **Publication preview** — Popup blocker fix applied but depends on browser settings. Instruct organisers to allow popups for itslegacycapsule.com.

3. **Free tier tribute limit complaint** — "no more room" error reported by a contributor. Root cause not fully diagnosed. Likely the 50-tribute FreeTierBar limit or Supabase storage quota. Needs investigation on the affected capsule.

4. **Legacy Room visibility** — Hidden until first tribute is approved (correct behaviour). Organisers testing on a capsule with 0 approved tributes will not see the Legacy Room link.

---

## DECISIONS MADE THIS SESSION

| Decision | Rationale |
|---|---|
| Gallery stays on both Profile Page and Legacy Room | Founder UX concern — Profile Page feels bare without gallery |
| Auto-occasion block disappears when organiser adds Introduction | Organiser voice takes priority over auto-generated content |
| Legacy Room and Profile links conditional on content | Rolls Royce principle — never link to empty pages |
| Publication PDF via browser print on Hobby plan | Puppeteer blocked on Hobby; browser print is clean and free |
| Programme Export independent of Publication Engine | Different use case — funeral programmes, print materials |
| Share links use NEXT_PUBLIC_APP_URL not window.location.origin | Prevents Vercel branch URLs appearing in shared links |
| Account delete only removes auth when last capsule deleted | Safety fix — prevents losing access to all capsules |

---

## WHAT TO BUILD NEXT

| Priority | Module | Tables Ready |
|---|---|---|
| 1 | Event Phases UI | capsule_phases ✅ |
| 2 | Guest Management + Access Codes | guests ✅ + capsule_access ✅ |
| 3 | Table Management | event_tables ✅ |
| 4 | Asoebi Coordination | attire_orders ✅ + attire_variants ✅ |
| 5 | Honouree Appreciation Dispatch | honouree_email_templates ✅ |
| 6 | Community Gallery | gallery_items ✅ |
| 7 | Stripe Phase 1.5 | payments ✅ + subscriptions ✅ |

All database tables exist. All remaining work is UI and API routes.

---

## EMERGENCY OPERATIONS THIS SESSION

**Account Recovery (geeajibz@gmail.com):**
- Auth user deleted via account delete bug
- Capsules soft-deleted (14 capsules, all recovered)
- Recovery process:
  1. Recreate auth user via Supabase Dashboard → Authentication → Add User
  2. Insert profile row: `INSERT INTO profiles (id, full_name, role, created_at, email) SELECT id, 'Name', 'organiser', now(), 'email' FROM auth.users WHERE email = 'email'`
  3. Restore capsules: `UPDATE capsules SET deleted_at = NULL WHERE organiser_email = 'email' AND deleted_at = '[timestamp]'`
- Root cause fixed in v1.3.0 (account delete route rewrite)
- Trigger added to prevent future auth user deletion when capsules exist

---

*Document prepared by AI7 — End of Session*
