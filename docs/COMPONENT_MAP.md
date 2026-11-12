# COMPONENT_MAP.md

# LegacyCapsule — Master Component & Implementation Map

---

FILE PATH

/docs/COMPONENT_MAP.md

DOCUMENT OWNER

Founder (CG01)

STATUS

Active

VERSION

v2.0

CREATED

30 May 2026

LAST UPDATED

26 June 2026

DEPENDS ON

START_HERE.md

PROJECT_RULES.md

CURRENT_STATE.md

LC00–LC10 Architecture Library

DOCUMENT PURPOSE

This document is the authoritative implementation inventory for LegacyCapsule.

It records where every significant platform capability is implemented.

It enables AI systems and contributors to quickly locate components, understand ownership, and safely modify the correct files without unnecessary exploration.

It does not define architecture.

Architecture belongs exclusively to the LC00–LC10 Architecture Library.

---

# COMPONENT MAP PRINCIPLE

This document inventories implementation.

It records:

• Pages

• Components

• API Routes

• Database Structures

• Shared Libraries

• Runtime Services

• File Ownership

• Implementation Status

It does NOT define:

• Product Architecture

• Business Rules

• Roadmaps

• Feature Specifications

Those belong exclusively to the Architecture Library.

Where conflicts exist:

1. Architecture Library
2. Governance Documents
3. Component Map
4. Existing Implementation

The higher authority always prevails.

---

# WHY THIS DOCUMENT EXISTS

LegacyCapsule has grown into a large multi-engine platform.

Multiple AI systems now contribute to the implementation.

Without a controlled implementation inventory, AI systems would:

• duplicate components

• overwrite existing work

• modify incorrect files

• create conflicting implementations

The Component Map eliminates implementation archaeology.

Every implementation task begins here.

---

# WHO USES THIS DOCUMENT

Founder (CG01)

Before assigning implementation work.

ChatGPT (CG03)

Architecture governance

Implementation review

Cross-document consistency

Claude

Feature implementation

Database work

Refactoring

Testing

VS Code / Local AI Agents

Bug fixes

Local implementation

Verification

Every new AI joining the project

Mandatory reading before modifying the codebase.

---

# IMPLEMENTATION RULE

No file may be:

• Created

• Deleted

• Renamed

• Moved

• Significantly modified

without updating this document.

If no Component Map changes are required, the implementation report must explicitly state:

Component Map Impact

None.

---

# BEFORE MODIFYING ANY FILE

Every AI must:

1.

Read this document.

2.

Locate the target file.

3.

Determine who last modified it.

4.

Read the latest implementation.

5.

Determine the governing Architecture document.

6.

Modify only the required areas.

Never rewrite functioning implementation without Founder approval.

Preference is always given to architectural convergence rather than replacement.

---

# AFTER EVERY IMPLEMENTATION

Every implementation report shall contain:

Implementation Summary

Files Added

Files Modified

Database Changes

API Changes

Architecture Reference

Component Map Impact

Convergence Report

Implementation Log Entry

---

# COMPONENT STATUS LEVELS

Level 0

Planned

Level 1

Created

Level 2

Partially Implemented

Level 3

Architecturally Aligned

Level 4

Launch Ready

Level 5

Production Proven

---

# COMPONENT ENTRY STANDARD

Every significant component should eventually include:

Component

Purpose

File Path

Architecture Reference

Dependencies

Used By

Owner

Status

Last Updated

Version

Reviewed By

---

# IMPLEMENTATION HISTORY

Every major implementation should conclude with:

Date

AI

Model

Files Modified

Architecture Reference

Component Map Updated

Reviewed By

Status

This provides a permanent audit trail throughout the lifetime of the platform.

---
## API Routes Inventory

### Open Graph Dynamic Cover Engine
* **File Path:** `app/api/og/[slug]/route.tsx`
* **Governing Architecture:** `docs/specifications/OG02_COVER_SYSTEM.md`
* **Current Maturity:** Level 3 (Architecturally Aligned)
* **Description:** Edge-runtime canvas rendering endpoint using Satori to dynamically generate high-gloss Publication Covers and Hero Covers for capsules based on regional and plan feature flags.
* **Authorship History:**
  - *Original Draft:* CG01 (Founder) — 26 June 2026
  - *Refactor & Edge Alignment:* Worker GM01 — 04 July 2026
| Date | Version | Worker ID | Action / Scope | Status |
| :--- | :--- | :--- | :--- | :--- |
| 04 July 2026 | v2.1 | GM01 | Registered `app/api/og/[slug]/route.tsx` in API Routes; upgraded maturity to Level 3. | Completed |
---

# PLATFORM INFRASTRUCTURE

This section documents the runtime environment required for LegacyCapsule.

It serves as the implementation reference for deployment, infrastructure, storage, databases and runtime services.

---

# PLATFORM STACK

| Item | Value |
|------|-------|
| Product | LegacyCapsule |
| Organisation | VALNEX, UNIPESSOAL LDA |
| Ecosystem | RevoWorldTech |
| Live Domain | itslegacycapsule.com |
| Admin Domain | admin.revoworldtech.uk |
| Hosting | Vercel |
| Database | Supabase |
| Email Provider | Resend |
| Frontend | Next.js + React |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |

---

# DEPLOYMENT

| Item | Value |
|------|-------|
| Production Branch | main |
| Staging Branch | develop |
| Deployment | Automatic via Vercel |
| Recommended Node Version | 20.x |
| Next.js | 16.x |

Node 24.x should not be used until confirmed compatible.

---

# EXTERNAL SERVICES

| Service | Purpose | Architecture |
|----------|----------|--------------|
| Supabase | Database, Authentication, Storage | LC08 |
| Resend | Transactional Email | LC04 |
| Stripe | Payments | LC04 |
| Vercel | Hosting | LC01 |

Future ecosystem services should be added here only after becoming production dependencies.

---

# STORAGE

| Bucket | Access | Purpose | Architecture |
|---------|--------|----------|--------------|
| tribute-photos | Public | Tribute photos and gallery media | LC03 |
| capsule-publications | Private | Generated publications | LC03 |

Storage buckets should contain files only.

Business state belongs in the database.

---

# ENVIRONMENT VARIABLES

Environment variables are managed through Vercel.

They should never be hardcoded.

## Public Variables

| Variable | Purpose |
|----------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Client Authentication |
| NEXT_PUBLIC_APP_URL | Public Application URL |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe Client |

---

## Server Variables

| Variable | Purpose |
|----------|----------|
| SUPABASE_SERVICE_ROLE_KEY | Administrative database access |
| RESEND_API_KEY | Transactional email |
| STRIPE_SECRET_KEY | Payment processing |
| STRIPE_WEBHOOK_SECRET | Webhook validation |
| LCADMIN_PASSWORD | Administration |
| LCADMIN_SESSION_SECRET | Session security |
| CRON_SECRET | Cron endpoint protection |

Server variables must never be exposed to client-side code.

---

# DATABASE GOVERNANCE

Database ownership is defined by LC08.

This document records implementation only.

Business ownership must not be duplicated here.

---

# DATABASE IMPLEMENTATION NOTES

## Contributions

Critical implementation fields:

- contributor_name
- tribute_text
- thumbnail_url
- lat
- lng
- email
- status

---

## Capsules

Critical implementation fields:

- page_state
- tier
- components
- owner_user_id
- notification_frequency
- organiser_last_notified_at

---

## Expression of Honour

Tables

- capsule_support_accounts

- support_acknowledgements

Architecture Reference

LC02

---

## Gallery

Tables

- capsule_gallery

- gallery_photo_comments

Architecture Reference

LC03

---

## Family Representative

Tables

- honouree_portal_tokens

- tribute_responses

Architecture Reference

LC02

---

# IMPLEMENTATION RULES

Never rename database fields without Founder approval.

Never duplicate business ownership across tables.

Never introduce architectural decisions into migration files.

Database implementation must always follow LC08 Data Architecture.

---

---
# IMPLEMENTATION INVENTORY

This section maps every major runtime component to its implementation location.

Every implementation component should reference the architecture document that governs it.

---

# PAGE ROUTES

## Public Experience

| Route | File | Purpose | Architecture | Status |
|--------|------|----------|--------------|--------|
| / | app/page.tsx | Landing Page | LC01 | L3 |
| /book | app/book/page.tsx | Capsule Booking | LC04 | L3 |
| /pricing | app/pricing/page.tsx | Commercial Pricing | LC04 | L3 |
| /help | app/help/page.tsx | Help Centre | LC01 | L2 |
| /examples | app/examples/page.tsx | Inspiration Gallery | LC03 | L2 |
| /how-it-works | app/how-it-works/page.tsx | Platform Introduction | LC01 | L2 |

---

## Capsule Experience

| Route | File | Purpose | Architecture | Status |
|--------|------|----------|--------------|--------|
| /for/[slug] | Tribute Wall | LC02 LC03 | L3 |
| /for/[slug]/profile | Event Profile | LC03 | L3 |
| /for/[slug]/submit | Tribute Submission | LC02 | L3 |
| /for/[slug]/story | Event Story | LC02 | L2 |
| /for/[slug]/legacy | Legacy Room | LC05 LC06 | L2 |
| /for/[slug]/honouree | Family Representative Portal | LC02 | L3 |

---

## Organiser Experience

| Route | Purpose | Architecture | Status |
|--------|----------|--------------|--------|
| /manage/[slug] | Event Management Dashboard | LC02 | L3 |
| /manage/[slug]/publication | Publication Studio | LC03 | L2 |

---

## Administration

| Route | Purpose | Architecture | Status |
|--------|----------|--------------|--------|
| /dashboard | User Dashboard | LC01 | L3 |
| /admin | Platform Administration | LC01 | L3 |
| /admin/dashboard | Operations Dashboard | LC01 | L2 |
| /admin/moderation | Moderation | LC02 | L2 |
| /admin/capsule | Capsule Management | LC01 | L3 |

---

# COMPONENT INVENTORY

Every runtime component follows the same structure.

---

## Tribute Experience

| Component | File | Purpose | Architecture | Status |
|-----------|------|----------|--------------|--------|
| TributeWallClient | components/... | Main Tribute Experience | LC02 LC03 | L3 |
| TributeMap | components/... | World Tribute Map | LC02 | L3 |
| AudioTribute | components/... | Audio Contributions | LC02 | L2 |
| VideoTribute | components/... | Video Contributions | LC02 | L2 |

---

## Profile Experience

| Component | Purpose | Architecture | Status |
|-----------|----------|--------------|--------|
| GalleryLightbox | Gallery Experience | LC03 | L3 |
| GalleryEditor | Gallery Management | LC03 | L3 |
| SectionReactions | Community Engagement | LC05 | L3 |
| WaysToHonourCard | Expression of Honour | LC02 | L3 |

---

## Expression of Honour

| Component | Purpose | Architecture | Status |
|-----------|----------|--------------|--------|
| WaysToHonourSection | Tribute Wall Support Experience | LC02 | L3 |
| WaysToHonourCard | Profile Experience | LC02 | L3 |

---

## Event Management

| Component | Purpose | Architecture | Status |
|-----------|----------|--------------|--------|
| EventPhasesSection | Event Timeline | LC02 | L2 |
| GuestManagementSection | Guest Operations | LC02 | L2 |
| TableManagementSection | Seating Operations | LC02 | L2 |
| ServicesTab | Premium Services Hub | LC02 | L2 |

---

## Publication

| Component | Purpose | Architecture | Status |
|-----------|----------|--------------|--------|
| Publication Studio | Publication Editing | LC03 | L2 |
| Publication Renderer | Publication Output | LC03 | L2 |
| Publication Components | Publication UI | LC03 | L2 |

---

## Legacy Experience

| Component | Purpose | Architecture | Status |
|-----------|----------|--------------|--------|
| LegacyRoom | Legacy Experience | LC05 LC06 | L2 |
| LegacySnapshot | Legacy Metrics | LC03 LC06 | L2 |

---

# IMPLEMENTATION STATUS KEY

L0

Planned

L1

Created

L2

Partially Implemented

L3

Architecturally Aligned

L4

Launch Ready

L5

Production Proven

---

# SERVICES & RUNTIME INVENTORY

This section records every runtime service used by LegacyCapsule.

Unlike the Architecture Library, this section records actual implementation locations.

---

# API INVENTORY

Every API route should include:

| Route | Purpose | Architecture | Status |
|---------|----------|--------------|--------|

Group APIs into functional domains.

---

## Authentication

- Verify Sign-in
- Verify Email
- Authentication Support

Architecture

LC01

LC08

---

## Capsule Management

- Ownership Transfer
- Capsule Management
- Account Deletion

Architecture

LC01

---

## Event Services

- Family Representative
- Expression of Honour
- Guest Management
- Event Phases
- Table Management
- Check-in

Architecture

LC02

---

## Publication

- Publication Rendering
- Publication APIs
- Export APIs

Architecture

LC03

---

## Payments

- Checkout
- Stripe
- Regional Pricing

Architecture

LC04

---

## Engagement

- Reactions
- Gallery Comments
- Notifications

Architecture

LC05

---

## Administration

- Component Activation
- LCAdmin Operations

Architecture

LC01

---

## Scheduled Services

Cron Jobs

Architecture

LC05

Implementation Rule

Every scheduled task must include:

• Auto termination

• Audit logging

• Failure recovery

---

# LIBRARY INVENTORY

Shared implementation libraries.

| Library | Purpose | Architecture | Status |
|----------|----------|--------------|--------|

Examples

Theme Configuration

Publication Utilities

Payment Utilities

Admin Utilities

Email Utilities

Image Utilities

Map Utilities

---

# PREMIUM COMPONENT REGISTRY

This section records every premium feature currently supported by the platform.

| Component | Purpose | Architecture | Status |

Examples

Audio Tributes

Video Tributes

Expression of Honour

Publication

Extended Validity

Future Event Services

Guest Management

RSVP

Attire Coordination

Table Management

---

# DESIGN DECISION REGISTER

Only implementation decisions belong here.

Examples

SSR Rules

Database Rules

Email Rules

Pricing Rules

Next.js Rules

Cron Rules

Content Rules

Each decision should contain:

Decision ID

Rule

Architecture Reference

---

# IMPLEMENTATION STANDARDS

Implementation must always:

• Follow Architecture.

• Reuse existing implementation.

• Preserve working behaviour.

• Avoid unnecessary rewrites.

• Update Component Map where required.

---

# COMPONENT STATUS

L0

Planned

L1

Created

L2

Partial

L3

Architecturally Aligned

L4

Launch Ready

L5

Production Proven


# KNOWN IMPLEMENTATION ISSUES

This section records implementation issues that are still relevant.

Resolved issues should be moved to the Implementation History.

Each issue should contain:

| Issue | Impact | Status | Owner |

Example

| Issue | Impact | Status | Owner |
|--------|---------|--------|-------|
| Featured photo limit | Medium | Pending | Claude |
| TributeMap western hemisphere | Low | Pending | Claude |
| Stripe webhook activation | High | Pending | Claude |
| DNS for admin subdomain | Medium | Pending | Founder |

Only active issues belong here.

---

# IMPLEMENTATION REGISTER

Every major implementation should be recorded here.

| Date | AI | Model | Scope | Architecture | Status |

Example

| Date | AI | Model | Scope | Architecture | Status |
|------|----|--------|---------|--------------|--------|
| 26 Jun 2026 | Claude | Sonnet | Expression of Honour | LC02 | Completed |
| 26 Jun 2026 | ChatGPT | GPT-5.5 | Architecture Review | LC00–LC09 | Approved |

This register provides a chronological implementation audit trail.

---

# VERSION HISTORY

Only significant platform versions should appear here.

| Version | Summary | Date |

Minor implementation changes belong in the Implementation Register.

---

# ARCHITECTURE LIBRARY

Location

/docs/architecture/

Authoritative Documents

LC00 Architecture Index

LC01 System Map

LC02 Event Services

LC03 Publication Engine
LC04 Payment Engine

LC05 Engagement Engine

LC06 Legacy Recognition Engine

LC07 Ecosystem Alignment [RETIRED — replaced by RW00]

LC08 Data Architecture

LC09 AI Collaboration Workflow

LC10 Founder Product Roadmap

| RW00 | Platform Architecture Index         | RevoWorldTech Platform | July 2026 |
| RW01 | Payment Services Platform           | RevoWorldTech Platform | July 2026 |
| RW03 | Publication Platform                | RevoWorldTech Platform | July 2026 |
| RW04 | Recognition Platform                | RevoW

These documents define platform architecture.

The Component Map records where that architecture is implemented.

---

# COMPONENT MAP MAINTENANCE

This document is maintained by the Founder.

AI systems should not directly modify the master Component Map.

Instead, every implementation response must conclude with:

Component Map Impact

Components Added

Components Modified

Components Removed

Architecture References

Status Changes

or

Component Map Impact

None

The Founder (or an approved maintenance session) updates the master document.

---

# COMPONENT MAP QUALITY RULES

The Component Map should always answer:

Where is it implemented?

Which architecture governs it?

What is its current maturity?

Never duplicate architecture.

Never duplicate business rules.

Never duplicate roadmap decisions.

Keep implementation and architecture clearly separated.

---

# IMPLEMENTATION MATURITY SCALE

| Level | Meaning |
|--------|----------|
| L0 | Planned |
| L1 | Created |
| L2 | Partially Implemented |
| L3 | Architecturally Aligned |
| L4 | Launch Ready |
| L5 | Production Proven |

---

# IMPLEMENTATION HISTORY

This section records major governance milestones for the Component Map itself.

Example

26 June 2026

Version 2.0

Major governance refactor.

Aligned with Architecture Library.

Introduced architecture references.

Separated implementation inventory from roadmap.

Introduced implementation maturity levels.

Established Component Map governance rules.

---

# FOUNDER PRINCIPLE

The Component Map exists to eliminate implementation uncertainty.

Every significant runtime capability should be discoverable within minutes.

As the platform grows, clarity is more valuable than completeness.

The objective is not to document everything.

The objective is to ensure that every important implementation can be located, understood and safely modified.


# COMPONENT_MAP UPDATE — AI10 / Claude Sonnet 4.6 Session
# Date: 10 July 2026
# AI: Claude (Sonnet 4.6 — Implementation Worker)
# Session Scope: OG02 Cover System build, BUG-LEGACYROOM-001 fix,
#                TributeWallClient repair, M2 brand convergence patches
# Status: Ready for Founder to merge into master COMPONENT_MAP.md

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — IMPLEMENTATION REGISTER ENTRIES (append to Implementation Register)
# ─────────────────────────────────────────────────────────────────────────────

| Date         | AI                    | Model            | Scope                                      | Architecture   | Files Changed                                                      | Version | Status    |
|--------------|-----------------------|------------------|--------------------------------------------|----------------|--------------------------------------------------------------------|---------|-----------|
| 10 Jul 2026  | Claude                | Sonnet 4.6       | OG02 Cover System — full build             | OG02           | lib/og/CoverThemeResolver.ts (NEW), lib/og/getLegacySnapshot.ts (NEW), components/og/OpenGraphCover.tsx (NEW), components/og/OpenGraphHeroCover.tsx (NEW), app/api/og/[slug]/route.tsx (REPLACED) | v1.4.0 | Completed |
| 10 Jul 2026  | Claude                | Sonnet 4.6       | BUG-LEGACYROOM-001 fix                     | LC05 LC06      | app/api/email/approval/route.ts (MODIFIED)                        | v1.4.0 | Completed |
| 10 Jul 2026  | Claude                | Sonnet 4.6       | TributeWallClient composer repair          | LC02           | components/TributeWallClient.tsx (MODIFIED)                       | v1.4.0 | Completed |
| 10 Jul 2026  | Claude                | Sonnet 4.6       | M2 brand convergence patches               | LC00A OG02     | components/LegacyRoomClient.tsx (MODIFIED), app/for/[slug]/profile/page.tsx (MODIFIED), app/page.tsx (REVIEWED — no changes required) | v1.4.1 | Completed |

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — NEW COMPONENTS (add to component tables)
# ─────────────────────────────────────────────────────────────────────────────

## OG / Cover System (NEW SECTION — add to Component Map)

| Component           | File Path                              | Purpose                                          | Architecture | Owner                | Built By      | Date         | Status |
|---------------------|----------------------------------------|--------------------------------------------------|--------------|----------------------|---------------|--------------|--------|
| CoverThemeResolver  | lib/og/CoverThemeResolver.ts           | Maps event types to OG cover theme tokens. 12 event themes. Participation prompt system. Legacy statement pool. | OG02 | Claude | Claude Sonnet 4.6 | 10 Jul 2026 | L3 |
| getLegacySnapshot   | lib/og/getLegacySnapshot.ts            | Fetches participation metrics (voices + countries) for cover Legacy Snapshot. Reads capsule_participation_summary first, falls back to live count. | OG02 LC05 | Claude | Claude Sonnet 4.6 | 10 Jul 2026 | L3 |
| OpenGraphCover      | components/og/OpenGraphCover.tsx       | Mode A — Legacy Cover JSX for Satori. No hero image required. 7-level visual hierarchy. Book spine signature element. 1200×630px. | OG02 | Claude | Claude Sonnet 4.6 | 10 Jul 2026 | L3 |
| OpenGraphHeroCover  | components/og/OpenGraphHeroCover.tsx   | Mode B — Hero Cover JSX for Satori. Split layout with hero image right column. Same hierarchy as Mode A preserved. 1200×630px. | OG02 | Claude | Claude Sonnet 4.6 | 10 Jul 2026 | L3 |

## Updated API Route

| Component               | File Path                     | Purpose                                                                 | Architecture | Owner  | Last Modified By  | Date         | Status |
|-------------------------|-------------------------------|-------------------------------------------------------------------------|--------------|--------|-------------------|--------------|--------|
| OG Image Route          | app/api/og/[slug]/route.tsx   | Edge runtime. Selects Mode A or B based on hero_image_url. Loads DM Sans fonts. Reads capsule + snapshot. Sets 1hr CDN cache. Branded fallback on error. | OG02 | Claude | Claude Sonnet 4.6 | 10 Jul 2026 | L3 |

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — MODIFIED COMPONENTS (update existing entries with new details)
# ─────────────────────────────────────────────────────────────────────────────

## Tribute Experience

| Component          | File Path                            | Purpose                                                                 | Architecture | Last Modified By  | Date         | Changes Made                                                          | Status |
|--------------------|--------------------------------------|-------------------------------------------------------------------------|--------------|-------------------|--------------|-----------------------------------------------------------------------|--------|
| TributeWallClient  | components/TributeWallClient.tsx     | Main contributor experience. Theme-aware. Collapsible composer. Hero controls. Map card. Profile summary. Expression of Honour. Attribution engine wired. v9 Premium. | LC02 LC05 | Claude Sonnet 4.6 | 10 Jul 2026 | Fixed JSX parse error (injected comment in ternary branch). Fixed undefined state refs (isComposerExpanded → composerOpen). Fixed undefined handlers (handleCopyLink → handleCopy, handleWhatsAppShare → inline). Fixed submit button layout (width:100% → flexShrink:0). | L3 |

## Approval Email Route

| Component           | File Path                          | Purpose                                                                               | Architecture | Last Modified By  | Date         | Changes Made                                                                 | Status |
|---------------------|------------------------------------|---------------------------------------------------------------------------------------|--------------|-------------------|--------------|------------------------------------------------------------------------------|--------|
| Approval Route      | app/api/email/approval/route.ts    | Called on tribute approval. Assigns ref code, updates participation summary, recalculates legacy builders, sends Keepsake Card. BUG-LEGACYROOM-001 fixed. | LC05 LC06 D27 | Claude Sonnet 4.6 | 10 Jul 2026 | Added assignRefCode(), updateParticipationSummary(), recalculateLegacyBuilders() calls from lib/participation/refCode.ts. These were built but never called. | L4 |

## Legacy Room

| Component        | File Path                           | Purpose                                                                  | Architecture | Last Modified By  | Date         | Changes Made                                                     | Status |
|------------------|-------------------------------------|--------------------------------------------------------------------------|--------------|-------------------|--------------|------------------------------------------------------------------|--------|
| LegacyRoomClient | components/LegacyRoomClient.tsx     | Public community participation room. Stats, builders, activity, gallery, publication status. 60s polling. Theme-aware. | LC05 LC06 | Claude Sonnet 4.6 | 10 Jul 2026 | M2 brand patches: stat labels (Contributors→Voices Gathered, Photos→Memories Preserved, Shares→Times Shared). Recent Activity→Recently Joined This Record. Publication status text updated. Legacy Builder teaser added when hidden. Footer brand line fixed (Legacies continue→Legacies don't). | L3 |

## Profile Page

| Component    | File Path                              | Purpose                                                                              | Architecture | Last Modified By  | Date         | Changes Made                                                                   | Status |
|--------------|----------------------------------------|--------------------------------------------------------------------------------------|--------------|-------------------|--------------|--------------------------------------------------------------------------------|--------|
| Profile Page | app/for/[slug]/profile/page.tsx        | Public honouree profile. Biography, milestones, gallery, featured photos, publication download. Server component with ISR. | LC02 LC03 | Claude Sonnet 4.6 | 10 Jul 2026 | M2 brand patches: removed marketing CTA from footer (/book link). Made Attire nav link conditional on capsule.components?.includes('attire'). | L3 |

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — CONFIRMED EXISTING FILES (file paths now confirmed for first time)
# ─────────────────────────────────────────────────────────────────────────────
# These were listed in the component map without file paths. Now confirmed.

| Component                | File Path                                   | Confirmed By      | Date         |
|--------------------------|---------------------------------------------|-------------------|--------------|
| Tribute Wall Server Page | app/for/[slug]/page.tsx                     | Claude Sonnet 4.6 | 10 Jul 2026  |
| Legacy Room Server Page  | app/for/[slug]/legacy/page.tsx              | Claude Sonnet 4.6 | 10 Jul 2026  |
| Profile Page             | app/for/[slug]/profile/page.tsx             | Claude Sonnet 4.6 | 10 Jul 2026  |
| Booking Page             | app/book/page.tsx                           | Claude Sonnet 4.6 | 10 Jul 2026  |
| Homepage                 | app/page.tsx                                | Claude Sonnet 4.6 | 10 Jul 2026  |
| Admin Capsule Detail     | app/admin/capsule/[id]/page.tsx             | Claude Sonnet 4.6 | 10 Jul 2026  |
| Attribution Engine       | lib/participation/refCode.ts                | Claude Sonnet 4.6 | 10 Jul 2026  |
| Approval Email Route     | app/api/email/approval/route.ts             | Claude Sonnet 4.6 | 10 Jul 2026  |

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — KNOWN GAPS 
# ─────────────────────────────────────────────────────────────────────────────
# These files are confirmed to exist (referenced in code) but have not been
# shared or inventoried. File paths are inferred — verify before recording as final.

| Component         | Inferred File Path                          | Referenced By                        | Required For                | Priority  |
|-------------------|---------------------------------------------|--------------------------------------|-----------------------------|-----------|
| ComponentsPanel   | app/admin/capsule/[id]/ComponentsPanel.tsx  | app/admin/capsule/[id]/page.tsx      | community_stories toggle    | HIGH      |
| CapsuleBottomNav  | components/CapsuleBottomNav.tsx             | app/for/[slug]/page.tsx, legacy/page.tsx, profile/page.tsx | Stories tab nav | HIGH |
| AnimatedWorldMap  | components/AnimatedWorldMap.tsx             | app/page.tsx                         | Homepage hero               | LOW       |
| HeroPositionPicker| components/HeroPositionPicker.tsx           | components/TributeWallClient.tsx     | Hero image controls         | LOW       |
| SectionTextClamp  | components/SectionTextClamp.tsx             | app/for/[slug]/profile/page.tsx      | Profile section display     | LOW       |
| SectionReactions  | components/SectionReactions.tsx             | app/for/[slug]/profile/page.tsx      | Section reactions           | LOW       |
| WaysToHonourSection | components/WaysToHonourSection.tsx        | components/TributeWallClient.tsx     | Expression of Honour        | LOW       |
| AudioTribute      | components/AudioTribute.tsx                 | components/TributeWallClient.tsx     | Audio contributions         | LOW       |
| VideoTribute      | components/VideoTribute.tsx                 | components/TributeWallClient.tsx     | Video contributions         | LOW       |
| TributeMap        | components/TributeMap.tsx                   | components/TributeWallClient.tsx     | World map display           | LOW       |


# ═══════════════════════════════════════════════════════════════
# SECTION 6 — DESIGN DECISIONS
# ═══════════════════════════════════════════════════════════════

| ID         | Decision                                                                                             | Date        |
|------------|------------------------------------------------------------------------------------------------------|-------------|
| DD-OG-001  | OG route auto-selects Mode A (no image) or Mode B (hero image) based on hero_image_url presence     | 10 Jul 2026 |
| DD-OG-002  | OG fonts loaded via Google Fonts CDN. Self-host in public/fonts/ before Vercel Pro upgrade.         | 10 Jul 2026 |
| DD-PAY-001 | Feature activation unified to capsule.components array. Boolean columns (voice_tributes_active etc) are retired. | 10 Jul 2026 |
| DD-PAY-002 | Honour/Premier tier packages scrapped. All features are individual purchases. Capsule creation is free. | 10 Jul 2026 |
| DD-PAY-003 | Feature prices require is_published=true before appearing to users. Admin sets price, then publishes. | 10 Jul 2026 |
| DD-NAV-001 | No app/for/[slug]/layout.tsx. Navigation handled by CapsuleBottomNav included per page.             | 10 Jul 2026 |
| DD-NAV-002 | Community Stories tab uses id='stories', Event Story uses id='story'. Must remain distinct.         | 10 Jul 2026 |
| DD-SUB-001 | Contribution inserts are client-side in TributeWallClient.tsx. No contributions API route exists.   | 10 Jul 2026 |



# ─────────────────────────────────────────────────────────────────────────────
# SECTION 7 — VERSION HISTORY ENTRY
# ─────────────────────────────────────────────────────────────────────────────

| Version | Date        | Summary                                                                                 |
|---------|-------------|-----------------------------------------------------------------------------------------|
| v1.4.0  | 10 Jul 2026 | OG02 Cover System. BUG-LEGACYROOM-001 fix. TributeWallClient composer repair.          |
| v1.4.1  | 10 Jul 2026 | M2 brand convergence: Legacy Room, Profile Page cleanup.                                |
| v1.4.2  | 10 Jul 2026 | M3 Community Stories: SQL migration, 9 sprint files placed, nav + ComponentsPanel.     |
| v1.4.3  | 10 Jul 2026 | M4 Publication Distribution: distribute route + Collective Belonging Email.             |
| v1.4.4  | 10 Jul 2026 | M5 Event Services: guest_management toggle, CapsuleBottomNav stories fix.              |
| v1.4.5  | 10 Jul 2026 | M5b Payment automation: featureUnlocker unified to components, feature checkout route. |
| v1.4.6  | 10 Jul 2026 | Admin pricing: draft/live control, publish/unpublish with audit log, feature prices.   |
| v1.4.7  | 10 Jul 2026 | Feature pricing: regional prices in ServicesTab, priceFetcher is_published gate.       |
| v1.5.9–1.6.9 | Access Code System (DB+API+components), D-Day portal, context-aware QR, Community Memories & Stories rebuild, Publication render upgrade, correction templates, ServicesTab price column, phase tier gating, lc_pricing cleanup | 14 Jul 2026 |

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 8 — DESIGN DECISION REGISTER ENTRIES
# ─────────────────────────────────────────────────────────────────────────────

| Decision ID | Rule                                                                                      | Architecture | Date         |
|-------------|-------------------------------------------------------------------------------------------|--------------|--------------|
| DD-OG-001   | OG route selects Mode A (no image) or Mode B (hero image) automatically based on hero_image_url. No manual mode parameter needed from server page. | OG02 | 10 Jul 2026 |
| DD-OG-002   | OG fonts loaded via Google Fonts CDN with force-cache. Self-host in public/fonts/ before Vercel Pro upgrade to ensure Puppeteer reliability. | OG02 | 10 Jul 2026 |
| DD-OG-003   | OG image cache: s-maxage=3600, stale-while-revalidate=86400. New ?t= bust in server page metadata forces fresh fetch when needed. | OG02 | 10 Jul 2026 |
| DD-SUB-001  | Contribution inserts are client-side (TributeWallClient.tsx direct Supabase insert). No contributions API route exists. Any new contribution fields (e.g. story_topic_id) must be added to this client-side insert. | LC02 | 10 Jul 2026 |
| DD-NAV-001  | No app/for/[slug]/layout.tsx exists. Capsule room navigation is handled by CapsuleBottomNav component, included in each room's page.tsx individually. | LC01 | 10 Jul 2026 |

ComponentFileChangeComponentsPanelapp/admin/capsule/[id]/ComponentsPanel.tsxAdded community_stories toggleCapsuleBottomNavcomponents/CapsuleBottomNav.tsxAdded Stories tab conditional on community_stories componentTributeWallClientcomponents/TributeWallClient.tsxAdded story_topic_id: null to contribution insert

TypeFileChangeNEWapp/api/publication/distribute/route.tsCollective Belonging Email. Sends publication PDF link to all approved contributors with emails. Resend batch API. 50/batch. Deduplicates by email. Updates distributed_at if column exists. Built: Claude Sonnet 4.6 · July 2026MODIFIEDcomponents/publication/PublicationEditor.tsxAdded distribute state + handler + UI (Distribute section in right panel, visible only when PDF exists). Fixed back link (/capsule/slug/manage → /manage/slug). Modified: Claude Sonnet 4.6 · July 2026

| DD-PHASE-001  | Phase limit is tier-aware: free=1, paid=2, +1 per additional_phase in components array. Counted by occurrences (not inclusion) to support multiple purchases. | LC02 | 14 Jul 2026 |
| DD-CART-001   | ServicesTab uses side-by-side price column (checkbox + price) instead of inline cart buttons. Selection and checkout live in price column only. Service cards are for learning/managing only. | LC02 | 14 Jul 2026 |
| DD-DDAY-001   | D-Day uploads: photos go to gallery_items (source='dday'), tributes go to contributions (is_dday=true). Context-aware QR redirects: before event→tribute wall, event day+window open→/dday, after→tribute wall. | LC02 | 14 Jul 2026 |
| DD-STORIES-001| Client-facing name: Community Memories & Stories. Backend IDs stay as community_stories. Tribute char limit: 500 (new submissions only). Story char limit: 2000 + 3 photos. | LC02 | 14 Jul 2026 |
| DD-EOH-001    | Client-facing name: Gift of Honour. Backend IDs stay as ways_to_honour, WaysToHonourSection, capsule_support_accounts unchanged. | LC02 | 14 Jul 2026 |
| DD-CORR-001   | Max 2 correction requests per contribution. Third request flags contribution as 'flagged' instead of sending email. Status flow: pending→pending_correction→approved/flagged. | LC02 | 14 Jul 2026 |

## OG / Cover System

| Component           | File Path                              | Purpose                                                        | Built By      | Date        |
|---------------------|----------------------------------------|----------------------------------------------------------------|---------------|-------------|
| CoverThemeResolver  | lib/og/CoverThemeResolver.ts           | 12 event-type cover themes, participation prompts, legacy statements | Claude Sonnet 4.6 | 10 Jul 2026 |
| getLegacySnapshot   | lib/og/getLegacySnapshot.ts            | Participation metrics for OG cover. Reads summary, falls back to live count. | Claude Sonnet 4.6 | 10 Jul 2026 |
| OpenGraphCover      | components/og/OpenGraphCover.tsx       | Mode A — publication-style cover, no hero image. Satori JSX. 1200×630. | Claude Sonnet 4.6 | 10 Jul 2026 |
| OpenGraphHeroCover  | components/og/OpenGraphHeroCover.tsx   | Mode B — split layout with hero image. Satori JSX. 1200×630.  | Claude Sonnet 4.6 | 10 Jul 2026 |

## Community Stories

| Component               | File Path                                            | Purpose                                              | Built By   | Date        |
|-------------------------|------------------------------------------------------|------------------------------------------------------|------------|-------------|
| Stories Page            | app/for/[slug]/stories/page.tsx                      | Community Stories public room — server component     | AI10       | Jun 2026    |
| CommunityStoriesClient  | components/CommunityStoriesClient.tsx                | Interactive stories wall — topic containers, empty state | AI10   | Jun 2026    |
| TopicContainer          | components/TopicContainer.tsx                        | Individual topic chapter — fixed height, scrollable  | AI10       | Jun 2026    |
| StoryCard               | components/StoryCard.tsx                             | Story display — name, text, optional photo           | AI10       | Jun 2026    |
| StorySubmissionPanel    | components/StorySubmissionPanel.tsx                  | Three-option story submission flow                   | AI10       | Jun 2026    |
| TopicSelector           | components/TopicSelector.tsx                         | Event-type-aware default topic lists                 | AI10       | Jun 2026    |
| Community Topics API    | app/api/community-topics/route.ts                    | GET topics / POST organiser topic                    | AI10       | Jun 2026    |
| Story Submit API        | app/api/community-topics/submit/route.ts             | POST story submission with photo + topic handling    | AI10       | Jun 2026    |
| Topic Approve API       | app/api/community-topics/[topicId]/approve/route.ts  | POST approve community-proposed topic                | AI10       | Jun 2026    |

## Payment System

| Component               | File Path                                | Purpose                                                        | Built By      | Date        |
|-------------------------|------------------------------------------|----------------------------------------------------------------|---------------|-------------|
| Feature Checkout Route  | app/api/checkout/feature/route.ts        | Stripe checkout for individual feature purchases               | Claude Sonnet 4.6 | 10 Jul 2026 |
| Distribute Route        | app/api/publication/distribute/route.ts  | Collective Belonging Email — sends PDF to all contributors     | Claude Sonnet 4.6 | 10 Jul 2026 |

# ═══════════════════════════════════════════════════════════════
# SECTION 4 — MODIFIED COMPONENTS (update existing entries)
# ═══════════════════════════════════════════════════════════════

| Component              | File Path                                    | Changes Made                                                                                          | Date        |
|------------------------|----------------------------------------------|-------------------------------------------------------------------------------------------------------|-------------|
| OG Route               | app/api/og/[slug]/route.tsx                  | Full replacement — OG02 spec. Mode A/B auto-select. Edge runtime. DM Sans fonts. 1hr CDN cache.      | 10 Jul 2026 |
| Approval Route         | app/api/email/approval/route.ts              | BUG-LEGACYROOM-001: added assignRefCode, updateParticipationSummary, recalculateLegacyBuilders calls  | 10 Jul 2026 |
| TributeWallClient      | components/TributeWallClient.tsx             | Fixed JSX parse error (injected comment), undefined state refs, undefined handlers, submit layout     | 10 Jul 2026 |
| LegacyRoomClient       | components/LegacyRoomClient.tsx              | Stat labels, activity heading, publication status text, footer brand line, builder teaser             | 10 Jul 2026 |
| Profile Page           | app/for/[slug]/profile/page.tsx              | Removed marketing CTA from footer, attire link conditional on components                              | 10 Jul 2026 |
| ComponentsPanel        | app/admin/capsule/[id]/ComponentsPanel.tsx   | Added community_stories and guest_management toggles                                                  | 10 Jul 2026 |
| CapsuleBottomNav       | components/CapsuleBottomNav.tsx              | Added Community Stories tab (stories ID), fixed story/stories conflict, extended CapsulePage type     | 10 Jul 2026 |
| PublicationEditor      | components/publication/PublicationEditor.tsx | Added distribute state + handler + UI. Fixed back link (/capsule/slug → /manage/slug)                 | 10 Jul 2026 |
| featureUnlocker        | lib/payments/featureUnlocker.ts              | REPLACED — unified to capsule.components array. Old version wrote to boolean columns UI never read.   | 10 Jul 2026 |
| PaymentService         | lib/payments/PaymentService.ts               | Added initiateFeatureCheckout function for individual feature purchases                               | 10 Jul 2026 |
| ServicesTab            | components/manage/ServicesTab.tsx            | Unlock buttons wired to feature checkout. Regional price display. useEffect price fetch on mount.     | 10 Jul 2026 |
| admin/actions.ts       | lib/admin/actions.ts                         | Added publishPrice and unpublishPrice functions with audit logging                                    | 10 Jul 2026 |
| Admin Pricing Route    | app/api/admin/pricing/route.ts               | Added publish/unpublish action routing                                                                | 10 Jul 2026 |
| Admin Pricing Page     | app/admin/pricing/page.tsx                   | Draft/Live badge, Go Live / Unpublish buttons per price row                                           | 10 Jul 2026 |
| Regional Prices Route  | app/api/regional-prices/route.ts             | Added features param — returns regional prices for feature keys                                       | 10 Jul 2026 |
| priceFetcher           | lib/payments/priceFetcher.ts                 | Added is_published gate — throws if price not live                                                    | 10 Jul 2026 |

| Access Code Migration     | migrations/access_code_system.sql                          | Claude Sonnet 4.6 | 14 Jul 2026  |
| Access Code Config API    | app/api/access-codes/config/route.ts                       | Claude Sonnet 4.6 | 14 Jul 2026  |
| Access Code Sections API  | app/api/access-codes/sections/route.ts                     | Claude Sonnet 4.6 | 14 Jul 2026  |
| Access Code Generate API  | app/api/access-codes/generate/route.ts                     | Claude Sonnet 4.6 | 14 Jul 2026  |
| Access Code Validate API  | app/api/access-codes/validate/route.ts                     | Claude Sonnet 4.6 | 14 Jul 2026  |
| Access Code List API      | app/api/access-codes/list/route.ts                         | Claude Sonnet 4.6 | 14 Jul 2026  |
| Access Code Send API      | app/api/access-codes/send/route.ts                         | Claude Sonnet 4.6 | 14 Jul 2026  |
| Access Code Metrics API   | app/api/access-codes/metrics/route.ts                      | Claude Sonnet 4.6 | 14 Jul 2026  |
| Access Code Manual Checkin| app/api/access-codes/manual-checkin/route.ts               | Claude Sonnet 4.6 | 14 Jul 2026  |
| Access Code Revoke API    | app/api/access-codes/revoke/route.ts                       | Claude Sonnet 4.6 | 14 Jul 2026  |
| Access Code Walkin API    | app/api/access-codes/walkin/route.ts                       | Claude Sonnet 4.6 | 14 Jul 2026  |
| Usher Session API         | app/api/usher/session/route.ts                             | Claude Sonnet 4.6 | 14 Jul 2026  |
| Usher Verify API          | app/api/usher/verify/route.ts                              | Claude Sonnet 4.6 | 14 Jul 2026  |
| Capsule By Slug API       | app/api/capsule-by-slug/route.ts                           | Claude Sonnet 4.6 | 14 Jul 2026  |
| AccessCodeSetup           | components/manage/access-codes/AccessCodeSetup.tsx         | Claude Sonnet 4.6 | 14 Jul 2026  |
| GuestCodeList             | components/manage/access-codes/GuestCodeList.tsx           | Claude Sonnet 4.6 | 14 Jul 2026  |
| UsherSessionManager       | components/manage/access-codes/UsherSessionManager.tsx     | Claude Sonnet 4.6 | 14 Jul 2026  |
| AccessMetricsDashboard    | components/manage/access-codes/AccessMetricsDashboard.tsx  | Claude Sonnet 4.6 | 14 Jul 2026  |
| Checkin Page              | app/manage/[slug]/checkin/page.tsx                         | Claude Sonnet 4.6 | 14 Jul 2026  |
| GuestManagementSection    | components/manage/GuestManagementSection.tsx               | Claude Sonnet 4.6 | 14 Jul 2026  |
| D-Day Upload Page         | app/for/[slug]/dday/page.tsx                               | Claude Sonnet 4.6 | 14 Jul 2026  |
| D-Day Upload API          | app/api/dday/upload/route.ts                               | Claude Sonnet 4.6 | 14 Jul 2026  |
| Context-Aware QR Route    | app/api/qr/[token]/route.ts                                | Claude Sonnet 4.6 | 14 Jul 2026  |
| Community Stories Page    | app/for/[slug]/stories/page.tsx                            | Claude Sonnet 4.6 | 14 Jul 2026  |
| CommunityStoriesClient    | components/CommunityStoriesClient.tsx                      | Claude Sonnet 4.6 | 14 Jul 2026  |
| Correction Request API    | app/api/email/correction-request/route.ts                  | Claude Sonnet 4.6 | 14 Jul 2026  |
| Publication Render Page   | app/publication-render/[token]/page.tsx                    | Claude Sonnet 4.6 | 14 Jul 2026  |
| Phases API (tier gate)    | app/api/phases/route.ts                                    | Claude Sonnet 4.6 | 14 Jul 2026  |
| ServicesTab (price col)   | components/manage/ServicesTab.tsx                          | Claude Sonnet 4.6 | 14 Jul 2026  |
| lc_pricing cleanup SQL    | migrations/lc_pricing_cleanup.sql                          | Claude Sonnet 4.6 | 14 Jul 2026  |
# ═══════════════════════════════════════════════════════════════
# SECTION 5 — DATABASE CHANGES
# ═══════════════════════════════════════════════════════════════

| Table                    | Change                                                                 | Date        |
|--------------------------|------------------------------------------------------------------------|-------------|
| community_story_topics   | NEW TABLE — created via migration_community_stories.sql               | 10 Jul 2026 |
| contributions            | NEW COLUMN — story_topic_id UUID nullable FK to community_story_topics | 10 Jul 2026 |
| lc_pricing               | NEW COLUMN — is_published BOOLEAN NOT NULL DEFAULT false              | 10 Jul 2026 |
| lc_pricing               | NEW ROWS — 8 feature price entries (all default to Draft/false)        | 10 Jul 2026 |





# COMPONENT_MAP — AI13 UPDATE BLOCK
# Date: 22 July 2026
# AI: AI13 (Claude Sonnet 4.6)
# Covers: v1.8.0 → v1.9.8 (AI12 session, 19–21 Jul 2026) — previously unrecorded
# Also corrects: missing entries from v1.5.9–v1.7.8 (AI11 session, 14 Jul 2026)
# Action: Append this entire block to the bottom of COMPONENT_MAP.md

# ═══════════════════════════════════════════════════════════════
# SECTION A — IMPLEMENTATION REGISTER ENTRIES (v1.8.0 → v1.9.8)
# Append these rows to the Implementation Register table
# ═══════════════════════════════════════════════════════════════

| Date | AI | Model | Scope | Architecture | Files Changed | Version | Status |
|------|----|-------|-------|-------------|--------------|---------|--------|
| 19 Jul 2026 | AI12 | Opus+Sonnet | RW02 authored, service copy rewrite, booking Step 3 rebuilt, help page v3, brand patches | RW02 LC02 | app/book/page.tsx, app/help/page.tsx, lib/content/serviceDetails.ts | v1.8.0 | Completed |
| 19 Jul 2026 | AI12 | Sonnet | GuestManagementSection: GuestCodeList wired, 3-scope selector, ticket generation (M6.6) | LC02 RW02 | components/manage/GuestManagementSection.tsx | v1.8.1 | Completed |
| 19 Jul 2026 | AI12 | Sonnet | ServicesTab: access_codes added, durations fixed (60s), prop chain fixed | LC02 | components/manage/ServicesTab.tsx, app/admin/capsule/[id]/ComponentsPanel.tsx | v1.8.2 | Completed |
| 19 Jul 2026 | AI12 | Sonnet | D-Day rebuilt (photos only, 6-photo limit, sharp compression), publication subscribers table, 24 platform_config keys seeded | LC02 | app/for/[slug]/dday/page.tsx, app/api/dday/upload/route.ts, app/api/publication/subscribe/route.ts, rw_ecosystem_config_seed_v4.sql | v1.8.3 | Completed |
| 19 Jul 2026 | AI12 | Sonnet | D-Day page unblocked (public-info API), Publication Dispatch Manager (2-step preview+send) | LC02 LC03 | app/api/capsule/public-info/route.ts (NEW), app/api/publication/distribute/route.ts | v1.8.4 | Completed |
| 19 Jul 2026 | AI12 | Sonnet | PublicationSubscribePanel in stories room, participant_category migration | LC02 LC05 | components/capsule/PublicationSubscribePanel.tsx (NEW), app/for/[slug]/stories/page.tsx, guests_participant_category.sql | v1.8.5 | Completed |
| 19 Jul 2026 | AI12 | Sonnet | PublicationSubscribePanel on tribute wall, email incentive copy | LC02 LC05 | components/TributeWallClient.tsx | v1.8.6 | Completed |
| 19 Jul 2026 | AI12 | Sonnet | Event phases strip on profile + legacy pages | LC02 | app/for/[slug]/profile/page.tsx, app/for/[slug]/legacy/page.tsx | v1.8.7 | Completed |
| 19 Jul 2026 | AI12 | Sonnet | Phase strips on tribute wall + community stories, capacity packs seeded in lc_pricing | LC02 | components/TributeWallClient.tsx, app/for/[slug]/stories/page.tsx, lc_pricing_capacity_packs_v4.sql | v1.8.8 | Completed |
| 19 Jul 2026 | AI12 | Sonnet | Capacity Monitor in GuestManagementSection, capacity API route, capacity packs in ServicesTab | LC02 | app/api/guests/capacity/route.ts (NEW), components/manage/GuestManagementSection.tsx, components/manage/ServicesTab.tsx | v1.8.9 | Completed |
| 21 Jul 2026 | AI12 | Sonnet | CapsuleBottomNav rebuilt (4+1 tabs), community_stories guard removed, Capsule Reveal removed, UpgradeCard replaced, tribute serial numbers, duplicate share box removed | LC02 | components/CapsuleBottomNav.tsx, app/manage/[slug]/page.tsx, components/TributeWallClient.tsx | v1.9.0 | Completed |
| 21 Jul 2026 | AI12 | Sonnet | Profile page overflow fixed, inline nav buttons removed, phase strip added | LC02 | app/for/[slug]/profile/page.tsx | v1.9.1 | Completed |
| 21 Jul 2026 | AI12 | Sonnet | ServicesTab checkbox alignment fixed (ResizeObserver height sync) | LC02 | components/manage/ServicesTab.tsx | v1.9.2 | Completed |
| 21 Jul 2026 | AI12 | Sonnet | Currency detection fixed — Cloudflare cf-ipcountry header first, no more ipapi.co rate limit failures | LC04 | app/api/regional-prices/route.ts, lib/payments/regionDetector.ts | v1.9.3 | Completed |
| 21 Jul 2026 | AI12 | Sonnet | Payment metadata enriched (feature_ids), ip_country in honouree page, country count fixed | LC04 LC02 | app/api/checkout/bundle/route.ts, app/for/[slug]/honouree/page.tsx, app/for/[slug]/honouree/HonoureePortalClient.tsx | v1.9.4 | Completed |
| 21 Jul 2026 | AI12 | Sonnet | Order history panel, capacity pack activation in featureUnlocker, orders API route | LC04 | app/api/capsule/orders/route.ts (NEW), components/manage/OrderHistoryPanel.tsx (NEW), lib/payments/featureUnlocker.ts, app/manage/[slug]/page.tsx | v1.9.5 | Completed |
| 21 Jul 2026 | AI12 | Sonnet | FEAT-001 Send Payment Link — modal in ServicesTab, API route, email template, serviceDetails entry | LC04 | app/api/checkout/send-payment-link/route.ts (NEW), components/manage/ServicesTab.tsx, lib/content/serviceDetails.ts | v1.9.6 | Completed |
| 21 Jul 2026 | AI12 | Sonnet | ServicesTab: D-Day Live Wall repositioned, cancel URL fix (source: dashboard), apostrophes fixed | LC02 | components/manage/ServicesTab.tsx, app/api/checkout/bundle/route.ts | v1.9.7 | Completed |
| 21 Jul 2026 | AI12 | Sonnet | Tribute serial numbers in manage dashboard, name/relationship split to two lines | LC02 | components/manage/TributeSection.tsx | v1.9.8 | Completed |

# ═══════════════════════════════════════════════════════════════
# SECTION B — NEW FILES CREATED (v1.8.0 → v1.9.8)
# Add these to the relevant component tables or a new "API Routes" section
# ═══════════════════════════════════════════════════════════════

## New API Routes (v1.8.0 → v1.9.8)

| File | Purpose | Architecture | Built By | Date | Status |
|------|---------|-------------|---------|------|--------|
| app/api/capsule/public-info/route.ts | Returns capsule public info + D-Day photo limit for unauthenticated D-Day page | LC02 | AI12 | 19 Jul 2026 | L3 |
| app/api/guests/capacity/route.ts | Returns guest capacity usage vs total allocation (base + packs) for CapacityMonitor | LC02 | AI12 | 19 Jul 2026 | L3 |
| app/api/capsule/orders/route.ts | Returns paid order history for a capsule (paid_at NOT NULL only) | LC04 | AI12 | 21 Jul 2026 | L3 |
| app/api/publication/subscribe/route.ts | Registers publication subscribers with source tagging | LC03 LC05 | AI12 | 19 Jul 2026 | L3 |
| app/api/publication/distribute/route.ts | Multi-source deduped publication dispatch — tributes + D-Day + subscribers | LC03 LC05 | AI12 | 19 Jul 2026 | L3 |
| app/api/checkout/send-payment-link/route.ts | FEAT-001: generates and emails a Stripe payment link to a third party | LC04 | AI12 | 21 Jul 2026 | L3 |

## New Components (v1.8.0 → v1.9.8)

| Component | File | Purpose | Architecture | Built By | Date | Status |
|-----------|------|---------|-------------|---------|------|--------|
| PublicationSubscribePanel | components/capsule/PublicationSubscribePanel.tsx | Inline panel for guests to subscribe to publication distribution. Appears on tribute wall and stories room. | LC03 LC05 | AI12 | 19 Jul 2026 | L3 |
| OrderHistoryPanel | components/manage/OrderHistoryPanel.tsx | Shows paid service order history in Settings tab of manage dashboard | LC04 | AI12 | 21 Jul 2026 | L3 |

# ═══════════════════════════════════════════════════════════════
# SECTION C — MODIFIED FILES (v1.8.0 → v1.9.8)
# Update existing entries in component tables
# ═══════════════════════════════════════════════════════════════

| Component | File | Last Modified | Version | Changes Summary |
|-----------|------|-------------|---------|----------------|
| CapsuleBottomNav | components/CapsuleBottomNav.tsx | AI12 — 21 Jul 2026 | v1.9.0 | Rebuilt to 4+1 tab structure: Tributes / Memories / Profile / Highlights + conditional Attire. Event Story removed from nav (accessed via phase strip). CapsulePage type: 'tribute'\|'memories'\|'profile'\|'legacy'\|'attire' |
| TributeWallClient | components/TributeWallClient.tsx | AI12 — 21 Jul 2026 | v1.9.0 | Serial numbers on tribute cards, name/relationship split to two lines, PublicationSubscribePanel injected, phase strip added, duplicate share box removed |
| ServicesTab | components/manage/ServicesTab.tsx | AI12 — 21 Jul 2026 | v1.9.7 | access_codes service added, durations fixed (60s), FEAT-001 Send Payment Link modal, D-Day Live Wall repositioned, checkbox alignment (ResizeObserver), capacity packs added, source param for cancel URL |
| GuestManagementSection | components/manage/GuestManagementSection.tsx | AI12 — 19 Jul 2026 | v1.8.9 | GuestCodeList wired, 3-scope participant selector, ticket/access pass generation, CapacityMonitor injected |
| TributeSection | components/manage/TributeSection.tsx | AI12 — 21 Jul 2026 | v1.9.8 | Tribute serial numbers added, contributor name/relationship split to two lines |
| D-Day Upload Page | app/for/[slug]/dday/page.tsx | AI12 — 19 Jul 2026 | v1.8.3 | Photos ONLY (tribute text removed from D-Day), 6-photo limit enforced, 3-option UI simplified |
| D-Day Upload API | app/api/dday/upload/route.ts | AI12 — 19 Jul 2026 | v1.8.3 | sharp compression (max 1200px, JPEG quality 82), 6-photo limit (device_token IP+UA hash), source='dday' |
| Profile Page | app/for/[slug]/profile/page.tsx | AI12 — 21 Jul 2026 | v1.9.1 | Overflow fixed, inline nav buttons removed, event phases strip added |
| Legacy (Highlights) Page | app/for/[slug]/legacy/page.tsx | AI12 — 19 Jul 2026 | v1.8.7 | Event phases strip added, PublicationSubscribePanel added |
| Stories (Memories) Page | app/for/[slug]/stories/page.tsx | AI12 — 19 Jul 2026 | v1.8.5 | community_stories notFound() guard removed (community stories is always free), currentPage='memories', PublicationSubscribePanel added |
| Honouree Page | app/for/[slug]/honouree/page.tsx | AI12 — 21 Jul 2026 | v1.9.4 | ip_country added to select query |
| HonoureePortalClient | app/for/[slug]/honouree/HonoureePortalClient.tsx | AI12 — 21 Jul 2026 | v1.9.4 | ip_country added to Tribute interface for correct country count |
| Manage Dashboard | app/manage/[slug]/page.tsx | AI12 — 21 Jul 2026 | v1.9.5 | Capsule Reveal removed, UpgradeCard replaced with pointer to ServicesTab, OrderHistoryPanel injected in Settings tab, routing fixes |
| ComponentsPanel (Admin) | app/admin/capsule/[id]/ComponentsPanel.tsx | AI12 — 19 Jul 2026 | v1.8.2 | attire toggle added, access_codes toggle added, additional_phase toggle added, community_stories toggle removed (always free), service durations and labels corrected |
| Bundle Checkout API | app/api/checkout/bundle/route.ts | AI12 — 21 Jul 2026 | v1.9.7 | feature_ids in payment metadata, source param for cancel URL (dashboard returns to manage page not booking flow) |
| Regional Prices API | app/api/regional-prices/route.ts | AI12 — 21 Jul 2026 | v1.9.3 | Cloudflare cf-ipcountry header checked first — eliminates ipapi.co rate limit failures |
| featureUnlocker | lib/payments/featureUnlocker.ts | AI12 — 21 Jul 2026 | v1.9.5 | Capacity packs added to FEATURE_MAP with additive guest count logic |
| regionDetector | lib/payments/regionDetector.ts | AI12 — 21 Jul 2026 | v1.9.3 | detectRegionFromHeaders() added using cf-ipcountry |
| serviceDetails | lib/content/serviceDetails.ts | AI12 — 21 Jul 2026 | v1.9.6 | Full rewrite + all new services + send_payment_link entry |

# ═══════════════════════════════════════════════════════════════
# SECTION D — DATABASE CHANGES (v1.8.0 → v1.9.8)
# Append to Section 5 — Database Changes
# ═══════════════════════════════════════════════════════════════

| Table | Change | Migration File | Date |
|-------|--------|---------------|------|
| publication_subscribers | NEW TABLE — capsule_id, name, email, source, subscribed_at, sent_at. Unique on (capsule_id, LOWER(email)) | lc_publication_subscribers.sql | 19 Jul 2026 |
| gallery_items | NEW COLUMN — device_token (IP+UA hash for 6-photo limit enforcement) | lc_publication_subscribers.sql | 19 Jul 2026 |
| gallery_items | NEW COLUMN — storage_path (for cleanup on delete) | lc_publication_subscribers.sql | 19 Jul 2026 |
| guests | NEW COLUMN — participant_category: 'guest' \| 'event_team' \| 'organiser'. Only 'guest' counts against capacity. | guests_participant_category.sql | 19 Jul 2026 |
| lc_pricing | NEW ROWS — 3 capacity pack rows (growth, celebration, grand) with EUR and NGN prices | lc_pricing_capacity_packs_v4.sql | 19 Jul 2026 |
| platform_config (RW-Ecosystem) | 24 new config keys seeded — dday limits, tribute/story char limits, capacity thresholds and alerts, comms timing | rw_ecosystem_config_seed_v4.sql | 19 Jul 2026 |
| payments | COLUMN ENRICHED — metadata JSONB now includes feature_ids array (from v1.9.4) | No migration — data change only | 21 Jul 2026 |

# ═══════════════════════════════════════════════════════════════
# SECTION E — DESIGN DECISIONS (append to Design Decision Register)
# ═══════════════════════════════════════════════════════════════

| ID | Decision | Architecture | Date |
|----|---------|-------------|------|
| DD-NAV-002 | CapsuleBottomNav 4+1 structure: Tributes/Memories/Profile/Highlights always visible; Attire conditional on components. Event Story page accessed via phase strip only, not bottom nav. CapsulePage type: 'tribute'\|'memories'\|'profile'\|'legacy'\|'attire' | LC02 | 21 Jul 2026 |
| DD-DDAY-002 | D-Day page captures photos ONLY. Tribute text input is NOT on D-Day page — it belongs on the Tribute Wall. 6 photos per device per phase enforced server-side via device_token (IP+UA hash). | LC02 | 19 Jul 2026 |
| DD-CAP-001 | Guest capacity system: free base=150, paid base=300 (from platform_config). Capacity packs are additive (Growth +250, Celebration +750, Grand +2000). Only participant_category='guest' rows count. Alert thresholds at 70/85/95%. | LC02 | 19 Jul 2026 |
| DD-SUB-001 | Publication subscribers table captures email from four sources: tribute contributors, D-Day photo uploaders, stories room sign-ups, tribute wall sign-ups. Deduped by LOWER(email) per capsule. Dispatch is always manual (organiser controls timing). | LC03 LC05 | 19 Jul 2026 |
| DD-PAY-001 | Cancel URL from ServicesTab must include source='dashboard' so Stripe cancel redirects back to manage page, not the booking flow. | LC04 | 21 Jul 2026 |
| DD-FEAT-001 | Send Payment Link feature: organiser can enter third-party email, AI13 generates a Stripe payment link and sends it by email. Does not require the recipient to be a platform user. | LC04 | 21 Jul 2026 |
| DD-CURRENCY-001 | Currency detection order: (1) Cloudflare cf-ipcountry header, (2) x-real-ip, (3) x-forwarded-for. No longer calls ipapi.co (rate-limited). | LC04 | 21 Jul 2026 |

# ═══════════════════════════════════════════════════════════════
# SECTION F — KNOWN ISSUES UPDATE
# Replace or extend the Known Implementation Issues table
# ═══════════════════════════════════════════════════════════════

| ID | Issue | Impact | Status | Owner |
|----|-------|--------|--------|-------|
| BUG-003 | Family Rep invite email sends plain URL, no button — needs email template upgrade | Medium | Fix identified — needs rep/invite/route.ts file upload | AI13 |
| BUG-005 | ServicesTab checkbox alignment (ResizeObserver cardHeights) | Medium | Partially fixed v1.9.2 — verify after v1.9.8 deploy | AI13 |
| BUG-006 | Order history: no total spend, no expiry dates, no resend receipt option | Low | Post-launch | Founder |
| BUG-011 | Country count in Family Rep portal shows incorrect value | Low | Partially fixed (ip_country added v1.9.4) — confirm after deploy | AI13 |
| BUG-023 | Memories tab "page cannot be displayed" | High | AI13 investigating | AI13 |
| BUG-028 | Payment activation not triggering post-checkout | High | Webhook URL corrected v1.9.4 — E2E test outstanding | Founder action |
| BUG-TM-001 | TributeMap western hemisphere cutoff | Low | Pending | Claude |
| BUG-OG-001 | OG image WhatsApp preview unconfirmed on live capsule | Low | Pending — Founder to test after 24hr cache clear | Founder |

# ═══════════════════════════════════════════════════════════════
# SECTION G — PAGE ROUTES (missing entries to add)
# ═══════════════════════════════════════════════════════════════

## Capsule Experience (additions)

| Route | File | Purpose | Architecture | Status |
|-------|------|---------|-------------|--------|
| /for/[slug]/stories | app/for/[slug]/stories/page.tsx | Community Memories & Stories room | LC02 LC05 | L3 |
| /for/[slug]/dday | app/for/[slug]/dday/page.tsx | D-Day photo capture portal (photos only) | LC02 | L3 |
| /for/[slug]/display | app/for/[slug]/display/page.tsx | Live Contributor Wall — fullscreen display | LC05 | L3 |
| /for/[slug]/attire | app/for/[slug]/attire/page.tsx | Event attire coordination (conditional) | LC02 RW02 | L2 |
| /for/[slug]/story/[phaseId] | app/for/[slug]/story/[phaseId]/page.tsx | Event Story — phase narrative page | LC02 | L3 |

## Organiser Experience (additions)

| Route | File | Purpose | Architecture | Status |
|-------|------|---------|-------------|--------|
| /manage/[slug]/checkin | app/manage/[slug]/checkin/page.tsx | Usher check-in page — PIN + QR scan | LC02 RW02 | L3 |
| /publication-render/[token] | app/publication-render/[token]/page.tsx | Browser-print publication render (autoPrint=1 support) | LC03 | L3 |

## Usher / Access Control

| Route | File | Purpose | Architecture | Status |
|-------|------|---------|-------------|--------|
| /usher/[slug] | app/usher/[slug]/page.tsx | Usher interface for event day check-in | LC02 RW02 | L3 |

# ═══════════════════════════════════════════════════════════════
# END OF AI13 UPDATE BLOCK
# AI13 · Claude Sonnet 4.6 · 22 July 2026
# ═══════════════════════════════════════════════════════════════


# ==============================================================
# COMPONENT MAP -- AI13 SESSION BLOCK 2
# Date: 22 July 2026
# AI: AI13 (Claude Sonnet 4.6)
# Covers: v2.0.5 to v2.1.1 (second half of AI13 session)
# ==============================================================

# ==============================================================
# SECTION A -- Implementation Register (v2.0.5 to v2.1.1)
# ==============================================================

| Date | AI | Model | Version | Files Changed | Summary | Status |
|------|----|-------|---------|--------------|---------|--------|
| 22 Jul 2026 | AI13 | Sonnet | v2.0.5 | lib/email.ts, app/api/email/eoh-digest/route.ts, app/api/checkout/send-payment-link/route.ts, app/api/rep/invite/route.ts | Email quality pass -- unicode entities, personal greeting, amount fix, Gifting rename | Completed |
| 22 Jul 2026 | AI13 | Sonnet | v2.0.6 | components/manage/OrderHistoryPanel.tsx | Amount divided by 100 (minor units fix), expires_at field added, ExpiryBadge component | Completed |
| 22 Jul 2026 | AI13 | Opus | v2.0.7 | lib/payments/featureUnlocker.ts, app/api/capsule/orders/route.ts, app/api/webhooks/stripe/route.ts, app/api/email/gift-notification/route.ts | B1 access_codes activation fix, B7 payment confirmation email, B3 gift organiser email, per-currency order totals | Completed |
| 22 Jul 2026 | AI13 | Sonnet | v2.0.8 | app/api/checkout/bundle/route.ts, lib/payments/regionDetector.ts, app/book/page.tsx | B2 currency fix (detectRegionFromHeaders), regionDetector re-encoded, B10 Premium label | Completed |
| 22 Jul 2026 | AI13 | Sonnet | v2.0.9 | app/book/page.tsx, app/api/email/gift-schedule/route.ts, app/api/webhooks/stripe/route.ts, app/api/checkout/bundle/route.ts | B11 gift scheduled delivery -- date picker, Resend scheduledAt, webhook routing | Completed |
| 22 Jul 2026 | AI13 | Sonnet | v2.1.0 | app/page.tsx, app/api/homepage/stats/route.ts | F1 homepage showcase + live stats strip, /examples -> /#showcase | Completed |
| 22 Jul 2026 | AI13 | Sonnet | v2.1.1 | app/for/[slug]/profile/page.tsx, app/manage/[slug]/page.tsx | F2 heartfelt appreciation plaque -- gold frame, renders after event date, prefilled default text | Completed |

# ==============================================================
# SECTION B -- New Files Created (v2.0.5 to v2.1.1)
# ==============================================================

| File | Purpose | Built By | Version | Status |
|------|---------|---------|---------|--------|
| app/api/email/gift-schedule/route.ts | Scheduled gift delivery via Resend scheduledAt. Stores gift_deliver_at on capsule, schedules recipient email, sends organiser confirmation. | AI13 | v2.0.9 | L3 |
| app/api/homepage/stats/route.ts | Live platform stats (tribute count, capsule count) + featured capsules for showcase. Called client-side from homepage. | AI13 | v2.1.0 | L3 |

# ==============================================================
# SECTION C -- Modified Files (v2.0.5 to v2.1.1)
# ==============================================================

| File | Last Modified | Version | Change Summary |
|------|-------------|---------|---------------|
| lib/email.ts | AI13 -- 22 Jul 2026 | v2.0.5 | Unicode ornaments replaced with HTML entities throughout. sendKeepsakeCard and sendOrganiserWelcome both clean. |
| app/api/email/eoh-digest/route.ts | AI13 -- 22 Jul 2026 | v2.0.5 | Header badge updated to GIFTING DIGEST. Amount display removed (currency unknown). Count only shown. |
| app/api/checkout/send-payment-link/route.ts | AI13 -- 22 Jul 2026 | v2.0.5 | Amount divided by 100. Footer copy cleaned. ways_to_honour label updated to Gifting. |
| app/api/rep/invite/route.ts | AI13 -- 22 Jul 2026 | v2.0.5 | Personal greeting added (repName). Raw token URL removed from email body. |
| components/manage/OrderHistoryPanel.tsx | AI13 -- 22 Jul 2026 | v2.0.6 | formatAmount() helper divides by 100. expires_at in Order interface. ExpiryBadge component added. |
| lib/payments/featureUnlocker.ts | AI13 -- 22 Jul 2026 | v2.0.7 | access_codes key added (was missing -- root cause of B1). additional_phase key added. access_code_system alias corrected. Checks both package_tier and metadata.feature_ids. |
| app/api/capsule/orders/route.ts | AI13 -- 22 Jul 2026 | v2.0.7 | Per-currency summary grouping. expires_at added to query. ways_to_honour -> Gifting label. |
| app/api/webhooks/stripe/route.ts | AI13 -- 22 Jul 2026 | v2.0.9 | Payment confirmation email added (Step 3). Gift routing: immediate vs scheduled based on gift_deliver_at. organiser_email passed to gift-notification. |
| app/api/email/gift-notification/route.ts | AI13 -- 22 Jul 2026 | v2.0.7 | Organiser confirmation email added. Raw URL removed from recipient footer. Two separate email functions. |
| app/api/checkout/bundle/route.ts | AI13 -- 22 Jul 2026 | v2.0.9 | detectRegionFromHeaders replaces detectRegion(ip). gift_deliver_at added to body + Stripe metadata. |
| lib/payments/regionDetector.ts | AI13 -- 22 Jul 2026 | v2.0.8 | Re-encoded cleanly (was corrupted with box-drawing bytes). Logic unchanged. |
| app/book/page.tsx | AI13 -- 22 Jul 2026 | v2.0.9 | Gift delivery schedule UI -- immediate vs date/time picker. giftDeliverNow + giftDeliverAt state. Screen 5 confirmation copy updated. Premium -> With Add-ons label. |
| app/page.tsx | AI13 -- 22 Jul 2026 | v2.1.0 | STATS array replaced with live data from /api/homepage/stats. Showcase Section 8 added. /examples links -> /#showcase. useHomepageData hook. |
| app/for/[slug]/profile/page.tsx | AI13 -- 22 Jul 2026 | v2.1.1 | appreciation section type filtered from regular render loop. Gold plaque renders after event date. getSectionTitle updated. |
| app/manage/[slug]/page.tsx | AI13 -- 22 Jul 2026 | v2.1.1 | appreciation added to PROFILE_SECTION_TYPES. DEFAULT_APPRECIATION_TEXT constant. Prompt card in Profile tab when no appreciation section exists. One-click prefilled insert. |

# ==============================================================
# SECTION D -- Database Changes (v2.0.5 to v2.1.1)
# ==============================================================

| Table | Change | Migration File | Date |
|-------|--------|---------------|------|
| capsules | 5 new columns: gift_deliver_at, gift_delivered, gift_recipient_email, gift_recipient_name, gift_resend_id | gift_delivery_migration.sql | 22 Jul 2026 |
| capsules | 4 new columns: featured_on_homepage, showcase_opted_out, showcase_notified_at, showcase_qualified_at | homepage_showcase_migration.sql | 22 Jul 2026 |

# ==============================================================
# SECTION E -- Design Decisions (v2.0.5 to v2.1.1)
# ==============================================================

| ID | Decision | Date |
|----|---------|------|
| DD-GIFT-001 | Gift delivery: immediate (default) or scheduled via Resend scheduledAt. No Vercel cron. Webhook checks gift_deliver_at -- routes to gift-schedule or gift-notification accordingly. | 22 Jul 2026 |
| DD-GIFT-002 | Gift delivery date picker: datetime-local input, minimum 1hr from now, shows in local time. Stored as UTC. | 22 Jul 2026 |
| DD-SHOWCASE-001 | Homepage showcase: auto-qualify (event_date past + contrib_count >= 5), admin amendable via featured_on_homepage flag. 24hr window for organiser opt-out. Organiser notification email before activation. | 22 Jul 2026 |
| DD-APPRECIATION-001 | Heartfelt appreciation: section_type='appreciation' in capsule_profile_sections. Renders as gold plaque, always last. Only shown after event_date has passed. Default text prefilled with [honouree_name] substituted at insert time. | 22 Jul 2026 |
| DD-CURRENCY-002 | detectRegionFromHeaders() is now the canonical method for currency detection in all checkout routes. detectRegion(ip) is legacy -- kept only for backward compatibility. | 22 Jul 2026 |
| DD-MODULE-001 | Access Code, Guest Management, Attire confirmed as A+++ modules requiring dedicated full build sessions. Cannot launch with current state. Access Code first (birthday deadline 21 Aug 2026). | 22 Jul 2026 |

# ==============================================================
# SECTION F -- Known Issues Update (v2.1.1 state)
# ==============================================================

| ID | Issue | Status |
|----|-------|--------|
| BUG-001 | Access code generation silent fail | Pending -- Access Code module build |
| BUG-028 | Stripe webhook E2E not confirmed | Pending -- founder action (test payment) |
| BUG-OG-001 | OG image WhatsApp preview unconfirmed | Pending -- founder to test |
| BUG-ATTIRE-001 | Attire items not adding (404 on /api/attire/orders) | Pending -- Attire module build |
| BUG-005 | ServicesTab checkbox alignment | Pending -- founder visual QA |
| BUG-011 | Country count in Family Rep portal | Pending -- founder visual QA |

# ==============================================================
# END OF AI13 SESSION BLOCK 2
# AI13 -- Claude Sonnet 4.6 -- 22 July 2026
# ==============================================================


AI14 25 July 2026    Resumes

## Access Code System (LC02)

### Page Route
- `app/manage/[slug]/access/page.tsx` — Dedicated access code management page. Auth-gated, verifies access_codes activation, renders AccessCodeModule.

### Orchestrator
- `components/manage/access-codes/AccessCodeModule.tsx` — Tab-based orchestrator (Setup · Codes · Ushers · Live). Progressive tab locking. Contains CodesTabContent sub-component for generate + code list.

### Sub-components
- `components/manage/access-codes/AccessCodeSetup.tsx` — Hall config form with FieldWithTip tooltips, Toggle sub-component, localStorage draft persistence, validation, guidance note tracking.
- `components/manage/access-codes/GuestCodeList.tsx` — Code list with status, send all, revoke actions. (Phase 4 rebuild pending)
- `components/manage/access-codes/UsherSessionManager.tsx` — Usher PIN sessions. (Phase 7 verification pending)
- `components/manage/access-codes/AccessMetricsDashboard.tsx` — Live arrival metrics. (Phase 7 verification pending)

### Gateway
- `components/manage/ServicesTab.tsx` — Access Code System row uses externalLink to navigate to /manage/[slug]/access when activated.

- `components/manage/access-codes/SectionManager.tsx` — Venue section builder. Adapts UI per hall config: batch numbered tables, named table input, group section presets, auto tier zones. Self-contained config fetch. Sub-sections: imports/types, design tokens, hall metadata, presets/constants, component (state, fetch, create numbered, create single, create zones, delete, update capacity, render with 8 sub-blocks).

- `app/api/access-codes/generate/route.ts` — POST. Config validation (422 if missing), sent-code detection (409 warning before destructive regenerate), batch insert in 100-row chunks, valid_until from config, specific errors per stage. Sections: client, tier mapping, max_uses map, code helpers, POST handler (input validation, config check, sent-code check, guest fetch, delete, batch build, batch insert, backward-compat update, response).

- `components/manage/access-codes/GuestCodeList.tsx` — Code list with search (name/code/email), filter tabs with counts, bulk send, per-code send/resend/revoke, real-time status updates, tier accent left-borders, STATUS_LABEL map, regeneration warning banner. Sub-components: StatCard. Sections: imports/types, design tokens, status/tier maps, StatCard, main component (state, fetch, computed values, flash, sendAll, sendOne, revoke, render with 8 display blocks).

- `components/manage/access-codes/BulkGuestImport.tsx` — Bulk guest entry. Steps: input (paste/CSV), preview (duplicate check, per-entry remove, tier assignment), importing (progress bar), done. Parser: parseLine (6 format variants), parseCSV (header detection, quoted fields). POSTs to /api/guests sequentially. Sections: imports/types, design tokens, constants, parser helpers (parseLine, parseCSV), component (state, parse/preview, CSV upload, remove entry, run import, reset, render with 4 step blocks).

- `components/manage/access-codes/AccessCardPrint.tsx` — Card designer and print controller. 5 themes (Classic, Soft, Romantic, Vibrant, Spiritual), scope selector (all/unsent/tier/individual), 85×54mm card grid, @media print CSS via injected <style>, QR via /api/qr/[token]. Sub-components: AccessCard (single card renderer). Sections: imports/types, screen tokens, card themes (THEMES array), tier labels, AccessCard, main component (state, computed codes, tier list, print handler, render with controls + preview grid).

- `app/manage/[slug]/access/cards/print/page.tsx` — Print page. Auth-gated, fetches codes via /api/access-codes/list and config via /api/access-codes/config, renders AccessCardPrint. Sections: imports, supabase client, tokens, types, page component (load, loading state, error state, render).

- `components/manage/access-codes/AccessMetricsDashboard.tsx` — Live event-day arrivals dashboard. 15-second auto-refresh with pause/resume toggle and pulsing live indicator. SVG ArrivalSparkline sub-component renders arrival_trend data. Dynamic tier breakdown (only tiers with guests shown). Outstanding VVIPs panel, recent arrivals feed with tier badges, anomaly indicators (invalid scans, manual overrides). Sections: imports/types, design tokens, tier colour/label maps, ArrivalSparkline sub-component, main component (state, fetch, auto-refresh, dynamic tiers, render with 9 display blocks).

- `components/manage/access-codes/UsherSessionManager.tsx` — Usher PIN generator and session manager. CopyButton sub-component with clipboard API + textarea fallback. Check-in URL with copy button, one-time PIN display with Copy PIN and Copy PIN+URL buttons, 4-step flow explanation, create form with Enter-to-submit, session list with coloured status dots and active count badge, deactivate with confirmation. Sections: imports/types, design tokens, CopyButton sub-component, main component (state, fetch, create, deactivate, render with 7 display blocks).
---------------------------------------------
AI15

| /api/rsvp/update | POST | app/api/rsvp/update/route.ts | Circle Leader RSVP override — token-auth, circle membership guard, audit log | L3 |


# ==============================================================
# COMPONENT MAP -- AI16 SESSION BLOCK 2
# Date: 2-3 August 2026
# AI: AI16 (Claude Sonnet 4.6 / Opus 4.6)
# Covers: Event Moments spec build, terminology completion,
#         QR print, photographer portal, phase edit fix
# Versions: v2.11.11 -- v2.11.27
# Action: Append to bottom of COMPONENT_MAP.md (after Block 1)
# ==============================================================

# ==============================================================
# SECTION A -- Implementation Register (v2.11.11 -- v2.11.27)
# ==============================================================

| Date | AI | Model | Version | Files Changed | Summary | Status |
|------|----|-------|---------|--------------|---------|--------|
| 2 Aug 2026 | AI16 | Sonnet | v2.11.11 | lib/config/participationLanguage.ts | Encomium terminology added for chieftaincy, award_ceremony, ordination, birthday | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.12 | lib/config/participationLanguage.ts, components/TributeWallClient.tsx | Birthday uses Encomium; dead code removed from empty state | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.13 | components/GalleryLightbox.tsx | Gallery comments name field removed; PublicationSubscribePanel added post-comment | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.14 | app/manage/[slug]/page.tsx | Event Moments moved from standalone nav tab into Services tab | Completed |
| 2 Aug 2026 | AI16 | Opus | v2.11.15 | components/PremiumsPanel.tsx, components/CapsuleBottomNav.tsx, app/for/[slug]/page.tsx, app/for/[slug]/stories/page.tsx, app/for/[slug]/legacy/page.tsx, app/for/[slug]/profile/page.tsx | Event Moments added to Premiums panel with per-phase links; phases prop wired to CapsuleBottomNav | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.16 | app/for/[slug]/stories/page.tsx, app/for/[slug]/legacy/page.tsx, app/for/[slug]/profile/page.tsx | phases prop variable name fixes across all three pages | Completed |
| 2 Aug 2026 | AI16 | Opus | v2.11.17 | app/api/photographer/token/generate/route.ts, app/api/photographer/token/revoke/route.ts, app/api/photographer/[token]/route.ts, app/api/photographer/[token]/upload/route.ts, app/photographer/[token]/page.tsx, components/capsule/PhotographerPortalClient.tsx | Official Photography Portal -- token routes, portal page, photographer client | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.18 | app/for/[slug]/profile/page.tsx, components/CommunityStoriesClient.tsx | Profile page horizontal scroll fixed; Memories back link updated to The Voices | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.19 | components/PremiumsPanel.tsx | D-Day Captures removed from service list; Event Moments heading updated | Completed |
| 2 Aug 2026 | AI16 | Opus | v2.11.20 | app/manage/[slug]/page.tsx | EventMomentsManager properly wired into Services tab with phases fetch | Completed |
| 2 Aug 2026 | AI16 | Opus | v2.11.21 | components/manage/EventPhasesSection.tsx, app/manage/[slug]/phases/[phaseId]/print/page.tsx, components/manage/PhaseQRPrintClient.tsx | EventPhasesSection fully rebuilt; QR print page; photographer token UI | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.22 | components/CapsuleBottomNav.tsx, app/for/[slug]/story/[phaseId]/page.tsx | CapsulePage 'none' type added; phase page no longer highlights Voices tab | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.23 | app/for/[slug]/story/page.tsx | Event Story: Tribute Room → The Voices; Memories tab fix; phases prop added | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.24 | app/api/phases/route.ts, components/manage/EventMomentsManager.tsx | Phases PATCH handler added; EventMomentsManager uses public GET route for photo fetch | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.25 | app/api/event-moments/[phaseId]/upload-official/route.ts, app/api/event-moments/[phaseId]/curate/route.ts | Auth gates removed; capsule ownership check simplified for manage dashboard | Completed |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.26 | app/api/event-moments/[phaseId]/upload-official/route.ts | Compression updated with dimensions; contributor_name removed; dimensions stored | Completed — BUG-UPLOAD-001 persists |
| 2 Aug 2026 | AI16 | Sonnet | v2.11.27 | components/manage/EventPhasesSection.tsx | Phase limit fetch removed; server-side enforcement retained | Completed |

# ==============================================================
# SECTION B -- New Files Created (v2.11.11 -- v2.11.27)
# ==============================================================

| File | Purpose | Built By | Version | Status |
|------|---------|---------|---------|--------|
| app/api/photographer/token/generate/route.ts | POST generates photographer upload token per phase. 7-day expiry. One active token per phase. | AI16 Opus | v2.11.17 | Live |
| app/api/photographer/token/revoke/route.ts | POST revokes photographer token. Clears token + expiry from capsule_phases. | AI16 Opus | v2.11.17 | Live |
| app/api/photographer/[token]/route.ts | GET validates photographer token. Returns phase info + existing photo count + thumbnails. | AI16 Opus | v2.11.17 | Live |
| app/api/photographer/[token]/upload/route.ts | POST photographer uploads official photos via token. Enforces 30-photo cap. Compresses via sharp. | AI16 Opus | v2.11.17 | Live |
| app/photographer/[token]/page.tsx | Server page for Official Photography Portal. Validates token, fetches phase + capsule + existing photos. | AI16 Opus | v2.11.17 | Live |
| components/capsule/PhotographerPortalClient.tsx | Client UI for photographer upload portal. Drag-drop upload, per-file progress, existing photo grid, cap indicator. | AI16 Opus | v2.11.17 | Live |
| app/manage/[slug]/phases/[phaseId]/print/page.tsx | Server page for QR print. Fetches phase + capsule data, passes to client. | AI16 Opus | v2.11.21 | Live |
| components/manage/PhaseQRPrintClient.tsx | Premium print-ready QR card. Print + close buttons. @media print hides chrome. | AI16 Opus | v2.11.21 | Live |
| LC12_EVENT_MOMENTS_SPEC.md | Full service specification v1.0 | AI16 Opus | v1.0 | Superseded by v2.0 |
| LC12_EVENT_MOMENTS_SPEC_v2.md | Full service specification v2.0 with current build status | AI16 Opus | v2.0 | Current |
| HANDOFF_AI16_TO_AI17.md | Full handoff document for AI17 | AI16 Opus | v1.0 | Current |
| CURRENT_STATE_v5.md | Platform state document | AI16 Sonnet | v5.0 | Current |

# ==============================================================
# SECTION C -- Modified Files (v2.11.11 -- v2.11.27)
# ==============================================================

| File | Last Modified | Version | Change Summary |
|------|-------------|---------|---------------|
| lib/config/participationLanguage.ts | AI16 -- 2 Aug 2026 | v2.11.12 | Encomium for birthday, chieftaincy, award_ceremony, ordination. wallTitle, cta, singular, plural all updated. |
| components/TributeWallClient.tsx | AI16 -- 2 Aug 2026 | v2.11.12 | Dead code removed from empty state function. |
| components/GalleryLightbox.tsx | AI16 -- 2 Aug 2026 | v2.11.13 | Name field removed from comments. honoureeName prop added. PublicationSubscribePanel added post-comment. |
| components/PremiumsPanel.tsx | AI16 -- 2 Aug 2026 | v2.11.19 | phases prop added. Event Moments section with per-phase links. D-Day Captures removed from service list. |
| components/CapsuleBottomNav.tsx | AI16 -- 2 Aug 2026 | v2.11.22 | CapsulePage type extended with 'none'. phases prop added. phases passed to PremiumsPanel. |
| app/for/[slug]/page.tsx | AI16 -- 2 Aug 2026 | v2.11.15 | phases fetched (replaces phaseCount). phases passed to CapsuleBottomNav. |
| app/for/[slug]/stories/page.tsx | AI16 -- 2 Aug 2026 | v2.11.16 | phases fetch added to Promise.all. phasesData passed to CapsuleBottomNav. hasPhases updated. |
| app/for/[slug]/legacy/page.tsx | AI16 -- 2 Aug 2026 | v2.11.16 | phases variable mapped correctly for CapsuleBottomNav prop. |
| app/for/[slug]/profile/page.tsx | AI16 -- 2 Aug 2026 | v2.11.18 | overflowX hidden on outer wrapper. Card backgrounds softened. phases variable mapped for nav. |
| app/for/[slug]/story/page.tsx | AI16 -- 2 Aug 2026 | v2.11.23 | Tribute Room link renamed to The Voices. currentPage changed from memories to none. phases prop added. |
| app/for/[slug]/story/[phaseId]/page.tsx | AI16 -- 2 Aug 2026 | v2.11.22 | currentPage changed from tribute to none. |
| components/CommunityStoriesClient.tsx | AI16 -- 2 Aug 2026 | v2.11.18 | Back to Tribute Wall renamed to Back to The Voices. |
| app/manage/[slug]/page.tsx | AI16 -- 2 Aug 2026 | v2.11.20 | EventMomentsManager import added. phases state + fetch added. EventMomentsManager wired into Services tab. |
| components/manage/ServicesTab.tsx | AI16 -- 2 Aug 2026 | v2.11.19 | Event Phases section title and description updated to Event Moments -- D-Day Guest Capture. |
| components/manage/EventPhasesSection.tsx | AI16 -- 2 Aug 2026 | v2.11.21 | Full rebuild. Inline edit (was TODO). Manage Photos button per phase. Photographer token UI. QR print link. Phase limit fetch removed. |
| components/manage/EventMomentsManager.tsx | AI16 -- 2 Aug 2026 | v2.11.24 | fetchFullPhotos uses public GET route instead of missing manage endpoint. fetchPhotos references corrected. |
| app/api/phases/route.ts | AI16 -- 2 Aug 2026 | v2.11.24 | PATCH handler added (delegates to PUT). PUT reads id from body not query string. |
| app/api/event-moments/[phaseId]/upload-official/route.ts | AI16 -- 2 Aug 2026 | v2.11.26 | Auth gate removed. Compression updated with dimensions. contributor_name removed from insert. BROKEN -- BUG-UPLOAD-001. |
| app/api/event-moments/[phaseId]/curate/route.ts | AI16 -- 2 Aug 2026 | v2.11.25 | Auth gate removed. Session references removed. Capsule check simplified. |
| app/api/dday/upload/route.ts | AI16 -- 2 Aug 2026 | v2.11.26 | Compression pipeline updated to return width_px, height_px, aspect_ratio. |

# ==============================================================
# SECTION D -- Database Changes (v2.11.11 -- v2.11.27)
# ==============================================================

| Table | Change | Date |
|-------|--------|------|
| capsule_phases | NEW COLUMN -- photographer_token TEXT NULL | 2 Aug 2026 |
| capsule_phases | NEW COLUMN -- photographer_token_expires_at TIMESTAMPTZ NULL | 2 Aug 2026 |
| platform_config (RW-Ecosystem) | lc.dday.photos_per_device_per_phase updated from 6 to 5 | 2 Aug 2026 |

# ==============================================================
# SECTION E -- Design Decisions (v2.11.11 -- v2.11.27)
# ==============================================================

| ID | Decision | Date |
|----|---------|------|
| DD-ENCOMIUM-001 | Encomium terminology applied to birthday, chieftaincy, award_ceremony, ordination event types. wallTitle='Encomium Wall', cta='Share Your Encomium', singular='Encomium', plural='Encomiums'. | 2 Aug 2026 |
| DD-EM-005 | Event Moments accessed via Premiums panel only on public pages. No dedicated bottom nav tab. | 2 Aug 2026 |
| DD-EM-006 | CapsulePage type includes 'none' for pages not corresponding to a nav tab (phase pages, story pages). | 2 Aug 2026 |
| DD-EM-007 | Photographer portal URL: /photographer/[token]. Token per phase, 7-day expiry, one active at a time, revocable. | 2 Aug 2026 |
| DD-EM-008 | QR print page URL: /manage/[slug]/phases/[phaseId]/print. Opens in new tab. Premium white card design. | 2 Aug 2026 |
| DD-EM-009 | Manage dashboard does NOT use organiser_session cookie. Uses Supabase Auth. Event Moments API routes must not gate on organiser_session cookie. | 2 Aug 2026 |
| DD-EM-010 | EventMomentsManager uses the public GET /api/event-moments/[phaseId] route for photo fetching. No separate manage endpoint needed. | 2 Aug 2026 |
| DD-PHASES-001 | Phases PATCH handler delegates to PUT. PUT reads id from request body not query string. | 2 Aug 2026 |
| DD-GALLERY-001 | gallery_items has uploaded_by_name not contributor_name. aspect_ratio is numeric type in Postgres. | 2 Aug 2026 |

# ==============================================================
# SECTION F -- Bugs Closed (v2.11.11 -- v2.11.27)
# ==============================================================

| ID | Description | Fixed In |
|----|-------------|---------|
| BUG-NAV-003 | Phase page highlighted Voices tab -- wrong | v2.11.22 |
| BUG-NAV-004 | Event Story page highlighted Memories tab -- wrong | v2.11.23 |
| BUG-PHASE-EDIT | Phase edit form said "id is required" -- id was in query string not body | v2.11.25 |
| BUG-PHASE-STUB | Phase edit was a TODO stub -- no inline edit existed | v2.11.21 |
| BUG-SCROLL-001 | Profile page horizontal scroll / white foreground sliding in | v2.11.18 |
| BUG-LINK-001 | Event Story showed Tribute Room link instead of The Voices | v2.11.23 |
| BUG-LINK-002 | Memories page showed Back to Tribute Wall instead of The Voices | v2.11.18 |
| BUG-DDAY-001 | D-Day Captures still showing in Premiums panel after retirement | v2.11.19 |

# ==============================================================
# SECTION G -- Known Issues Remaining at AI16 Handoff
# ==============================================================

| ID | Issue | Priority | Notes |
|----|-------|----------|-------|
| BUG-UPLOAD-001 | Official photo upload fails with 500 -- upload-official route | Critical | See LC12_EVENT_MOMENTS_SPEC_v2.md Section 9 for full diagnostic |
| BUG-028 | Payment E2E live test | Critical | Founder action |
| BUG-CIRCLE-001 | Circle Leader RSVP endpoint missing | High | |
| BUG-RSVP-001 | RSVP token preflight | Medium | |
| BUG-003 | Family Rep invite email -- no button | Medium | |
| Guest Coordination UI | 6 files unbuilt | High | Highest structural priority |
| Publication UI | Rearrangement needed | Low | |
| Orientation-aware grid | EventMomentsClient | High | Portrait 2-col, landscape full-width |

# ==============================================================
# END OF AI16 SESSION BLOCK 2
# AI16 -- Claude Sonnet 4.6 / Opus 4.6 -- 2-3 August 2026
# ==============================================================


# COMPONENT_MAP — AI17 SESSION APPENDIX
# To be appended to COMPONENT_MAP.md
# AI17 — Claude Sonnet 4.6 / Opus 4.6 — 5 August 2026
# Platform version: v2.11.27 → v2.11.50

---

# ==============================================================
# SECTION — AI17 NEW FILES
# ==============================================================

## New API Routes

| File Path | Purpose | Method | Auth |
|-----------|---------|--------|------|
| `app/api/event-moments/[phaseId]/reorder/route.ts` | Batch update display_order for official photo reordering. Accepts `{ capsule_id, order: [{id, display_order}] }` | POST | Organiser owns capsule |
| `app/api/event-moments/[phaseId]/photos/[photoId]/route.ts` | Delete single gallery_items row + removes file from tribute-photos storage via REST | DELETE | Organiser owns capsule |
| `app/api/event-moments/[phaseId]/bulk-curate/route.ts` | Bulk PATCH on multiple photo IDs. Actions: feature, unfeature, hide, show, delete. Delete also removes storage files in parallel | PATCH | Organiser owns capsule |

## New Layout File

| File Path | Purpose |
|-----------|---------|
| `app/publication-render/layout.tsx` | Standalone minimal layout for publication render route. Prevents root layout injecting site header/footer/nav into publication PDF. Passes children through with no wrapping. |

---

# ==============================================================
# SECTION — AI17 MODIFIED FILES
# ==============================================================

## Upload Routes

### `app/api/event-moments/[phaseId]/upload-official/route.ts`
**Sections:**
- SECTION 1 — Clients (Supabase admin)
- SECTION 2 — Route config (force-dynamic, maxDuration 30)
- SECTION 3 — Compression via Sharp (.rotate() for EXIF, resize 1200px, jpeg 82)
- SECTION 4 — Direct REST storage upload (bypasses Supabase JS client SharedArrayBuffer restriction)
- SECTION 5 — POST handler (parse formData, validate, verify phase+capsule, compress, REST upload, DB insert)

**Key architecture decisions:**
- Uses `fetch()` directly to Supabase Storage REST API — NOT `db.storage.upload()`
- Bucket: `tribute-photos` (not `gallery`)
- `aspect_ratio` NOT inserted — it is a generated column
- Public URL constructed manually: `${supabaseUrl}/storage/v1/object/public/tribute-photos/${storagePath}`
- Storage cleanup on insert failure also uses REST DELETE fetch

### `app/api/dday/upload/route.ts`
**Sections:**
- SECTION 1 — Clients
- SECTION 2 — Route config
- SECTION 3 — Compression config + compressImage() with Sharp .rotate()
- SECTION 4 — Device fingerprint (SHA256 hash of IP + user-agent)
- SECTION 5 — Config reader (photo limit from platform_config)
- SECTION 6 — POST handler (validate, capsule check, device limit, compress, REST upload, insert)
- SECTION 7 — DELETE handler (device token verification, REST storage delete)

**Key changes from previous:**
- All `db.storage.from('gallery')` → REST fetch to `tribute-photos`
- `compressImage()` now calls `sharp(buffer).rotate()` before resize
- POST uses `fetch()` to Storage REST API
- DELETE uses `fetch()` to Storage REST API

---

## EventMomentsManager — Full Component Map

### `components/manage/EventMomentsManager.tsx`
**Sections:**
- SECTION 1 — Imports & types (DnD kit imports, GalleryPhoto, Phase, Props interfaces)
- SECTION 2 — Responsive columns helper (`useGridCols` hook, <600px = 2col, ≥600px = 3col)
- SECTION 3 — PhaseTab sub-component (phase tab pill button)
- SECTION 4 — ManagedPhotoCard sub-component
  - Selection checkbox (top-left, gold when selected)
  - Image container with overflow:hidden on container only (not outer card)
  - Badges: Hidden, ★ Featured, Official (top-right)
  - Action buttons: Hide/Show, Feature/Unfeature, Delete (tap-to-confirm)
  - isMobile flag: icon-only buttons on mobile (👁 ★ 🗑), text on desktop
  - confirmDelete state: 3-second window for tap-to-confirm delete
- SECTION 5 — SortablePhotoCard sub-component
  - Wraps ManagedPhotoCard with @dnd-kit useSortable
  - Drag handle ⠿ positioned top:34px right:6px (below badge row)
  - isDragging: opacity 0.5
- SECTION 6 — PhotographerTokenPanel sub-component
  - Generate/Revoke photographer upload tokens
  - WhatsApp share link (⚠️ known paste corruption point — verify `<a` tag after paste)
- SECTION 7 — SectionHeading sub-component (accepts optional `hint` prop for drag tip / save status)
- SECTION 8 — Main EventMomentsManager component
  - State: activePhaseId, photos, loading, uploading, uploadError, successMsg, uploadProgress, reordering, reorderMsg, selectedIds (Set<string>), bulkBusy, isMobile
  - `useGridCols()` hook for responsive grid columns
  - `useSensors`: PointerSensor (distance:8) + TouchSensor (delay:200, tolerance:8)
  - `fetchFullPhotos()` — GET `/api/event-moments/${activePhaseId}?limit=50&manage=1`
  - `handleAction()` — PATCH `/api/event-moments/${activePhaseId}/curate`
  - `handleDelete()` — DELETE `/api/event-moments/${activePhaseId}/photos/${photoId}`
  - `handleSelect()` — toggles single photo in selectedIds Set
  - `handleSelectAll()` — toggles all photos in a section
  - `handleBulkAction()` — PATCH `/api/event-moments/${activePhaseId}/bulk-curate`
  - `handleDragEnd()` — POST `/api/event-moments/${activePhaseId}/reorder` with optimistic UI
  - `handleOfficialUpload()` — batched upload (UPLOAD_BATCH_SIZE=5, 800ms pause between batches)
  - Bulk action bar: sticky bottom bar, appears when selectedIds.size > 0, Feature/Unfeature/Hide/Delete/Clear

---

## EventMomentsClient — Modified

### `components/capsule/EventMomentsClient.tsx`
**Key changes:**
- `GalleryPhoto` interface: `uploaded_by_name: string | null` (was `contributor_name: string`)
- `PhotoCard`: name overlay only renders when `hasName` is true (non-null, non-empty)
- `PhotoCard`: `imageOrientation: 'from-image'` on img tag
- Guest empty state: only shows when `initialOfficialPhotos.length === 0`
- Lightbox img: `imageOrientation: 'from-image'`, alt uses `uploaded_by_name ?? 'Event photo'`

---

## Phase Gallery Server Page — Modified

### `app/for/[slug]/story/[phaseId]/page.tsx`
**Key changes:**
- `export const revalidate = 0` — forces fresh data every request
- All queries use `uploaded_by_name` not `contributor_name`
- Official photos query: `.eq('approved', true)`, `.order('display_order', {ascending:true, nullsFirst:false})`, `.order('storage_path', {ascending:true})`, `.limit(30)`
- Guest photos query: `.order('created_at', {ascending:false})`, `.limit(20)`
- Error logging on official photos fetch: `console.error('[phase page] official photos error:'...)`

---

## D-Day Page — Modified

### `app/for/[slug]/dday/page.tsx`
**Key change:**
- `PhotoThumb` now accepts `capsuleId: string` prop
- Delete handler passes `capsule_id: capsuleId` (was incorrectly passing `capsule_id: photo.id`)

---

## Publication Render Page — Complete Replacement

### `app/publication-render/[token]/page.tsx`
**Sections:**
- SECTION 1 — Supabase admin client
- SECTION 2 — Data types (CapsuleData, ContributionData, GalleryItemData, GuestData, ProfileSectionData, StoryTopicData, MemoryData, ProfileGalleryItem)
- SECTION 3 — `toSignedUrl()` helper (300-second signed URLs for private storage)
- SECTION 4 — Theme style definitions (5 themes: classic, soft, romantic, vibrant, spiritual — all white pageBg)
- SECTION 5 — `renderSectionHeader()` (28px, 3px rule, 60px margin, `page-break-after:avoid`, 5 styles)
- SECTION 5b — `renderSubHeading()` (18px, gold accent bar, `page-break-after:avoid`)
- SECTION 6 — `renderCover()` (hero image, gradient overlay, name, tag, date)
- SECTION 7 — `renderHonoureeProfile()` (5 section types: biography/occasion/story/appreciation/custom)
- SECTION 8 — `renderProfileGallery()` (reads `capsule_gallery`, grouped by section_index, 3-col grid)
- SECTION 8b — `getTributeHeading(eventType)` (routes heading by event type, default: Appreciations)
- SECTION 9 — `renderTributes(section, contribs, styles, eventType)` (serial numbers, participation language)
- SECTION 10 — `renderCommunityStories()` (grouped by topic, sub-headings)
- SECTION 11 — `renderMemories()` (reads capsule_memories, grouped by era_label, graceful empty)
- SECTION 12 — `renderPhasePhotos()` (organiser-curated slots from layout_config)
- SECTION 13 — `renderOfficialPhotography()` (is_official_photography=true, 2-col premium grid, ordered by display_order)
- SECTION 14 — `renderGuestCaptures()` (is_official_photography=false, 3-col grid, "In The Room" heading)
- SECTION 15 — `renderWhoAttended()` (tier grouping, 3-column name list)
- SECTION 16 — `renderClosingMessage()` (centred, "Events end. Legacies don't.")
- SECTION 17 — Utilities: `escapeHtml()`, `formatEventDate()`
- SECTION 18 — `PublicationRenderPage` page component
  - Validates render_token
  - Fetches 8 data sources in parallel: capsule, contributions, gallery_items, guests, profile_sections, story_topics, memories, capsule_gallery
  - Resolves signed URLs for all gallery_items
  - Extracts closingSection from enabledSections — always appended last
  - Injects A4 instruction banner as HTML string (`.no-print` class, hidden on print)
  - `@page { size: 210mm 297mm; margin: Nmm; }` — explicit dimensions
  - Section assembly order: organiser sections → profile gallery → official photography → guest captures → community stories → memories → closing message

**Data sources fetched:**
- `publications` (render_token → layout_config, capsule_id)
- `capsules` (honouree_name, honouree_title, event_type, event_date, event_tag, hero_image_url, theme, cover_style)
- `contributions` (approved, not deleted)
- `gallery_items` (approved, not deleted, all — split into official/guest in renderers)
- `guests` (checked in only)
- `capsule_profile_sections` (active only, ordered by sort_order)
- `community_story_topics` (active, ordered by display_order)
- `capsule_memories` (all, ordered by created_at)
- `capsule_gallery` (all, ordered by section_index then sort_order)

---
# ==============================================================
# SECTION — KNOWN ISSUES AT AI17 HANDOFF
# ==============================================================

| ID | Issue | Priority | Notes |
|----|-------|----------|-------|
| PUB-001 | Publication Re-sync Content button missing | Critical | Photos/tributes added after pub init don't show without re-sync |
| PUB-002 | SectionNavigator missing new section types | High | official_photography, community_stories, memories, profile_gallery not in sidebar |
| PUB-003 | Publication further tweaking | High | Founder has additional review notes for AI18 |
| PUB-004 | approved_contrib_count cache drift | Medium | Run SQL reset + add decrement trigger |
| BUG-CIRCLE-001 | Circle Leader RSVP endpoint missing | High | Portal unusable without it |
| BUG-003 | Family Rep invite email: plain URL, no button | Medium | |
| BUG-028 | Payment E2E live test | Critical | Founder action required |
| GUEST-UI | Guest Coordination UI — 6 files unbuilt | High | Backend complete, UI gap |
| SECURITY | RLS hardening — dedicated session needed | Post-launch | 5 tables RLS disabled, permissive policies |
| OPTION-C | Client-side image compression | Post-launch | Browser-image-compression npm package |
| EMAIL-DIST | Publication email distribution UI | Post-launch | publication_subscribers table + Resend ready |

# ==============================================================
# END OF AI17 SESSION BLOCK
# AI17 — Claude Sonnet 4.6 / Opus 4.6 — 4-5 August 2026
# v2.11.27 → v2.11.50 | 23 versions | 4 files created | 8 files modified
# ==============================================================


Confirmed. Here are the surgical find and replace instructions for both files.

---

## FILE A: `app/publication-render/[token]/page.tsx`

---

### Change 1 — Remove banner, add floating print button

**FIND** (lines 878–883):
```
  // ── A4 instruction banner (screen only, hidden on print) ───
  const bannerHtml = `<div class="no-print" style="position:sticky; top:0; left:0; right:0; z-index:9999; background:#1a0845; color:#E2C36B; padding:10px 20px; font-size:12px; font-family:system-ui,sans-serif; display:flex; align-items:center; gap:16px; justify-content:center;">
    <span>📄</span>
    <span>In the print dialog: set <strong>Paper size → A4</strong> and <strong>Margins → None</strong> for best results</span>
  </div>
  <div class="no-print" style="height:8px;"></div>`;
```

**REPLACE WITH:**
```
  // ── Floating print button (screen only, hidden on print) ───
  const printButtonHtml = `<div class="no-print" style="position:fixed; top:16px; right:16px; z-index:9999;">
    <button onclick="window.print()" style="display:flex; align-items:center; gap:8px; padding:9px 18px; border-radius:24px; background:#1a0845; border:1px solid rgba(226,195,107,0.35); color:#E2C36B; font-size:12px; font-family:system-ui,sans-serif; font-weight:600; cursor:pointer; box-shadow:0 4px 16px rgba(0,0,0,0.3); letter-spacing:0.04em;">
      <span>🖨</span><span>Print / Save PDF</span>
    </button>
  </div>`;
```

---

### Change 2 — Update the body injection to use the new variable name

**FIND** (line 917):
```
        __html: bannerHtml + sectionHtml + autoPrintScript
```

**REPLACE WITH:**
```
        __html: printButtonHtml + sectionHtml + autoPrintScript
```

---

### Change 3 — Fix cover page height (spillover onto page 2)

**FIND** (line 280, inside `renderCover()`):
```
  return `<div style="min-height:100vh; background:${styles.coverBg}; color:${styles.coverTextColor}; display:flex; flex-direction:column; justify-content:flex-end; page-break-after:always; position:relative; overflow:hidden;">
```

**REPLACE WITH:**
```
  return `<div style="height:297mm; background:${styles.coverBg}; color:${styles.coverTextColor}; display:flex; flex-direction:column; justify-content:flex-end; page-break-after:always; position:relative; overflow:hidden;">
```

---

### Change 4 — Update file header version

**FIND:**
```
 *   — v2.11.49: Screen-only A4 instruction banner (hidden on print)
```

**REPLACE WITH:**
```
 *   — v2.11.51: Banner removed; floating print button added (screen only)
 *   — v2.11.51: Cover height fixed to 297mm (was min-height:100vh — caused page 2 spillover)
 *   — v2.11.49: Screen-only A4 instruction banner (hidden on print)
```

---

## FILE B: `app/manage/[slug]/page.tsx`

---

### Change 5 — Add Delete and Hide/Show buttons to section action row

**FIND** (inside `SectionEditor`, the Save button action row):
```
  <div
    style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center',
    }}
  >
    <button
      onClick={() =>
        handleSaveEdit(
          s.id,
          drafts[s.id]?.title ?? '',
          drafts[s.id]?.content ?? ''
        )
      }
      style={{
        padding: '6px 14px',
        borderRadius: '8px',
        border: 'none',
        background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
        color: '#1a0845',
        fontWeight: 700,
        fontSize: '11px',
        cursor: 'pointer',
      }}
    >
      Save
    </button>
  </div>
```

**REPLACE WITH:**
```
  <div
    style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center',
    }}
  >
    <button
      onClick={() =>
        handleSaveEdit(
          s.id,
          drafts[s.id]?.title ?? '',
          drafts[s.id]?.content ?? ''
        )
      }
      style={{
        padding: '6px 14px',
        borderRadius: '8px',
        border: 'none',
        background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
        color: '#1a0845',
        fontWeight: 700,
        fontSize: '11px',
        cursor: 'pointer',
      }}
    >
      Save
    </button>
    <button
      onClick={() => handleToggle(s)}
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        border: `1px solid ${cardBorder}`,
        background: 'transparent',
        color: s.is_active ? textFaint : goldMuted,
        fontSize: '11px',
        cursor: 'pointer',
      }}
    >
      {s.is_active ? 'Hide' : 'Show'}
    </button>
    <DeleteSectionButton onDelete={() => handleDelete(s.id)} />
  </div>
```

---

### Change 6 — Add the `DeleteSectionButton` sub-component

This needs to be placed just **above** the `SectionEditor` function definition. 

**FIND:**
```
/* -- SECTION EDITOR -- NO character limits --------------- */
function SectionEditor({
```

**REPLACE WITH:**
```
/* -- DELETE SECTION BUTTON — tap-to-confirm -------------- */
function DeleteSectionButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)
  if (confirming) {
    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: textFaint }}>Remove section?</span>
        <button
          onClick={() => { onDelete(); setConfirming(false) }}
          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: 'rgba(248,113,113,0.8)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
        >
          Yes, remove
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${cardBorder}`, background: 'transparent', color: textFaint, fontSize: '11px', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    )
  }
  return (
    <button
      onClick={() => setConfirming(true)}
      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.55)', fontSize: '11px', cursor: 'pointer' }}
    >
      ✕ Remove
    </button>
  )
}

/* -- SECTION EDITOR -- NO character limits --------------- */
function SectionEditor({
```

---

### Change 7 — Update file header version

**FIND:**
```
// VERSION:   v2.1.1
// DATE:      22 July 2026
```

**REPLACE WITH:**
```
// VERSION:   v2.1.2
// DATE:      5 August 2026
// UPDATED:   AI18 — delete + hide/show buttons wired to profile section editor
```

---

## After Both Edits

Run your build check:
```
npm run build
```

Then git commit:
```
git add . ; git commit -m "v2.11.51 - Publication: remove banner, add print button, fix cover height to 297mm; Manage: profile section delete + hide/show buttons wired" ; git push origin main
```

---

## Component Map Additions to Note

After confirming the build is clean, the following should be added to `COMPONENT_MAP.md`:

| Component | File | Change | Date |
|---|---|---|---|
| `DeleteSectionButton` | `app/manage/[slug]/page.tsx` | NEW sub-component — tap-to-confirm delete for profile sections | 5 Aug 2026 |
| `SectionEditor` | `app/manage/[slug]/page.tsx` | Delete and Hide/Show buttons now wired to action row | 5 Aug 2026 |
| Publication Render Page | `app/publication-render/[token]/page.tsx` | Banner removed; floating print button added; cover height fixed to 297mm | 5 Aug 2026 |

## COMPONENT MAP ADDITIONS DURING AI18 SESSION
Component	File	Change	Date
VoiceMetrics	components/LegacyRoomClient.tsx	NEW exported type — voice intelligence metrics object	6 Aug 2026
ActivityItem	components/LegacyRoomClient.tsx	NEW exported type — unified activity feed item	6 Aug 2026
MetricRow	components/LegacyRoomClient.tsx	NEW — label/value metric row component	6 Aug 2026
DistributionBar	components/LegacyRoomClient.tsx	NEW — CSS horizontal bar chart row	6 Aug 2026
RankedBar	components/LegacyRoomClient.tsx	NEW — ranked list with bar and percentage	6 Aug 2026
LegacyRoomClient	components/LegacyRoomClient.tsx	Major upgrade — 5 new sections, participation language throughout, live pub status	6 Aug 2026
computeVoiceMetrics	app/for/[slug]/legacy/page.tsx	NEW server-side function — all metrics computed before client render	6 Aug 2026
renderCollectionIntelligence	app/publication-render/[token]/page.tsx	NEW — 2-column premium metrics page in publication PDF	6 Aug 2026

## COMPONENT MAP ADDITIONS DURING AI18 SESSION

| Component | File | Change |
|-----------|------|--------|
| `VoiceMetrics` | `components/LegacyRoomClient.tsx` | NEW exported type |
| `ActivityItem` | `components/LegacyRoomClient.tsx` | NEW exported type |
| `MetricRow` | `components/LegacyRoomClient.tsx` | NEW — label/value pair |
| `DistributionBar` | `components/LegacyRoomClient.tsx` | NEW — CSS bar chart row |
| `RankedBar` | `components/LegacyRoomClient.tsx` | NEW — ranked list with bar |
| `StatTooltip` | `components/LegacyRoomClient.tsx` | NEW — tap-to-reveal tooltip panel |
| `StatCard` | `components/LegacyRoomClient.tsx` | Updated — tooltip props, ⓘ indicator |
| `ActivityRow` | `components/LegacyRoomClient.tsx` | Updated — type pills (VOICE/MEMORY/MOMENT) |
| `DistributionSummary` | `components/publication/PublicationEditor.tsx` | NEW — persistent email stats panel |
| `AppreciationButton` | `app/manage/[slug]/page.tsx` | NEW — loading/saved states |
| `SectionEditor` | `app/manage/[slug]/page.tsx` | Save button: Saving/Saved states |
| `renderWorldMap` | `app/publication-render/[token]/page.tsx` | NEW — SVG dot map |
| `renderCollectionIntelligence` | `app/publication-render/[token]/page.tsx` | NEW — renamed Capsule Highlights |
| `renderClosingMessage` | `app/publication-render/[token]/page.tsx` | Redesigned — premium LC brand page |
| `computeVoiceMetrics` | `app/for/[slug]/legacy/page.tsx` | NEW — server-side metrics computation |
| `COUNTRY_NAME_TO_ISO` | `app/publication-render/[token]/page.tsx` | NEW — full country name to ISO lookup |
| `countryToIso` | `app/publication-render/[token]/page.tsx` | NEW — resolver function |
| `SECTION_WRAP` | `app/publication-render/[token]/page.tsx` | NEW — horizontal padding constant |

## NEW FILES CREATED DURING AI18 SESSION

| File | Purpose |
|------|---------|
| `app/api/publication/family-preview/route.ts` | Tier 1 — family preview send |
| `app/api/publication/named-send/route.ts` | Tier 2 — named individual send |
| `app/api/og/generate/route.ts` | Moved from `app/api/og/[slug]/generate/route.ts` |

# ==============================================================
# COMPONENT MAP -- AI16 SESSION BLOCK 3
# Date: 9 August 2026
# AI: AI16 (Claude Sonnet 4.6 / Opus 4.6)
# Covers: Stories room redesign, reactions, OG fixes,
#         relationship question engine, terminology,
#         notification dots, Stories discovery sprint
# Versions: v2.11.49 -- v2.11.60
# Action: Append to bottom of COMPONENT_MAP.md (after Block 2)
# ==============================================================

# ==============================================================
# SECTION A — Implementation Register (v2.11.49 -- v2.11.60)
# ==============================================================

| Date | AI | Model | Version | Files Changed | Summary | Status |
|------|----|-------|---------|--------------|---------|--------|
| 9 Aug 2026 | AI16 | Sonnet | v2.11.49 | lib/config/participationLanguage.ts | Event-aware CTA strings refined — ordination Offer Your Blessing, anniversary Share Your Celebration, wedding Share Your Blessing, graduation Send Your Congratulations, award Encomium | Completed |
| 9 Aug 2026 | AI16 | Sonnet | v2.11.50 | components/TributeWallClient.tsx, components/LegacyRoomClient.tsx, app/for/[slug]/legacy/page.tsx, lib/email.ts, app/api/email/submission-confirmation/route.ts | Stories discovery sprint — Voices wall teaser, post-submission prompt, Highlights preview strip, keepsake email mention, confirmation email link | Completed — TributeWallClient confirmed by AI19; other files not confirmed |
| 9 Aug 2026 | AI16 | Sonnet | v2.11.51 | app/for/[slug]/legacy/page.tsx, components/LegacyRoomClient.tsx | Stories preview strip wired — recentStories fetch corrected (was duplicate), prop passed to LegacyRoomClient | Completed |
| 9 Aug 2026 | AI16 | Sonnet | v2.11.52 | components/TributeWallClient.tsx | Voices wall textarea placeholder now uses lang.cta (event-aware) | Completed |
| 9 Aug 2026 | AI16 | Opus | v2.11.53 | lib/utils/getRelationshipQuestion.ts (NEW), components/TributeWallClient.tsx, components/CommunityStoriesClient.tsx, lib/eventLabels.ts | Relationship question engine — honorific stripping, event-aware question, gated options (Legacy Beneficiary/Caregiver gated), memorial uses full name past tense | Completed |
| 9 Aug 2026 | AI16 | Sonnet | v2.11.54 | components/TributeWallClient.tsx, components/CommunityStoriesClient.tsx, lib/eventLabels.ts | Event-aware relationship options and question wired across all entry points | Completed |
| 9 Aug 2026 | AI16 | Sonnet | v2.11.55 | lib/email.ts, app/api/email/submission-confirmation/route.ts, components/LegacyRoomClient.tsx, app/for/[slug]/legacy/page.tsx | Stories discovery — keepsake card Stories mention, confirmation email Stories link and copy fix, Highlights preview, recentStories select updated with story_text and topic join | Completed |
| 9 Aug 2026 | AI16 | Opus | v2.11.56 | components/CommunityStoriesClient.tsx (FULL REDESIGN), app/api/stories/react/route.ts (NEW), app/api/stories/reactions/route.ts (NEW) | Stories room full redesign — scrollable feed, StoryCard with reactions, TopicExplorer, filter, AddTopicInline, emotional empty state, SubmitStoryPanel preserved | Completed |
| 9 Aug 2026 | AI16 | Sonnet | v2.11.57 | app/for/[slug]/stories/page.tsx | Stories page — community_story_topics join added to contributions fetch so topic_name visible on cards | Completed |
| 9 Aug 2026 | AI16 | Sonnet | v2.11.58 | components/CommunityStoriesClient.tsx | StoryCard redesigned — topic prominent on line 1 (gold, italic), date right-aligned, serial number in circle, name/relationship on line 2 | Completed |
| 9 Aug 2026 | AI16 | Sonnet | v2.11.59 | components/TributeWallClient.tsx | Stories Room teaser copy updated — Also Visit the Stories Room, personalised text with honouree name | Completed |
| 9 Aug 2026 | AI16 | Sonnet | v2.11.60 | app/for/[slug]/stories/page.tsx | Stories page — latestMemoryAt and latestVoiceAt passed to CapsuleBottomNav for notification dot | In progress — duplicate variable error being fixed |

# ==============================================================
# SECTION B — New Files Created (v2.11.49 -- v2.11.60)
# ==============================================================

| File | Purpose | Path | Built By | Version | Status |
|------|---------|------|---------|---------|--------|
| getRelationshipQuestion.ts | Event-aware relationship question and options. Strips honorific prefixes (getFamiliarName). Returns correct question per event type. Gates Legacy Beneficiary and Caregiver/Healthcare Worker to relevant event types. Returns wedding-specific options list. | lib/utils/getRelationshipQuestion.ts | AI16 Opus | v2.11.53 | Live |
| react/route.ts | POST toggle a reaction (heart/prayer/star/sad/clap/dove) on a community story. Uses story_reactions table keyed to contribution_id. Optimistic toggle — insert or delete. Returns updated counts. | app/api/stories/react/route.ts | AI16 Opus | v2.11.56 | Live |
| reactions/route.ts | GET batch reaction counts and current device's reactions for multiple stories. Called once on Stories room load. Query: ?story_ids=x,y&device_token=abc. | app/api/stories/reactions/route.ts | AI16 Opus | v2.11.56 | Live |

# ==============================================================
# SECTION C — Modified Files (v2.11.49 -- v2.11.60)
# ==============================================================

| File | Path | Last Modified | Version | Change Summary |
|------|------|-------------|---------|---------------|
| participationLanguage.ts | lib/config/participationLanguage.ts | AI16 · 9 Aug 2026 | v2.11.49 | ordination cta → Offer Your Blessing. anniversary → Celebration Wall / Share Your Celebration / Celebration/Celebrations. wedding cta → Share Your Blessing (singular). graduation cta → Send Your Congratulations. award → Encomium Wall / Share Your Encomium. |
| getRelationshipQuestion.ts | lib/utils/getRelationshipQuestion.ts | AI16 · 9 Aug 2026 | v2.11.53 | NEW — see Section B |
| TributeWallClient.tsx | components/TributeWallClient.tsx | AI16/AI19 · 9 Aug 2026 | v2.11.59 | Stories teaser card added below header (Also Visit the Stories Room). Post-submission Stories prompt added. Textarea placeholder uses lang.cta. RELATIONSHIP_OPTIONS and getRelationshipOptions replaced with import from getRelationshipQuestion utility. RelationshipSelect label and placeholder use getRelationshipQuestion(). |
| CommunityStoriesClient.tsx | components/CommunityStoriesClient.tsx | AI16 · 9 Aug 2026 | v2.11.58 | FULL REDESIGN v3.0.0. Fixed-height (420px) scrollable story feed. StoryCard: topic prominent line 1 (gold italic), date right, serial number in circle, name/relationship line 2. Reactions strip (6 types). AddTopicInline per category with category notice. TopicExplorer: category dropdown + topic chips + Write CTA. Filter chip. Emotional empty state (Playfair Display italic). SubmitStoryPanel preserved with grouped topics. RELATIONSHIP_OPTIONS replaced with utility import. |
| LegacyRoomClient.tsx | components/LegacyRoomClient.tsx | AI16 · 9 Aug 2026 | v2.11.55 | recentStories prop added to Props interface and component signature. Stories preview section added between Recently Joined and Gallery sections. Each story card links to /for/[slug]/stories. |
| email.ts | lib/email.ts | AI16 · 9 Aug 2026 | v2.11.55 | Stories room link added to keepsake card HTML — after share URL, before closing td. Emotional LC-standard copy. |
| submission-confirmation/route.ts | app/api/email/submission-confirmation/route.ts | AI16 · 9 Aug 2026 | v2.11.55 | Stories room invitation added before view wall link. Stale tribute language fixed (Edit your tribute → Edit your ${lang.singular}). View tribute wall → View [subjectName]'s record. |
| stories/page.tsx | app/for/[slug]/stories/page.tsx | AI16 · 9 Aug 2026 | v2.11.60 | latestStory fetch corrected (was referencing community_stories — fixed to contributions WHERE story_topic_id IS NOT NULL). community_story_topics join added to stories select for topic_name on cards. latestVoiceAt and latestMemoryAt passed to CapsuleBottomNav. |
| legacy/page.tsx | app/for/[slug]/legacy/page.tsx | AI16 · 9 Aug 2026 | v2.11.55 | recentStories select updated to include story_text and community_story_topics(topic_name) join. recentStories mapped and passed to LegacyRoomClient. latestVoiceAt fetched and passed to CapsuleBottomNav. |
| eventLabels.ts | lib/eventLabels.ts | AI16 · 9 Aug 2026 | v2.11.54 | getRelationshipLabel now delegates to getRelationshipQuestion utility. Import added. |

# ==============================================================
# SECTION D — Database Changes (v2.11.49 -- v2.11.60)
# ==============================================================

| Table | Change | Date | Notes |
|-------|--------|------|-------|
| story_reactions | NEW TABLE — contribution_id UUID FK, capsule_id UUID FK, emoji TEXT CHECK IN (heart/prayer/star/sad/clap/dove), ip_hash TEXT, UNIQUE(contribution_id, ip_hash, emoji) | 9 Aug 2026 | Reactions on community stories (stored in contributions with story_topic_id set) |

# ==============================================================
# SECTION E — Design Decisions (v2.11.49 -- v2.11.60)
# ==============================================================

| ID | Decision | Date |
|----|---------|------|
| DD-REL-001 | Relationship question is event-aware. Birthday/thanksgiving = Who is the celebrant to you? Retirement = Who is the retiree to you? Memorial = Who was [FullName] to you? (past tense, full name). Wedding/anniversary = Who are you to the couple? Chieftaincy/ordination/award = Who is the honouree to you? Graduation = Who is the graduate to you? Default = Who is [FamiliarName] to you? (honorifics stripped). | 9 Aug 2026 |
| DD-REL-002 | getFamiliarName() strips known honorific prefixes (His, Her, Prof, Dr, Rev, Chief, Oba, Alhaji etc) and returns first meaningful name word. Prevents Who is His to you? for His Royal Highness Shadamoro. | 9 Aug 2026 |
| DD-REL-003 | Legacy Beneficiary option gated to memorial, retirement, chieftaincy event types only. Caregiver/Healthcare Worker gated to memorial and retirement only. Community Leader/Guide renamed to Community Leader (universal). | 9 Aug 2026 |
| DD-REL-004 | Wedding/anniversary event types use dedicated WEDDING_RELATIONSHIP_OPTIONS list (Friend of Bride/Groom, Parent of Bride/Groom, Best Man/Maid of Honour, Groomsman/Bridesmaid etc). General list not shown for weddings. | 9 Aug 2026 |
| DD-STORIES-002 | Community stories stored in contributions table with story_topic_id set (not a separate community_stories table — that table does not exist). All queries must use contributions WHERE story_topic_id IS NOT NULL. | 9 Aug 2026 |
| DD-STORIES-003 | Stories room redesigned: flat feed first (scrollable, newest first), topic explorer below. Categories are entry points to topics, not primary navigation. Stories content leads, structure follows. | 9 Aug 2026 |
| DD-STORIES-004 | Story reactions use story_reactions table keyed to contribution_id. Device identity via localStorage UUID (lc_device_token). One reaction type per device per story (same device can react with multiple types). Counts public. Toggle on/off. | 9 Aug 2026 |
| DD-STORIES-005 | StoryCard hierarchy: Line 1 = Topic name (gold, italic, prominent) + Date. Line 2 = Serial number (circle) + Contributor name + Relationship. Serial = total - index (newest = highest number, matches Voices wall pattern). | 9 Aug 2026 |
| DD-STORIES-006 | Empty state for Stories room uses Playfair Display italic emotional copy in three paragraphs. After first story is added, empty state disappears (feed shows). | 9 Aug 2026 |
| DD-OG-004 | OG image URL simplified to slug-only — no query params, no cache-buster. Format: /api/og/[slug] only. Fully stable and cacheable by WhatsApp and social platforms. | 9 Aug 2026 |
| DD-OG-005 | Static OG images generated and stored in tribute-photos Supabase storage under og/[capsule_id].png. og_image_url column on capsules table. Public wall page reads og_image_url first, falls back to dynamic route. | 9 Aug 2026 |

# ==============================================================
# SECTION F — Bugs Closed (v2.11.49 -- v2.11.60)
# ==============================================================

| ID | Description | Fixed In |
|----|-------------|---------|
| BUG-STORIES-001 | Stories room queried community_stories table which doesn't exist — no stories ever displayed | v2.11.56 (page.tsx corrected to query contributions WHERE story_topic_id IS NOT NULL) |
| BUG-STORIES-002 | Topic names not showing on story cards — join to community_story_topics missing from fetch | v2.11.57 |
| BUG-REL-001 | Relationship question showed first word of name — Who is His to you? for His Royal Highness Shadamoro | v2.11.53 |
| BUG-REL-002 | Relationship options not event-aware — Legacy Beneficiary shown for weddings, Caregiver shown for birthdays | v2.11.53 |
| BUG-OG-002 | OG image URL had changing cache-buster timestamp — WhatsApp could not cache reliably | v2.11.39 |
| BUG-OG-003 | cover_attributes=%7B%7D appended to OG URL when empty | v2.11.29 |
| BUG-LANG-005 | submit page textarea placeholder hardcoded Share your voice instead of event-aware lang.cta | v2.11.52 |
| BUG-EMAIL-001 | Submission confirmation email contained tribute terminology (Edit your tribute, View tribute wall) | v2.11.55 |

# ==============================================================
# SECTION G — Known Issues Remaining at v2.11.60
# ==============================================================

| ID | Issue | Priority | Notes |
|----|-------|----------|-------|
| BUG-UPLOAD-001 | Official photo upload fails — upload-official route 500 error | Critical | Suspected aspect_ratio type mismatch or uploaded_by_name constraint. Check Vercel logs. |
| BUG-028 | Payment E2E live test not confirmed | Critical | Founder action |
| BUG-CIRCLE-001 | Circle Leader RSVP endpoint missing | High | |
| BUG-003 | Family Rep invite email — no button | Medium | |
| Guest Coordination UI | 6 files unbuilt | High | |
| Stories dot fix | latestStory/latestVoice redeclaration in stories/page.tsx | In progress | Delete duplicate fetches added at lines 159-176 |
| OG static backfill | Remaining capsules need /api/og/generate called | Low | Run console script per capsule |

# ==============================================================
# SECTION H — File Path Quick Reference (new/changed this block)
# ==============================================================

| File | Full Path |
|------|-----------|
| Relationship Question Utility | lib/utils/getRelationshipQuestion.ts |
| Story React API | app/api/stories/react/route.ts |
| Story Reactions GET API | app/api/stories/reactions/route.ts |
| OG Generate API | app/api/og/generate/route.ts |
| Stories Room Client | components/CommunityStoriesClient.tsx |
| Stories Room Page | app/for/[slug]/stories/page.tsx |
| Participation Language Config | lib/config/participationLanguage.ts |
| Keepsake Email | lib/email.ts |
| Submission Confirmation Email | app/api/email/submission-confirmation/route.ts |
| Highlights Page | app/for/[slug]/legacy/page.tsx |
| Legacy Room Client | components/LegacyRoomClient.tsx |
| Voices Wall Client | components/TributeWallClient.tsx |
| Event Labels | lib/eventLabels.ts |
| story_reactions table | Supabase LC operational (Frankfurt) |
| capsules.og_image_url column | Supabase LC operational (Frankfurt) |

# ==============================================================
# END OF AI16 SESSION BLOCK 3
# AI16 -- Claude Sonnet 4.6 / Opus 4.6 -- 9 August 2026
# ==============================================================

# ==============================================================
# COMPONENT MAP — AI19 SESSION BLOCK
# AI19 — Claude Sonnet 4.6 — 9 August 2026
# Platform: AI19v2.11.65 → AI19v2.11.87
# ==============================================================

# ==============================================================
# SECTION A — Session Work Log (AI19v2.11.65 — AI19v2.11.87)
# ==============================================================

| Date | AI | Model | Version | Files Changed | Summary | Status |
|------|----|----|---------|--------------|---------|--------|
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.65 | app/publication-render/[token]/page.tsx, lib/publication/types.ts, lib/publication/autoArrange.ts, components/publication/SectionNavigator.tsx | Cover+closing spill fixed via named @page CSS rules (cover-page, closing-page both margin:0mm). who_attended removed from render page, types, SectionNavigator, autoArrange. box-sizing:border-box on closing page. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.66 | components/publication/PublicationEditor.tsx | handleRegenerate now calls /api/publication/init first then preview-token. Layout state refreshes from init response. setPubVersion updates from token response. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.67 | app/api/publication/init/route.ts, app/api/publication/preview-token/route.ts | reconcileLayoutConfig() added — runs on every Regenerate. Adds missing world_map, rebuilds auto phase sections, ensures closing last. preview-token: intelligent version bump via MD5 hash vs distributed_layout_hash. TypeScript fixes throughout. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.68 | app/publication-render/[token]/page.tsx, lib/publication/autoArrange.ts, components/publication/SectionNavigator.tsx | World map SVG continent paths replaced with equirectangular projection. ip_country as primary country source. renderAppreciationBlock added (SECTION 5B). Appreciation filtered from renderHonoureeProfile. autoArrange includes world_map in default order. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.69 | app/publication-render/[token]/page.tsx | Engagement breakdown added to renderCollectionIntelligence (correct scope). escapeHtml and formatEventDate hoisted to SECTION 3B before all renderers. Duplicate appreciation render removed. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.70 | app/publication-render/[token]/page.tsx | renderPhasePhotos REWRITTEN — was reading slot.gallery_item_id (non-existent field). Now correctly reads slot.slot_type, slot.photo_id (feature), slot.photos[n].photo_id (double/triple). Event Moments photos now actually render in publication. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.71 | app/publication-render/[token]/page.tsx | Countries breakdown moved from Capsule Highlights right column to World Map page (ranked table below bubble chart). Engagement breakdown finalised in renderCollectionIntelligence. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.72 | app/publication-render/[token]/page.tsx, lib/publication/autoArrange.ts, app/api/publication/init/route.ts | World map replaced with abstract bubble chart (Option C — circles sized by contributor count). buildPhaseSection exported from autoArrange. reconcileLayoutConfig v2: rebuilds auto phase slots from current gallery_items. seenPhaseIds deduplication. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.73 | app/publication-render/[token]/page.tsx | renderForeword() added (SECTION 5C). Emotional intro copy ~100 words. Dynamic participation language. "Capsule Digital Publication Content" TOC. Renders as page 2 via page-break-after on cover. Wired into main render pipeline. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.74 | app/publication-render/[token]/page.tsx | SECTION_FOOTER constant created. Applied to all 12 section renderers. Foreword: LC closing sentence + URL below TOC. Closing page: CTA tagline "Captures and Preserves Memories for ALL your events" + prominent URL. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.75 | app/publication-render/[token]/page.tsx | Cover: "DIGITAL PUBLICATION / by LegacyCapsule" label. World map renamed to "Contributors Country Spread". Relationship categories: pills → metricRow in right column. Official Photography count label removed from photo pages. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.76 | app/publication-render/[token]/page.tsx | ip_country confirmed as full country name (not ISO). renderWorldMap and renderCollectionIntelligence updated. Duplicate COUNTRY_NAME_TO_ISO keys removed. Greece, Romania, Hungary, Czech Republic, Slovakia added. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.77 | app/api/publication/named-send/route.ts (NEW), app/api/publication/purge-section/route.ts (NEW), components/publication/PublicationEditor.tsx, components/publication/PhotoSection.tsx, app/api/publication/init/route.ts | Named Send route created. Multi-recipient UI with staged list. purge-section route created. Purge & Rebuild button in PhotoSection (two-step confirm). onPurged callback in editor. who_attended purged from layout_config in reconciliation. Editor aside: inline styles for padding. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.78 | app/publication-render/[token]/page.tsx, lib/publication/autoArrange.ts, app/api/publication/init/route.ts | Phase section headers show event date + venue. buildPhaseSection carries phase_date and phase_venue. Caption labels removed from all photo slot renderers. Promise.all query order fixed (gallery before phases). | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.79 | app/api/community-topics/submit/route.ts | page_state check removed — contributor routes must never gate on activation status. Capsule existence check only. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.80 | app/api/community-topics/submit/route.ts | story_topic_id FormData null string coercion — "null" string correctly coerced to null. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.81 | app/api/community-topics/submit/route.ts | Route now accepts both multipart/form-data and JSON. Email field: contributor_email → email. capsule_slug added to submit body. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.82 | components/CommunityStoriesClient.tsx | SubmitStoryPanel receives defaultCategory prop. New topic proposed within category stays in that category (was always defaulting to General). | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.83 | app/for/[slug]/page.tsx | Voices page contributions query adds .is('story_topic_id', null). Community stories no longer appear on Voices wall. Server-side ISR fix. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.84 | components/CapsuleBottomNav.tsx, app/for/[slug]/stories/page.tsx, app/publication-render/[token]/page.tsx | Memories tab renamed to Stories. Page metadata updated. renderCommunityStories header → "Community Stories". | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.85 | app/publication-render/[token]/page.tsx, app/api/publication/init/route.ts, components/publication/PublicationEditor.tsx | Foreword TOC: Contributors Country Spread, event-aware Tributes, Capsule Highlights, Family Appreciation added. Heading: Capsule Digital Publication Content. Reconciliation removes official_photography and guest_captures. Editor aside min-width enforced. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.86 | app/for/[slug]/legacy/page.tsx | storiesCount reads from contributions WHERE story_topic_id IS NOT NULL (not empty community_stories table). photo_count computed live from gallery_items. momentsCount adds deleted_at guard. | Completed |
| 9 Aug 2026 | AI19 | Sonnet | AI19v2.11.87 | components/TributeWallClient.tsx | poll() adds .is('story_topic_id', null) filter. Prevents community stories appearing in Voices wall on 60-second refresh cycle. Definitive client-side companion to AI19v2.11.83. | Completed |

# ==============================================================
# SECTION B — New Files Created (AI19v2.11.65 — AI19v2.11.87)
# ==============================================================

| File | Purpose | Path | Built By | Version | Status |
|------|---------|------|---------|---------|--------|
| named-send/route.ts | POST /api/publication/named-send — sends publication URL to one or more named recipients. Multi-recipient support. Emotional email template. Logs each send. | app/api/publication/named-send/route.ts | AI19 Sonnet | AI19v2.11.77 | Live |
| purge-section/route.ts | POST /api/publication/purge-section — purges and rebuilds a specific phase_photos section from current gallery_items. Clears stale slots. Returns new layout_config. | app/api/publication/purge-section/route.ts | AI19 Sonnet | AI19v2.11.77 | Live |
| LC_EMOTIONAL_COMMUNICATION_STANDARD.md | Applied tone and copy guide. Governs all user-facing copy across emails, publication, UI, confirmations. Five Emotional Pillars. Forbidden phrases. Standing approved phrases. AI instance rules. | /mnt/project/ (upload to project knowledge) | AI19 Sonnet | v1.0 | Created — upload to project |

# ==============================================================
# SECTION C — Modified Files (AI19v2.11.65 — AI19v2.11.87)
# ==============================================================

| File | Path | Last Modified | Version | Change Summary |
|------|------|-------------|---------|---------------|
| page.tsx (publication render) | app/publication-render/[token]/page.tsx | AI19 · 9 Aug 2026 | AI19v2.11.85 | Major additions: renderForeword (SECTION 5C), renderAppreciationBlock (SECTION 5B), SECTION_FOOTER constant, escapeHtml/formatEventDate hoisted to SECTION 3B. renderPhasePhotos rewritten for correct slot schema. renderWorldMap replaced with abstract bubble chart. cover-page and closing-page named @page rules. DIGITAL PUBLICATION label on cover. Phase headers show date+venue. Caption labels removed. Countries ranked table on world map page. Engagement breakdown in renderCollectionIntelligence left column. Relationship categories in metricRow style. Foreword TOC updated with all section names. |
| init/route.ts | app/api/publication/init/route.ts | AI19 · 9 Aug 2026 | AI19v2.11.85 | reconcileLayoutConfig() function added. Runs on every Regenerate. Adds world_map if missing. Rebuilds auto phase slots from gallery_items. Deduplicates phases via seenPhaseIds. Removes who_attended, official_photography, guest_captures. Ensures closing_message always last. |
| preview-token/route.ts | app/api/publication/preview-token/route.ts | AI19 · 9 Aug 2026 | AI19v2.11.67 | Intelligent version bump — MD5 hash of layout_config vs distributed_layout_hash. Version only increments on content change. generated_at updated. Returns version in response. |
| autoArrange.ts | lib/publication/autoArrange.ts | AI19 · 9 Aug 2026 | AI19v2.11.78 | buildPhaseSection now EXPORTED. world_map added to default section order. buildPhaseSection carries phase_date and phase_venue via spread (TypeScript-safe). |
| PublicationEditor.tsx | components/publication/PublicationEditor.tsx | AI19 · 9 Aug 2026 | AI19v2.11.77 | handleRegenerate: calls init first, then preview-token. Multi-recipient Named Send: staged list, Add/Remove recipients, Send to N recipients button. onPurged callback wired to PhotoSection. Editor aside: inline styles for padding (px-5 not picked up by Tailwind JIT). |
| PhotoSection.tsx | components/publication/PhotoSection.tsx | AI19 · 9 Aug 2026 | AI19v2.11.77 | Purge & Rebuild button added with two-step confirm (Purge & Rebuild → Yes, purge / Cancel). purging state, confirmPurge state, purgeResult, purgeError. handlePurge calls /api/publication/purge-section. capsuleId and onPurged props added. |
| SectionNavigator.tsx | components/publication/SectionNavigator.tsx | AI19 · 9 Aug 2026 | AI19v2.11.68 | who_attended removed from SECTION_LABELS and SECTION_ICONS. collection_intelligence, appreciation labels added. |
| TributeWallClient.tsx | components/TributeWallClient.tsx | AI19 · 9 Aug 2026 | AI19v2.11.87 | poll() function adds .is('story_topic_id', null) — prevents community stories appearing in Voices wall on 60s refresh. composer-enter div: overflow changed from 'hidden' to 'visible' — fixes Audio/Video panel clipping on mobile. |
| page.tsx (voices/for) | app/for/[slug]/page.tsx | AI19 · 9 Aug 2026 | AI19v2.11.83 | Contributions query adds .is('story_topic_id', null) — community stories excluded from Voices wall. |
| legacy/page.tsx | app/for/[slug]/legacy/page.tsx | AI19 · 9 Aug 2026 | AI19v2.11.86 | storiesCount: now queries contributions WHERE story_topic_id IS NOT NULL (was querying empty community_stories table). livePhotoCount: computed from gallery_items, passed as summary.photo_count override. momentsCount: deleted_at guard added. |
| CommunityStoriesClient.tsx | components/CommunityStoriesClient.tsx | AI19 · 9 Aug 2026 | AI19v2.11.82 | SubmitStoryPanel receives defaultCategory prop. New topics proposed within a category stay in that category. Email field corrected: contributor_email → email. capsule_slug added to JSON body. story_topic_id null string coercion applied in JSON path. |
| submit/route.ts (community) | app/api/community-topics/submit/route.ts | AI19 · 9 Aug 2026 | AI19v2.11.81 | page_state check removed entirely. Accepts both multipart/form-data and JSON content types. story_topic_id null string coercion. email field name corrected. capsule_slug read for email. |
| CapsuleBottomNav.tsx | components/CapsuleBottomNav.tsx | AI19 · 9 Aug 2026 | AI19v2.11.84 | Memories tab label → Stories. |
| stories/page.tsx | app/for/[slug]/stories/page.tsx | AI19 · 9 Aug 2026 | AI19v2.11.84 | Metadata title: Community Memories & Stories → Community Stories. |
| types.ts (publication) | lib/publication/types.ts | AI19 · 9 Aug 2026 | AI19v2.11.65 | 'who_attended' removed from SectionType union. WhoAttendedSection interface removed. |

# ==============================================================
# SECTION D — Database Changes (AI19v2.11.65 — AI19v2.11.87)
# ==============================================================

| Table | Change | Date | Notes |
|-------|--------|------|-------|
| publications | distributed_layout_hash column used for version bump comparison | 9 Aug 2026 | Was added by AI18. AI19 now writes to it on every Regenerate. |
| publications (prof-adesina) | official_photography and guest_captures removed from layout_config via SQL | 9 Aug 2026 | SQL: jsonb_agg filtering out those section types |
| contributions | story_topic_id IS NULL filter now enforced in Voices page and poll() | 9 Aug 2026 | Data model unchanged — filter applied at query level |
| capsules (pa-ajibulu) | page_state updated to 'active' via SQL | 9 Aug 2026 | Was 'pending' — blocking community story submission |

# ==============================================================
# SECTION E — Design Decisions (AI19v2.11.65 — AI19v2.11.87)
# ==============================================================

| ID | Decision | Date |
|----|---------|------|
| DD-PUB-001 | Publication cover and closing pages use named @page CSS rules (cover-page, closing-page) with margin:0mm. Body pages use @page with pageMarginMm. This is the permanent fix for spill — never revert to height:297mm alone. | 9 Aug 2026 |
| DD-PUB-002 | Family Appreciation renders just before the closing page — not inside the honouree profile block. The family voice is the final human word before the LC brand closing. | 9 Aug 2026 |
| DD-PUB-003 | World map is an abstract bubble chart (Option C). No SVG continent paths — they will always look toy-like at this precision level. Circles sized by contributor count. Country name and count inside each circle. | 9 Aug 2026 |
| DD-PUB-004 | Phase section headers display event date and venue as a sub-header below the section title. Data comes from capsule_phases.event_date and capsule_phases.venue. | 9 Aug 2026 |
| DD-PUB-005 | SECTION_FOOTER constant appended to every section renderer — subtle itslegacycapsule.com watermark at 22% opacity. Present on every page without being obtrusive. | 9 Aug 2026 |
| DD-PUB-006 | Countries breakdown lives on the World Map page (below bubble chart), not in Capsule Highlights. The Highlights right column contains Character Lengths and Relationship Categories only. | 9 Aug 2026 |
| DD-PUB-007 | Engagement breakdown lives in the left column of Capsule Highlights, below "When They Arrived". Same box style and dimensions as the other left-column boxes. | 9 Aug 2026 |
| DD-PUB-008 | official_photography and guest_captures are NOT stored in layout_config sections. They are auto-included by the render page. Reconciliation actively removes them if found in stored config. | 9 Aug 2026 |
| DD-PUB-009 | Publication foreword (Page 2) is emotional, punchy, ~100 words. Ends with "Keep it. Return to it. Let someone else read it." TOC heading: "Capsule Digital Publication Content". | 9 Aug 2026 |
| DD-STORIES-007 | community_stories table is empty/legacy. All community stories are in contributions WHERE story_topic_id IS NOT NULL. Every query touching stories must use contributions table. | 9 Aug 2026 |
| DD-STORIES-008 | Voices wall (TributeWallClient poll + for/[slug]/page.tsx fetch) must always filter story_topic_id IS NULL. This is non-negotiable — stories and voices must never mix. | 9 Aug 2026 |
| DD-COUNTRY-001 | ip_country column stores full country names (e.g. "Nigeria"), NOT ISO codes. Cloudflare cf-ipcountry header (ISO) is resolved to full name before storage. Never treat ip_country as ISO. Use it as-is for display and as primary source over contributor-typed country field. | 9 Aug 2026 |
| DD-ROUTE-001 | Contributor-facing submission routes must NEVER check page_state. Only admin/organiser routes check page_state. A pending capsule can still receive contributions. | 9 Aug 2026 |
| DD-VERSION-001 | Publication version only bumps on content change (MD5 hash of layout_config vs distributed_layout_hash). Multiple Regenerate clicks without content changes do not create new versions. | 9 Aug 2026 |

# ==============================================================
# SECTION F — Bugs Closed (AI19v2.11.65 — AI19v2.11.87)
# ==============================================================

| ID | Description | Fixed In |
|----|-------------|---------|
| PUB-LAY-002 | Cover page spilling onto page 2 | AI19v2.11.65 (named @page rules) |
| PUB-LAY-002b | Closing page spilling + blank trailing page | AI19v2.11.65 (named @page + box-sizing:border-box) |
| PUB-LAY-001 | Family Appreciation wrong position (inside profile) | AI19v2.11.68 (renders just before closing) |
| PUB-PHASE-001 | Event Moments not rendering — slot.gallery_item_id non-existent | AI19v2.11.70 (renderPhasePhotos rewritten) |
| PUB-STALE-001 | Regenerate not refreshing content — returning stale layout_config | AI19v2.11.67 (reconcileLayoutConfig runs on every Regenerate) |
| PUB-WORLD-001 | World map showing 7 countries instead of full set | AI19v2.11.76 (ip_country treated as full name not ISO) |
| STORIES-ROUTE-001 | Community story submission 500 — Content-Type mismatch | AI19v2.11.81 (dual FormData/JSON support) |
| STORIES-ROUTE-002 | story_topic_id passed as string "null" — stories filed as tributes | AI19v2.11.80 (null string coercion) |
| STORIES-DISPLAY-001 | Community stories appearing in Voices wall | AI19v2.11.83+AI19v2.11.87 (server + poll filter) |
| STORIES-DISPLAY-002 | Stories reappearing in Voices wall after 60s | AI19v2.11.87 (poll filter) |
| STORIES-COUNT-001 | Stories counter showing 0 — querying empty community_stories table | AI19v2.11.86 (reads contributions WHERE story_topic_id IS NOT NULL) |
| PHOTO-COUNT-001 | Photos counter showing 0 — participation_summary stale | AI19v2.11.86 (live count from gallery_items) |
| NAMED-SEND-001 | Named Send error "Unexpected token < !DOCTYPE" — route missing | AI19v2.11.77 (route created) |
| ACTIVATION-001 | pa-ajibulu capsule page_state='pending' blocking story submission | AI19v2.11.79 (page_state check removed from route) |
| AUDIO-CLIP-001 | Audio/Video panels clipped in composer on mobile | AI19v2.11.87 (overflow:visible on composer-enter div) |
| CATEGORY-001 | New story topics always assigned to General regardless of selected category | AI19v2.11.82 (defaultCategory prop added to SubmitStoryPanel) |

# ==============================================================
# SECTION G — Known Issues Remaining at AI19v2.11.87
# ==============================================================

| ID | Issue | Priority | Notes |
|----|-------|----------|-------|
| EMAIL-SUITE | Full email suite not audited against LC_EMOTIONAL_COMMUNICATION_STANDARD | 🔴 High | 7 email files — see HANDOFF_AI19_TO_AI20.md for priority order |
| PURGE-VIS-001 | Purge & Rebuild button exists but visually hidden in toolbar | 🟡 Medium | Needs redesign — move below photo grid, more prominent |
| EDITOR-PAD-001 | Editor right panel padding still hitting edges on some views | 🟡 Medium | Inline styles applied — verify on production after hard refresh |
| RECENT-STORIES | recentStories in legacy/page.tsx still queries community_stories table | 🟡 Medium | Line 312-318 — fix to query contributions WHERE story_topic_id IS NOT NULL |
| VALIDATOR-TS | app/api/og/[slug]/generate/route.ts AppRouteHandlerRoutes error | 🟢 Low | Preexisting — route may need full removal if moved to app/api/og/generate |
| BUG-003 | Family Rep invite email — no button, raw URL | 🟢 Low | |
| BUG-CIRCLE-001 | Circle Leader RSVP endpoint missing | 🟡 Medium | |
| ATTIRE-001 | Attire Coordination module — no build yet | — | Requires founder approval + dedicated architecture doc LC11 |
| ETH-GM-001 | Guest Management Phase 2A — no build | — | Requires founder approval |
| RLS-001 | Supabase RLS security hardening | — | Deferred — requires dedicated session |
| VERCEL-PRO | Vercel Pro upgrade — unblocks Puppeteer PDF | — | Deferred — budget decision |
| TOC-CI | collection_intelligence not in layout_config — won't appear in foreword TOC | 🟢 Low | Synthetic entry needed in renderForeword |

# ==============================================================
# SECTION H — File Path Quick Reference (new/changed this block)
# ==============================================================

| File | Full Path |
|------|-----------|
| Publication Render Page | app/publication-render/[token]/page.tsx |
| Publication Init Route | app/api/publication/init/route.ts |
| Publication Preview Token | app/api/publication/preview-token/route.ts |
| Named Send Route | app/api/publication/named-send/route.ts |
| Purge Section Route | app/api/publication/purge-section/route.ts |
| autoArrange | lib/publication/autoArrange.ts |
| Publication Types | lib/publication/types.ts |
| Publication Editor | components/publication/PublicationEditor.tsx |
| Photo Section | components/publication/PhotoSection.tsx |
| Section Navigator | components/publication/SectionNavigator.tsx |
| Tribute Wall Client | components/TributeWallClient.tsx |
| Community Stories Client | components/CommunityStoriesClient.tsx |
| Voices Page | app/for/[slug]/page.tsx |
| Legacy Room Page | app/for/[slug]/legacy/page.tsx |
| Stories Page | app/for/[slug]/stories/page.tsx |
| Capsule Bottom Nav | components/CapsuleBottomNav.tsx |
| Community Submit Route | app/api/community-topics/submit/route.ts |
| Emotional Communication Standard | LC_EMOTIONAL_COMMUNICATION_STANDARD.md |

# ==============================================================
# COMPONENT MAP — AI19 ADDENDUM (Post-Handoff Work)
# AI19 — Claude Sonnet 4.6 — 10 August 2026
# Platform: AI19v2.11.88 → AI19v2.11.89
# NOTE: Append this after COMPONENT_MAP_AI19_ADDITIONS.md
# ==============================================================

# ==============================================================
# SECTION A — Additional Work Log (AI19v2.11.88 — AI19v2.11.89)
# ==============================================================

| Date | AI | Model | Version | Files Changed | Summary | Status |
|------|----|----|---------|--------------|---------|--------|
| 10 Aug 2026 | AI19 | Sonnet | AI19v2.11.88 | app/api/publication/init/route.ts, components/CommunityStoriesClient.tsx, components/TributeWallClient.tsx | Canonical sort step added to reconcileLayoutConfig. Stories char limit 2000→3000. Topic name slice(0,60) removed — full topic now shows. flexWrap:wrap on TributeCard and StoryCard name+relationship rows. SQL fix on prof-adesina layout_config section order. | Completed |
| 10 Aug 2026 | AI19 | Sonnet | AI19v2.11.89 | app/api/publication/purge-section/route.ts | Route file was 0 bytes (empty). Full route content written. Purge & Rebuild button now functional — was returning 404. | Completed |

# ==============================================================
# SECTION B — Modified Files (AI19v2.11.88 — AI19v2.11.89)
# ==============================================================

| File | Path | Last Modified | Version | Change Summary |
|------|------|-------------|---------|---------------|
| init/route.ts | app/api/publication/init/route.ts | AI19 · 10 Aug 2026 | AI19v2.11.88 | CANONICAL_ORDER added as step 4 in reconcileLayoutConfig. Sections sorted after reconciliation: cover(1) honouree_profile(2) world_map(3) tributes(4) phase_photos(5) official_photography(6) guest_captures(7) community_stories(8) memories(9) closing_message(10). Prevents future ordering corruption. |
| CommunityStoriesClient.tsx | components/CommunityStoriesClient.tsx | AI19 · 10 Aug 2026 | AI19v2.11.88 | maxLength 2000→3000. Character counter 2000-text.length → 3000-text.length. Colour threshold 1800→2700. Topic display: slice(0,60) removed — full topic name shown. StoryCard Line 2: flexWrap:'wrap' added. |
| TributeWallClient.tsx | components/TributeWallClient.tsx | AI19 · 10 Aug 2026 | AI19v2.11.88 | TributeCard Line 1 (name+relationship row): flexWrap:'wrap', alignItems:'flex-start'. Long names and relationships now wrap instead of overflowing. |
| purge-section/route.ts | app/api/publication/purge-section/route.ts | AI19 · 10 Aug 2026 | AI19v2.11.89 | File was 0 bytes — full route content written. Fetches phase metadata, current approved gallery_items for phase, calls buildPhaseSection, splices rebuilt section into layout, saves to DB. Returns ok, photo_count, slot_count, layout_config. |

# ==============================================================
# SECTION C — Database Changes (AI19v2.11.88 — AI19v2.11.89)
# ==============================================================

| Table | Change | Date | Notes |
|-------|--------|------|-------|
| publications (prof-adesina) | layout_config sections reordered via SQL — phase_photos moved from positions 2,3 back to correct positions after tributes | 10 Aug 2026 | SQL: jsonb_agg with CASE ORDER BY on section type |

# ==============================================================
# SECTION D — Design Decisions (AI19v2.11.88 — AI19v2.11.89)
# ==============================================================

| ID | Decision | Date |
|----|---------|------|
| DD-PUB-010 | Reconciliation step 4 enforces canonical section order on every run. Phase_photos sections all sort to position 5 — multiple phases sort together, preserving their relative order from the array. This prevents any future ordering corruption regardless of how sections are added or removed. | 10 Aug 2026 |
| DD-STORIES-009 | Community story topic names are shown in full — no character truncation in StoryCard. Long topics wrap naturally. This preserves the full context of the prompt the contributor was responding to. | 10 Aug 2026 |
| DD-STORIES-010 | Stories character limit is 3000 (not 2000). This matches the richer, longer-form nature of community stories vs tribute appreciations (which have their own 2000 char limit). | 10 Aug 2026 |

# ==============================================================
# SECTION E — Bugs Closed (AI19v2.11.88 — AI19v2.11.89)
# ==============================================================

| ID | Description | Fixed In |
|----|-------------|---------|
| PUB-ORDER-001 | Publication section order corrupted — phase_photos appeared before honouree_profile | AI19v2.11.88 (SQL fix + canonical sort in reconciliation) |
| STORIES-TRUNC-001 | Topic names cut at 60 characters with hardcoded slice — full context lost | AI19v2.11.88 (slice removed) |
| TRIBUTE-WRAP-001 | Long contributor names + relationship truncated with no read option | AI19v2.11.88 (flexWrap added) |
| PURGE-404 | Purge & Rebuild returning 404 — route file was 0 bytes | AI19v2.11.89 (route content written) |

# ==============================================================
# SECTION F — Known Issues Remaining at AI19v2.11.89
# ==============================================================

| ID | Issue | Priority | Notes |
|----|-------|----------|-------|
| EMAIL-SUITE | Full email suite not audited against LC_EMOTIONAL_COMMUNICATION_STANDARD | 🔴 High | 7 email files — submission-confirmation first |
| PURGE-VIS-001 | Purge & Rebuild button works but visually hidden in toolbar | 🟡 Medium | Move below photo grid, more prominent |
| EDITOR-PAD-001 | Editor right panel padding | 🟡 Medium | Verify on production |
| RECENT-STORIES | recentStories in legacy/page.tsx queries empty community_stories table | 🟡 Medium | Fix to query contributions WHERE story_topic_id IS NOT NULL |
| TOC-CI | collection_intelligence not in foreword TOC | 🟢 Low | Add synthetic entry in renderForeword |
| VALIDATOR-TS | app/api/og/[slug]/generate AppRouteHandlerRoutes error | 🟢 Low | Preexisting |

# ==============================================================
# END OF AI19 ADDENDUM
# AI19 — Claude Sonnet 4.6 — 10 August 2026
# Platform: AI19v2.11.89 | Branch: main | Deployed: Vercel
# Event countdown: 11 days to Chief J.A.Ajibulu 90th Birthday
# ==============================================================

# COMPONENT_MAP — AI20 ADDENDUM
# AI20 — Claude Opus 4.6 — 15 August 2026
# Platform: AI20v2.11.90 → AI20v2.12.07
# Previous: COMPONENT_MAP_AI19_ADDENDUM.md

---

## SECTION A — Session Work Log

| Version | Files Changed | Summary | Status |
|---------|--------------|---------|--------|
| v2.11.90–92 | 11 email files | Full ECS rewrite of all transactional emails | ✅ |
| v2.11.93–94 | named-send/route.ts, distribute/route.ts | Subject lines use honouree name + event type | ✅ |
| v2.11.96 | PublicationEditor.tsx | Distribution send button: full state machine redesign | ✅ |
| v2.11.97 | PaystackAdapter.ts (NEW), paystack webhook (NEW), bundle/route.ts, featureUnlocker.ts | Paystack integration | ✅ |
| v2.11.98 | bundle/route.ts | Stripe null-guard, processor bug fix, lineItems any[] | ✅ |
| v2.11.99 | ServicesTab.tsx | coming_soon, preset buttons, LimitsBar | ✅ |
| v2.11.99b | app/book/page.tsx | Card grid event types, preset buttons, gift delivery picker | ✅ |
| v2.11.99c | lib/content/serviceDetails.ts | Validity copy fixed, COMING_SOON_SERVICES constant | ✅ |
| v2.12.00 | migrations/ai20_sprint1_commercial_model_v3.sql | 6 new tables, 9 capsule columns, 18 pricing rows | ✅ |
| v2.12.01 | featureUnlocker.ts, limits/route.ts, TributeWallClient.tsx, queue-submission/route.ts (NEW), queue-update-email/route.ts (NEW), TierUpgradePanel.tsx (NEW), for/[slug]/page.tsx | Sprint 2+3: tier enforcement, wall experience | ✅ |
| v2.12.02 | priceFetcher.ts, ServicesTab.tsx | KEY_MAP Sprint 1 keys, floating checkout bar | ✅ |
| v2.12.03–05 | ServicesTab.tsx, manage/page.tsx, limits/route.ts | Preset toggle, page header, FreeTierBar fixes, free tier detection fix | ✅ |
| v2.12.06 | orders/route.ts (NEW), help/layout.tsx (NEW), ServicesTab.tsx | Order history route, help nav removal, inline prices | ✅ |
| v2.12.07 | orders/route.ts | Filter abandoned pending payments, summary counts paid only | ✅ |

---

## SECTION B — New Files Created in AI20

| File | Path | Purpose | Version |
|------|------|---------|---------|
| PaystackAdapter.ts | lib/payments/adapters/PaystackAdapter.ts | Paystack checkout, verify, webhook signature | AI20v2.11.97 |
| paystack webhook | app/api/webhooks/paystack/route.ts | Receives charge.success/failed, calls featureUnlocker | AI20v2.11.97 |
| queue-submission route | app/api/capsule/queue-submission/route.ts | Autosaves contributor work at wall-hit | AI20v2.12.01 |
| queue-update-email route | app/api/capsule/queue-update-email/route.ts | Adds email to queued submission post wall-hit | AI20v2.12.01 |
| TierUpgradePanel.tsx | components/manage/TierUpgradePanel.tsx | Manage dashboard tier status + upgrade prompts | AI20v2.12.01 |
| limits route | app/api/capsule/limits/route.ts | Live free tier counters for dashboard | AI20v2.12.01 |
| orders route | app/api/capsule/orders/route.ts | Payment history for capsule | AI20v2.12.06 |
| help layout | app/help/layout.tsx | Removes global nav from help page | AI20v2.12.06 |
| Sprint 1 migration | migrations/ai20_sprint1_commercial_model_v3.sql | Commercial model DB foundation | AI20v2.12.00 |

---

## SECTION C — Modified Files

| File | Path | Version | Key Changes |
|------|------|---------|-------------|
| PublicationEditor.tsx | components/publication/PublicationEditor.tsx | AI20v2.11.96 | Distribution section: clean state machine (idle→previewing→confirming→sending→done\|error). existingPdfUrl dependency removed. |
| featureUnlocker.ts | lib/payments/featureUnlocker.ts | AI20v2.12.01 | All Sprint 1 keys: capsule_activation_base, tier upgrades, access code blocks, extend_6mo, reactivation_admin. logLifecycleEvent() helper. Max 6mo extension cap. |
| limits/route.ts | app/api/capsule/limits/route.ts | AI20v2.12.05 | Free tier detection by contribution_tier (not lifecycle_state). Combined voice count. wall_status. contribution_tier in response. |
| priceFetcher.ts | lib/payments/priceFetcher.ts | AI20v2.12.02 | All Sprint 1 keys added to KEY_MAP. Fallback skips platform_config for lc_pricing-only keys. |
| bundle/route.ts | app/api/checkout/bundle/route.ts | AI20v2.11.98 | Paystack routing. Essential/Signature preset resolution. Stripe null-guard. lineItems any[]. |
| ServicesTab.tsx | components/manage/ServicesTab.tsx | AI20v2.12.06 | Floating checkout bar. Inline price+Add on cards. Preset toggle-deselect. Page header. LimitsBar. |
| book/page.tsx | app/book/page.tsx | AI20v2.11.99b | Visual card grid event types. Presets. Gift delivery picker. Free strip corrected. |
| serviceDetails.ts | lib/content/serviceDetails.ts | AI20v2.11.99c | 90-day validity copy. 1-phase FAQ. COMING_SOON_SERVICES constant. BOOKING_SERVICE_ORDER reordered. |
| manage/page.tsx | app/manage/[slug]/page.tsx | AI20v2.12.02 | FreeTierBar plain English. Expand Capsule removed. Expiry conditional (≤30 days). FREE_TRIBUTE_LIMIT 30. |
| TributeWallClient.tsx | components/TributeWallClient.tsx | AI20v2.12.01 | Wall state vars. handleWallAutosave. Wall check in handleSubmit. Wall-hit modal. Warning banner. |
| for/[slug]/page.tsx | app/for/[slug]/page.tsx | AI20v2.12.01 | lifecycle_state, contribution_tier, voice_ceiling added to capsule select. |

---

## SECTION D — Database Changes

| Table | Change | Date |
|-------|--------|------|
| capsules | Added: lifecycle_state, dormant_at, purge_scheduled_at, contribution_tier, access_code_block, voice_ceiling, activated_at, validity_months, showcase_consent | 11 Aug 2026 |
| lc_pricing | 18 new pricing keys added with NGN + EUR prices | 11–15 Aug 2026 |
| free_tier_limits | voice_ceiling_free key added (value: 30) | 11 Aug 2026 |
| free_tier_limits | Public read RLS policy added | 15 Aug 2026 |
| contribution_tier_config | NEW TABLE — 5 tier rows | 11 Aug 2026 |
| access_code_block_config | NEW TABLE — 5 block rows | 11 Aug 2026 |
| queued_submissions | NEW TABLE — wall-hit autosave | 11 Aug 2026 |
| capsule_lifecycle_events | NEW TABLE — audit log | 11 Aug 2026 |
| dormant_reactivation_requests | NEW TABLE | 11 Aug 2026 |
| lc_showcase_archive | NEW TABLE — future gallery | 11 Aug 2026 |
| payments | No schema changes. Confirmed: NO expires_at column | 15 Aug 2026 |

---

## SECTION E — Design Decisions

| ID | Decision | Date |
|----|---------|------|
| DD-COMM-001 | Freemium model: same base activation fee for all event types. Activity tiers (V = voices) are the scaling mechanism. Not guest count — guest count assumes Access Codes. | 11 Aug 2026 |
| DD-COMM-002 | voice_ceiling = combined tributes + stories. Single ceiling, split display. One upgrade path. | 11 Aug 2026 |
| DD-COMM-003 | Estate-∞V/G: NULL in voice_ceiling/access_code_block columns = unlimited. Never treat as zero. | 11 Aug 2026 |
| DD-COMM-004 | Validity: 6 months from first tribute on paid tier. 90 days free. Max 6 months per extension. Annual archive max 1 year at a time. | 11 Aug 2026 |
| DD-COMM-005 | Event Moments: Option C soft cap. All photos stored, 20 display publicly on free. Upgrade shows full gallery. No mid-event cutoff. | 11 Aug 2026 |
| DD-COMM-006 | Preset buttons (Essential/Signature) are display convenience only. PRESET_FEATURES in bundle/route.ts is the canonical definition. ServicesTab and booking page both read from the same route. | 11 Aug 2026 |
| DD-COMM-007 | Pending payment records >24hrs are abandoned checkout sessions. Filter from order history. Show only succeeded, paid, and pending within 24hrs. | 15 Aug 2026 |
| DD-UX-001 | FreeTierBar expiry shown only when ≤30 days remain. Before that, it creates anxiety without any actionable context. | 14 Aug 2026 |
| DD-UX-002 | "Expand Capsule" button removed from FreeTierBar. Organiser reaches Services via nav tab. Redundant button = eye clutter. | 14 Aug 2026 |
| DD-UX-003 | Preset toggle behaviour: clicking a selected preset clears its selections. Clicking again reapplies. | 14 Aug 2026 |
| DD-PAY-001 | Stripe is optional — only initialises when STRIPE_SECRET_KEY present. International payments return 503 gracefully when key absent. | 11 Aug 2026 |
| DD-PAY-002 | PAYSTACK_WEBHOOK_SECRET falls back to PAYSTACK_SECRET_KEY in test mode. Separate secret only needed in live mode. | 14 Aug 2026 |

---

## SECTION F — Bugs Closed

| ID | Description | Fixed In |
|----|-------------|---------|
| DIST-SEND-001 | Distribution send button permanently disabled — existingPdfUrl guard, willReceiveNow=0, stale closure | AI20v2.11.96 |
| CHECKOUT-001 | "Something went wrong" — priceFetcher KEY_MAP missing Sprint 1 keys | AI20v2.12.02 |
| CHECKOUT-002 | 500 on bundle route — PAYSTACK_SECRET_KEY not in Vercel env vars | AI20v2.12.04 |
| LIMITS-404 | /api/capsule/limits 404 — SUPABASE_SERVICE_ROLE_KEY not in Vercel env | AI20v2.12.04 |
| LIMITS-FREETIER | limits route: lifecycle_state='active' incorrectly flagging free capsules as paid | AI20v2.12.05 |
| ORDERS-500 | orders route: selecting expires_at column that doesn't exist on payments table | AI20v2.12.06 |
| ORDERS-INFLATE | Order history showing 10+ orders including abandoned pending sessions | AI20v2.12.07 |
| SERVICES-DUPE | ServicesTab: presets and services appearing twice — orphaned JSX block outside component | AI20v2.12.02 |
| SERVICES-HIDDEN | Pay button hidden behind CapsuleBottomNav — floating bar now at bottom:72 | AI20v2.12.03 |
| SERVICES-NOPRICE | Price and Add button only visible on card expand — now always visible in header | AI20v2.12.06 |
| HELP-NAV | Global nav showing on help page — layout override added | AI20v2.12.06 |
| FREETIERBAR-VAGUE | "Expand Capsule" button — vague, redundant, wrong timing | AI20v2.12.02 |
| BOOKING-DURATION | Booking page: "6 Months Online", "2 Event Phases" hardcoded — now 90 days, 1 phase | AI20v2.11.99b |
| SERVICES-SUGGESTED | guest_management and attire in SUGGESTED_BY_EVENT — now removed | AI20v2.11.99b |

---

## SECTION G — Known Issues Remaining

| ID | Issue | Priority |
|----|-------|----------|
| WALL-RESTORE | ?restore= handler in TributeWallClient not built | 🔴 High |
| BATCH-NOTIFY | No batch email when organiser upgrades tier | 🔴 High |
| TIER-PANEL | TierUpgradePanel built but not wired into manage dashboard | 🔴 High |
| UX-AUDIT | Full app friction audit — plain English guidance throughout | 🔴 Founder mandate |
| HELP-COPY | Help page validity copy outdated (3mo/6mo, 2 phases) | 🟡 Medium |
| EMAIL-QUOTA | email_sends_log + Resend webhook + LCAdmin widget | 🟡 Medium |
| SHOWCASE | LC Showcase Gallery — homepage strip | 🟡 Medium |
| LIFECYCLE-CRON | Nightly expiry→dormancy→purge jobs | 🟡 Medium |
| RVQ | Repeat Visit Quotient metric | 🟡 Medium |
| VIDEO-AUDIO | Record+upload UI, duration enforcement | 🟡 Medium |

---

# END OF AI20 ADDENDUM
# AI20 — Claude Opus 4.6 — 15 August 2026
# Platform: AI20v2.12.07 | Branch: main


# COMPONENT_MAP — AI21 ADDENDUM
# AI21 — Claude Opus 4.6 — 16 August 2026
# Platform: AI21v2.12.08 → AI21v2.12.15
# Previous: COMPONENT_MAP_AI20_ADDENDUM.md

---

## SECTION A — Session Work Log

| Version | Files Changed | Summary | Status |
|---------|--------------|---------|--------|
| v2.12.08 | restore-submission/route.ts (NEW), batch-notify/route.ts (NEW), sendWallReopenNotification.ts (NEW), featureUnlocker.ts, TributeWallClient.tsx, participationLanguage.ts, manage/page.tsx | Wall restore flow, batch-notify, ECS pass, submitLabel engine | ✅ |
| v2.12.09 | ca-migration.sql (NEW), logAction.ts (NEW), SettingsSubTabs.tsx (NEW), FamilyRepElderInvite.tsx (NEW), FamilyRepElderCard.tsx (NEW), familyRepAuth.ts (NEW), team/invite/route.ts (NEW), team/resend/route.ts (NEW), team/revoke/route.ts (NEW), appreciation/route.ts (NEW), family/[slug]/[token]/page.tsx (NEW), FamilyRepElderPortalClient.tsx (NEW), manage/page.tsx | CA Steps 1-6: DB migration, logAction, Settings restructure, FR Elder invite + portal | ✅ |
| v2.12.10 | moderation/approve/route.ts, moderation/remove/route.ts, contributions/approve/route.ts (NEW), contributions/reject/route.ts (NEW), manage/page.tsx | CA Step 7: contribution handlers, moderation headers | ✅ |
| v2.12.11 | lib/activity/logAction.ts | Casing fix for Vercel Linux build | ✅ |
| v2.12.12 | set-password/page.tsx (NEW), SetPasswordClient.tsx (NEW), team/set-password/route.ts (NEW), team/upgrade/route.ts (NEW), team/accounts/route.ts (NEW), FamilyRepFullAccessPanel.tsx (NEW), OrganizerUpgradePanel.tsx (NEW), manage/page.tsx | CA Steps 8-9: password flows, FRFA panel, upgrade panel | ✅ |
| v2.12.13 | supabaseRW.ts (RETIRED — use supabase-ecosystem.ts), platform-services/route.ts (NEW), PermissionPicker.tsx (NEW), CoadminInvite.tsx (NEW), CoadminCard.tsx (NEW), team/permissions/route.ts (NEW), activity-log/route.ts (NEW), activity-log/export/route.ts (NEW), ActivityLogTab.tsx (NEW), manage/page.tsx | CA Steps 10-13: PermissionPicker, Co-admin invite/card, ActivityLogTab, platform-services | ✅ |
| v2.12.14 | stories/action/route.ts (NEW), capsule/update/route.ts (NEW), contributions/toggle-flag/route.ts (NEW), manage/page.tsx | CA Step 14: story/capsule/flag handlers with logAction | ✅ |
| v2.12.15 | manageAuth.ts (NEW), manage/[slug]/page.tsx (SERVER COMPONENT), ManagePageClient.tsx (NEW — formerly page.tsx), AdminLoginPanel.tsx (NEW), AccountDetailsSection.tsx (NEW), team/verify/route.ts (NEW), migrate-family-rep/route.ts (NEW) | CA Steps 15a+15b: server/client split, password login, account section, migration | ✅ |

---

## SECTION B — New Files Created in AI21

### Wall Experience
| File | Path | Purpose | Version |
|------|------|---------|---------|
| restore-submission route | `app/api/capsule/restore-submission/route.ts` | GET ?token= — returns queued submission for form pre-fill | AI21v2.12.08 |
| batch-notify route | `app/api/capsule/batch-notify/route.ts` | POST — emails all queued contributors on tier upgrade | AI21v2.12.08 |
| sendWallReopenNotification | `lib/email/sendWallReopenNotification.ts` | ECS wall re-open email builder + Resend sender | AI21v2.12.08 |

### CA — Account Hierarchy
| File | Path | Purpose | Version |
|------|------|---------|---------|
| CA migration SQL | `supabase/migrations/ca_account_hierarchy.sql` | capsule_accounts, permissions, activity_log tables | AI21v2.12.09 |
| logAction | `lib/activity/logAction.ts` | Shared activity log writer — non-blocking, never throws | AI21v2.12.09 |
| SettingsSubTabs | `components/manage/settings/SettingsSubTabs.tsx` | Sub-tab nav for Settings (5 tabs) | AI21v2.12.09 |
| FamilyRepElderInvite | `components/manage/settings/FamilyRepElderInvite.tsx` | Invite new Family Representative | AI21v2.12.09 |
| FamilyRepElderCard | `components/manage/settings/FamilyRepElderCard.tsx` | Single FR display + actions | AI21v2.12.09 |
| familyRepAuth | `lib/familyRepAuth.ts` | Server-side auth for FR Elder portal | AI21v2.12.09 |
| team/invite route | `app/api/team/invite/route.ts` | Create account + send invite email (all types) | AI21v2.12.09 |
| team/resend route | `app/api/team/resend/route.ts` | Resend invite with fresh token | AI21v2.12.09 |
| team/revoke route | `app/api/team/revoke/route.ts` | Deactivate account | AI21v2.12.09 |
| appreciation route | `app/api/capsule/appreciation/route.ts` | Create/update Family Appreciation section | AI21v2.12.09 |
| FR Elder portal page | `app/family/[slug]/[token]/page.tsx` | Server component auth gate for FR portal | AI21v2.12.09 |
| FamilyRepElderPortalClient | `components/family/FamilyRepElderPortalClient.tsx` | FR portal client — voices, stories, EOH, appreciation | AI21v2.12.09 |
| contributions/approve route | `app/api/contributions/approve/route.ts` | Approve contribution with logAction | AI21v2.12.10 |
| contributions/reject route | `app/api/contributions/reject/route.ts` | Reject contribution with logAction | AI21v2.12.10 |
| set-password page | `app/auth/set-password/page.tsx` | Server component — validates invite token | AI21v2.12.12 |
| SetPasswordClient | `app/auth/set-password/SetPasswordClient.tsx` | Password creation UI | AI21v2.12.12 |
| team/set-password route | `app/api/team/set-password/route.ts` | Consume token, store bcrypt hash | AI21v2.12.12 |
| team/upgrade route | `app/api/team/upgrade/route.ts` | Organiser self-upgrade to FRFA | AI21v2.12.12 |
| team/accounts route | `app/api/team/accounts/route.ts` | List capsule accounts by type | AI21v2.12.12 |
| FamilyRepFullAccessPanel | `components/manage/settings/FamilyRepFullAccessPanel.tsx` | FRFA section in Team tab | AI21v2.12.12 |
| OrganizerUpgradePanel | `components/manage/settings/OrganizerUpgradePanel.tsx` | Organiser self-upgrade UI with confirmation modal | AI21v2.12.12 |
| platform-services route | `app/api/team/platform-services/route.ts` | Fetch permission list from RW-Ecosystem | AI21v2.12.13 |
| PermissionPicker | `components/manage/settings/PermissionPicker.tsx` | Co-admin permission checkboxes (data-driven) | AI21v2.12.13 |
| CoadminInvite | `components/manage/settings/CoadminInvite.tsx` | Invite new Co-admin with permission selection | AI21v2.12.13 |
| CoadminCard | `components/manage/settings/CoadminCard.tsx` | Single Co-admin display + edit permissions + actions | AI21v2.12.13 |
| team/permissions route | `app/api/team/permissions/route.ts` | GET/PATCH co-admin permissions | AI21v2.12.13 |
| activity-log route | `app/api/activity-log/route.ts` | Paginated activity log with filters | AI21v2.12.13 |
| activity-log/export route | `app/api/activity-log/export/route.ts` | CSV export of full activity log | AI21v2.12.13 |
| ActivityLogTab | `components/manage/settings/ActivityLogTab.tsx` | Full audit trail UI with filters and export | AI21v2.12.13 |
| stories/action route | `app/api/stories/action/route.ts` | All story moderation with logAction | AI21v2.12.14 |
| capsule/update route | `app/api/capsule/update/route.ts` | Update capsule fields (allowlisted) with logAction | AI21v2.12.14 |
| contributions/toggle-flag route | `app/api/contributions/toggle-flag/route.ts` | Toggle boolean flag with logAction | AI21v2.12.14 |
| manageAuth | `lib/manageAuth.ts` | Server-side auth for manage dashboard (FRFA/Co-admin) | AI21v2.12.15 |
| ManagePageClient | `app/manage/[slug]/ManagePageClient.tsx` | Full dashboard client (formerly page.tsx) | AI21v2.12.15 |
| AdminLoginPanel | `components/manage/AdminLoginPanel.tsx` | Inline password login — slides over magic link | AI21v2.12.15 |
| AccountDetailsSection | `components/manage/settings/AccountDetailsSection.tsx` | My Account section in Capsule sub-tab | AI21v2.12.15 |
| team/verify route | `app/api/team/verify/route.ts` | Email + password → session cookie | AI21v2.12.15 |
| migrate-family-rep route | `app/api/team/migrate-family-rep/route.ts` | Silent Option A migration for legacy family_rep_email | AI21v2.12.15 |

---

## SECTION C — Modified Files

| File | Path | Version | Key Changes |
|------|------|---------|-------------|
| featureUnlocker.ts | `lib/payments/featureUnlocker.ts` | AI21v2.12.08 | batch-notify trigger after tier upgrade keys. TIER_UPGRADE_KEYS set. |
| TributeWallClient.tsx | `components/TributeWallClient.tsx` | AI21v2.12.08 | ?restore= useEffect, restore banner (Option B), restoreToken/Banner/Loading/Error state, composer id anchor, capsule_slug bug fix in handleWallAutosave, ECS: placeholders, submit button, success message, validation errors. |
| participationLanguage.ts | `lib/config/participationLanguage.ts` | AI21v2.12.08 | submitLabel added to ParticipationLanguage interface. All 11 event categories updated. |
| getParticipationLanguage.ts | `lib/utils/getParticipationLanguage.ts` | AI21v2.12.08 | No change needed — reads from config which was updated. |
| manage/[slug]/page.tsx | `app/manage/[slug]/page.tsx` | AI21v2.12.15 | Converted to server component. Now only 40 lines. Calls checkManageAuth, renders ManagePageClient with auth props. |
| ManagePageClient.tsx | `app/manage/[slug]/ManagePageClient.tsx` | AI21v2.12.15 | All former page.tsx content. Receives serverAccountType/Name/Email/Permissions props. accountType/isCoadmin state. BottomNav scoped by permissions. Role badge in header. AccountDetailsSection in Capsule sub-tab. Settings restructured into 5 sub-tabs. All story/capsule/flag handlers now call server-side API routes. FamilyRepSection inline component retired. FamilyRepElderSection with auto-migration. CoadminSection added. AdminLoginPanel on unauthenticated screen. |
| moderation/approve/route.ts | `app/api/moderation/approve/route.ts` | AI21v2.12.10 | File header added |
| moderation/remove/route.ts | `app/api/moderation/remove/route.ts` | AI21v2.12.10 | File header added |
| moderation/route.ts | `app/api/moderation/route.ts` | AI21v2.12.10 | File header added |

---

## SECTION D — Retired / Superseded

| Item | Status | Notes |
|------|--------|-------|
| `FamilyRepSection` inline component | ✅ Retired | Was inside manage/page.tsx. Replaced by FamilyRepElderSection. |
| `lib/supabaseRW.ts` | ✅ Never placed | Superseded by pre-existing `lib/supabase-ecosystem.ts` |
| `app/manage/[slug]/page.tsx` (client version) | ✅ Renamed | Now `ManagePageClient.tsx`. page.tsx is now server component. |
| `COMPONENT_MAP_AI20_ADDENDUM.md` | ⚠ Superseded | Use this document (AI21) |
| `CURRENT_STATE_v10.md` | ⚠ Superseded | Use CURRENT_STATE_v11.md |

---

## SECTION E — New State Variables in ManagePageClient.tsx

| Variable | Type | Purpose |
|----------|------|---------|
| `accountType` | `'organiser' \| 'family_rep_full_access' \| 'coadmin'` | Server-injected account type |
| `accountName` | `string` | Server-injected account name |
| `permissions` | `string[]` | Server-injected Co-admin permissions |
| `isCoadmin` | `boolean` | Derived: `accountType === 'coadmin'` |
| `showPasswordLogin` | `boolean` | Controls AdminLoginPanel visibility |
| `settingsTab` | `SettingsSubTab` | Active Settings sub-tab |

---

## SECTION F — New State Variables in TributeWallClient.tsx

| Variable | Type | Purpose |
|----------|------|---------|
| `restoreToken` | `string \| null` | Session token from ?restore= URL param |
| `restoreBanner` | `boolean` | Controls persistent top banner |
| `restoreLoading` | `boolean` | Fetch in progress indicator |
| `restoreError` | `string \| null` | Error message if restore fetch fails |

---

## SECTION G — API Route Summary (AI21 additions)

### Wall Experience
- `GET /api/capsule/restore-submission?token=` — fetch saved work for form pre-fill
- `POST /api/capsule/batch-notify` — notify all queued contributors
- `POST /api/capsule/appreciation` — create/update Family Appreciation section

### Team / Auth
- `POST /api/team/invite` — create account + send invite (all types)
- `POST /api/team/resend` — resend invite with fresh token
- `POST /api/team/revoke` — deactivate account
- `POST /api/team/upgrade` — organiser self-upgrade to FRFA
- `POST /api/team/set-password` — consume token, store hash
- `POST /api/team/verify` — email + password → session cookie
- `GET /api/team/accounts` — list accounts by type
- `GET,PATCH /api/team/permissions` — read/update co-admin permissions
- `GET /api/team/platform-services` — permission list from RW-Ecosystem
- `POST /api/team/migrate-family-rep` — silent Option A migration

### Contributions / Stories / Capsule
- `POST /api/contributions/approve` — approve with logAction
- `POST /api/contributions/reject` — reject with logAction
- `POST /api/contributions/toggle-flag` — toggle boolean flag with logAction
- `POST /api/stories/action` — approve/decline/delete/edit with logAction- `PATCH /api/capsule/update` — update capsule fields with logAction

### Activity Log
- `GET /api/activity-log` — paginated log with filters
- `GET /api/activity-log/export` — CSV download

---

*Component map compiled by AI21 · Claude Opus 4.6 · 16 August 2026*

# COMPONENT_MAP — AI21 ADDENDUM 2
# AI21 · Claude Opus 4.6 · 17 August 2026
# Platform: AI21v2.12.17
# Previous: COMPONENT_MAP_AI21_ADDENDUM.md

---

## SECTION A — Session Work Log (Live Testing Sprint)

| Version | Files Changed | Summary | Status |
|---------|--------------|---------|--------|
| v2.12.16 | dday/page.tsx, dday/upload/route.ts, ServicesTab.tsx, ManagePageClient.tsx, signin/page.tsx, AdminSigninPanel.tsx (NEW), AdminSigninPanel (components/auth/) | D-Day UX fixes, upload bug fixes, QR removed from Live Wall, Admin Login on signin + manage pages | ✅ |
| v2.12.17 | dday/page.tsx, phases/[phaseId]/print/page.tsx (SPLIT), PhaseQRPrintClient.tsx (UPDATED), team/capsules/route.ts (NEW), AdminSigninPanel.tsx (UPDATED) | Pre/post event window states, print page params fix, QR URL corrected, capsule selection after admin login | ✅ |

---

## SECTION B — New Files Created (Live Testing Sprint)

| File | Path | Purpose | Version |
|------|------|---------|---------|
| AdminSigninPanel (auth) | `components/auth/AdminSigninPanel.tsx` | Inline password login for FRFA/Co-admin. Email + password → capsule list → session. Used on /signin page. | AI21v2.12.16 |
| team/capsules route | `app/api/team/capsules/route.ts` | POST email+password → returns list of accessible capsules. Used by AdminSigninPanel for capsule selection. | AI21v2.12.17 |
| phase print server page | `app/manage/[slug]/phases/[phaseId]/print/page.tsx` | Server component — awaits params (Next.js 16), fetches capsule+phase, builds QR URL to /dday?phase=, passes props to PhaseQRPrintClient. Replaces broken merged file. | AI21v2.12.17 |

---

## SECTION C — Modified Files (Live Testing Sprint)

| File | Path | Version | Key Changes |
|------|------|---------|-------------|
| dday page | `app/for/[slug]/dday/page.tsx` | AI21v2.12.17 | Three window states: before (countdown)/open (upload)/closed. Phase pre-selection from ?phase= URL param. Countdown ticker (WAT 6am). Pre-event screen with capsule links. Post-event closed screen. Empty placeholders, mandatory email, shortened gold note. Autocomplete fix on name+email. Upload button visual feedback. |
| dday upload route | `app/api/dday/upload/route.ts` | AI21v2.12.17 | Capsule lookup: ID first, slug fallback. deleted_at null guard. console.error log. Wrong bucket name fixed: gallery → tribute-photos. Wrong column name fixed: key → config_key in getPhotoLimit. |
| PhaseQRPrintClient | `components/manage/PhaseQRPrintClient.tsx` | AI21v2.12.17 | Now a pure client component (server logic moved to page.tsx). New props: phaseId, ddayUrl, programmeSummary. QR URL corrected to /for/[slug]/dday?phase=[phaseId]. Event day window note added to print card. Short URL updated to show /dday path. |
| ServicesTab | `components/manage/ServicesTab.tsx` | AI21v2.12.16 | QR code removed from LiveWallSection. Description updated — URL only, no QR. |
| ManagePageClient | `app/manage/[slug]/ManagePageClient.tsx` | AI21v2.12.16 | "Email me a sign-in link →" copy. "Admin Login" discreet button. Email form hidden when showAdminLogin=true. AdminLoginPanel imported. showAdminLogin state added. |
| signin page | `app/signin/page.tsx` | AI21v2.12.16 | AdminSigninPanel imported. showAdminLogin state. Email form + "No account yet" hidden when Admin Login active. Gold divider between magic link and Admin Login trigger. |
| AdminSigninPanel | `components/auth/AdminSigninPanel.tsx` | AI21v2.12.17 | Removed capsule URL field. Now calls /api/team/capsules to get accessible capsule list. One capsule → direct redirect. Multiple → selection list with honouree name, event tag, access level badge. capsuleSlug prop for manage dashboard context (skips selection). |

---

## SECTION D — Window State Logic (dday page)

```
getWindowState(event_date) returns: 'before' | 'open' | 'closed'

Window open  = event_date at 05:00 UTC (6am WAT, UTC+1)
Window close = window open + 24 hours

before → countdown screen with capsule navigation links
open   → full upload form (existing identity → phase → upload → done flow)
closed → window closed screen with capsule links
```

WAT = West Africa Time = UTC+1. Hard-coded for launch. Timezone-aware version deferred.

---

## SECTION E — Admin Login Flow

```
/signin or manage dashboard unauthenticated screen
  → "Admin Login" button (discreet, small)
  → AdminSigninPanel slides in (covers magic link form)
  → Email + password entered
  → POST /api/team/capsules → validates credentials → returns capsule list
  → 1 capsule: POST /api/team/verify → session cookie → redirect /manage/[slug]
  → N capsules: selection list shown → admin picks → same verify flow
  → onBack: retracts panel, magic link form reappears
```

---

## SECTION F — Remaining Fixes for AI23

These were identified in live testing but NOT completed by AI21 (context limit):

| Fix | File needed | Description |
|-----|-------------|-------------|
| "EVENT PHASES" → "EVENT MOMENTS" on tribute wall + clickable card | `TributeWallClient.tsx` or `app/for/[slug]/page.tsx` | Header rename, card links to /for/[slug]/story/[phaseId], content only shows on dday |
| "Capture closes" field removal from phase setup | `components/manage/EventPhasesSection.tsx` | Remove date/time picker — duration is fixed 24hrs from 6am |
| "1 of 10 phases" → "1 Event Moment included. Add more →" | `components/manage/EventPhasesSection.tsx` | Link to services tab |
| "+ I Was There" button click feedback | `app/for/[slug]/story/[phaseId]/page.tsx` | Loading state, opacity 0.6, "Opening…" text |

---

*Component map addendum 2 compiled by AI21 · Claude Opus 4.6 · 17 August 2026*