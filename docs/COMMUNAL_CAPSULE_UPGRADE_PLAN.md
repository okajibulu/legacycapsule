# Personal and Communal Capsule Upgrade — Implementation Plan

**FILE PATH** `/docs/COMMUNAL_CAPSULE_UPGRADE_PLAN.md`  
**DOCUMENT OWNER** CG08-LC — LegacyCapsule implementation coordination  
**STATUS** Approved for Adoption — authoritative working plan; implementation and migration remain separately gated  
**VERSION** v2.1  
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



## 8D. Caller-Graph and Shared Email Contract Audit — 17 October 2026

This pass traced the source-visible callers for several event-facing email and contribution flows. It identified one confirmed request-contract mismatch and two email endpoints whose in-repository callers remain unconfirmed. These are audit findings only; no source code was changed.

### Caller and contract matrix

| Source / caller | Destination or helper | Source-confirmed behaviour | Audit disposition |
|---|---|---|---|
| `components/TributeWallClient.tsx` | `POST /api/email/submission-confirmation` | Sends camelCase fields including `contributionId`, `capsuleSlug`, `contributorName`, `contributorEmail`, `subjectName`, and `eventType`. The route accepts the required identity fields and creates a 7-day edit token. | Existing direct-wall caller aligns with the route's required payload. Extend the subject/path context compatibly; preserve edit-token behaviour. |
| `app/api/community-topics/submit/route.ts` | `POST /api/email/submission-confirmation` | Sends `contributor_name`, `email`, `capsule_slug`, and `contribution_type`; it does not send the route-required `contributionId`, `capsuleSlug`, `contributorName`, or `contributorEmail` field names. The confirmation route therefore rejects this request at its required-field validation if this payload reaches it unchanged. | **Confirmed pre-existing request-contract mismatch in source.** Determine whether this path is active and whether the intended behaviour is the shared confirmation email or only the separate thank-you email. Do not silently broaden the route contract during the communal upgrade without agreeing the desired semantics. |
| `app/api/community-topics/submit/route.ts` | `lib/email/sendContributorThankYou.ts` | Fetches `honouree_name, slug` and passes the honouree name into story thank-you copy. | Add path-aware subject context if this flow is eligible for communal Capsules; preserve the non-blocking send behaviour. |
| `app/api/email/approval/route.ts` | `lib/email.ts` → `sendKeepsakeCard` | Loads `slug, honouree_name, event_type` and uses `honouree_name` as `subjectName` for the contributor Keepsake Card. | Include in the contributor-facing email inventory. Establish whether communal contributions use the same Keepsake Card concept and, if so, use the resolved event subject without changing approval or ref-code behaviour. |
| `app/api/webhooks/paystack/route.ts` | `lib/email/sendPaymentConfirmation.ts` | Calls the shared payment-confirmation helper using a fallback honouree label when the Capsule name is absent. | Update the shared helper and this caller together; preserve amount, currency, processor, promo and payment-state semantics. |
| `app/api/webhooks/stripe/route.ts` | Local `sendPaymentConfirmationEmail` and gift routes | Implements a separate person-centred payment confirmation; independently calls gift notification/scheduling for gift-mode purchases. | Treat Stripe confirmation separately from Paystack's shared helper. Keep purchased-gift eligibility distinct from physical Gift Collection. |
| `app/api/email/verify-code/route.ts` | Capsule verification/welcome flow | On successful verification, selects `slug, honouree_name, organiser_email, event_type` and constructs the welcome subject from `honouree_name`. Gift-mode welcome is delegated to gift-notification. | This is the verified creation-flow dependency to adapt first; preserve verification, access creation, expiry and cleanup behaviour. |
| `app/api/email/verify-organiser/route.ts` | `lib/verification.ts` → `sendOrganiserVerification` | Route requires `honoreeName`. The audited creation endpoint calls `/api/email/verify-code`, not this route. No internal caller was established in this source pass. | **Caller status unresolved**, not confirmed dead. Check runtime/log evidence and broader caller references before changing or removing its contract. |
| `app/api/email/verify-contributor/route.ts` | `lib/verification.ts` → `sendContributorVerification` | Route requires `honoreeName`; no internal caller was established in this source pass. | **Caller status unresolved**, not confirmed dead. Preserve until usage is confirmed; communal eligibility and payload design remain open. |
| `app/api/capsule/honouree-reveal/route.ts` | `lib/honoureeEmail.ts` / reveal delivery | Reads the honouree record and creates a token for an individual honouree portal. | Keep personal-only unless a distinct communal-recipient model is approved; enforce at the server boundary. |
| `app/api/capsule/appreciation/route.ts` | Family Appreciation profile section | Creates/updates a `capsule_profile_sections` appreciation section; dashboard templates use family/person language. | Decide and enforce personal-only eligibility unless a communal appreciation concept is explicitly defined. |

### Additional confirmed constraints

- The public Tribute Wall writes ordinary contributions directly from `components/TributeWallClient.tsx` with `story_topic_id: null`; the communal upgrade must not change this discriminator.
- Community-topic submissions are a separate code path and carry their own topic/story semantics. Preserve the distinction between ordinary wall contributions and Community Stories.
- `app/api/community-topics/submit/route.ts` uses `honouree_name` for its thank-you email, while its shared submission-confirmation request currently does not match the destination route's required payload. Treat the mismatch as pre-existing; test and resolve it deliberately rather than folding an incidental fix into unrelated identity changes.
- The repository's code-search connector returned no indexed matches for function/route caller searches during this audit. The caller dispositions above are based on direct source inspection and the repository's checked-in `email_audit.txt` search artifact; a missing match is not proof that an endpoint is unused.
- The checked-in `email_audit.txt`, `og_callers.txt`, and similar root-level text files are search/audit artifacts, not authoritative architecture or migration records. Do not treat them as a substitute for current source or runtime evidence.

### Gate update

The email caller graph is **partially traced, not closed**. Before implementation, still verify the runtime usage of the two verification endpoints, trace thank-you and Keepsake Card callers comprehensively, and inspect all remaining direct `capsules` reads/writes and feature gates. No endpoint should be removed solely because an internal callsite was not found in this pass.



## 8E. Contribution Lifecycle Findings Register — 17 October 2026

This section consolidates source/schema findings from the read-only audit. These findings are not implementation authorisation. Production impact must not be asserted without deployment/runtime verification.

### Confirmed source or schema mismatches

1. **RSVP contribution source column:** `app/api/rsvp/respond/route.ts` inserts `source: 'rsvp'` into `public.contributions`, while the live schema exposes `contribution_source`. The route catches insertion errors and allows the RSVP to succeed, so an RSVP message may not become a contribution. Runtime frequency is unverified.
2. **Community Stories confirmation payload:** `app/api/community-topics/submit/route.ts` sends snake_case fields (`contributor_name`, `email`, `capsule_slug`, `contribution_type`) to `/api/email/submission-confirmation`, whose required request fields are `contributionId`, `capsuleSlug`, `contributorName`, and `contributorEmail`. The request is incompatible as written; the caller treats email failure as non-fatal.
3. **Queue restoration endpoint:** `components/TributeWallClient.tsx` requests `/api/capsule/restore-submission?token=...`. No corresponding route appears in the recursive repository trees inspected for either `main` or `cg08/communal-capsule-upgrade-plan`. Deployment state remains unverified. Do not conclude that production restoration is broken until the deployed version is checked.

### Confirmed status-contract differences

- Ordinary Tribute Wall and Community Stories insert contributions with `pending_review`.
- RSVP-generated messages use `pending` in source, alongside the separate source-column mismatch.
- `lib/admin/actions.ts` includes `pending_review` and `pending` in the admin moderation list and counter.
- `app/api/contributions/pending/route.ts` filters `pending` and `pending_correction`, so its query does not include `pending_review`.
- `queued_submissions.status = 'queued'` belongs to a separate queue table and must not be treated as a contribution moderation status.

The status differences are confirmed in source. Their live operational impact and the intended canonical status vocabulary remain to be established. No status should be renamed or bulk-updated as part of the communal-event migration without a separate approved disposition.

### Moderation retention policy requires a product decision

- `app/api/contributions/reject/route.ts` deletes a contribution.
- `lib/admin/actions.ts::adminRemoveContribution` sets `status = 'declined'` and `deleted_at`.
- Approval routes set `status = 'approved'`; notification and audit behaviour varies by route.

These behaviours have different retention and audit consequences. Before consolidation, define whether organiser rejection and admin removal are intentionally different, what records must be retained, and which approval side effects must run for each moderation interface.

### Lifecycle invariants to preserve

1. Ordinary Tribute Wall contributions remain distinct from Community Stories; `story_topic_id = null` continues to identify the ordinary wall path, while topic-linked submissions retain their topic association.
2. Queue restoration must preserve the session token, expiry/purge semantics, contributor details, and already-uploaded media references.
3. A successful RSVP must remain independent of optional public contribution insertion unless a separately approved consistency change defines otherwise.
4. All moderation surfaces must agree on the approved pending-status contract and include regression tests for each supported submission path.
5. Notification failures must have explicit and observable handling; non-fatal email failures must not be misreported as successful delivery.
6. Personal-only honouree functionality must remain eligibility-gated when communal Capsules are introduced.

### Required verification and disposition gates

- Verify the deployed application version and endpoint availability for queue restoration.
- Trace how queued submissions are converted into contributions, including final status, media references, and purge/consumption behaviour.
- Establish the canonical contribution status vocabulary and reconcile every moderation query and counter.
- Confirm the intended `contribution_source` values and the migration/compatibility policy for historical records.
- Align Community Stories submission-confirmation payload with the receiving endpoint contract and add a caller/receiver contract test.
- Define rejection, deletion, soft-deletion, and audit-retention policy.
- Add regression coverage for ordinary wall, Community Stories, RSVP, queued restoration, admin moderation, organiser moderation, and notification failure.

These gates belong to the pre-implementation dependency audit. They do not authorise a production fix, database migration, or unrelated refactor.




### Queue persistence, restoration, notification and expiry — additional audit evidence

This subsection records a further read-only source/database pass completed on 17 October 2026. It narrows what is known about the queue lifecycle; it does not establish the state of the deployed application.

**Source-confirmed queue creation and client behaviour**

- `app/api/capsule/queue-submission/route.ts` creates a random session token, sets `purge_after` to 30 days, and inserts the contributor details, tribute text, media URLs, `assets_pending = true`, and `status = 'queued'` into `public.queued_submissions`. It logs a `wall_hit` lifecycle event on a best-effort basis and returns a restore URL containing the token.
- `app/api/capsule/queue-update-email/route.ts` updates the email address only when the token identifies a row whose status remains `queued`.
- `components/TributeWallClient.tsx` requests `/api/capsule/restore-submission?token=...`, but that route was not present in the inspected recursive trees for `main` or this plan branch. The visible restoration logic repopulates contributor identity, location, relationship, tribute text, and audio/video URLs. Photo restoration into the form state was not established by this pass.
- The visible client path submits directly to `public.contributions` with `pending_review` when wall capacity permits. When capacity is full, it queues the draft and presents a return/restore path. Source inspection did not establish an automatic conversion of queued rows into contributions when capacity reopens.
- The queue route comment says the 30-day purge is handled separately. No queue purge job or restoration route was found in the inspected repository tree. This is a repository finding, not proof that an external scheduler or deployed endpoint does not exist.
- `app/api/cron/notify-pending/route.ts` is the only relevant cron route identified in this pass; it notifies organisers about pending contributions. It does not establish notification to contributors when queued capacity becomes available.

**Read-only live database snapshot**

- `public.queued_submissions` contains fields for `status`, `notified_at`, `completed_at`, and `purge_after`, as well as contributor fields and photo/audio/video URLs.
- The table had **0 rows at the time of inspection**. This does not prove the queue feature is unused or that no queued records existed historically.
- No triggers on `queued_submissions` and no database routines referencing it were returned by the inspected `information_schema` queries. The Supabase Edge Functions listing returned no functions. The migration history inspected contains 11 entries through 7 October 2026, with no obvious queue restore/purge migration.
- No identified source writer for `notified_at` or `completed_at` was established in this pass. Deployment configuration and external scheduled jobs were not accessible for verification.

**Disposition: lifecycle contract remains open**

Do not claim that queued submissions are automatically restored, converted, notified, or purged until the deployed application and any external scheduler are verified. Before implementation, specify and test:

1. A working, token-protected restoration endpoint with a defined expiry check; restore every persisted form field and media reference, including photo.
2. The intended user journey when capacity reopens. The current source does not prove silent auto-submission; preserve explicit contributor review/confirmation unless a different contract is approved.
3. Idempotent completion so retries, repeated restores, and double submissions cannot create duplicate contributions.
4. A defined state transition and timestamp contract, including when `completed_at` and `notified_at` are written and how failures are surfaced.
5. A real retention/expiry mechanism for queue rows and an explicit policy for associated media objects; a `purge_after` timestamp alone does not purge data.
6. A verified notification path if the product promises to tell contributors when the wall reopens.
7. Regression tests for token expiry, expired links, missing/deleted media, retries, capacity reopening, notification failure, and queue completion.

**Evidence boundary:** repository source and live schema were inspected; production deployment, historical queue activity, external schedulers, and user-facing incident frequency remain unverified. No source code, database, migration, or deployment was changed by this audit.


## 8F. Personal-Only Feature Eligibility and Server-Boundary Audit — 17 October 2026

This pass inspected the server routes for honouree reveal, Family Appreciation, purchased-gift notifications, scheduled gift delivery, Capsule updates, prompt seeding, and RSVP contribution creation. Findings below are source-confirmed observations from `main`; runtime exposure, caller authentication, and production impact require separate verification. No code or database was changed.

### Feature eligibility and server-side enforcement

| File / capability | Source-confirmed observation | Required disposition before communal launch |
|---|---|---|
| `app/api/capsule/honouree-reveal/route.ts` | Accepts `capsule_id` and caller-supplied `honouree_email`, loads Capsule details with the service-role client, creates a honouree portal token and sends person-specific copy. In the inspected handler, no organiser-session/ownership check or explicit personal-path eligibility check is visible before token creation and email delivery. | Treat as a high-priority server-boundary review. Confirm intended caller authentication and ownership contract. Enforce personal-only eligibility server-side unless a distinct communal-recipient model is approved. Do not rely on hiding the dashboard control. Review token generation and send retry behaviour as part of the same route audit. |
| `app/api/capsule/appreciation/route.ts` | The route comment says portal access is an implicit auth check, but the inspected handler uses the service-role client and does not visibly validate a session, organiser ownership, or Capsule path. It can create/update a `capsule_profile_sections` appreciation section by supplied Capsule/section IDs. | Verify whether middleware or an external boundary protects this route. If no verified boundary exists, require explicit authorisation and personal-only eligibility where Family Appreciation remains personal. Verify section ownership on both create and update paths. |
| `app/api/email/gift-notification/route.ts` | Sends a purchased-gift Capsule notification using `honouree_name` and person-centred copy. It is described in source as called by the Stripe webhook for `book_mode === 'gift'`. | Keep this workflow distinct from physical Gift Collection. Decide whether communal Capsules can be purchased as gifts; if not, enforce that rule at the creation/payment/webhook boundary. If allowed, define recipient and event-identity semantics before changing copy. |
| `app/api/email/gift-schedule/route.ts` | Schedules recipient email through Resend and writes delivery metadata to the Capsule. It uses `honouree_name` in recipient and organiser messages. The source describes this as called by the Stripe webhook for scheduled gift delivery. | Apply the same separately approved eligibility rule as immediate gift notification. Preserve scheduling, cancellation/rescheduling, and payment semantics; verify external send IDs and error handling before changes. |
| `app/api/capsule/update/route.ts` | Uses a field allowlist and currently permits fields such as `honouree_name` and `event_type`, but not the proposed `event_path` or `event_name`. It uses a service-role client; this file alone does not establish how the request is authenticated upstream. | Preserve protected-field restrictions. Add the new fields only after schema rollout and request-identity/ownership checks are established; validate canonical path/type and event-name requirements server-side. |
| `app/api/capsule/seed-prompts/route.ts` | Accepts a caller-supplied `capsule_id` and optional `event_type`; if the latter is absent, it reads the Capsule type. It seeds system prompts based on event type and general prompts. The inspected handler does not visibly validate ownership or reconcile a supplied type with the stored Capsule type. | Verify its caller and protection boundary. Derive canonical path/type from the stored Capsule where possible; ensure caller-supplied values cannot seed inappropriate prompts or cross-Capsule data. Add communal prompt coverage without collapsing ordinary wall and Community Stories. |
| `app/api/rsvp/respond/route.ts` | Validates a guest `rsvp_token`, updates the RSVP, and optionally inserts a public contribution. The contribution insert uses `source: 'rsvp'` and status `pending`, while the audited schema/status contract findings in Section 8E remain unresolved. | Preserve RSVP success independently of optional contribution insertion. Resolve the source-column and status contracts separately, and define whether RSVP messaging is suitable for communal Capsules. |

### Important evidence boundary

- The observations above mean **the inspected route code does not itself show the stated check**. They do not prove that a route is publicly reachable or unprotected in production; middleware, hosting configuration, or another verified upstream boundary may exist.
- A comment saying authentication is implicit is not, by itself, proof of an effective security boundary.
- Do not remove personal-only functionality or expand eligibility based only on UI visibility. The server must enforce the approved eligibility and authorisation contract.
- No penetration test, deployed-route test, middleware audit, or runtime log review was performed in this pass. Treat possible authorisation gaps as verification priorities, not as confirmed exploitation or a claim of production compromise.

### Required gates

1. Trace every caller and inspect middleware/route protection for the reveal, appreciation, update, and prompt-seeding endpoints.
2. Verify Capsule ownership/organiser authorisation on all service-role mutations and side-effecting email/token routes.
3. Define a single explicit eligibility matrix for personal-only, communal-capable, and separately purchased-gift features.
4. Enforce that matrix at server boundaries and test direct HTTP requests that bypass UI controls.
5. Test wrong-Capsule IDs, unauthorised callers, repeated requests, expired/deleted Capsules, communal Capsules, and failure/retry paths.
6. Keep the physical Gift Collection workflow separate from purchased-gift Capsule notifications.
7. Do not start implementation until these gates and the open lifecycle gates in Section 8E have been dispositioned.


## 8G. Route-Protection and Caller-Trace Follow-up — 17 October 2026

This pass inspected the recursive `main` tree, the management page/server wrapper, selected route handlers, authentication routes, and the checked-in Next.js configuration. It supplements Section 8F. It is a source-level audit only; no deployed requests, penetration tests, or runtime logs were examined.

### Repository-level protection evidence

- The recursive `main` tree contains 793 paths and 175 `app/api/**/route.ts` files. No root `middleware.ts`, `middleware.js`, `proxy.ts`, or `proxy.js` was present in that tree.
- The inspected `next.config.js` defines a host-based redirect and build configuration; it does not show a general API authentication rule.
- This absence does **not** prove there is no protection: hosting controls, route-local checks, imported helpers, or another external boundary may apply. The Vercel project configuration and deployed behaviour were not available in this pass.
- GitHub code-search calls for the four endpoint paths returned no indexed matches. Treat those results as inconclusive; the endpoint caller graph remains unresolved.

### Additional source-confirmed details

1. **Management page boundary:** `app/manage/[slug]/page.tsx` calls `checkManageAuth(slug)` for Family Representative/Co-admin sessions, but its own header states that the organiser flow is still identified client-side through localStorage when no manager cookie is found. The client component also creates a Supabase anon client. This page alone does not establish whether the four service-role API routes enforce organiser ownership.
2. **Capsule update endpoint:** `app/api/capsule/update/route.ts` filters request fields through an allowlist and writes through a service-role client. The inspected handler does not visibly verify caller identity or Capsule ownership before the update. This is a high-priority verification item; do not infer public exploitability without examining all upstream controls.
3. **Appreciation endpoint:** `app/api/capsule/appreciation/route.ts` accepts supplied Capsule and section IDs and performs service-role writes. The handler does not visibly authenticate the caller or verify Capsule ownership for the create path. On the update path, it filters by `section_id`, `capsule_id`, and `section_type`, but still does not visibly prove the requester is authorised for that Capsule.
4. **Prompt seeding endpoint:** `app/api/capsule/seed-prompts/route.ts` accepts a Capsule ID and optional event type, then writes system topics using the service-role client. The inspected handler does not visibly authenticate the caller or validate that the supplied event type matches the Capsule record when provided.
5. **Honouree reveal endpoint:** `app/api/capsule/honouree-reveal/route.ts` accepts a Capsule ID and honouree email, creates a portal token, and sends an email using service-role access. No route-local caller identity/ownership check is visible in the inspected handler.
6. **Creation endpoint:** `app/api/capsules/create-and-verify/route.ts` is intentionally a public registration route, performs request validation, creates a Capsule and calls the established verification endpoint. Its public nature is not itself a finding; communal upgrade work must preserve validation, verification, and cleanup semantics while adding the approved path/name contract.

### Audit disposition

The four endpoints in the initial review—honouree reveal, appreciation, Capsule update, and prompt seeding—remain **authorisation verification priorities**. The source inspected so far does not show a route-local identity/ownership check in those handlers, and no repository-wide middleware/proxy file was found. However, upstream and deployment controls remain unverified, so the audit does not label these confirmed production vulnerabilities.

### Required verification sequence

1. Inspect `lib/manageAuth.ts`, any shared auth/permission helpers, and all route-specific imported helpers.
2. Retrieve the full callers from the repository with a local/complete search rather than relying on connector code-search results.
3. Inspect Vercel project settings and deployed route behaviour through an authorised environment; do not expose secrets or tokens in the audit record.
4. For every service-role mutation or side effect, define and enforce a caller identity + Capsule ownership/permission contract. Use narrowly scoped permissions where a co-admin/FRFA role is involved.
5. Add direct-request tests for unauthenticated callers, users who own a different Capsule, wrong section IDs, communal/personal eligibility, repeated requests, and allowed roles.
6. Verify the intended public nature and abuse controls of registration, RSVP, queue, and verification endpoints separately; do not indiscriminately require organiser authentication on legitimate public participant routes.
7. Record the result as one of: **verified protected**, **confirmed missing control**, or **unresolved**. Do not classify a control as absent solely because it is not visible in a single file.

No code, database, migration, deployment, or main-branch change was made.


## 8H. Shared Management Authentication Review — 17 October 2026

This pass inspected `lib/manageAuth.ts`, `app/manage/[slug]/page.tsx`, `app/api/team/verify/route.ts`, and the four priority service-role routes. This is source review only; deployed behaviour and external controls remain unverified.

### Verified source behaviour

**1. Organiser authentication is not established by `checkManageAuth`.**

- `lib/manageAuth.ts` validates the `lc_mgr_[slug]` cookie for active Family Representative Full Access and Co-admin accounts. That is a scoped manager-session check.
- If no valid manager cookie is found, `checkManageAuth(slug)` returns `accountType: 'organiser'` with no server-verified organiser identity. The file explicitly delegates organiser identity to the existing client-side localStorage flow.
- `app/manage/[slug]/page.tsx` passes that result into the dashboard client. Therefore, the page's server wrapper must not be treated as proof of organiser authentication for service-role API requests.

**2. The manager cookie verifies an account session, but does not itself authorise API mutations.**

- `app/api/team/verify/route.ts` checks the submitted email/password against an active FR Full Access or Co-admin account, then sets an HttpOnly, SameSite=Strict cookie scoped to `/manage/[slug]`.
- `lib/manageAuth.ts` can validate that cookie against the stored session hash and account/Capsule association. The four priority API handlers inspected do not call `validateManageSession` or another visible authorisation helper.
- The cookie's `/manage/[slug]` path scope means it is not automatically sent to `/api/capsule/*` endpoints. Any future shared API-auth design must account for this intentionally scoped cookie and must not weaken it casually.

**3. Capsule update is a priority authorisation gate.**

- `app/api/capsule/update/route.ts` accepts a caller-supplied `capsule_id`, allowlisted fields, and caller-supplied `actor_name`/`actor_email`. It updates the Capsule using the service-role client and logs the supplied actor details as an organiser. The inspected handler does not visibly verify the caller's identity, Capsule ownership, or permission before the write.
- The allowlist protects certain fields from browser updates, but it does not substitute for authentication and object-level authorisation. Caller-supplied audit identity must not be treated as verified identity.
- This is a **confirmed source-level missing check in the handler**, but not yet a confirmed production vulnerability because upstream/deployment protection and actual route reachability remain unverified.

**4. Appreciation, prompt seeding, and reveal remain unverified at the route boundary.**

- `app/api/capsule/appreciation/route.ts` uses the service-role client and accepts supplied Capsule/section IDs; no visible session/ownership check is present in the handler.
- `app/api/capsule/seed-prompts/route.ts` accepts a supplied Capsule ID and optionally supplied event type; no visible session/ownership check is present, and a caller-supplied event type is used without visibly confirming it against the stored Capsule.
- `app/api/capsule/honouree-reveal/route.ts` accepts a supplied Capsule ID and email, creates a private portal token, and sends the reveal email; no visible session/ownership or personal-path eligibility check is present.
- The UI caller for reveal is `components/HonoureeRevealPanel.tsx`, used by the management dashboard. The source comment for appreciation names the Family Representative Elder portal as its caller, but the exact caller component was not resolved in this pass. Prompt-seeding caller was not conclusively established by connector code search.
- These are handler-level observations. Do not assert production exposure until the full caller graph and external controls are verified.

### Implementation implications for the communal upgrade

1. Do not build communal eligibility on top of unverified client-side organiser identity.
2. Before enabling new Capsule identity fields or communal-specific mutations, establish a trusted server-side organiser identity and Capsule-level authorisation contract.
3. Use the existing manager-session helper only for the account types it actually validates; do not assume it authenticates organisers.
4. Define how organiser accounts, FR Full Access, Co-admin permissions, and FR Elder portal sessions map to endpoint-specific actions. Do not grant blanket access merely because a valid session exists.
5. Derive actor identity from a validated server-side session. Do not accept caller-supplied `actor_name` or `actor_email` as authoritative audit identity.
6. Keep route authentication distinct from feature eligibility: a valid actor may still be ineligible to use a personal-only feature on a communal Capsule.
7. Test direct HTTP calls without UI access, cross-Capsule IDs, insufficient co-admin permissions, invalid/expired sessions, and all approved personal/communal eligibility combinations.

### Remaining unknowns

- Whether Vercel/hosting configuration or an external gateway protects any of these routes.
- The complete caller graph for appreciation and prompt seeding.
- The existing organiser session mechanism, beyond the client-side localStorage reference in the inspected management files.
- The production deployment's exact commit and runtime behaviour.

No code, database, migration, deployment, or main-branch change was made.

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
| v1.6 | 17 October 2026 | Added direct caller-graph findings, a confirmed community-topic submission-confirmation payload mismatch, Keepsake Card dependency, and unresolved verification-endpoint caller status; clarified that absent search results do not establish that routes are unused. |
| v1.7 | 17 October 2026 | Added consolidated contribution-lifecycle findings register: RSVP source/schema mismatch, moderation-status query divergence, queue-restoration route discrepancy across inspected branches, notification contract mismatch, moderation-retention decision, and verification gates. No code or database changes authorised. |
| v1.8 | 17 October 2026 | Extended the contribution-lifecycle register with queue schema/state evidence, restoration and photo-recovery gaps, unverified notification and expiry mechanisms, and explicit lifecycle contract gates. Deployment remains unverified; no implementation or database changes authorised. |
| v1.9 | 17 October 2026 | Added personal-only feature eligibility and server-boundary audit findings for honouree reveal, Family Appreciation, purchased-gift notifications, Capsule updates, prompt seeding, and RSVP contribution handling. Potential authorisation gaps are marked for verification, not asserted as production exposure. No code or database changes authorised. |
| v2.0 | 17 October 2026 | Added repository-level route-protection and caller-trace follow-up: no root middleware/proxy file found, service-role route checks requiring verification, management auth boundary observations, and an explicit evidence classification sequence. No production exposure asserted; no code or database changes authorised. |
| v2.1 | 17 October 2026 | Inspected shared management authentication. Documented that manager-session validation covers FR Full Access/Co-admin only, organiser identity remains client-side in the inspected dashboard flow, and Capsule update accepts caller-supplied actor labels without visible route-level identity/ownership checks. Production reachability remains unverified. No implementation authorised. |

## 11. Attribution

Prepared under implementation coordination reference **CG08-LC**. This plan is based on the live repository and read-only Supabase schema/data checks performed on 17 October 2026. All proposed changes remain unimplemented until the relevant branch commits, tests, and migration record confirm otherwise.
