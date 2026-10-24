# LC-PUBLICATION-ACTIVATION-001 — Sprint Execution Package
## Prepared by AI8 · June 2026

**Purpose:** This document contains every SQL query, code change, and verification
result needed to complete the Publication Activation Sprint.

**What AI8 confirmed from documentation (no live DB access):**
Items marked ✅DOC are confirmed from project knowledge files.
Items marked ⚠️VERIFY require live database or filesystem confirmation.
Items marked 🔧FIX require a code change — code provided below.

**How to use:** Hand this to a Claude Code session (Opus 4.6) or work through
it manually. Every command is ready to copy-paste.

---

# ═══════════════════════════════════════════════════════
# STEP 1 — VERIFY ALL PUBLICATION SCHEMA COLUMNS
# ═══════════════════════════════════════════════════════

## 1A — publications table

### What documentation confirms:

✅DOC: `publications` table exists — confirmed in Master Build Plan Section 1.1
("publications" listed among all 16 core tables, status: DONE)

✅DOC: Phase 3 columns were specified — Build Guide Section 1.3 provides
the ALTER TABLE statements.

✅DOC: HANDOFF.md states "Database schema additions applied" under
Publication Engine — Complete section.

⚠️VERIFY: Run this in Supabase SQL Editor to confirm all columns are present:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'publications'
ORDER BY ordinal_position;
```

### If any Phase 3 columns are missing, run this complete migration:

```sql
-- Publication Engine Phase 3 columns — safe to re-run (IF NOT EXISTS)
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS layout_config jsonb,
  ADD COLUMN IF NOT EXISTS page_map jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS arrangement_source text DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS pdf_size_bytes integer,
  ADD COLUMN IF NOT EXISTS generation_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS generation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_error text,
  ADD COLUMN IF NOT EXISTS render_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_publications_render_token
  ON public.publications(render_token);
```

### UNIQUE constraint on capsule_id:

⚠️VERIFY: The init route uses `upsert({ onConflict: 'capsule_id' })`.
Check if the constraint exists:

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'publications'
  AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');
```

If no UNIQUE on capsule_id:
```sql
ALTER TABLE public.publications
  ADD CONSTRAINT publications_capsule_id_key UNIQUE (capsule_id);
```

---

## 1B — gallery_items dimension columns

### What documentation confirms:

✅DOC: Build Guide Section 1.3 specifies the ALTER TABLE for width_px,
height_px, and aspect_ratio.

✅DOC: HANDOFF.md lists O14 "imageUtils wired into upload flow" as
unchecked — meaning the columns may exist but the wiring does not.

⚠️VERIFY: Run in Supabase SQL Editor:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gallery_items'
  AND column_name IN ('width_px', 'height_px', 'aspect_ratio')
ORDER BY column_name;
```

### If missing:
```sql
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS width_px integer,
  ADD COLUMN IF NOT EXISTS height_px integer,
  ADD COLUMN IF NOT EXISTS aspect_ratio numeric GENERATED ALWAYS AS
    (CASE WHEN height_px > 0 THEN width_px::numeric / height_px ELSE NULL END) STORED;

CREATE INDEX IF NOT EXISTS idx_gallery_items_capsule_phase
  ON public.gallery_items(capsule_id, phase_id, approved, created_at);
```

---

## 1C — Storage bucket

✅DOC: PROJECT_RULES.md confirms: `capsule-publications` bucket exists,
private, signed URLs only.

⚠️VERIFY:
```sql
SELECT name, public
FROM storage.buckets
WHERE name = 'capsule-publications';
```

If missing:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('capsule-publications', 'capsule-publications', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "publications_service_upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'capsule-publications');

CREATE POLICY "publications_service_read"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'capsule-publications');
```

---

## 1D — guests table column name

✅DOC: Master Document schema (Section 14.3) shows guests table with
column named `name` (not `guest_name` or `contributor_name`).

✅DOC: MVP Build Guide schema Block 6 confirms: `name text not null`.

✅DOC: The render route queries `guests.select('id, name, tier, checked_in_at')`
— this matches the schema.

**Result: Column is confirmed as `name` from documentation. No mismatch.**

⚠️VERIFY: Quick confirmation:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'guests'
  AND column_name = 'name';
```

---

# ═══════════════════════════════════════════════════════
# STEP 2 — VERIFY next.config.js
# ═══════════════════════════════════════════════════════

### What documentation confirms:

✅DOC: HANDOVER_TRIBUTE_WALL_20MAY2026.md shows the exact current config:

```js
const nextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  async redirects() {
    return [{
      source: '/',
      destination: '/admin',
      permanent: false,
      has: [{ type: 'host', value: 'admin.revoworldtech.uk' }],
    }]
  },
}
module.exports = nextConfig
```

✅DOC: This uses `serverExternalPackages` at top level — the correct
Next.js 16 syntax. NOT the older `experimental.serverComponentsExternalPackages`.

**Result: next.config.js is confirmed correct from documentation.**

⚠️VERIFY: Open the file and confirm no subsequent AI session has changed it.

---

### maxDuration on generate route

🔧FIX REQUIRED: The Build Guide's generate route code does NOT include
`export const maxDuration`. Without it, Vercel enforces a 10-second
timeout. Puppeteer takes 30–90 seconds.

**In file:** `app/api/publication/generate/route.ts`

**Add immediately below the imports (before the adminClient declaration):**

```ts
export const maxDuration = 60 // seconds — Vercel serverless function timeout
```

**Find this line near the top of the file:**
```ts
const adminClient = createClient(
```

**Add the export ABOVE it:**
```ts
export const maxDuration = 60

const adminClient = createClient(
```

---

### NEXT_PUBLIC_APP_URL

✅DOC: HANDOVER_TRIBUTE_WALL_20MAY2026.md confirms DNS is resolved and
domain is live. HANDOFF.md lists O10 as pending.

⚠️VERIFY: Check Vercel Dashboard → Project → Settings → Environment Variables

Must be: `NEXT_PUBLIC_APP_URL = https://itslegacycapsule.com`

If still `http://localhost:3000`, the generate route will try to navigate
Puppeteer to localhost on the Vercel server. Every PDF generation will
timeout.

**Fix:** Update in Vercel Dashboard → Environment Variables → set to
`https://itslegacycapsule.com` → redeploy.

---

# ═══════════════════════════════════════════════════════
# STEP 3 — VERIFY render_token FLOW
# ═══════════════════════════════════════════════════════

### What documentation confirms:

✅DOC: Generate route code (Build Guide Section 3.5) writes render_token
before launching Puppeteer. Token generation uses `crypto.randomBytes(32).toString('hex')`.

✅DOC: Render route reads token from params and queries
`publications.render_token` to validate.

✅DOC: After PDF generation, token is invalidated: `render_token: null`.

### Params pattern on render route

🔧FIX LIKELY REQUIRED: The Build Guide shows the OLD params pattern:

```ts
// BUILD GUIDE VERSION — WRONG FOR NEXT.JS 16:
export default async function PublicationRenderPage({
  params,
}: {
  params: { token: string }
}) {
```

HOWEVER — HANDOVER_TRIBUTE_WALL_20MAY2026.md confirms this file was
ALREADY FIXED to the correct pattern:

> Files already fixed:
> - app/publication-render/[token]/page.tsx

**So the live code should use:**
```ts
export default async function PublicationRenderPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
```

⚠️VERIFY: Open `app/publication-render/[token]/page.tsx` and confirm
the params are typed as `Promise<{ token: string }>` and are awaited.

**If it still shows the old pattern, fix it:**

Find:
```ts
  params: { token: string }
}) {
```

Replace with:
```ts
  params: Promise<{ token: string }>
}) {
  const { token } = await params
```

Then change all references to `params.token` in the file to just `token`.

**Critical:** Also check the `.eq('render_token', ...)` query uses the
destructured `token` variable, not `params.token`.

---

# ═══════════════════════════════════════════════════════
# STEP 4 — IMAGE DIMENSION CAPTURE
# ═══════════════════════════════════════════════════════

### What documentation confirms:

✅DOC: HANDOFF.md lists O14 "imageUtils wired into upload flow" as unchecked.
This means the getImageDimensions function likely exists in `lib/imageUtils.ts`
but is NOT called by the gallery upload handler.

✅DOC: Build Guide Section 1.4 provides the complete `getImageDimensions`
function code.

### For the first PDF test:

The auto-arrangement will still run even if width_px/height_px are null.
All photos will be assigned as double-slot (the default fallback). The
PDF will look like a uniform grid — functional but not optimally laid out.

**This is acceptable for the first test.** Fix the upload wiring after
confirming the pipeline works end-to-end.

### Check test capsule data:

⚠️VERIFY: Run with your test capsule ID:
```sql
SELECT
  COUNT(*) AS total,
  COUNT(width_px) AS with_dimensions,
  COUNT(*) - COUNT(width_px) AS missing_dimensions
FROM gallery_items
WHERE capsule_id = '[YOUR_TEST_CAPSULE_ID]'
  AND approved = true
  AND deleted_at IS NULL;
```

Record the result. Proceed regardless.

---

# ═══════════════════════════════════════════════════════
# STEP 5 — VERIFY page_map POPULATION
# ═══════════════════════════════════════════════════════

### What documentation confirms:

✅DOC: The generate route (Build Guide Section 3.5, step 8) includes
the page_map extraction:

```ts
const pageMap = await page.evaluate(() => {
  const map: Record<string, number> = {}
  const cards = document.querySelectorAll('[data-contribution-id]')
  cards.forEach(card => {
    const id = card.getAttribute('data-contribution-id')!
    const rect = card.getBoundingClientRect()
    const pageNum = Math.ceil((rect.top + window.scrollY + 1) / 1122)
    map[id] = pageNum
  })
  return map
})
```

✅DOC: The render route's TributePages component (Build Guide Section 3.3)
DOES include `data-contribution-id={c.id}` on each tribute card:

```tsx
<div key={c.id} className="tribute-card"
  data-contribution-id={c.id}
>
```

**Result: Both the extraction logic AND the data attributes are confirmed
present in the specification code. page_map SHOULD populate correctly.**

⚠️VERIFY: After the first PDF test, check:
```sql
SELECT page_map
FROM publications
WHERE capsule_id = '[YOUR_TEST_CAPSULE_ID]';
```

If the result is `{}` (empty), the `data-contribution-id` attributes may
have been removed during a subsequent code change. Check the render route.

---

# ═══════════════════════════════════════════════════════
# STEP 6 — PUBLICATION ROUTE ACCESS
# ═══════════════════════════════════════════════════════

## 6.1 — Add publication card to manage page

🔧FIX REQUIRED: This is confirmed missing. HANDOFF.md activation checklist
lists it as unchecked. Open item O13.

### File: `app/manage/[slug]/page.tsx`

This is a client component (confirmed — uses `useParams()`).

**Finding the right insertion point:**

The manage page contains (per HANDOFF.md):
- Stats strip: total / pending / approved tribute counts
- Moderation queue: All / Pending / Approved tabs
- Share: copy link + WhatsApp

The publication card goes AFTER the moderation queue section and BEFORE
the share section. Search for the share section — likely a comment or
a heading with "Share" or "WhatsApp".

**Code to insert — the publication card:**

```tsx
      {/* ═══════════════════════════════════════════════════ */}
      {/* PUBLICATION CARD                                    */}
      {/* Links organiser to /manage/[slug]/publication        */}
      {/* ═══════════════════════════════════════════════════ */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'rgba(184,150,12,0.06)',
        border: '1px solid rgba(184,150,12,0.2)',
        borderRadius: '16px',
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#FAF3DC',
          marginBottom: '0.5rem',
        }}>
          Event Digital Publication
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: 'rgba(245,243,238,0.55)',
          lineHeight: 1.6,
          marginBottom: '1.25rem',
        }}>
          Assemble all approved tributes, photos, and event content into your
          permanent publication. Review the auto-arranged layout, make any
          changes, then generate your PDF.
        </p>
        <a
          href={`/manage/${slug}/publication`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 24px',
            background: 'linear-gradient(180deg, #C8A010, #B8960C)',
            color: '#2D1B69',
            fontSize: '0.875rem',
            fontWeight: 700,
            borderRadius: '9999px',
            textDecoration: 'none',
            letterSpacing: '0.05em',
          }}
        >
          Open Publication Editor →
        </a>
      </div>
```

**Confirm `slug` is available:** At the top of the component, verify:
```ts
const { slug } = useParams()
```

If `slug` is typed differently (e.g. `params.slug` or from a different
source), adjust the `href` accordingly.

---

## 6.2 — Verify publication entry page

⚠️VERIFY: Navigate to `/manage/[a-real-slug]/publication` on production.

✅DOC: File confirmed at `app/manage/[slug]/publication/page.tsx` per
HANDOFF.md ("Entry page at `app/manage/[slug]/publication/page.tsx`")

✅DOC: Params pattern confirmed fixed per HANDOVER_TRIBUTE_WALL:
`app/manage/[slug]/publication/page.tsx` is in the list of files fixed
for Next.js 16 async params.

---

# ═══════════════════════════════════════════════════════
# STEP 7 — FIRST PRODUCTION PDF TEST
# ═══════════════════════════════════════════════════════

## 7.0 — Pre-flight checklist

Before triggering generation, confirm ALL of the following:

| Check | How |
|---|---|
| `maxDuration = 60` is in generate route | Open the file |
| `NEXT_PUBLIC_APP_URL` is production URL | Vercel dashboard |
| render_token column exists | Step 1A query |
| capsule-publications bucket exists | Step 1C query |
| Test capsule has ≥3 approved contributions | Supabase Table Editor |
| Test capsule has `honouree_name` and `event_tag` set | Supabase Table Editor |

### Find your test capsule:
```sql
SELECT id, slug, honouree_name, event_tag, hero_image_url,
  (SELECT COUNT(*) FROM contributions
   WHERE capsule_id = c.id AND status = 'approved') AS approved_count
FROM capsules c
WHERE page_state = 'active'
ORDER BY created_at DESC
LIMIT 5;
```

Pick one with `approved_count >= 3`. Record its `id` and `slug`.

---

## 7.1 — Initialise publication layout

### Option A: Via the editor UI
Navigate to `/manage/[slug]/publication` — the editor calls `/api/publication/init`
automatically on load.

### Option B: Direct API call (PowerShell)
```powershell
$body = '{"capsule_id":"[YOUR-CAPSULE-ID]"}'
Invoke-WebRequest -Uri "https://itslegacycapsule.com/api/publication/init" `
  -Method POST -ContentType "application/json" -Body $body
```

### Verify:
```sql
SELECT id, arrangement_source, generation_status,
  layout_config IS NOT NULL AS has_layout,
  jsonb_array_length(layout_config->'sections') AS section_count
FROM publications
WHERE capsule_id = '[YOUR-CAPSULE-ID]';
```

Expected: `has_layout = true`, `section_count >= 5`.

---

## 7.2 — Trigger PDF generation

### Option A: Click "Generate Publication PDF" in the editor UI

### Option B: Direct API call (PowerShell)
```powershell
$body = '{"capsule_id":"[YOUR-CAPSULE-ID]"}'
Invoke-WebRequest -Uri "https://itslegacycapsule.com/api/publication/generate" `
  -Method POST -ContentType "application/json" -Body $body
```

**Monitor in Vercel:** Dashboard → Project → Logs → filter for
`/api/publication/generate` and `/publication-render/`

---

## 7.3 — Check results

```sql
SELECT
  generation_status,
  pdf_url IS NOT NULL AS has_pdf,
  pdf_size_bytes,
  page_map != '{}' AS page_map_populated,
  generation_error,
  generation_completed_at - generation_started_at AS duration
FROM publications
WHERE capsule_id = '[YOUR-CAPSULE-ID]';
```

### If generation_status = 'ready':

🎉 Download the PDF via pdf_url. Open it. Check:
- [ ] Cover page has honouree name and event tag
- [ ] Tributes section shows approved contributions
- [ ] Fonts are Cormorant Garamond / DM Sans (not Times/Arial)
- [ ] No broken image placeholders
- [ ] Pages are A4 format

### If generation_status = 'failed':

Read `generation_error` and diagnose using this table:

| Error contains | Cause | Fix |
|---|---|---|
| `timeout` | Function killed by Vercel | Confirm `maxDuration = 60` |
| `ERR_NAME_NOT_RESOLVED` | NEXT_PUBLIC_APP_URL wrong | Fix env var, redeploy |
| `render_token` | Column missing | Run Step 1A migration |
| `notFound` | Token not written or params bug | Check render route params |
| `executablePath` | Chromium version | `npm install @sparticuz/chromium@latest` |
| `Upload failed` | Bucket missing or policy | Run Step 1C migration |

### If generation_status = 'generating' (stuck):

The function timed out silently. Most likely cause: `maxDuration` not set.

```sql
-- Reset to allow retry
UPDATE publications
SET generation_status = 'pending',
    render_token = NULL,
    generation_error = 'Manually reset after timeout'
WHERE capsule_id = '[YOUR-CAPSULE-ID]';
```

Then add `maxDuration`, redeploy, and retry.

---

## 7.4 — Font check

If the PDF shows Times New Roman or Arial instead of Cormorant Garamond
and DM Sans, Google Fonts failed to load during Puppeteer's render.

**Recommended fix: self-host fonts.**

Download these files (from Google Fonts or fonts.google.com):
- CormorantGaramond-Bold.woff2
- CormorantGaramond-BoldItalic.woff2
- DMSans-Regular.woff2
- DMSans-Medium.woff2
- DMSans-SemiBold.woff2

Place in: `public/fonts/`

In `app/publication-render/[token]/page.tsx`, find the `<head>` section
and replace any Google Fonts `<link>` tags with local @font-face rules:

```tsx
<style>{`
  @font-face {
    font-family: 'Cormorant Garamond';
    font-weight: 700;
    font-style: normal;
    src: url('/fonts/CormorantGaramond-Bold.woff2') format('woff2');
    font-display: block;
  }
  @font-face {
    font-family: 'Cormorant Garamond';
    font-weight: 700;
    font-style: italic;
    src: url('/fonts/CormorantGaramond-BoldItalic.woff2') format('woff2');
    font-display: block;
  }
  @font-face {
    font-family: 'DM Sans';
    font-weight: 400;
    font-style: normal;
    src: url('/fonts/DMSans-Regular.woff2') format('woff2');
    font-display: block;
  }
  @font-face {
    font-family: 'DM Sans';
    font-weight: 500;
    font-style: normal;
    src: url('/fonts/DMSans-Medium.woff2') format('woff2');
    font-display: block;
  }
  @font-face {
    font-family: 'DM Sans';
    font-weight: 600;
    font-style: normal;
    src: url('/fonts/DMSans-SemiBold.woff2') format('woff2');
    font-display: block;
  }
`}</style>
```

Use `font-display: block` not `swap` — Puppeteer must wait for fonts
to load before rendering. `block` forces this.

---

# ═══════════════════════════════════════════════════════
# STEP 8 — RESULTS TABLE
# ═══════════════════════════════════════════════════════

## Pre-filled from documentation review:

| Step | Check | Status | Notes |
|---|---|---|---|
| 1A | `publications.render_token` exists | ⚠️VERIFY | HANDOFF says "schema additions applied" — likely present |
| 1A | All Phase 3 columns present | ⚠️VERIFY | Same — run Query A to confirm |
| 1B | `gallery_items.width_px` exists | ⚠️VERIFY | Build Guide provides migration; run status unknown |
| 1B | `gallery_items.height_px` exists | ⚠️VERIFY | Same as above |
| 1C | `capsule-publications` bucket exists | ✅DOC CONFIRMED | PROJECT_RULES.md lists it |
| 1D | `guests.name` column confirmed | ✅DOC CONFIRMED | Master Document + MVP Guide: `name text not null` |
| 1E | `publications.capsule_id` UNIQUE | ⚠️VERIFY | Init route depends on it |
| 2 | `serverExternalPackages` at top level | ✅DOC CONFIRMED | HANDOVER shows correct syntax |
| 2 | `maxDuration = 60` in generate route | 🔧FIX REQUIRED | Not in Build Guide code — must be added |
| 2 | `NEXT_PUBLIC_APP_URL` = production | ⚠️VERIFY | HANDOFF O10 listed as pending |
| 3 | Render route Promise params | ✅DOC CONFIRMED | HANDOVER lists file as fixed |
| 3 | Token write→read chain | ✅DOC CONFIRMED | Build Guide code shows full chain |
| 4 | `getImageMetadata` wired | 🔧DEFERRED | HANDOFF O14 unchecked — defer to post-test |
| 4 | Test capsule dimensions | ⚠️VERIFY | Run query with test capsule ID |
| 5 | `data-contribution-id` on tributes | ✅DOC CONFIRMED | Build Guide render route code includes it |
| 5 | page_map extraction in generate route | ✅DOC CONFIRMED | Build Guide step 8 code includes it |
| 6 | Publication card on manage page | 🔧FIX REQUIRED | Code provided in Step 6.1 above |
| 6 | Editor loads at `/manage/[slug]/publication` | ⚠️VERIFY | File exists per HANDOFF |
| 6 | Init route runs, layout_config in DB | ⚠️VERIFY | Test after card is placed |
| 7 | PDF generated successfully | ⚠️EXECUTE | The actual test |
| 7 | PDF downloads and opens | ⚠️EXECUTE | Visual inspection |
| 7 | Correct fonts | ⚠️EXECUTE | Visual inspection |
| 7 | No broken images | ⚠️EXECUTE | Visual inspection |
| 7 | Generation duration | ⚠️EXECUTE | Check query result |
| 8 | page_map populated | ⚠️EXECUTE | Post-generation query |

---

## SUMMARY OF REQUIRED CODE CHANGES

Only TWO code changes are required before the test:

### Change 1: Add maxDuration to generate route
**File:** `app/api/publication/generate/route.ts`
**Action:** Add `export const maxDuration = 60` below the imports
**Risk if skipped:** Every PDF generation times out at 10 seconds

### Change 2: Add publication card to manage page
**File:** `app/manage/[slug]/page.tsx`
**Action:** Insert the publication card JSX block (provided in Step 6.1)
**Risk if skipped:** Organiser has no way to access the Publication Editor

### Conditional Change 3: Fix NEXT_PUBLIC_APP_URL
**Location:** Vercel Dashboard → Environment Variables
**Action:** Set to `https://itslegacycapsule.com` if still localhost
**Risk if skipped:** Puppeteer navigates to localhost — PDF never generates

### Conditional Change 4: Self-host fonts (only if Step 7 shows fallback fonts)
**Files:** `public/fonts/` + `app/publication-render/[token]/page.tsx`
**Action:** Download woff2 files, add @font-face rules
**Risk if skipped:** Publication looks unprofessional

---

## EXECUTION SEQUENCE FOR CLAUDE CODE SESSION

```
1. Open Supabase SQL Editor
   → Run Query A (publications columns)
   → Run Query B (gallery_items dimensions)
   → Run Query C (storage bucket)
   → Run Query D (guests.name)
   → Run Query E (UNIQUE constraint)
   → Run any missing migrations

2. Open app/api/publication/generate/route.ts
   → Add: export const maxDuration = 60
   → Save

3. Check Vercel Dashboard
   → Verify NEXT_PUBLIC_APP_URL = https://itslegacycapsule.com
   → Fix if wrong

4. Open app/manage/[slug]/page.tsx
   → Read in full
   → Find insertion point (after moderation, before share)
   → Insert publication card code from Step 6.1
   → Save

5. Run: npm run build
   → Must pass with zero errors

6. Push to develop → main
   → Wait for Vercel deployment

7. Navigate to /manage/[test-slug]/publication
   → Verify editor loads
   → Verify sections appear

8. Click "Generate Publication PDF"
   → Watch Vercel logs
   → Wait 30-90 seconds

9. Check publications table
   → Run Step 7.3 query
   → Download and inspect PDF

10. Fill in Results Table with actual values
    → Record activation status
```

---

## ACTIVATION STATUS

After the sprint is complete, one of these applies:

**FULLY ACHIEVED:**
PDF generates on production. Cover, tributes, and photos render correctly.
Fonts are correct. Publication card is visible on manage page.
Commercial activation is possible.

**ACHIEVED WITH NOTES:**
PDF generates but with known gaps (null image dimensions, fallback fonts).
Functional but not premium. List specific gaps and fix timeline.

**NOT ACHIEVED:**
PDF generation fails on production. Record the error. Diagnose using
Step 7.3 table. Identify next action.

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*
*LC-PUBLICATION-ACTIVATION-001 Sprint Package · AI8 · June 2026*
