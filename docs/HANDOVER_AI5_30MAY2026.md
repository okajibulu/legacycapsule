# HANDOVER DOCUMENT — AI5 (Claude) Session
## LegacyCapsule · 30 May 2026
## For: Incoming AI — continuation of build from v1.2.5

---

## ═══════════════════════════════════════════════
## SECTION 1 — MANDATORY FIRST ACTIONS
## ═══════════════════════════════════════════════

Before touching any file or writing any code, incoming AI must:

1. Read `COMPONENT_MAP.md` in the project root — this is the master file map
2. Read `PROJECT_RULES.md` in the project root — absolute rules, never violate
3. Read this handover document fully
4. Ask the founder to confirm the top priority task
5. Request the specific files listed in COMPONENT_MAP.md for that task — do not ask for the whole codebase
6. Confirm understanding before producing any file

**Never produce code before the founder confirms direction.**
**Never rewrite a file you haven't read in this session.**
**Always state which AI last touched a file before editing it.**

---

## ═══════════════════════════════════════════════
## SECTION 2 — WHO WE ARE AND WHAT WE'VE BUILT
## ═══════════════════════════════════════════════

### The Product
LegacyCapsule (itslegacycapsule.com) is a premium event remembrance platform. Organisers create a capsule for a milestone event (retirement, memorial, wedding, birthday, chieftaincy etc). Guests leave text, photo, audio, and video tributes. The platform compiles them into a digital publication sent to all contributors.

### The Company
VALNEX, UNIPESSOAL LDA · RevoWorldTech · Portugal

### The Founder
Olugbenga Ajibulu — coordinates all AI sessions, executes code placements, manages Git

### The Dual-AI Workflow
- **Claude (AI5)** — heavy architecture, new features, DB schema, API routes, complex logic
- **ChatGPT** — UX finetuning, copy refinement, visual polish, Tailwind CSS tweaks

This workflow is deliberate. Each AI operates in its strength zone. Neither AI should overwrite the other's work without reading the current file state first. The COMPONENT_MAP.md tracks who last touched what.

### Stack
- Next.js 16.2.6 (Turbopack)
- TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + Storage + Auth)
- Resend (email)
- Vercel (Hobby plan)
- Node.js 20.x (NOT 24.x — breaks dynamic routes)

### Repo
`okajibulu/legacycapsule` on GitHub
- `main` → Vercel auto-deploy (live at itslegacycapsule.com)
- `develop` → staging

---

## ═══════════════════════════════════════════════
## SECTION 3 — CURRENT BUILD STATE (v1.2.5)
## ═══════════════════════════════════════════════

### What is live and working

**Booking flow** (`/book`)
- 5-screen flow: path chooser → event type → details → verify code → confirmation
- Free capsule creation — no payment required to go live
- Email verification with 4-char code
- `page_state: 'active'` on creation (fixed from invalid `tribute_collection` in v1.2.5)
- `owner_user_id` now written at verification (Strategy B) and at signin (Strategy C)

**Tribute Wall** (`/for/[slug]`)
- Full tribute submission (text, photo, audio, video)
- Audio/Video premium gated — shows unlock notice if not activated
- Emoji reactions on tributes (❤️🙏✦😢👏🕊️)
- Copy Link | ✦ Leave a Tribute | Share Link button row
- Pending tributes visible to submitter (email match)
- Admin approve/delete (organiser email match)
- 60-second polling for new tributes
- World Tribute Map with geocoded pins (Leaflet, dynamic import)
- Profile summary sections preview
- Expression of Honour section (3-zone, gold plaque aesthetic)
- Family Rep tribute responses (shown inline on tribute cards)

**Profile Page** (`/for/[slug]/profile`)
- Biography, timeline, achievements, quote, message sections
- 6-line text clamp with read more/show less (SectionTextClamp)
- Emoji reactions per section (SectionReactions)
- Featured photos grid with lightbox
- Gallery sections (up to 5, editable names, up to 10 photos each)
- Gallery lightbox with click-to-expand + comments
- Expression of Honour — Zone A ceremonial header + WaysToHonourCard
- Timeline/milestones
- Always visible (even with no content)

**Manage Dashboard** (`/manage/[slug]`)
- Tabs: Overview, Tributes, Profile, Gallery, Settings
- Overview: capsule stats + Capsule Services table (free/locked/coming soon)
- Tributes: moderation (approve/delete)
- Profile: section editor, featured photos uploader, hero position picker
- Gallery: GalleryEditor (5 sections, editable titles, 10 photos/section)
- Settings: capsule details, event details, visual style, family rep, transfer ownership, tribute notifications, Expression of Honour, delete account, upgrade form

**Family Rep Portal** (`/for/[slug]/honouree?token=`)
- Token-gated private view
- 3 tabs: Tributes (read + respond), Ways to Honour, Acknowledgements
- Respond to individual tributes — email sent to contributor
- Acknowledgements tab explained clearly
- Token sent from Settings → Family Representative → Send Portal Access Link

**Dashboard** (`/dashboard`)
- Your Capsules list
- Pending tribute count badge per capsule
- Days to event countdown

**LCAdmin** (`admin.revoworldtech.uk`)
- 10 screens: login, dashboard, capsules, capsule detail, clients, transactions, moderation, resellers, content editor, pricing zones
- ComponentsPanel — toggle premium features per capsule (no SQL needed)
- Auth: LCADMIN_PASSWORD env var, 8hr session cookie

**Tribute Notifications** (cron)
- Hourly cron (Vercel Hobby limit)
- Per-capsule frequency: 20min / 1hr / 6hr / 24hr (respected internally)
- Auto-terminates: event_date+30 days or created_at+120 days
- Organiser opts in via Settings → Tribute Notifications

**Expression of Honour (Ways to Honour)**
- User-facing: "Expression of Honour" everywhere
- Internal: `ways_to_honour`, `capsule_support_accounts`, `support_acknowledgements` — NEVER renamed
- 3-zone layout: ceremonial header + beneficiary cards + notify form
- Correct DB field names: `method_label`, `account_holder`, `reference_guide`, `is_active`
- Notify Beneficiary → saves to `support_acknowledgements` → fires thank-you email via `/api/honouree/acknowledgement`
- Activated via SQL or LCAdmin ComponentsPanel

**Gallery comments** (v1.2.5 — newly built, not yet confirmed deployed)
- Anyone can comment on gallery photos (name + text)
- Comments load in lightbox modal
- API: `GET/POST /api/gallery/comment`
- Table: `gallery_photo_comments`

**Ownership Transfer**
- Settings tab → Transfer Ownership
- Two after-role options: Family Representative or No further role
- Type TRANSFER to confirm
- Emails sent to both old and new organiser
- If Family Rep chosen: portal token auto-generated + invite email sent

**Account Deletion**
- Settings tab → Danger Zone
- Type DELETE to confirm
- Soft-deletes all capsules, removes profile, deletes Supabase Auth user
- GDPR-compliant

---

## ═══════════════════════════════════════════════
## SECTION 4 — PENDING ITEMS (priority order)
## ═══════════════════════════════════════════════

### HIGH — Do these next

**1. Featured photos limit → 15**
The limit is enforced somewhere in the manage dashboard uploader (not yet located in this session). Search manage page for featured photos insert logic or a MAX constant. Change limit from current value to 15. Simple constant change — but file must be found first.

**2. Expression of Honour — account details editable after set**
Task 7 from LC-TASK-EOH-001. Once organiser sets bank account details, they should be able to edit them. Currently the form saves and the fields disappear. Need an edit mode on `WaysToHonourSection` manage dashboard form.

**3. SQL deployment — v1.2.5**
Run `eoh-sql.sql` in Supabase if not already done:
- Adds `relationship_to_honouree` to `capsule_support_accounts`
- Adds `section_title` to `capsule_gallery`
- Creates `gallery_photo_comments` table with RLS

**4. Paystack payment integration**
`PaymentService.ts` exists in `lib/payments/`. Stripe scaffold also exists. Paystack is the priority for Nigerian market. Needs:
- Paystack checkout wired into booking Screen 3 (paid path)
- Webhook to activate capsule `page_state` and write `components` on payment confirmed
- LCAdmin transactions screen to reflect payments

### MEDIUM — After HIGH items

**5. Americas cut off on TributeMap**
The Leaflet world map cuts off the western hemisphere. Fix the centre coordinates and bounds in `components/TributeMap.tsx`.

**6. Relationship field on Expression of Honour accounts**
`relationship_to_honouree` column added in v1.2.5 SQL. The manage dashboard form for adding Expression of Honour accounts needs a field for this. The trust statement ("This account belongs to X, spouse of Y") will auto-generate from it.

**7. Trust statement display**
`WaysToHonourSection.tsx` has `getTrustStatement()` built. But `WaysToHonourCard.tsx` (profile page) does not show the trust statement yet. It needs `relationship_to_honouree` fetched and displayed.

**8. Gallery section titles on profile page**
Profile page reads `section_title` from DB (added v1.2.5). But the fetch query in `app/for/[slug]/profile/page.tsx` needs to confirm it selects `section_title` from `capsule_gallery`. Verify this is in the select statement.

**9. Guest comments moderation**
`gallery_photo_comments` are currently public with no moderation. Admin/organiser needs ability to delete comments. A simple delete endpoint + button in the manage dashboard gallery tab.

**10. Publication engine**
Built but not activated. Needs end-to-end wiring with payment trigger.

### LOW — Backlog

- admin.revoworldtech.uk DNS (CNAME to cname.vercel-dns.com)
- About page real copy
- Examples page real demo slugs
- Anniversary recall email (1 year after event)
- Group Commission feature (Phase 3)

---

## ═══════════════════════════════════════════════
## SECTION 5 — CRITICAL RULES (DO NOT VIOLATE)
## ═══════════════════════════════════════════════

These have caused real problems before. Every single one applies today.

**Code quality:**
- Never chain `.catch()` on Supabase query builders — always `try/catch`
- Never use duplicate property names in style objects — TypeScript will error
- Never put `useEffect` inside another `useEffect`
- Never call `localStorage` during server-side rendering — guard with `typeof window !== 'undefined'`

**Database:**
- `contributor_name` NOT `name` on contributions table
- `tribute_text` NOT `content` on contributions table
- `page_state: 'active'` — never use `tribute_collection`
- `method_label`, `account_holder`, `reference_guide`, `is_active` on `capsule_support_accounts`
- `supporter_name`, `supporter_email` on `support_acknowledgements`
- `honouree_email` NOT NULL on `honouree_portal_tokens` — always provide on insert

**Architecture:**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components
- Never import Resend or email functions into client components — use API routes
- Never create files in `src/` — use root-level `app/`, `components/`, `lib/`
- `TributeMap` MUST be dynamically imported with `ssr: false`
- No blanket `createClient()` refactoring — file by file only

**Next.js 16:**
- Server component dynamic routes: `params: Promise<{ slug: string }>` then `const { slug } = await params`
- `searchParams` is also a Promise in Next.js 15+

**Terminology:**
- "Expression of Honour" — user-facing
- `ways_to_honour`, `WaysToHonourSection`, `capsule_support_accounts`, `support_acknowledgements` — internal, never rename
- "Honouree" — internal only, never in public UI

**Pricing:**
- Never hardcode prices — always from `lc_pricing` Supabase table
- Never hardcode tier names — always from `lc_content` table
- Single currency per user by IP — never dual currency on same screen

**Cron jobs:**
- All crons MUST have auto-termination logic
- Vercel Hobby plan: max once per hour (`0 * * * *`)

**Git:**
- Always work on `main` for production deploys
- Confirm `git branch` shows `* main` before pushing
- `git add .` then `git commit` then `git push origin main`
- Never commit before copying files into VS Code project folder

---

## ═══════════════════════════════════════════════
## SECTION 6 — HOW THE FOUNDER WORKS
## ═══════════════════════════════════════════════

This is essential to understand for a smooth working relationship.

**The founder:**
- Coordinates between Claude and ChatGPT
- Executes file placements manually (downloads from Claude outputs, pastes into VS Code)
- Runs `npm run build` to catch errors before pushing
- Pushes to Git when ready — not immediately after every output
- Uses Windows PowerShell (use `;` not `&&` to chain commands)

**What the founder expects from Claude:**
- **Recommend first, build second** — never jump to code without founder confirmation
- **Read files before editing** — always ask for or read the current file before modifying
- **One question at a time** — never ask multiple questions in one message if one blocks the other
- **File paths at top of every script** — `// → app/for/[slug]/page.tsx` at line 1
- **Surgical edits over rewrites** — change only what needs changing
- **No premature git commands** — only provide git commands when asked or when a logical batch is complete
- **Model recommendations** — state which Claude model to use at start of complex tasks (Opus 4.5 for architecture, Sonnet 4.6 for fixes)
- **Cooperative mindset** — work with ChatGPT's outputs, not against them

**What frustrates the founder (avoid these):**
- Jumping to code before deliberation is complete
- Producing a file without reading the current version first
- Running ahead when the founder is still thinking
- Issuing git commands after every single fix
- Rewriting a whole file when one line needed changing
- Not checking COMPONENT_MAP.md before starting

---

## ═══════════════════════════════════════════════
## SECTION 7 — KEY FILE LOCATIONS QUICK REFERENCE
## ═══════════════════════════════════════════════

```
app/
  book/page.tsx                         — Booking flow (5 screens)
  dashboard/page.tsx                    — Your Capsules list
  for/
    layout.tsx                          — Isolates /for/ from root layout
    [slug]/
      page.tsx                          — Tribute wall server component
      profile/page.tsx                  — Profile page
      honouree/
        page.tsx                        — Family Rep portal server
        HonoureePortalClient.tsx        — Family Rep portal client
      submit/page.tsx                   — Tribute submission form
      edit/[token]/page.tsx             — Contributor edit form
  manage/[slug]/page.tsx                — Organiser dashboard
  admin/
    capsule/[id]/
      page.tsx                          — LCAdmin capsule detail
      ComponentsPanel.tsx               — Premium feature toggles
      CapsuleActions.tsx                — Activate/suspend/extend
  api/
    auth/verify-signin/route.ts         — Sign-in code validation + session
    email/verify-code/route.ts          — Booking verification code
    capsule/transfer/route.ts           — Ownership transfer
    account/delete/route.ts             — Account deletion
    rep/invite/route.ts                 — Family Rep portal invite
    rep/respond/route.ts                — Family Rep tribute response
    honouree/acknowledgement/route.ts   — Expression of Honour notify
    tribute/react/route.ts              — Emoji reactions on tributes
    section/react/route.ts              — Emoji reactions on sections
    gallery/comment/route.ts            — Gallery photo comments
    admin/capsule/components/route.ts   — Toggle premium components
    cron/notify-pending/route.ts        — Batched tribute notifications
    geocode/route.ts                    — City/country to lat/lng
    regional-prices/route.ts           — IP to regional price

components/
  TributeWallClient.tsx                 — ALL tribute wall UI + logic
  WaysToHonourSection.tsx               — Expression of Honour (tribute wall)
  honouree/WaysToHonourCard.tsx         — Expression of Honour (profile page)
  GalleryEditor.tsx                     — Gallery editor (manage dashboard)
  GalleryLightbox.tsx                   — Click-to-expand photo + comments
  SectionTextClamp.tsx                  — 6-line clamp + read more
  SectionReactions.tsx                  — Emoji reactions on profile sections
  HonoureePortalClient.tsx              — (moved to app/for/[slug]/honouree/)
  TributeMap.tsx                        — Leaflet world map (ssr:false always)
  AudioTribute.tsx                      — Audio recorder (premium)
  VideoTribute.tsx                      — Video uploader (premium)
  HeroPositionPicker.tsx                — Hero image position control
  LogoCapsule.tsx                       — LC logo component
  AnimatedWorldMap.tsx                  — Decorative animated map
  layout/
    NavigationWrapper.tsx               — Hides nav on /for/ /manage/ etc
    FooterWrapper.tsx                   — Hides footer on /for/ /manage/ etc
    Navigation.tsx                      — Site navigation
    Footer.tsx                          — Site footer

lib/
  themeConfig.ts                        — resolveTheme() + getThemeConfig()
  eventLabels.ts                        — All public event copy/labels
  email.ts                              — sendKeepsakeCard, sendOrganiserWelcome
  honoureeEmail.ts                      — sendSupportThankYou
  supabase-browser.ts                   — Browser Supabase client
  admin/auth.ts                         — isAdminAuthenticated()
  admin/actions.ts                      — getCapsuleById()
  payments/regionDetector.ts            — IP → zone key
  payments/priceFetcher.ts              — zone + key → RegionalPrice
  tributeWallHelpers.ts                 — COUNTRIES, formatTributeDate, getInitials
  imageUtils.ts                         — Image compression
  mapCities.ts                          — City → lat/lng lookup
```

---

## ═══════════════════════════════════════════════
## SECTION 8 — SQL CHANGES PENDING DEPLOYMENT
## ═══════════════════════════════════════════════

The following SQL must be run in Supabase if not already applied. File: `eoh-sql.sql` (in outputs from this session).

```sql
-- Expression of Honour — relationship field
ALTER TABLE capsule_support_accounts
ADD COLUMN IF NOT EXISTS relationship_to_honouree text DEFAULT NULL;

-- Gallery section titles
ALTER TABLE capsule_gallery
ADD COLUMN IF NOT EXISTS section_title text DEFAULT NULL;

-- Gallery photo comments
CREATE TABLE IF NOT EXISTS gallery_photo_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL,
  capsule_id uuid NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
  commenter_name text NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

ALTER TABLE gallery_photo_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read gallery comments"
  ON gallery_photo_comments FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Anyone can insert gallery comments"
  ON gallery_photo_comments FOR INSERT WITH CHECK (true);
```

---

## ═══════════════════════════════════════════════
## SECTION 9 — FILES PRODUCED THIS SESSION
## ═══════════════════════════════════════════════

All files in outputs folder. Deploy in this order:

### SQL (run in Supabase first)
| File | Action |
|---|---|
| `eoh-sql.sql` | Run in Supabase SQL editor |

### New components (create new files)
| File | Destination |
|---|---|
| `SectionTextClamp.tsx` | `components/SectionTextClamp.tsx` |
| `GalleryLightbox.tsx` | `components/GalleryLightbox.tsx` |
| `gallery-comments-route.ts` | `app/api/gallery/comment/route.ts` |

### Updated components (replace existing)
| File | Destination |
|---|---|
| `WaysToHonourSection.tsx` | `components/WaysToHonourSection.tsx` |
| `WaysToHonourCard.tsx` | `components/honouree/WaysToHonourCard.tsx` |
| `GalleryEditor.tsx` | `components/GalleryEditor.tsx` |
| `profile-page.tsx` | `app/for/[slug]/profile/page.tsx` |
| `auth-verify-signin-route.ts` | `app/api/auth/verify-signin/route.ts` |
| `book-page.tsx` | `app/book/page.tsx` |

### Documentation (place in project root)
| File | Destination |
|---|---|
| `COMPONENT_MAP.md` | `COMPONENT_MAP.md` (project root) |
| `HANDOVER_AI5_30MAY2026.md` | `HANDOVER_AI5_30MAY2026.md` (project root) |

---

## ═══════════════════════════════════════════════
## SECTION 10 — RECOMMENDED FIRST ACTIONS FOR INCOMING AI
## ═══════════════════════════════════════════════

1. Confirm with founder: is `eoh-sql.sql` applied in Supabase yet?
2. Confirm with founder: is v1.2.5 committed and deployed to Vercel?
3. Run validation query to check owner_user_id progress:
   ```sql
   SELECT count(*) total, count(owner_user_id) with_owner FROM capsules;
   ```
4. Ask founder for top priority from Section 4 pending items
5. Request only the specific files needed for that task — not the whole codebase
6. Read COMPONENT_MAP.md before any file edit

---

## ═══════════════════════════════════════════════
## SECTION 11 — MODEL GUIDANCE
## ═══════════════════════════════════════════════

| Task | Model |
|---|---|
| New feature architecture, multi-file builds, DB schema | Claude Opus 4.5 |
| Bug fixes, single file edits, SQL, git commands | Claude Sonnet 4.6 |
| Deliberation, planning, analysis | Claude Sonnet 4.6 |
| UX polish, copy, Tailwind CSS | ChatGPT |

Always state the model recommendation at the start of a build task.
Downgrade to Sonnet as soon as the heavy lifting is done.

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*
*HANDOVER_AI5_30MAY2026.md — Prepared by Claude AI5*
*Session ended: 30 May 2026 · v1.2.5*
*Next session begins here.*
