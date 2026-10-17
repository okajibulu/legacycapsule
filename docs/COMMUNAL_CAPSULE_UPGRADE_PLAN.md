# Personal and Communal Capsule Upgrade — Implementation Plan

**FILE PATH** `/docs/COMMUNAL_CAPSULE_UPGRADE_PLAN.md`  
**DOCUMENT OWNER** CG08-LC — LegacyCapsule implementation coordination  
**STATUS** Approved for Adoption — authoritative working plan; implementation and migration remain separately gated  
**VERSION** v1.5  
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

## 7. Additional Dependency Audit Findings

The following dependencies were confirmed in the read-only audit. These findings refine implementation scope; they do not mean every dependent feature must become communal-capable.

| Dependency | Confirmed concern | Implementation requirement |
|---|---|---|
| Organiser dashboard: `app/manage/[slug]/ManagePageClient.tsx` | Numerous labels, prompts, sharing messages and child components assume an individual honouree. Some child features are inherently personal. | Introduce the shared display-subject rule; audit and gate individual-only controls rather than mechanically replacing every name reference. |
| Update API: `app/api/capsule/update/route.ts` | Explicit update-field allowlist omits `event_path` and `event_name`. | Validate and permit only the intended new fields; retain protected-field restrictions. |
| Public Capsule APIs: `app/api/capsule-by-slug/route.ts`, `app/api/capsule/public-info/route.ts` | Current response contracts expose existing person-oriented fields only. | Extend contracts only where traced consumers require path/name data. |
| Story prompts: `app/api/capsule/seed-prompts/route.ts` | Prompt selection currently uses `event_type` only. | Review prompt-library coverage and ensure communal prompts are appropriate; preserve legacy prompt seeding. |
| Contributor verification: `app/api/email/verify-contributor/route.ts`, `lib/verification.ts` | Route contract requires `honoreeName`; contributor copy is person-oriented. | Trace the caller and carry event context where needed. Keep personal behaviour stable and avoid fabricating a honouree for communal events. |
| Gift notification: `app/api/email/gift-notification/route.ts` | Email copy assumes a gift capsule is created in honour of a person. | First establish whether communal Capsules are eligible for this flow; adapt copy only if supported, otherwise enforce/document the eligibility boundary. |
| Admin: `lib/admin/queries.ts`, `app/admin/capsule/[id]/page.tsx` | Admin listings and detail headings use `honouree_name`. | Display the resolved subject and expose path/event classification where useful for safe support operations. |
| Community Stories: `components/CommunityStoriesClient.tsx`, `app/for/[slug]/stories/page.tsx` | Prompts, headings, relationship questions and metadata interpolate honouree names. | Make topic wording and page metadata path-aware; preserve the distinction between ordinary wall contributions and Community Stories. |
| Publication rendering: `app/publication-render/[token]/page.tsx`, `app/publication/[slug]/page.tsx` | Publication cover, narrative, topic headings and metadata rely on `honouree_name`. | Review section-by-section, implement communal narrative variants, and inspect a generated PDF end-to-end. |
| Social cover: `app/api/og/[slug]/route.tsx` | Current headline derives from honouree/title and uses `event_tag` as context. | Use communal `event_name` as the headline and retain `event_tag` as supplementary context. |

### Shared display-subject rule

Use one shared, tested resolution contract across public pages, management, email, social covers and publication output:

- Personal Capsule: use the honouree or appropriate personal-occasion wording.
- Communal Capsule: use the event name as the primary subject.
- Legacy record: use a safe fallback when the new fields are absent.

Do not make every individual-specific feature communal by default. Profile, family-representative, appreciation and honouree-portal features require explicit eligibility decisions.

### Additional verified implementation constraints

- The live `capsules` table currently has neither `event_path` nor `event_name`; `honouree_name` is currently NOT NULL. A communal insert therefore requires a staged schema/application rollout, not just UI changes.
- Existing `event_type` values include mixed-case and legacy labels. The record using `other` is a personal example and must not be blanket-classified communal. Backfill mapping must be explicit and reviewed.
- `app/api/capsule/update/route.ts` and creation/API payloads must agree on canonical values and validation.
- The repository has no test script in `package.json`; validation must explicitly include lint/build and documented manual regression checks.
- The plan’s current Component Map table is an impact proposal only. The repository did not contain the expected live `/docs/COMPONENT_MAP.md`; reconcile the complete Project Knowledge map before restoring or replacing it.

## 8. Extended Route and Event-Story Dependency Audit

A further repository-tree pass identified additional event-facing routes beyond the original inventory. These should be included in implementation review because they can expose person-centred copy even when the main Capsule page is path-aware.

| File | Dependency / risk | Required review |
|---|---|---|
| `app/api/capsule/honouree-reveal/route.ts` | Sends the honouree a reveal email and builds subject/body copy from `honouree_name`. | Confirm eligibility is personal-only or adapt the flow to communal event recipients; do not address a group event as if it were an individual. |
| `app/api/email/gift-schedule/route.ts` | Scheduled gift email repeats the person-centred assumptions found in immediate gift notification. | Treat gift notification and scheduled delivery as one eligibility/copy decision; ensure both routes behave consistently. |
| `app/for/[slug]/story/page.tsx` | Event Story landing page metadata and headings use the honouree name. | Make metadata and visible event heading path-aware while retaining event type, tag and phase navigation. |
| `app/for/[slug]/story/[phaseId]/page.tsx` | Phase story metadata and rendered data use the honouree name. | Use event subject for communal phase pages; preserve the phase name as the local page heading. |
| `app/api/publication/distribute/route.ts` | Publication distribution email subject/body refers to the honouree's event. | Adapt the publication title and message for communal event names; preserve distribution/access behaviour. |
| `app/api/publication/named-send/route.ts` | Named-recipient publication send uses honouree possessives in subject/body. | Apply the same display-subject helper as standard distribution and test both delivery routes. |
| `app/api/team/capsules/route.ts` | Team Capsule API returns `honouree_name`, `event_type`, and `event_tag` only. | Trace team UI consumers and include path/event name only if they need to identify communal Capsules correctly. |
| `app/manage/[slug]/publication/page.tsx` and publication editor components | Publication editor is a separate entry point into publication operations. | Confirm it remains compatible with communal data and the same render/distribution contracts. |

### Audit conclusion

The dependency surface includes more than the primary public wall and organiser dashboard. In particular, the honouree-reveal, gift scheduling, story/phase pages, and two publication delivery routes can independently generate misleading person-centred copy. These routes must either be explicitly personal-only with enforced eligibility or use the shared path-aware subject contract.

The audit has identified the relevant source files, but has not yet proven every route's caller graph or eligibility policy. Those checks remain implementation prerequisites. Do not infer that a route is communal-enabled solely because its API can accept a capsule ID.



## 8A. Email and Organiser-Flow Audit — 17 October 2026

The next source-file pass confirms that several email endpoints require coordinated contract changes, not merely updated templates:

| File | Confirmed current contract | Required implementation control |
|---|---|---|
| `app/api/email/verify-organiser/route.ts` → `lib/verification.ts` | Organiser verification requires `honoreeName`. | Accept a resolved Capsule subject/path context for communal creation; retain compatibility for existing callers and personal Capsules. Trace all callers before changing required fields. |
| `app/api/email/verify-contributor/route.ts` → `lib/verification.ts` | Contributor verification requires `honoreeName`; event type is optional. | Make verification subject path-aware while keeping contributor identity, contribution ID, slug, token and verification behaviour unchanged. Trace callers. |
| `app/api/email/submission-confirmation/route.ts` | Event-copy builder takes event type and a subject name, and creates a 7-day contributor edit token. | Pass path/event-name context into copy generation; do not alter edit-token lifecycle or contribution submission semantics. |
| `lib/email/sendContributorThankYou.ts` | Thank-you copy uses `honoureeName` in gallery/story confirmation and page title. | Extend parameters compatibly to accept resolved display subject; update both photo and story variants. Trace callers and preserve personal copy. |
| `lib/email/sendPaymentConfirmation.ts` | Payment confirmation requires `honoureeName`, `eventType`, and `eventTag`. | Identify communal Capsules by event name without affecting amount, currency, processor, promo-slot or payment-status details. Trace Stripe and Paystack callers. |
| `app/api/capsule/honouree-reveal/route.ts` and `lib/honoureeEmail.ts` | Feature explicitly creates a token for an individual honouree portal. | Treat as personal-only unless a distinct communal-recipient model is approved. Enforce eligibility server-side; hiding a button is insufficient. |
| `lib/gift/emailTemplates.ts` | Gift credential builder already has a separate `eventName` parameter. | Reuse this concept only where semantically correct; do not conflate gift-system event details with Capsule classification. |

### Confirmed implementation principles

1. Establish a shared server-safe subject resolver with explicit inputs for `event_path`, `event_name`, `honouree_name`, and legacy fallback. Avoid duplicated, inconsistent conditionals across routes.
2. Treat subject resolution and feature eligibility as separate concerns. A valid display name does not make an individual-only workflow suitable for a communal Capsule.
3. Before editing a route contract, trace every caller and record whether it is internal, public, webhook-driven, or UI-driven. Preserve existing personal callers during rollout.
4. Preserve verification, payment, contribution moderation, publication distribution, and token expiry semantics. This upgrade changes event identity and wording, not those business processes.
5. The source review confirms endpoint parameter assumptions; it does not yet establish the full caller graph for every helper. That remains an audit gate, not an assumed fact.

## 8B. Remaining Audit Gates

Before production implementation or migration, close these items:

- Trace callers of organiser/contributor verification, submission confirmation, thank-you email, payment confirmation, gift notification/scheduling and honouree reveal.
- Search every direct `capsules` read/write, including server actions, Supabase helpers and publication/editor paths, for assumptions that `honouree_name` is always present.
- Confirm eligibility for individual honouree portal/reveal, appreciation, family representative/co-admin features, gifts, and person-profile publication sections. Enforce at server/API boundaries where necessary.
- Inspect `PublicationEditor`, layout generation/reconciliation and PDF narrative code together. Decide how communal publications replace or omit individual profile sections, then inspect a generated communal PDF end-to-end.
- Define the repository migration convention before authoring DDL. No migrations directory or SQL migration file was found in the audited tree; do not invent a second migration mechanism without reconciling deployment practice.
- Retrieve and reconcile the complete authoritative Project Knowledge `COMPONENT_MAP(1).md` before restoring or changing the map. The map is not yet present in the branch repository.

These gates are mandatory because a successful creation form alone would not demonstrate a safe communal-event implementation.


## 8C. Cover, Publication and Gift Collection Contract Audit — 17 October 2026

This section records additional source-file findings from the read-only audit. It extends the dependency inventory; it does not approve implementation or schema changes.

### Social cover and public publication

| File | Confirmed current dependency | Required implementation control |
|---|---|---|
| `app/api/og/[slug]/route.tsx` | OG image query selects `honouree_name`, `honouree_title`, `event_type`, `event_tag`, and `hero_image_url`; the primary display name is derived from honouree fields. | Select path/name fields when available and use the shared subject resolver. Preserve existing theme, ornament, prompt, and both cover modes. |
| `app/publication/[slug]/page.tsx` | Public publication metadata and holding-page heading use `honouree_name`. | Use path-aware event identity in metadata and holding state while preserving publication lookup and availability behaviour. |
| `app/publication-render/[token]/page.tsx` | The renderer has a typed `honouree_name: string` contract and person-specific foreword, profile section labels, and narrative. | Review the renderer section-by-section. Define which personal profile sections are omitted or replaced for communal publications; preserve personal output and inspect a generated communal PDF end-to-end. |
| `app/api/publication/distribute/route.ts` | Distribution selects `honouree_name`, `event_type`, `event_tag`; subject and body copy assume an individual. | Use path-aware publication subject/copy without changing recipient selection, idempotency, or distribution semantics. |
| `app/api/publication/named-send/route.ts` | Named-recipient distribution independently uses honouree possessives and person-centred copy. | Apply the same subject/copy contract as standard distribution; test both routes. |
| `app/manage/[slug]/publication/page.tsx` | Separate publication editor entry point. | Verify its data contract and editor components against communal Capsules; do not assume the editor is compatible because the render route is updated. |

### Physical Gift Collection: schema/consumer mismatch

The following code requests Capsule fields that are absent from the audited live `public.capsules` schema:

- `app/api/gift/credential/deliver/route.ts` selects `event_name, event_date, event_location` and falls back to `Your Event` when the query yields no Capsule data.
- `app/api/gift/credential/page/route.ts` selects `event_name, honouree_name, event_date, event_location, slug`.
- `app/gift/collect/[token]/page.tsx` selects `event_name, honouree_name, event_date, event_location`, then uses the event name for the guest page and metadata.
- `components/gift/GiftCredentialDisplay.tsx` expects an event name and optional event date/location.

This confirms a source/schema contract mismatch. It does not, by itself, prove the frequency or extent of user-facing incidents. Do not fix this by blindly adding fields. Establish the authoritative Capsule event identity and event-location contract, then update all affected consumers as a coordinated group.

Physical Gift Collection is the event-operations workflow for guests receiving physical gifts. It must not be conflated with the separate purchased-gift Capsule notification flow. A communal event should be able to identify itself on physical gift credentials without requiring an individual honouree. The source of location data remains unresolved; `capsule_phases.location` is phase-level data and must not be treated as a general Capsule location without an explicit contract.

### Purchased-gift notifications — separate eligibility decision

`app/api/email/gift-notification/route.ts` and `app/api/email/gift-schedule/route.ts` remain person-centred and select `honouree_name, event_type, event_tag, organiser_email`. These routes concern the purchased-gift Capsule notification flow, not physical Gift Collection. Determine whether communal Capsules are eligible for this workflow before changing its copy or contracts. If not eligible, enforce and document the boundary rather than silently making the flow communal-capable.

### Additional regression requirements

- Test both Open Graph cover modes with a communal event name and with legacy personal data.
- Test the publication holding page, generated publication, standard distribution, and named-recipient send separately.
- Verify that personal honouree profile sections do not render empty or misleading placeholders in communal publications.
- Test physical credential API data, guest page, email delivery, and event display as one end-to-end group.
- Keep event date/location semantics distinct from event name; do not infer Capsule-level location from phase-level location.
- Preserve purchased-gift notification behaviour for existing personal Capsules and enforce the separately approved communal eligibility rule.


## 9. Out of Scope

- A new event-planning engine.
- Replacing the booking system or wholesale homepage redesign.
- Unnecessary database restructuring.
- New analytics infrastructure solely for this upgrade.
- Merging ordinary Tribute Wall contributions with Community Stories.
- Unrelated cleanup of duplicate story-prompt seeding unless testing shows a direct dependency.
- Marketing/flyer campaign production in the implementation branch; adoption strategy can be consolidated separately after the core path is stable.

## 10. Document History

| Version | Date | Change |
|---|---|---|
| v1.0 | 17 October 2026 | Initial audit-derived plan, schema proposal, implementation waves, regression matrix, and Component Map impact. |
| v1.1 | 17 October 2026 | Added organiser/admin, public API, story prompt, verification, gift eligibility, social cover and publication dependency findings; clarified shared display-subject rule and rollout constraints. |
| v1.2 | 17 October 2026 | Extended dependency audit to honouree reveal, scheduled gift delivery, event/phase story pages, publication distribution and named-send routes, team Capsule API, and publication editor entry point. |
| v1.3 | 17 October 2026 | Added source-confirmed email/organiser-flow contracts, distinguished subject resolution from feature eligibility, and formalised remaining caller-graph, direct-database-read, publication and migration-convention audit gates. |
| v1.4 | 17 October 2026 | Added source-confirmed OG cover, public publication, publication distribution, and physical Gift Collection schema/consumer mismatch findings; separated physical gifting from purchased-gift notifications and added regression requirements. |
| v1.5 | 17 October 2026 | Founder approved the plan for adoption as the authoritative working plan. This approval does not authorise code implementation, database migration, production deployment, or merge to `main`; existing audit gates remain mandatory. |

## 11. Attribution

Prepared under implementation coordination reference **CG08-LC**. This plan is based on the live repository and read-only Supabase schema/data checks performed on 17 October 2026. All proposed changes remain unimplemented until the relevant branch commits, tests, and migration record confirm otherwise.
