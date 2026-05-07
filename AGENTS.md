# LEGACYCAPSULE — AGENTS.md

This file defines the mandatory operational rules for all AI coding agents working on this repository, including OpenAI Codex, ChatGPT, Cline, Cursor, and any autonomous coding assistant.

All agents MUST read this file before making changes.

------------------------------------------------------------
SECTION 1 — PROJECT IDENTITY
------------------------------------------------------------

Project: LegacyCapsule
Organisation: RevoWorldTech / Valnex LDA
Primary Product Type: Premium event memory preservation platform
Current Phase: MVP Phase 1
Primary Stack:
- Next.js App Router
- TypeScript
- Supabase
- TailwindCSS
- Shadcn/UI
- Leaflet
- Resend
- Vercel

This repository follows a STRICT tiered build methodology.

------------------------------------------------------------
SECTION 2 — BUILD PHILOSOPHY
------------------------------------------------------------

NEVER build multiple systems simultaneously.

The build order is mandatory:

TIER 1 — Core Engine
- Database write
- Database read
- Dynamic rendering
- Form submission

TIER 2 — Logic Layer
- Page states
- Moderation
- Filtering
- Authentication
- RLS
- Email workflows

TIER 3 — Polish
- Animation
- Styling refinement
- Decorative effects
- Motion
- UI enhancements

Agents MUST NOT introduce Tier 3 work before Tier 1 and Tier 2 are stable.

DO NOT prematurely optimize.

DO NOT rebuild working systems without explicit instruction.

------------------------------------------------------------
SECTION 3 — ARCHITECTURE RULES
------------------------------------------------------------

The system follows modular separation.

Public pages:
- /capsule/[slug]
- public-facing only

Submission:
- /capsule/[slug]/submit

Admin:
- /admin/dashboard/[slug]

Authentication systems MUST remain isolated from public pages.

Moderation logic MUST eventually move fully into admin routes.

DO NOT place admin workflows inside public tribute pages unless explicitly instructed.

DO NOT merge unrelated concerns into single files.

------------------------------------------------------------
SECTION 4 — DATABASE RULES
------------------------------------------------------------

Supabase is the source of truth.

Agents MUST:
- use existing schema before proposing new tables
- avoid destructive schema rewrites
- preserve forward compatibility
- respect planned future phases

Current schema is intentionally future-expanded.

DO NOT remove "unused" columns.

DO NOT simplify schema by deleting future-ready fields.

Current naming conventions:
- capsules
- contributions
- capsule_phases
- guests
- gallery_items

Current contribution naming standard:
- name
- tribute_text
- status
- capsule_id
- created_at

Do not reintroduce old field names once replaced.

------------------------------------------------------------
SECTION 5 — RLS POLICY RULES
------------------------------------------------------------

Phase 1 intentionally uses permissive RLS.

Agents MUST NOT aggressively tighten RLS policies unless specifically instructed.

Authentication-based RLS belongs to Phase 2.

Avoid breaking:
- public reads
- public submissions
- moderation flow

Before changing RLS:
1. verify frontend queries
2. verify admin workflow
3. verify submission flow

------------------------------------------------------------
SECTION 6 — UI / DESIGN RULES
------------------------------------------------------------

LegacyCapsule visual identity:
- Deep Purple
- Antique Gold
- Warm Ivory
- Premium memorial aesthetic

UI principles:
- Elegant
- Emotional
- Premium
- Minimal clutter
- Strong spacing
- High readability

DO NOT:
- introduce generic SaaS styling
- introduce neon cyberpunk aesthetics
- overuse gradients
- use playful startup visuals

The platform is emotionally sensitive and premium.

------------------------------------------------------------
SECTION 7 — CODING RULES
------------------------------------------------------------

MANDATORY:
- TypeScript preferred
- Strong typing preferred over any
- Reusable components
- Clear section comments
- Modular structure

When editing large files:
- preserve section numbering
- preserve comment headers
- edit section-by-section only

Do not massively reformat files unnecessarily.

Avoid changing unrelated code.

Avoid hidden side effects.

------------------------------------------------------------
SECTION 8 — FILE EDIT SAFETY
------------------------------------------------------------

Before editing:
1. understand full file purpose
2. identify affected systems
3. minimize edit scope

Agents MUST NOT:
- rewrite entire files unnecessarily
- duplicate components
- create parallel architectures
- silently rename critical variables
- introduce dead code

Prefer incremental safe edits.

------------------------------------------------------------
SECTION 9 — ADMINISTRATIVE PRINCIPLES
------------------------------------------------------------

LegacyCapsule is part of the wider RevoWorldTech ecosystem.

Future integrations:
- Communiva
- RevoRent
- SMSProvince
- CDLS

Agents MUST preserve:
- modularity
- ecosystem compatibility
- reseller architecture
- regional pricing architecture

DO NOT hardcode business assumptions likely to vary by region.

------------------------------------------------------------
SECTION 10 — PERFORMANCE PRINCIPLES
------------------------------------------------------------

Priority order:
1. Stability
2. Data integrity
3. Architectural clarity
4. User experience
5. Performance optimization

Readable and maintainable code is preferred over clever code.

------------------------------------------------------------
SECTION 11 — REQUIRED WORKFLOW
------------------------------------------------------------

For major changes:
1. Explain proposed approach first
2. Identify affected files
3. Identify risks
4. Then implement

For schema changes:
- explain migration impact
- explain backward compatibility

For architectural changes:
- explain why current structure is insufficient

Agents should behave like senior engineers protecting a long-term product, not hackathon assistants.

------------------------------------------------------------
SECTION 12 — CURRENT PRIORITIES
------------------------------------------------------------

Current MVP priorities:
1. Stable tribute wall
2. Clean moderation flow
3. Public submission flow
4. Admin dashboard separation
5. Proper approved/pending filtering
6. Email workflows
7. Map integration
8. Deployment stability

NOT current priorities:
- micro animations
- advanced optimization
- dark/light theme systems
- extensive abstraction
- plugin systems
- AI features
- mobile app conversion

------------------------------------------------------------
SECTION 13 — DOCUMENTATION DISCIPLINE
------------------------------------------------------------

When architecture changes:
- update relevant documentation
- avoid documentation drift

Core documents:
- MVP Build Guide
- SiteBuild Architecture Plan
- Ecosystem Control Platform Spec

These documents are authoritative.

If implementation differs from documentation, flag it clearly before proceeding.

------------------------------------------------------------
SECTION 14 — FINAL OPERATING PRINCIPLE
------------------------------------------------------------

The objective is not fast code generation.

The objective is:
- a stable
- premium
- scalable
- emotionally powerful
platform with long-term maintainability.

Protect architecture first.