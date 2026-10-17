# Personal and Communal Capsule Upgrade — Implementation Plan

**FILE PATH** `/docs/COMMUNAL_CAPSULE_UPGRADE_PLAN.md`  
**DOCUMENT OWNER** CG08-LC — LegacyCapsule implementation coordination  
**STATUS** Draft — audit-derived plan; not an implementation approval or migration execution record  
**VERSION** v1.0  
**CREATED** 17 October 2026  
**LAST UPDATED** 17 October 2026  
**DEPENDS ON** `PROJECT_RULES.md`; `AI_CONTEXT.md`; `LC00_ARCHITECTURE_INDEX.md` in Project Knowledge; `LC01A_INTERFACE_AND_EXPERIENCE_STANDARD.md`; `OG02_COVER_SYSTEM.md`; `LC03_LEGACY_PUBLICATION_SYSTEM.md`; live code and live Supabase schema  
**SUPERSEDES** None  
**SUPERSEDED BY** None  
**DOCUMENT PURPOSE** Record the audit-confirmed implementation scope, migration approach, sequencing, regression requirements, and Component Map impacts for adding Personal and Communal Capsule creation without replacing the existing booking or publication systems.

> This document describes the proposed implementation. It does not state that code, schema, deployment, or the master Component Map has been changed.

## 1. Decision Summary

The creation journey will distinguish two paths: **Personal Events** and **Communal Events**. Both paths create a LegacyCapsule; the distinction changes the occasion classification, naming, relevant form fields, and public-facing language—not the core Capsule identity or lifecycle.

The homepage hero CTA changes from **Start Your Capsule** to **Start Here**. Keep the existing `/book` destination unless implementation review identifies a concrete routing reason to change it. The current homepage layout remains uncluttered; the explanation of Event Capsule is introduced progressively in the creation journey.

Every new Capsule requires an **Event Name**, independent of its canonical event classification.

### Agreed field responsibilities

| Field | Responsibility |
|---|---|
| `event_path` | Distinguishes `personal` from `communal`. |
| `event_type` | Stores canonical event classification, not a free-form occasion title. |
| `event_name` | Stores the required name of this particular occasion. |
| `honouree_name` | Stores the person or people being honoured in personal mode; may be absent for communal mode. It remains a separate field. |
| `event_tag` | Retains its existing optional subtitle/supplementary-label role. It must not be repurposed as the event name. |

Existing specialised personal event types must remain available. Personal and Communal paths each need an `Other` catch-all. A custom occasion label entered for an `Other` choice must not overwrite the canonical `event_type`.

The current user-facing booking labels and the values stored in the live database are not fully aligned. Implement a normalisation/mapping layer that preserves legacy records and presentation rather than changing old values indiscriminately.

## 2. Evidence and Constraints Confirmed During Audit

- The live `public.capsules` table has 43 rows in the audited snapshot and does not currently contain `event_path` or `event_name`.
- `honouree_name` is currently `NOT NULL`.
- Existing rows include canonical values and legacy display-style values, including `Conference`, `Memorial & Funeral`, and `Thanksgiving Service`.
- The legacy `other` row is a personal example (`Chief Alex`), so it cannot safely be backfilled as communal merely because its type is `other`.
- The current creation UI sends a custom “Other Event” label as `event_type`. This must be corrected for new records while existing rows remain readable.
- Public Capsule, story, email, Open Graph, and publication-rendering code includes person-centred assumptions.
- Ordinary Tribute Wall contributions use `story_topic_id IS NULL`; Community Stories use `story_topic_id IS NOT NULL`. This separation is a regression invariant.
- The existing email verification and owner-access flow must be preserved. The verification route contains two identical non-blocking story-prompt seed calls; this is unrelated and should not be changed as part of this work unless tests demonstrate a direct dependency.
- The repository's `main` branch did not contain `/docs/COMPONENT_MAP.md` during audit. The Project Knowledge copy is extensive and must not be reconstructed from a partial excerpt or overwritten without reconciliation.

## 3. Scope and File Inventory

The following is the current confirmed core inventory. Continue repository-wide consumer tracing before declaring the inventory closed; direct database reads, admin/editor forms, service integrations, and email callers must also be checked for nullable `honouree_name` and the new fields.

### Wave A — Creation and canonical data

1. `app/page.tsx`
   - Change hero CTA label to **Start Here**.
   - Preserve current layout and `/book` destination.
   - Review the homepage audience/routing card only as needed to make the Personal/Communal paths discoverable.

2. `app/book/page.tsx`
   - Add a clear Personal / Communal path choice early in the journey.
   - Keep existing specialised personal event options.
   - Add relevant communal categories, including reunions/alumni groups, plus an `Other` option.
   - Make custom occasion input update the occasion name while retaining canonical `event_type = other`.
   - Require Event Name for every new Capsule.
   - Keep `honouree_name` separate and only required when appropriate to the selected personal category/path.
   - Make slug suggestions derive from Event Name for communal mode and the appropriate person/event naming input for personal mode.
   - Make details copy, validation and summary path-aware.
   - Preserve booking/free paths, payment/service selection, email verification, and existing internal screen progression.

3. `app/api/capsules/create-and-verify/route.ts`
   - Validate `eventPath`, canonical `eventType`, required `eventName`, organiser email, slug, and booking mode server-side.
   - Accept an absent honouree name only for valid communal requests.
   - Insert new fields without changing verification cleanup guarantees.
   - Do not allow arbitrary display labels to become canonical event types.

4. `lib/eventLabels.ts`
   - Remain the shared source of truth for event-type labels and language.
   - Add shared helpers for legacy type normalisation and deriving a display subject/name from the capsule path and fields.
   - Ensure helper contracts are safe for nullable `honouree_name`; avoid scattered one-off ternaries.

5. `lib/config/participationLanguage.ts` and `lib/utils/getParticipationLanguage.ts`
   - Preserve existing personal participation categories and aliases.
   - Add path-aware communal wording where event type alone is insufficient.
   - Preserve existing generic fallback behaviour for legacy records.

### Wave B — Public Capsule and participant experience

6. `app/for/[slug]/page.tsx`
   - Select and pass `event_path` and `event_name`.
   - Make metadata and Open Graph descriptions use the path-aware display subject.
   - Preserve access, lifecycle, theme, contribution counts, and page-state behaviour.

7. `components/TributeWallClient.tsx`
   - Update the capsule type to include the new fields and a nullable honouree name.
   - Derive a safe display subject centrally.
   - Adapt hero labels, progress copy, submission guidance, placeholders, confirmation payloads, and sharing text for communal mode.
   - Keep the existing ordinary-wall contribution filter and submission flow intact.

8. `app/for/[slug]/stories/page.tsx` and `components/CommunityStoriesClient.tsx`
   - Include the new capsule fields in loader/query contracts.
   - Use a path-aware event/subject title in metadata, navigation, empty states, and story copy.
   - Preserve the story query filter for non-null `story_topic_id`; do not merge stories into ordinary Tribute Wall contributions.

9. `app/for-you/page.tsx`
   - Review only the audience framing and path-discovery copy. Avoid an unrelated redesign or broad marketing rewrite.

### Wave C — Verification and email

10. `app/api/email/verify-code/route.ts`
    - Make verification and welcome messages safe for communal capsules.
    - Read `event_path` and `event_name` when constructing welcome copy.
    - Preserve code verification, expiry, account creation, owner access, gift-path behaviour, and non-blocking failure handling.

11. `app/api/email/submission-confirmation/route.ts`
    - Add path-aware copy generation so communal submissions are described as contributions to an event/community record, not automatically as tributes to an individual.
    - Keep existing event-specific personal messages where appropriate.
    - Do not alter unrelated email content or contribution moderation.

12. `lib/email.ts` and `app/api/email/verify-organiser/route.ts`
    - Trace callers before changing contracts.
    - Ensure organiser emails do not require a person name when a communal event name is the relevant subject.
    - Keep compatibility with any existing personal-event caller.

### Wave D — Covers and publications

13. `app/api/og/[slug]/route.tsx`
    - Select `event_path` and `event_name`.
    - Render communal event name as the primary cover headline; retain legacy personal cover behaviour.
    - Keep `event_tag` as a subtitle/context field.

14. `lib/og/CoverThemeResolver.ts`
    - Extend only where communal categories need a distinct theme resolution. Avoid unnecessary theme-system replacement.

15. `app/publication-render/[token]/page.tsx`
    - Extend the capsule query/type with the new fields.
    - Use path-aware cover titles, page titles, foreword, profile headings, and closing narrative.
    - Avoid statements implying every publication is about an individual's life when rendering a communal event.
    - Audit other render sections that directly refer to `honouree_name`; make them safe without weakening personal narratives.

16. Architecture consistency review
    - `OG02_COVER_SYSTEM.md`: review the person-first primary visual focus rule for compatibility with communal covers.
    - `LC03_LEGACY_PUBLICATION_SYSTEM.md`: check that communal narrative progression is consistent with the existing publication concept.
    - Amend authoritative documents only after the implementation behaviour is established; do not duplicate existing architecture.

## 4. Database Migration Proposal

**Status: proposed only; do not apply until consumer review and rollout readiness are confirmed.**

### 4.1 Additive schema phase

Proposed schema changes:

- Add nullable `event_path TEXT` initially.
- Add nullable `event_name TEXT` initially.
- Relax `honouree_name` from NOT NULL to nullable only when the application consumers have been updated and the rollout sequence is ready.
- Add a check constraint for accepted path values once data and rollout requirements are established.
- Enforce non-empty `event_name` and valid path for newly created records in the server API; consider database-level constraints after legacy records are backfilled safely.

Do not immediately make `event_name` NOT NULL on the whole table: existing records require a controlled backfill first, and some legacy values are ambiguous.

### 4.2 Backfill rules

- Preserve existing `event_type`, `honouree_name`, and `event_tag` values.
- Backfill `event_name` only from a field whose meaning is unambiguous. A safe initial candidate is the existing `honouree_name` as a compatibility display-name fallback for legacy personal records; verify records and intended display before executing the update.
- Backfill `event_path` conservatively. Known legacy Conference records are likely communal, but each row should be assessed. The `other` type is ambiguous and must not be blanket-classified.
- Leave uncertain records on a compatibility path until a reviewed mapping is available; do not invent event names or infer a communal path from a slug alone.
- Ensure legacy UI continues to behave as personal where existing code has done so, unless record evidence explicitly establishes a communal event.

### 4.3 Deployment sequence

1. Complete a repository-wide consumer inventory, including admin/editor and API query paths.
2. Implement shared display helpers and make all consumers tolerate nullable `honouree_name`, while remaining compatible with records that have no new fields.
3. Prepare and review the SQL migration and an explicit row-by-row backfill mapping.
4. Apply the additive migration through the Supabase migration mechanism only when implementation and rollout are ready.
5. Deploy code that writes `event_path` and `event_name` for all new Capsules and reads legacy rows safely.
6. Verify new personal, new communal, and legacy records in a staging/test environment before enabling the new path for all users.
7. Only after verifying backfill completeness, decide whether to enforce stronger database constraints.

No migration should be run as part of audit or planning.

## 5. Regression and Acceptance Matrix

### Creation
- Existing personal types remain available and map to canonical event types.
- Both paths require an Event Name.
- Personal path validates the appropriate honouree details.
- Communal path does not require a person name.
- Each path has a working `Other` option and stores its custom occasion label separately from canonical `event_type`.
- Slug availability checking, manual editing, suggestions and duplicate rejection continue working.
- Free and paid booking paths, service selection, gift path, verification, and confirmation screens remain intact.

### Legacy data
- Existing Capsules with canonical types continue rendering.
- Legacy display-style event types continue rendering and retain recognisable presentation.
- Legacy `other` record is not misclassified as communal.
- A legacy record with missing `event_path` or `event_name` renders using safe compatibility fallbacks.
- Existing `event_tag` values remain subtitles and are not overwritten.

### Public experience
- Communal public page and social previews use Event Name.
- Personal pages retain person-specific language.
- Communal forms do not show false prompts such as “What would you like [event name] to know?”
- Ordinary wall contributions remain filtered by `story_topic_id IS NULL`.
- Community Stories remain filtered by `story_topic_id IS NOT NULL`.

### Email and publication
- Verification email can be requested and completed for both paths.
- Account creation and owner access remain intact.
- Welcome email subjects and headings use the correct display subject.
- Submission confirmation is grammatically appropriate for communal and personal modes.
- Publication cover, foreword, section headings and closing copy support communal events without breaking personal publication output.
- Social-preview image generation remains functional and uses the correct primary headline.

### Engineering quality
- TypeScript and lint checks pass.
- Build succeeds.
- Manual smoke tests cover one personal Capsule, one communal Capsule, and at least one legacy record of each relevant category.
- No production migration, deployment, or merge to `main` occurs before the verification checklist passes.

## 6. Component Map Impact — entries to reconcile

These are proposed responsibilities for the master map, not a claim that the master map has been edited.

| Component / responsibility | Relevant files |
|---|---|
| Capsule creation path and canonical event data | `app/book/page.tsx`, `app/api/capsules/create-and-verify/route.ts` |
| Event classification, legacy aliases and display subject resolution | `lib/eventLabels.ts`, `lib/utils/getParticipationLanguage.ts`, `lib/config/participationLanguage.ts` |
| Path-aware public Capsule rendering | `app/for/[slug]/page.tsx`, `components/TributeWallClient.tsx` |
| Path-aware Community Stories rendering | `app/for/[slug]/stories/page.tsx`, `components/CommunityStoriesClient.tsx` |
| Path-aware verification and organiser emails | `app/api/email/verify-code/route.ts`, `lib/email.ts`, `app/api/email/verify-organiser/route.ts` |
| Path-aware contributor confirmation | `app/api/email/submission-confirmation/route.ts` |
| Social cover/metadata | `app/api/og/[slug]/route.tsx`, `app/for/[slug]/page.tsx` |
| Publication cover and communal narrative | `app/publication-render/[token]/page.tsx`, `lib/og/CoverThemeResolver.ts` |

**Map governance:** the live repository did not contain `/docs/COMPONENT_MAP.md` at audit time. The Project Knowledge map contains substantial historical notes. Reconcile the complete source with the repository's expected authoritative location before creating or replacing the file; preserve existing addenda and ownership rules.

## 7. Out of Scope

- A new event-planning engine.
- Replacing the booking system or wholesale homepage redesign.
- Unnecessary database restructuring.
- New analytics infrastructure solely for this upgrade.
- Merging ordinary Tribute Wall contributions with Community Stories.
- Unrelated cleanup of duplicate story-prompt seeding unless testing shows a direct dependency.
- Marketing/flyer campaign production in the implementation branch; adoption strategy can be consolidated separately after the core path is stable.

## 8. Document History

| Version | Date | Change |
|---|---|---|
| v1.0 | 17 October 2026 | Initial audit-derived plan, schema proposal, implementation waves, regression matrix, and Component Map impact. |

## 9. Attribution

Prepared under implementation coordination reference **CG08-LC**. This plan is based on the live repository and read-only Supabase schema/data checks performed on 17 October 2026. All proposed changes remain unimplemented until the relevant branch commits, tests, and migration record confirm otherwise.
