# LC-PUBLICATION-ACTIVATION-001.md
## Publication Engine — Activation Mission

**Path:** docs/LC-PUBLICATION-ACTIVATION-001.md
**Compiled by:** AI8 · June 2026
**Status:** Active Mission Document
**Goal:** First commercially usable publication — end-to-end, on production Vercel
**Scope:** Publication pipeline only. No new features. No architecture changes.

> **Model for build sessions using this document: Claude Opus 4.6**
> Switch to Sonnet only for documentation tasks.

---

## HOW TO USE THIS DOCUMENT

Work through Steps 1–8 in order. Each step has:
- What to verify or do
- The exact SQL, code, or command
- A pass/fail test
- What to record in the results table at the end

Do not skip steps. Step 7 (the PDF test) will fail if any earlier step has a gap.

The **Results Table** at the end of this document is your sign-off checklist.
Fill it in as you go. When all rows show PASS, commercial activation is achieved.

---

## STEP 1 — Verify All Publication Schema Columns

### 1.1 What to run

Open Supabase SQL Editor. Run each query. Record the output.

**Query A — Check publications table columns:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'publications'
ORDER BY ordinal_position;
```

**Expected columns — every one of these must be present:**

| Column | Type | Required for |
|---|---|---|
| `id` | uuid | Primary key |
| `capsule_id` | uuid | FK to capsules |
| `community_id` | uuid | Multi-tenancy |
| `layout_config` | jsonb | Auto-arrangement output |
| `theme` | text | Publication theme |
| `cover_style` | text | Cover layout |
| `generated_at` | timestamptz | Timestamp |
| `pdf_url` | text | Download link |
| `version` | integer | Edition tracking |
| `created_at` | timestamptz | Record creation |
| `page_map` | jsonb | Contribution → page number map |
| `arrangement_source` | text | 'auto' or 'manual' |
| `pdf_size_bytes` | integer | Storage tracking |
| `generation_status` | text | Pipeline state |
| `generation_started_at` | timestamptz | Timeout detection |
| `generation_completed_at` | timestamptz | Completion record |
| `generation_error` | text | Error capture |
| `render_token` | text | **CRITICAL** — Puppeteer auth |

**If `render_token` is missing:** Run immediately:
```sql
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS render_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_publications_render_token
  ON public.publications(render_token);
```

**If any Phase 3 columns are missing:** Run:
```sql
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS layout_config jsonb,
  ADD COLUMN IF NOT EXISTS page_map jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS arrangement_source text DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS pdf_size_bytes integer,
  ADD COLUMN IF NOT EXISTS generation_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS generation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_error text,
  ADD COLUMN IF NOT EXISTS render_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_publications_render_token
  ON public.publications(render_token);
```

---

**Query B — Check gallery_items dimension columns:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gallery_items'
  AND column_name IN ('width_px', 'height_px', 'aspect_ratio')
ORDER BY column_name;
```

**Expected:** 3 rows returned (width_px, height_px, aspect_ratio).

**If missing:** Run:
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

**Query C — Confirm capsule-publications storage bucket:**
```sql
SELECT name, public
FROM storage.buckets
WHERE name = 'capsule-publications';
```

**Expected:** 1 row, `public = false`.

**If missing:** Run:
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

**Query D — Check guests table column name:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'guests'
  AND column_name IN ('name', 'checked_in_at');
```

**Expected:** 2 rows — `name` and `checked_in_at`.

> **Note:** The render route queries `guests.name` (not `guests.guest_name`). Confirm this is correct. If the column is named differently, record it — a one-line fix is needed in the render route.

---

**Query E — Confirm UNIQUE constraint on publications.capsule_id:**
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'publications'
  AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');
```

The `upsert({ onConflict: 'capsule_id' })` call in the init route depends on a UNIQUE constraint on `capsule_id`. If missing:
```sql
ALTER TABLE public.publications
  ADD CONSTRAINT publications_capsule_id_key UNIQUE (capsule_id);
```

---

### 1.2 Step 1 pass criteria

All queries return expected results. All missing columns added. Storage bucket confirmed. Record results in the Results Table.

---

## STEP 2 — Verify next.config.js

### 2.1 What to check

Open `next.config.js` in the project root.

**Confirmed from HANDOVER_TRIBUTE_WALL_20MAY2026.md — the correct current config is:**
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

**Critical:** The key is `serverExternalPackages` — NOT `experimental.serverComponentsExternalPackages`. Next.js 16 moved this out of experimental. The older key is silently ignored, meaning Puppeteer gets bundled client-side and the build either fails on size limits or crashes at runtime.

**Verify:**
- `serverExternalPackages` is at the top level (not nested under `experimental`)
- Both `'puppeteer-core'` and `'@sparticuz/chromium'` are in the array
- `module.exports = nextConfig` (not `export default`)

**Also verify `maxDuration` is set on the generate route:**

Open `app/api/publication/generate/route.ts`. Near the top, confirm this line exists:
```ts
export const maxDuration = 60 // seconds — raise to 300 on Vercel Pro if needed
```

If missing, add it immediately below the imports. Without this, Vercel enforces the default 10-second timeout and Puppeteer never completes.

### 2.2 Step 2 pass criteria

`next.config.js` uses `serverExternalPackages` at top level. `maxDuration = 60` is exported from the generate route. No `experimental` wrapper on the packages config.

---

## STEP 3 — Verify render_token Flow

### 3.1 What to check

This is the chain that must work: generate route writes token → render route reads token → Puppeteer authenticates.

**In `app/api/publication/generate/route.ts`, confirm:**

1. `render_token` is generated: `const renderToken = crypto.randomBytes(32).toString('hex')`
2. Token is written to publications table before Puppeteer launches
3. The render URL uses the correct `APP_URL`: `const renderUrl = \`${APP_URL}/publication-render/${renderToken}\``
4. `APP_URL` is `process.env.NEXT_PUBLIC_APP_URL` — verify this env var is set in Vercel

**In `app/publication-render/[token]/page.tsx`, confirm:**

1. Params pattern uses Next.js 16 async syntax:
```ts
export default async function PublicationRenderPage({
  params,
}: {
  params: Promise<{ token: string }>   // ← must be Promise<>
}) {
  const { token } = await params       // ← must be awaited
```

> **This is the most common silent failure.** The HANDOVER_TRIBUTE_WALL_20MAY2026.md confirms `app/publication-render/[token]/page.tsx` was in the list of files already fixed for the Next.js 16 params pattern. Verify the fix is in place — a non-awaited `params` causes a 404 on Vercel without any clear error.

2. Token validation queries the correct column:
```ts
const { data: pub } = await adminClient
  .from('publications')
  .select('*, capsule_id')
  .eq('render_token', params.token)   // ← render_token column must exist
  .single()
```

3. `if (!pub) return notFound()` is present — prevents render of invalid tokens

### 3.2 Verify NEXT_PUBLIC_APP_URL

Run in PowerShell or check Vercel dashboard:

In Vercel → Project → Settings → Environment Variables, confirm:
```
NEXT_PUBLIC_APP_URL = https://itslegacycapsule.com
```

If it is still `http://localhost:3000`, the generate route will attempt to navigate Puppeteer to localhost on the Vercel server — which does not exist. Every PDF generation will time out.

### 3.3 Step 3 pass criteria

render route uses `Promise<{ token: string }>` params pattern. `NEXT_PUBLIC_APP_URL` is set to production domain in Vercel. Token write → read chain confirmed in code.

---

## STEP 4 — Verify and Wire Image Dimension Capture

### 4.1 Current state

The `gallery_items` table requires `width_px` and `height_px` on every photo for the auto-arrangement algorithm to assign layout slots correctly. Without them, all photos fall through to the double-slot default — no feature photos, no triple slots, flat grid output.

There are two separate concerns:
- **New uploads:** `getImageMetadata()` must be called before upload
- **Existing photos:** Already in Supabase with null dimensions — need a backfill

### 4.2 Check existing data

Run in Supabase SQL Editor:
```sql
SELECT
  COUNT(*) AS total_gallery_items,
  COUNT(width_px) AS items_with_dimensions,
  COUNT(*) - COUNT(width_px) AS items_missing_dimensions
FROM gallery_items
WHERE deleted_at IS NULL;
```

If `items_missing_dimensions > 0`, the auto-arrangement will produce a degraded layout for those photos.

### 4.3 Backfill strategy for existing photos

For the first publication test, missing dimensions are an acceptable gap if the capsule being tested has photos uploaded after the dimension columns were added. Check the test capsule specifically:

```sql
SELECT id, image_url, width_px, height_px
FROM gallery_items
WHERE capsule_id = '[YOUR_TEST_CAPSULE_ID]'
  AND approved = true
  AND deleted_at IS NULL;
```

If all rows show null `width_px`, the auto-arrangement will still run — it will just assign all photos as double-slot. The PDF will generate. The layout will be functional but not optimal. **This is acceptable for the first test.** Note it in results and address the upload wiring after first successful PDF.

### 4.4 Wire getImageMetadata for future uploads

Locate the gallery upload handler. From the project structure this is likely in the manage page or a component used by the organiser dashboard. Find the `supabase.from('gallery_items').insert(...)` call.

Add dimension capture before the upload:

```ts
// lib/imageUtils.ts — verify this file exists, create if not
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image dimensions'))
    }
    img.src = url
  })
}
```

**In the upload handler — find the insert call and add dimensions:**

Search for: `supabase.from('gallery_items').insert`

Add before the insert:
```ts
const { width, height } = await getImageDimensions(file)
```

Add to the insert payload:
```ts
width_px: width,
height_px: height,
```

### 4.5 Step 4 pass criteria

Columns confirmed to exist in Supabase (Step 1B). `getImageMetadata` wired into upload handler. Test capsule's existing gallery items checked — note how many have dimensions vs null. Acceptable to proceed to Step 5 even if existing photos have null dimensions.

---

## STEP 5 — Verify page_map Population

### 5.1 What page_map is

After PDF generation, the publications table should contain a `page_map` jsonb object like:
```json
{
  "contrib_id_abc123": 4,
  "contrib_id_def456": 7,
  "contrib_id_ghi789": 7
}
```

This maps each `contribution_id` to the page number where that tribute appears. It is consumed by the Collective Belonging Email to personalise: "Your tribute appears on page 7."

### 5.2 How it is populated

In `app/api/publication/generate/route.ts`, after Puppeteer renders the page, a script injects into the browser context to read element positions. Confirm this block exists in the generate route:

```ts
// 7. Extract page map — read DOM element positions
const pageMap = await page.evaluate(() => {
  const map: Record<string, number> = {}
  const pageHeightPx = 1122 // A4 at 96dpi

  document.querySelectorAll('[data-contribution-id]').forEach(el => {
    const rect = el.getBoundingClientRect()
    const pageNumber = Math.floor(rect.top / pageHeightPx) + 1
    const id = el.getAttribute('data-contribution-id')!
    map[id] = pageNumber
  })

  return map
})
```

**This depends on tribute elements having `data-contribution-id` attributes in the render route.**

Check `app/publication-render/[token]/page.tsx` — in the `TributePages` component (or wherever individual tributes are rendered), confirm each tribute wrapper has:
```tsx
<div data-contribution-id={tribute.contribution_id} ...>
```

If missing, the `page_map` will be populated as an empty object `{}`. The Collective Belonging Email will still send but without page personalisation.

**For the first PDF test:** An empty `page_map` is acceptable. The PDF still generates. Note it as a gap to fix before distribution is used commercially. Do not block the test over this.

### 5.3 Step 5 pass criteria

The `page_map` extraction block exists in the generate route. Tribute elements in the render route have `data-contribution-id` attributes (or note that they are missing for a subsequent fix). Acceptable to proceed either way for first test.

---

## STEP 6 — Verify Publication Route Access

### 6.1 Add publication card to manage page

**File:** `app/manage/[slug]/page.tsx`

This is the single most important connection missing for commercial activation. The organiser cannot reach the Publication Editor without it.

**Find the location:** Search for the stats strip section in the manage page. The publication card goes below the moderation queue and above or alongside the share section.

**Add this card:**

```tsx
{/* ── PUBLICATION CARD ─────────────────────────────── */}
{/* Publication Engine — links to /manage/[slug]/publication */}
<div style={{
  marginTop: 'var(--space-8)',
  padding: 'var(--space-6)',
  background: 'rgba(184,150,12,0.06)',
  border: '1px solid rgba(184,150,12,0.2)',
  borderRadius: 'var(--radius-lg)',
}}>
  <div style={{
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    color: 'var(--lc-ivory)',
    marginBottom: 'var(--space-2)',
  }}>
    Event Digital Publication
  </div>
  <p style={{
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-sm)',
    color: 'rgba(245,243,238,0.55)',
    lineHeight: 1.6,
    marginBottom: 'var(--space-5)',
  }}>
    Assemble all tributes, photos and event content into your permanent publication.
    Review the auto-arranged layout, make any changes, then generate your PDF.
  </p>
  <a
    href={`/manage/${slug}/publication`}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '10px 24px',
      background: 'linear-gradient(180deg, #C8A010, #B8960C)',
      color: '#2D1B69',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      fontWeight: 700,
      borderRadius: 'var(--radius-full)',
      textDecoration: 'none',
      letterSpacing: 'var(--tracking-wide)',
    }}
  >
    Open Publication Editor →
  </a>
</div>
```

**Finding the slug variable:** The manage page uses `useParams()` (client component). The slug is available as `const { slug } = useParams()`. Confirm this is already destructured at the top of the component.

### 6.2 Verify the publication entry page exists

Confirm `app/manage/[slug]/publication/page.tsx` exists and renders without error.

Navigate directly to: `https://itslegacycapsule.com/manage/[a-real-slug]/publication`

Expected: Publication Editor loads. If it shows a blank page or 404, check:
- File exists at the correct path (no `src/` prefix — confirmed project rule)
- The `params` pattern uses `Promise<{ slug: string }>` (Next.js 16 — confirmed fixed per HANDOVER)
- The init API route is called correctly on load

### 6.3 Verify the publication editor shell loads

With a real capsule that has at least 2 approved contributions, open the editor:

1. Navigate to `/manage/[slug]/publication`
2. The page should call `/api/publication/init` on load
3. The editor shell should render with SectionNavigator on the left
4. Sections visible: Cover, Honouree Profile, Tributes, Who Attended, Closing Message

If the editor shows but sections are empty:
- Check that `layout_config` was written to `publications` table after init was called
- Run in Supabase SQL Editor: `SELECT layout_config FROM publications WHERE capsule_id = '[id]'`
- If null: the init route failed. Check Vercel function logs.

### 6.4 Step 6 pass criteria

Publication card added to manage page and links correctly. Publication editor loads at `/manage/[slug]/publication`. Init route runs and `layout_config` appears in `publications` table. Editor shell renders with sections visible.

---

## STEP 7 — Run First Production PDF Test

### 7.1 Prepare a test capsule

Use a capsule that has:
- At minimum 3 approved contributions (with email addresses for later distribution test)
- At minimum 1 approved gallery photo
- A `hero_image_url` set on the capsule record
- `honouree_name` and `event_tag` set

If no such capsule exists, create one via the booking flow, approve a few test contributions through LCAdmin, and upload a test photo through the manage page.

Confirm the capsule ID. Find it with:
```sql
SELECT id, slug, honouree_name, hero_image_url
FROM capsules
WHERE slug = '[your-test-slug]';
```

### 7.2 Initialise the publication layout

If not already done via the editor UI, call the init route directly:

```
POST https://itslegacycapsule.com/api/publication/init
Content-Type: application/json

{"capsule_id": "[your-capsule-id]"}
```

You can use the browser console on the publication editor page, or curl from PowerShell:

```powershell
Invoke-WebRequest -Uri "https://itslegacycapsule.com/api/publication/init" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"capsule_id":"[your-capsule-id]"}'
```

**Expected response:** `{"layout_config": {...}, "source": "generated", "pub_id": "..."}`

Verify `layout_config` now exists in Supabase:
```sql
SELECT id, arrangement_source, generation_status,
       jsonb_array_length(layout_config->'sections') AS section_count
FROM publications
WHERE capsule_id = '[your-capsule-id]';
```

Expected: `section_count` should be 5+ (cover, profile, tributes, who_attended, closing).

### 7.3 Trigger PDF generation

From the Publication Editor UI, click the "Generate Publication PDF" button.

**Alternatively**, call the generate route directly:

```powershell
Invoke-WebRequest -Uri "https://itslegacycapsule.com/api/publication/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"capsule_id":"[your-capsule-id]"}'
```

**Watch Vercel function logs in real time:**
Vercel Dashboard → Project → Functions → filter by `/api/publication/generate`

### 7.4 Interpret the result

**Success — generation_status becomes 'ready':**

```sql
SELECT generation_status, pdf_url, pdf_size_bytes,
       generation_completed_at, page_map
FROM publications
WHERE capsule_id = '[your-capsule-id]';
```

Expected:
- `generation_status = 'ready'`
- `pdf_url` — a Supabase Storage signed URL
- `pdf_size_bytes` — a non-zero integer
- `page_map` — ideally a populated JSON object (may be `{}` if data-contribution-id attributes are missing — acceptable for first test)

Download the PDF via the `pdf_url`. Open it. Verify:
- Cover page renders with honouree name and event tag
- Tributes section shows approved contributions
- Themes are applying correctly (colours, typography)
- No blank pages
- No broken image placeholders (white boxes where images should be)

---

**Failure — generation_status becomes 'failed':**

Check `generation_error` column:
```sql
SELECT generation_error, generation_started_at, generation_completed_at
FROM publications
WHERE capsule_id = '[your-capsule-id]';
```

**Diagnose by error:**

| Error | Cause | Fix |
|---|---|---|
| `Publication not found` | No publications row for this capsule | Run init first |
| `render_token` column does not exist | Migration not run | Run Step 1 migration |
| `net::ERR_NAME_NOT_RESOLVED` or timeout | `NEXT_PUBLIC_APP_URL` is localhost or wrong | Fix env var in Vercel, redeploy |
| `notFound()` from render route | Token not written before Puppeteer navigates | Check token write logic in generate route |
| `executablePath is not a function` | `@sparticuz/chromium` version mismatch | `npm install @sparticuz/chromium@latest` |
| Function timeout | Vercel plan timeout too low | Add `export const maxDuration = 60` to generate route |
| Images not rendering | Supabase Storage URLs not signed | See Section 7.5 |
| Build size error | `serverExternalPackages` missing or wrong key | Fix next.config.js (Step 2) |

### 7.5 If images are not rendering in the PDF

The render route fetches gallery items and constructs image URLs. In production, `image_url` values from `gallery_items` are Supabase Storage public URLs (tribute-photos bucket is public). These should load without authentication.

If cover image (`hero_image_url` from capsules) fails to load, it may be in a private bucket. Check:

```sql
SELECT hero_image_url FROM capsules WHERE id = '[capsule-id]';
```

If the URL contains `capsule-publications` (private bucket), a signed URL is needed. If it is in `tribute-photos` (public bucket), it should load directly.

For the first test, having the cover image render is essential. If it fails, generate a signed URL in the render route:

```ts
// In publication-render/[token]/page.tsx
// After fetching the capsule, generate signed URL for hero image if needed
let heroImageUrl = capsule.hero_image_url
if (heroImageUrl && heroImageUrl.includes('capsule-publications')) {
  const { data } = await adminClient.storage
    .from('capsule-publications')
    .createSignedUrl(heroImageUrl.split('capsule-publications/')[1], 3600)
  heroImageUrl = data?.signedUrl ?? heroImageUrl
}
```

### 7.6 Font verification

Open the downloaded PDF. Verify:
- Headings use Cormorant Garamond (serif with distinctive ligatures)
- Body text uses DM Sans (clean sans-serif)
- If fonts appear as Times New Roman or Arial — Google Fonts failed to load

**If fonts are wrong — self-host immediately:**

Create `public/fonts/` directory. Download:
- Cormorant Garamond: Bold (700), Italic Bold (700 italic)
- DM Sans: Regular (400), Medium (500), SemiBold (600)

In `app/publication-render/[token]/page.tsx`, replace Google Fonts `<link>` with:

```tsx
<style>{`
  @font-face {
    font-family: 'Cormorant Garamond';
    font-style: normal;
    font-weight: 700;
    src: url('/fonts/CormorantGaramond-Bold.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Cormorant Garamond';
    font-style: italic;
    font-weight: 700;
    src: url('/fonts/CormorantGaramond-BoldItalic.woff2') format('woff2');
  }
  @font-face {
    font-family: 'DM Sans';
    font-style: normal;
    font-weight: 400;
    src: url('/fonts/DMSans-Regular.woff2') format('woff2');
  }
  @font-face {
    font-family: 'DM Sans';
    font-style: normal;
    font-weight: 500;
    src: url('/fonts/DMSans-Medium.woff2') format('woff2');
  }
  @font-face {
    font-family: 'DM Sans';
    font-style: normal;
    font-weight: 600;
    src: url('/fonts/DMSans-SemiBold.woff2') format('woff2');
  }
`}</style>
```

### 7.7 Step 7 pass criteria

PDF generates successfully on production Vercel. `generation_status = 'ready'`. PDF downloads and opens. Cover page, tributes, and at least one gallery section render correctly. Fonts are Cormorant Garamond and DM Sans (not system fallbacks). No broken image placeholders.

---

## STEP 8 — Record Results and Confirm Activation

### 8.1 Post-generation verification queries

Run these after a successful PDF generation:

```sql
-- Full publication record state
SELECT
  p.id,
  p.generation_status,
  p.pdf_url IS NOT NULL AS has_pdf_url,
  p.pdf_size_bytes,
  p.page_map != '{}' AS page_map_populated,
  jsonb_array_length(p.page_map) AS page_map_entry_count,
  p.generation_completed_at - p.generation_started_at AS generation_duration,
  p.version
FROM publications p
WHERE p.capsule_id = '[your-capsule-id]';
```

Record:
- Generation duration (how long Puppeteer took — if > 50s, Vercel Pro may be needed for large capsules)
- PDF size bytes (sanity check — should be several hundred KB to a few MB)
- `page_map_entry_count` — if 0, the `data-contribution-id` attributes are missing from the render route

---

### 8.2 The autoPrint fallback path

The platform supports a browser print-to-PDF path as a user-controlled alternative. This does not require Puppeteer and works on any Vercel plan. It is valuable as:
- A fallback when Puppeteer times out on very large capsules
- A self-serve option for organisers on free or lower tiers

Verify the "Preview & Save as PDF" button exists in the `PublicationEditor.tsx` or the publication entry page. The URL pattern with `?autoPrint=1` on the render route should trigger `window.print()` on page load.

If not implemented, add to the publication page as a secondary option alongside the generate button. This is a critical safety net.

### 8.3 Activation sign-off criteria

All of the following must be true before the first paying client is directed to the publication flow:

1. PDF generates successfully on production Vercel
2. Publication card visible on manage page
3. Editor loads and shows sections correctly
4. PDF contains correct content (honouree name, event tag, tributes)
5. PDF uses correct fonts (Cormorant Garamond, DM Sans)
6. Cover image renders (not a broken placeholder)
7. `pdf_url` is accessible and downloads correctly
8. Generation completes within Vercel timeout (< 60s for standard capsules)

---

## RESULTS TABLE — Fill In As You Go

| Step | Check | Status | Notes |
|---|---|---|---|
| 1A | `publications.render_token` column exists | ☐ PASS / ☐ FAIL / ☐ ADDED | |
| 1A | All Phase 3 columns present | ☐ PASS / ☐ FAIL / ☐ ADDED | |
| 1B | `gallery_items.width_px` exists | ☐ PASS / ☐ FAIL / ☐ ADDED | |
| 1B | `gallery_items.height_px` exists | ☐ PASS / ☐ FAIL / ☐ ADDED | |
| 1C | `capsule-publications` storage bucket exists | ☐ PASS / ☐ FAIL / ☐ ADDED | |
| 1D | `guests.name` column confirmed | ☐ PASS / ☐ FAIL | Column name: _______ |
| 1E | `publications.capsule_id` UNIQUE constraint exists | ☐ PASS / ☐ FAIL / ☐ ADDED | |
| 2 | `next.config.js` uses `serverExternalPackages` at top level | ☐ PASS / ☐ FAIL | |
| 2 | `maxDuration = 60` exported from generate route | ☐ PASS / ☐ FAIL / ☐ ADDED | |
| 2 | `NEXT_PUBLIC_APP_URL` = production domain in Vercel | ☐ PASS / ☐ FAIL | Value: _______ |
| 3 | Render route uses `Promise<{ token: string }>` params | ☐ PASS / ☐ FAIL | |
| 3 | Token write → read chain confirmed in code | ☐ PASS / ☐ FAIL | |
| 4 | `getImageMetadata` wired into upload handler | ☐ PASS / ☐ FAIL / ☐ DEFERRED | |
| 4 | Test capsule gallery items dimension status | ☐ ALL NULL / ☐ SOME / ☐ ALL PRESENT | Count: _______ |
| 5 | `data-contribution-id` attributes on tribute elements | ☐ PRESENT / ☐ MISSING | |
| 5 | page_map extraction block in generate route | ☐ PRESENT / ☐ MISSING | |
| 6 | Publication card added to manage page | ☐ DONE | |
| 6 | Editor loads at `/manage/[slug]/publication` | ☐ PASS / ☐ FAIL | |
| 6 | Init route runs, `layout_config` appears in DB | ☐ PASS / ☐ FAIL | |
| 6 | Section count in layout_config | ☐ PASS | Count: _______ |
| 7 | PDF generation triggered | ☐ DONE | |
| 7 | `generation_status = 'ready'` | ☐ PASS / ☐ FAIL | Error if fail: _______ |
| 7 | PDF downloads successfully | ☐ PASS / ☐ FAIL | |
| 7 | Cover page renders correctly | ☐ PASS / ☐ FAIL | |
| 7 | Tributes section renders correctly | ☐ PASS / ☐ FAIL | |
| 7 | Fonts are Cormorant Garamond / DM Sans | ☐ PASS / ☐ FAIL — SELF-HOST | |
| 7 | No broken image placeholders | ☐ PASS / ☐ FAIL | |
| 7 | Generation duration | ☐ RECORDED | Duration: _______ seconds |
| 7 | PDF size | ☐ RECORDED | Size: _______ KB |
| 8 | `page_map` populated with entry count > 0 | ☐ PASS / ☐ FAIL — DEFER | Count: _______ |
| 8 | autoPrint fallback path exists | ☐ PASS / ☐ FAIL | |

**ACTIVATION STATUS:** ☐ NOT ACHIEVED — ☐ ACHIEVED WITH NOTES — ☐ FULLY ACHIEVED

---

## POST-ACTIVATION: WHAT COMES NEXT

Once the first PDF is confirmed on production, the following items complete the commercial publication experience. These are the next session's scope — not this one.

**Immediate next (same week):**
- Wire `getImageMetadata` into gallery upload if deferred in Step 4
- Add `data-contribution-id` attributes if `page_map` is empty (quick render route fix)
- Wire distribution button to `/api/publication/distribute` route

**Shortly after:**
- Collective Belonging Email test — confirm personalized page numbers reach contributors
- Legacy Room: add Publication Status section with download CTA (reads `publications.pdf_url`)
- Self-host fonts if Step 7 revealed fallback fonts

**Before first paid client:**
- Stripe webhook confirmed active (organiser pays → capsule unlocks → publication accessible)
- Moderation queue confirmed accessible on manage page
- One complete end-to-end with a real event — book → contribute → approve → publish → distribute

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*
*LC-PUBLICATION-ACTIVATION-001 · June 2026 · Confidential*
*Work through Steps 1–8 in order. Fill the Results Table as you go.*
*When all rows show PASS or ADDED: activation is achieved.*
