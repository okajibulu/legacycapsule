LEGACYCAPSULE
Every event. Preserved.
MVP Build Guide
Version 2.0  |  Valnex LDA  |  RevoWorldTech  |  Confidential
Next.js  ·  Supabase  ·  Shadcn/UI  ·  Leaflet  ·  Resend  ·  Vercel

This guide takes you from a blank project to a live, premium tribute page for a retirement event. It is the Phase 1 execution reference for LegacyCapsule. It covers the complete technical build — schema, RLS policies, Next.js setup, the tribute wall, submission form, moderation queue, world map, email system, and Vercel deployment. The build strategy is tiered: prove the core engine first, then logic, then polish. Nothing is built out of sequence.

Stack: Next.js with TypeScript  ·  Supabase  ·  Shadcn/UI  ·  Tailwind CSS  ·  Leaflet  ·  Nominatim geocoding  ·  Resend  ·  Vercel  ·  GitHub  ·  VS Code with Continue extension


SECTION 1  —  BUILD STRATEGY

1. Build Strategy


1.1  The Tiered Approach
Every build decision follows a strict tier sequence. No tier is started until the previous tier is solid. This is the guardrail that prevents the build from collapsing mid-way.

Tier	What it means — prove it before moving on
TIER 1 — Core engine	Write to database. Read from database. Display a dynamic list. Basic form submission completes. If ANY of these fail, diagnose and fix before touching anything else. This tier is the foundation. Everything else depends on it.
TIER 2 — Logic layer	Page state model. Filters by community_id and capsule_id. Moderation logic. Tribute status transitions. Email triggers. RLS policies with real auth.
TIER 3 — Polish	UI design refinements. Gold frame implementation. Animations. Layout tuning. Colour precision. This tier comes last, always.

Gold standard page rule
Build ONE page that works perfectly — data flows correctly, insert works, display works, filters work. Then duplicate and modify. Never build multiple pages simultaneously before the first one is proven.

End state architecture
Every schema decision in this guide is made with the full product in mind. Tables include columns that Phase 1 does not use — they are there so Phase 2 and Phase 3 never require a schema rewrite. Activate columns when their feature is built. Never rewrite what is already there.


SECTION 2  —  SUPABASE PROJECT SETUP

2. Supabase Project Setup


2.1  Project Creation
Go to supabase.com. Create a new project named legacycapsule. Choose a strong database password and store it securely. Select EU West region for Portugal-based operation. Wait for the project to provision fully before proceeding.

2.2  Authentication Settings
In the Supabase dashboard go to Authentication then Settings. Apply these settings:
•	Enable email provider — on
•	Confirm email — off during development. Turn on before going live with real users.
•	Minimum password length — 8

2.3  Database Schema — Full End-State Schema
Run each SQL block in the Supabase SQL Editor in sequence. Run one block, confirm it succeeds, then run the next. The schema is designed for the full LegacyCapsule product — Phase 1 uses a subset of columns and tables. Future phases activate what is already there rather than altering the schema.

Block 1 — Communities
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  community_type text not null default 'general',
  owner_user_id uuid,
  country text,
  city text,
  logo_url text,
  primary_color text default '#2D1B69',
  accent_color text default '#B8960C',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

Block 2 — Capsules
create table public.capsules (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id),
  slug text unique not null,
  module_type text not null default 'tribute',
  event_type text not null default 'retirement',
  page_state text not null default 'tribute_collection',
  honouree_name text not null,
  honouree_title text,
  holding_headline text,
  hero_image_url text,
  event_date date,
  event_end_date date,
  event_tag text,
  tribute_visibility text not null default 'open',
  submission_deadline timestamptz,
  theme text not null default 'classic',
  cover_style text not null default 'portrait',
  soundtrack_url text,
  is_password_protected boolean default false,
  family_section_code text,
  scheduled_upgrade_at timestamptz,
  owner_user_id uuid,
  reseller_code text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

Block 3 — Capsule Phases
create table public.capsule_phases (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id),
  community_id uuid references public.communities(id),
  name text not null,
  event_date date,
  location text,
  sort_order integer not null default 0,
  programme jsonb,
  capture_window_closes_at timestamptz,
  qr_token uuid default gen_random_uuid(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

Block 4 — Contributions (tributes, photos, audio, video)
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id),
  community_id uuid references public.communities(id),
  phase_id uuid references public.capsule_phases(id),
  contribution_type text not null default 'tribute',
  contributor_name text not null,
  city text,
  country text,
  lat numeric,
  lng numeric,
  relationship text,
  thumbnail_url text,
  tribute_text text,
  image_url text,
  audio_url text,
  video_url text,
  audio_transcript text,
  email text,
  is_anonymous boolean not null default false,
  is_dday boolean not null default false,
  is_guestbook boolean not null default false,
  is_legacy_question boolean not null default false,
  status text not null default 'pending_review',
  correction_note text,
  edit_token uuid default gen_random_uuid(),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

Block 5 — Gallery Items
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id),
  community_id uuid references public.communities(id),
  phase_id uuid references public.capsule_phases(id),
  image_url text,
  video_url text,
  caption text,
  sort_order integer not null default 0,
  source text not null default 'admin',
  approved boolean not null default false,
  uploaded_by_name text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

Block 6 — Guests
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id),
  community_id uuid references public.communities(id),
  name text not null,
  phone text,
  email text,
  tier text not null default 'general',
  invited_phases jsonb,
  access_code text unique default gen_random_uuid()::text,
  rsvp_status text not null default 'pending',
  dietary_requirements text,
  table_id uuid,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

Block 7 — Tables (seating)
create table public.event_tables (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id),
  community_id uuid references public.communities(id),
  name text not null,
  capacity integer not null default 10,
  tier_designation text,
  created_at timestamptz not null default now()
);

Block 8 — Attire Variants and Orders
create table public.attire_variants (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id),
  community_id uuid references public.communities(id),
  name text not null,
  description text,
  price_per_unit numeric,
  unit_type text default 'set',
  image_url text,
  sort_order integer default 0,
  cutoff_date date,
  created_at timestamptz not null default now()
);

create table public.attire_orders (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id),
  community_id uuid references public.communities(id),
  variant_id uuid references public.attire_variants(id),
  guest_name text not null,
  phone text,
  email text,
  quantity numeric not null,
  total_due numeric,
  amount_paid numeric not null default 0,
  custodian_name text,
  custodian_address text,
  custodian_phone text,
  delivery_type text default 'custodian',
  dispatch_cost numeric,
  status text not null default 'ordered',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.attire_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.attire_orders(id),
  amount numeric not null,
  payment_date date,
  reported_by text not null default 'organiser',
  proof_url text,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

Block 9 — Admin access, payments, geocoding cache
create table public.capsule_admins (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id),
  community_id uuid references public.communities(id),
  user_id uuid not null,
  role text not null default 'owner',
  module_access jsonb,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id),
  community_id uuid references public.communities(id),
  processor text not null,
  amount numeric not null,
  currency text not null,
  package_tier text,
  status text not null default 'pending',
  processor_ref text,
  reseller_code text,
  created_at timestamptz not null default now()
);

create table public.geocode_cache (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  country text not null,
  lat numeric not null,
  lng numeric not null,
  created_at timestamptz not null default now(),
  unique(city, country)
);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id),
  community_id uuid references public.communities(id),
  layout_config jsonb,
  theme text,
  cover_style text,
  generated_at timestamptz,
  pdf_url text,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

Block 10 — Indexes and updated_at trigger
-- Indexes
create index idx_contributions_capsule on public.contributions(capsule_id);
create index idx_contributions_status on public.contributions(status);
create index idx_contributions_community on public.contributions(community_id);
create index idx_capsules_slug on public.capsules(slug);
create index idx_capsules_community on public.capsules(community_id);
create index idx_guests_capsule on public.guests(capsule_id);
create index idx_attire_orders_capsule on public.attire_orders(capsule_id);
create index idx_gallery_capsule on public.gallery_items(capsule_id);

-- Updated_at trigger for contributions
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contributions_updated_at
  before update on public.contributions
  for each row execute procedure public.handle_updated_at();

Schema checkpoint
Verify all tables exist in the Supabase Table Editor before proceeding: communities, capsules, capsule_phases, contributions, gallery_items, guests, event_tables, attire_variants, attire_orders, attire_payments, capsule_admins, payments, geocode_cache, publications. If any are missing, rerun the relevant block.


SECTION 3  —  ROW LEVEL SECURITY

3. Row Level Security


RLS strategy
Phase 1 uses permissive policies that allow the build to proceed without authentication blocking. These are replaced with auth-based, community-scoped policies when the authentication system is built in Phase 2. The permissive policies are intentional and temporary. Every table has RLS enabled from day one so the replacement is a policy swap, not an architectural change.

3.1  Enable RLS on All Tables
alter table public.communities enable row level security;
alter table public.capsules enable row level security;
alter table public.capsule_phases enable row level security;
alter table public.contributions enable row level security;
alter table public.gallery_items enable row level security;
alter table public.guests enable row level security;
alter table public.event_tables enable row level security;
alter table public.attire_variants enable row level security;
alter table public.attire_orders enable row level security;
alter table public.attire_payments enable row level security;
alter table public.capsule_admins enable row level security;
alter table public.payments enable row level security;
alter table public.geocode_cache enable row level security;
alter table public.publications enable row level security;

3.2  Phase 1 Permissive Policies
These policies allow all operations during Phase 1 development. They are replaced in Phase 2 with auth-based policies.
-- Phase 1 permissive policies -- REPLACE IN PHASE 2
create policy "communities_open" on public.communities for all using (true) with check (true);
create policy "capsules_open" on public.capsules for all using (true) with check (true);
create policy "phases_open" on public.capsule_phases for all using (true) with check (true);
create policy "contributions_open" on public.contributions for all using (true) with check (true);
create policy "gallery_open" on public.gallery_items for all using (true) with check (true);
create policy "guests_open" on public.guests for all using (true) with check (true);
create policy "tables_open" on public.event_tables for all using (true) with check (true);
create policy "attire_variants_open" on public.attire_variants for all using (true) with check (true);
create policy "attire_orders_open" on public.attire_orders for all using (true) with check (true);
create policy "attire_payments_open" on public.attire_payments for all using (true) with check (true);
create policy "admins_open" on public.capsule_admins for all using (true) with check (true);
create policy "payments_open" on public.payments for all using (true) with check (true);
create policy "geocode_open" on public.geocode_cache for all using (true) with check (true);
create policy "publications_open" on public.publications for all using (true) with check (true);

3.3  Phase 2 RLS Policies — Replace Phase 1 Policies With These
When authentication is built, drop the permissive policies and apply these auth-based, community-scoped policies.
-- Drop permissive policies first
drop policy if exists "contributions_open" on public.contributions;
drop policy if exists "capsules_open" on public.capsules;

-- Public can read live capsules
create policy "capsules_public_read" on public.capsules for select
  using (page_state in ('tribute_collection','live') and deleted_at is null);

-- Authenticated users can insert capsules
create policy "capsules_auth_insert" on public.capsules for insert
  with check (auth.uid() is not null);

-- Capsule owners can update their capsules
create policy "capsules_owner_update" on public.capsules for update
  using (exists (
    select 1 from public.capsule_admins
    where capsule_id = capsules.id and user_id = auth.uid()
  ));

-- Anyone can submit a contribution
create policy "contributions_public_insert" on public.contributions for insert
  with check (true);

-- Public can only read approved contributions
create policy "contributions_public_read" on public.contributions for select
  using (status = 'approved' and deleted_at is null);

-- Admins can read ALL contributions for their capsule
create policy "contributions_admin_read" on public.contributions for select
  using (exists (
    select 1 from public.capsule_admins
    where capsule_id = contributions.capsule_id and user_id = auth.uid()
  ));

-- Admins can update contribution status
create policy "contributions_admin_update" on public.contributions for update
  using (exists (
    select 1 from public.capsule_admins
    where capsule_id = contributions.capsule_id and user_id = auth.uid()
  ));

-- Contributors can edit via their edit_token
create policy "contributions_edit_token" on public.contributions for update
  using (edit_token = (current_setting('app.edit_token', true))::uuid);

-- Geocode cache is publicly readable
create policy "geocode_public_read" on public.geocode_cache for select using (true);
create policy "geocode_auth_insert" on public.geocode_cache for insert
  with check (auth.uid() is not null);


SECTION 4  —  NEXT.JS PROJECT SETUP

4. Next.js Project Setup


4.1  Create the Project
npx create-next-app@latest legacycapsule --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd legacycapsule

4.2  Install Dependencies
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Shadcn/UI
npx shadcn@latest init
npx shadcn@latest add button input textarea card badge form label toast separator

# Leaflet
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet

# Email
npm install resend

# Form handling
npm install react-hook-form @hookform/resolvers zod

# Image compression
npm install browser-image-compression

4.3  Environment Variables — .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

4.4  Supabase Client Setup
Create src/lib/supabase/client.ts for browser-side access and src/lib/supabase/server.ts for server components. The server client uses cookies for session management. Both reference the same environment variables but serve different rendering contexts.

4.5  Design Tokens — globals.css
:root {
  --lc-purple: #2D1B69;
  --lc-purple-light: #EDE9FA;
  --lc-gold: #B8960C;
  --lc-gold-light: #FAF3DC;
  --lc-dark: #1C1C1E;
  --lc-mid: #5F5E5A;
  --lc-light: #F5F3EE;
  --lc-white: #FFFFFF;
}


SECTION 5  —  TIER 1 ENGINE TEST

5. Tier 1 — Prove the Core Engine


This step is mandatory
Before building the tribute page, prove that the stack can write to Supabase, read from Supabase, display a dynamic list, and handle a form submission. If any of these four fail, fix them here — not mid-tribute-page-build.

5.1  Seed Data — Run in SQL Editor
-- Create a test community
insert into public.communities (name, slug, community_type)
values ('LegacyCapsule Test', 'legacycapsule-test', 'general');

-- Create a test capsule linked to the community
insert into public.capsules (community_id, slug, honouree_name,
  page_state, event_type, event_tag)
select id, 'test-retirement', 'Dr. Adeyemi Okonkwo',
  'tribute_collection', 'retirement', 'Celebrating a Remarkable Journey'
from public.communities where slug = 'legacycapsule-test';

5.2  Engine Test Page
Create src/app/engine-test/page.tsx. This page has an input field, a submit button, and a list below. Type a name, submit, see it appear in the list immediately. This proves all four Tier 1 requirements. The page reads the community dynamically from the database — no hardcoded IDs. After Tier 1 is confirmed, delete this page.

Tier 1 pass criteria
Form submits without error. Data appears in Supabase Table Editor. Data appears in the list on the page. Refreshing the page shows the same data. Submitting multiple times works without duplicate errors. All four must pass before proceeding.


SECTION 6  —  TRIBUTE WALL PAGE

6. The Tribute Wall Page


6.1  Route Structure
src/app/
  capsule/
    [slug]/
      page.tsx           -- tribute wall (public)
      submit/page.tsx    -- submission form
      edit/[token]/page.tsx  -- contributor edit page
  admin/
    page.tsx             -- admin login
    dashboard/[slug]/page.tsx  -- moderation queue

6.2  Visual Design — Premium Tribute Wall
The tribute wall is the first thing every contributor sees. It must make an immediate impression. Every design element is intentional.

Zone	Design specification
Hero — top section	Full-width deep purple background (#2D1B69). Honouree photo centred, circular, with a substantial gold border — styled as a commemorative frame with inner shadow and depth, not a simple CSS border. Honouree name in large cream or white typography below the photo. Event tag in antique gold (#B8960C) with generous letter-spacing — e.g. C E L E B R A T I N G   A   R E M A R K A B L E   J O U R N E Y. Tapping the hero navigates to the honouree profile page.
Gold rule threshold	A single gold horizontal line separating the hero from the tribute wall. Acts as a visual threshold — you are now entering the space where voices gather.
Tribute cards	Warm ivory background (#F5F3EE). Subtle box shadow giving physical presence. Contributor name in deep charcoal, slightly bold. City and country in secondary colour, smaller. A small gold diamond mark separating location from date. Tribute text in generous body size — readable, like a letter. Thumbnail photo in small circular frame with gold border if provided. Generous padding throughout.
World map	Dark background Leaflet map with gold pins for contributor locations. Expands dynamically as tributes arrive from new countries. Sits below the tribute cards.
Brand footer	Powered by LegacyCapsule overlaid semi-transparently in gold across the map surface — not below it. The brand mark is part of the visual design of the map, not a footer afterthought.

6.3  Gold Frame Implementation
The circular photo frame is implemented as a CSS composition rather than a simple border. The container has a background gradient in gold tones. The image sits inside a circular clip. A box-shadow creates inner depth. For a more ornate effect, an SVG frame asset with subtle corner detail can be positioned over the container — designed once, used across all Capsules. On the streaming display at a live event, this frame at full projector resolution looks exceptional.

6.4  Data Fetching — Server Component
The tribute wall page is a Next.js server component. Community is loaded from the database by matching the capsule slug — no hardcoded IDs anywhere in the application. Approved contributions are fetched filtered by capsule_id and status equals approved. The page renders with all data available before reaching the client — no loading spinners on the tribute wall itself.

6.5  World Map — Leaflet Implementation
Dynamic import required — Leaflet cannot run server-side. Import the map component with ssr: false. The map zoom level is determined by contributor spread: single country maps to zoom 4, multiple countries in one region to zoom 3, intercontinental spread to zoom 2. Gold CircleMarker components for each contributor location. Tooltip shows contributor name and country on hover.
The brand overlay — Powered by LegacyCapsule — is positioned as an absolutely positioned element over the map container. Semi-transparent gold text. z-index above the map tiles but below interactive map controls. This placement means the brand mark appears within the visual experience of the map rather than as a separate element below it.


SECTION 7  —  SUBMISSION FORM & MODERATION

7. Submission Form and Moderation


7.1  Submission Form Fields
Field	Behaviour
Name	Required. Text input.
City	Required. Text input.
Country	Required. Text input Phase 1.
Relationship to honouree	Optional. Text input.
Thumbnail photo	Optional. Image only. Compressed client-side to under 1MB before upload using browser-image-compression before any network request.
Tribute text	Required. Minimum 20 characters. Maximum 1,000. Live character count displayed.
Email	Optional. Labelled: Leave your email to receive the Event Digital Publication when it is ready.

Preview step: before submitting the contributor sees their tribute exactly as it will appear on the wall. Message beneath the preview: Your tribute will be reviewed before appearing. Thank you for taking the time to share your words. Confirm to submit. Cancel to edit.

7.2  Geocoding
After submission, a Supabase edge function geocodes the city and country using the Nominatim API. Results are cached in the geocode_cache table — if the same city and country combination has been seen before, the cached coordinates are used immediately with no API call. The edge function includes a 1.1 second delay queue to respect Nominatim rate limits. If geocoding fails for any reason, the contribution still saves successfully — it simply does not appear on the map. The tribute wall is never blocked by a geocoding failure.

7.3  Tribute Status Model
Status	Meaning
pending_review	Newly submitted. Admin only. Awaiting moderation.
pending_correction	Admin requested a change. Contributor receives correction email with edit link.
approved	Visible on the public tribute wall. Contributor receives approval email.
declined	Removed silently. No contributor notification.

7.4  Moderation Actions and Correction Templates
Admin sees all contributions in the moderation queue with their full details. Four actions available: Approve — contribution goes live, contributor receives approval email. Request Correction — admin selects a template, fills one editable field, sends. Decline — silent removal. Leave — stays in queue for later.

Correction template	Editable field
Minor edit needed	Specify what needs changing.
Length adjustment	No editable field — standard message.
Clarity request	Specify what needs clarifying.
Photo quality	No editable field — standard message.

Maximum two correction requests per contribution before the system flags it for decline consideration. After the first correction cycle a flag appears in the admin interface on that contribution.


SECTION 8  —  EMAIL SYSTEM

8. Email System via Resend


Create a free account at resend.com. Add RESEND_API_KEY to .env.local and to Vercel environment variables. All emails are sent from noreply@legacycapsule.com. All emails carry LegacyCapsule branding. The service role key is used server-side for email triggers — never exposed to the client.

Email	Trigger and content
Submission confirmation	Sent when contribution submitted and email provided. Thank you, under review notice, edit link, publication opt-in offer, one-line marketing: Planning your own event? legacycapsule.com
Tribute approved	Sent when admin approves. Tribute is live, link to tribute wall, edit link with re-approval note, one-line marketing.
Correction request	Sent when admin selects Request Correction. Warm template opening, specific correction note, edit link, warm closing.
Opt-in thank you	Sent when contributor provides email specifically for the publication. What they will receive, when to expect it, LegacyCapsule lines, legacycapsule.com link.


SECTION 9  —  ADMIN PANEL

9. Admin Panel


The Phase 1 admin panel is a protected page at /admin/dashboard/[slug]. Protection in Phase 1 is a simple environment variable password — a query parameter or local storage check. Full Supabase authentication with session management is implemented in Phase 2 as part of the authentication sprint.

9.1  Moderation Queue
Shows all contributions for the capsule filtered by status. Default view: pending_review contributions sorted by submission date. Filter tabs for each status — pending_review, pending_correction, approved, declined. Each contribution shows full details: contributor name, city, country, relationship, thumbnail if provided, tribute text, submission date, and status. The four moderation actions are accessible from each contribution row.

9.2  Capsule Settings — Phase 1 Scope
The admin can update: holding headline for the tribute collection state, event tag, submission deadline, and tribute visibility mode — surprise or open. Full capsule settings panel expands in Phase 2 with the complete Capsule Control Panel.


SECTION 10  —  DEPLOYMENT

10. Deployment on Vercel


1.	Push the project to GitHub. Every working milestone gets a named commit before pushing.
2.	Go to vercel.com. Create a free account. Click Add New Project. Import the GitHub repository.
3.	In the Environment Variables section, add every variable from .env.local. Every variable must be added — Vercel does not read the local file.
4.	Click Deploy. Vercel builds and deploys automatically. The tribute page is live at your-project.vercel.app/capsule/test-retirement.
5.	Add the custom domain legacycapsule.com in the Vercel project settings under Domains. Vercel handles SSL automatically.

Production test rule
Before sharing the live URL with any real contributor, test the complete submission flow on the Vercel production URL — not localhost. Some behaviour differs between local and production, particularly around cookies and environment variables. Fix any production issues before sharing.


SECTION 11  —  BUILD SEQUENCE & SNAPSHOTS

11. Build Sequence and Git Snapshots


11.1  Build Sequence
6.	Supabase project created. Full schema deployed. All tables verified.
7.	Phase 1 permissive RLS policies applied. Confirmed all tables accessible.
8.	Seed data inserted — test community and test capsule.
9.	Next.js project created. All dependencies installed. Environment variables configured.
10.	Supabase client files created. Connection tested.
11.	Design tokens applied to globals.css.
12.	Tier 1 engine test page built and all four requirements verified. Page deleted.
13.	Tribute wall page built — server component, community loaded from database, hero with gold frame, tribute cards, world map with brand overlay.
14.	Submission form built — validation, preview step, geocoding edge function.
15.	Admin panel built — moderation queue, four moderation actions, correction templates.
16.	Email system connected — confirmation, approval, correction emails tested.
17.	Full end-to-end flow tested on Vercel production URL.
18.	Custom domain connected. SSL confirmed active.

11.2  Git Snapshot Names
Milestone	Commit message
Schema deployed and verified	feat: full end-state schema deployed — all tables verified
Tier 1 engine proven	feat: tier1 engine proven — write read display form all passing
Tribute wall rendering	feat: tribute wall rendering with gold frame hero and community data
Submission form complete	feat: submission form with validation preview and geocoding
Map rendering with pins	feat: leaflet map with gold pins and legacycapsule brand overlay
Moderation queue working	feat: admin moderation queue with all four actions and templates
Emails sending on Vercel	feat: resend email confirmed sending on vercel production
Full flow on production	feat: complete tribute flow tested and live on legacycapsule.com


SECTION 12  —  NEXT BUILD STEPS AFTER MVP

12. After MVP is Live


Once the tribute page is live and tested on production with real contributors, the next build steps proceed in this priority order. No step begins until the previous one is validated on production.

Next step	Phase
WhatsApp share button — wa.me deep link with pre-filled message	Phase 1 — immediate
Honouree profile page with progressive section activation	Phase 1 — after share button
Supabase authentication — email and password, session management	Phase 2 — first sprint
Replace permissive RLS with auth-based community-scoped policies	Phase 2 — immediately after auth
Community switching UI — multi-community support	Phase 2
Stripe payment integration — package booking flow	Phase 1.5
Tribute metadata expansion — audio, video uploads to Cloudflare R2	Phase 2
Multi-phase event support	Phase 2
Save the Date and guest management	Phase 2
Fabric and attire coordination	Phase 2
Table management, seating, and table card generation	Phase 2
Physical access code system and usher interface	Phase 2
Publication editor and Event Digital Publication generation	Phase 3
Animated marketing map on landing page	Phase 2 — after core application works
PWA configuration for home screen installation	Phase 2

This document is the single authoritative source for LegacyCapsule.
All build and business decisions are measured against this specification.
Valnex LDA  |  RevoWorldTech  |  LegacyCapsule  |  Confidential
