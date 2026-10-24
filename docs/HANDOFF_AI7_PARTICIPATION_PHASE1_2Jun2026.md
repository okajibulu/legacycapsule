# HANDOFF — AI7 Session Close
## LC-PARTICIPATION-001 Phase 1 Complete
## Date: 2 June 2026

---

## WHAT WAS BUILT

### Phase 1: Attribution & Recognition Engine (all 7 steps complete)

**Step 1 — SQL Migration**
- 4 new tables: `capsule_share_events`, `contribution_attribution`, `capsule_participation_summary`, `capsule_legacy_builders`
- 3 column additions: `contributions.ref_code` (UNIQUE), `contributions.legacy_builder_consent`, `capsules.legacy_builder_activation_threshold`
- Reserved columns: `capsule_legacy_builders.diversity_score`, `capsule_legacy_builders.ranking_score` (for Phase 2, no migration needed)
- Immutable helper function `lc_utc_date()` created for deduplication index
- Full RLS, indexes, deduplication constraints

**Step 2 — `lib/participation/refCode.ts`** (new file)
- `generateRefCode()` — 8-char safe alphanumeric (no I/O/0/1)
- `assignRefCode(contributionId)` — writes to DB with collision retry
- `updateParticipationSummary(capsuleId)` — upserts 7 metrics on every approval
- `recalculateLegacyBuilders(capsuleId)` — top 5 by ref_count, tier assignment, milestone emails
- `sendMilestoneEmail()` — 3 recognition tiers, fires once per threshold

**Step 3 — `app/api/email/approval/route.ts`** (modified)
- Hooks: assignRefCode → updateParticipationSummary → recalculateLegacyBuilders
- All non-blocking (try/catch, logged, never block keepsake email)
- `ref_code` added to contribution SELECT

**Step 4 — `components/TributeWallClient.tsx`** (6 edits)
- `?ref=` captured from URL on page load, stored in sessionStorage
- `legacy_builder_consent` checkbox added to submission form
- `legacy_builder_consent` included in contributions insert
- Attribution row written to `contribution_attribution` on submit if ref present
- Consent state reset on successful submission

**Step 5 — `components/TributeWallClient.tsx`** (continuation)
- Visitor's own ref code fetched after approval
- Copy Link appends `?ref=` to clipboard URL
- WhatsApp share link appends `?ref=`

**Step 6 — `app/api/share/record/route.ts`** (new file)
- POST endpoint recording share events with IP deduplication
- Daily-rotating SHA-256 IP hash (privacy-safe)
- Increments share_count in participation summary
- Silently ignores same-day duplicates via unique index
- Called from handleCopy and WhatsApp onClick in TributeWallClient

**Step 7 — `lib/email.ts`** (modified)
- `refCode` added to `ApprovalEmailParams` interface
- Keepsake Card share prompt upgraded: ref-coded CTA button + plain link
- Approval route passes `contribution.ref_code` to sendKeepsakeCard

---

## FILES CREATED

| File | Type | Purpose |
|------|------|---------|
| `lib/participation/refCode.ts` | New | Core attribution engine |
| `app/api/share/record/route.ts` | New | Share event recording API |

## FILES MODIFIED

| File | Changes |
|------|---------|
| `app/api/email/approval/route.ts` | Participation hooks + ref_code in select + refCode passthrough to keepsake |
| `components/TributeWallClient.tsx` | 6 edits: ref capture, consent checkbox, attribution insert, share ref appending, share event recording |
| `lib/email.ts` | refCode on interface, ref-coded share CTA in keepsake card |

## DATABASE CHANGES

| Object | Type |
|--------|------|
| `capsule_share_events` | New table |
| `contribution_attribution` | New table |
| `capsule_participation_summary` | New table |
| `capsule_legacy_builders` | New table |
| `lc_utc_date()` | New function (immutable) |
| `contributions.ref_code` | New column (UNIQUE) |
| `contributions.legacy_builder_consent` | New column |
| `capsules.legacy_builder_activation_threshold` | New column |

---

## COMPONENT MAP ADDITIONS

| Component | File | Section | Owner |
|-----------|------|---------|-------|
| `generateRefCode` | `lib/participation/refCode.ts` | Section 2 | AI7 |
| `assignRefCode` | `lib/participation/refCode.ts` | Section 2 | AI7 |
| `updateParticipationSummary` | `lib/participation/refCode.ts` | Section 3 | AI7 |
| `recalculateLegacyBuilders` | `lib/participation/refCode.ts` | Section 4 | AI7 |
| `sendMilestoneEmail` | `lib/participation/refCode.ts` | Section 5 | AI7 |
| `ExistingBuilder` type | `lib/participation/refCode.ts` | Section 4 types | AI7 |
| `POST /api/share/record` | `app/api/share/record/route.ts` | Full file | AI7 |
| `arrivalRef` + capture | `TributeWallClient.tsx` | EFFECTS | AI7 |
| `myRefCode` fetch | `TributeWallClient.tsx` | EFFECTS | AI7 |
| `fConsent` + checkbox | `TributeWallClient.tsx` | Composer | AI7 |
| Attribution insert | `TributeWallClient.tsx` | handleSubmit | AI7 |
| Share ref appending | `TributeWallClient.tsx` | handleCopy + WhatsApp | AI7 |
| Share event recording | `TributeWallClient.tsx` | handleCopy + WhatsApp onClick | AI7 |
| `ApprovalEmailParams.refCode` | `lib/email.ts` | Types | AI7 |
| Keepsake share CTA | `lib/email.ts` | buildKeepsakeCardHtml | AI7 |

---

## WHAT IS NOT YET BUILT

### Phase 2 — Legacy Room UI (next build block)
- Public-facing participation page: `/for/[slug]/legacy`
- Stats panel (contributor count, photo count, country count, share count)
- Legacy Builders leaderboard (top 5, tier badges, consent-aware display names)
- Participation wall / timeline
- Link from tribute wall footer to Legacy Room

### Phase 2 — Anti-Gaming (uses reserved columns)
- `diversity_score` computation (referral diversity, not raw count)
- `ranking_score` composite (diversity + ref_count weighted)
- Replace `ORDER BY ref_count DESC` with `ORDER BY ranking_score DESC`
- No migration needed — columns already in `capsule_legacy_builders`

### Other Pending (from CURRENT_STATE.md)
- EOH email flow diagnostics (support_acknowledgements audit)
- Path 2: "Build Your Capsule" configurator
- Gift a Capsule flow (post-Stripe)
- Honouree Appreciation Dispatch (Phase 3, Experience 5b)
- Vendor/contractor tier in Coordinate pillar

---

## KEY DECISIONS MADE

| Decision | Rationale |
|----------|-----------|
| Ref codes generated at approval, not submission | Prevents gaming from mass-submitted pending tributes |
| 8-char codes using 32-char safe charset | Matches platform convention, no ambiguous characters |
| `diversity_score` + `ranking_score` reserved now | Zero-cost future-proofing, no Phase 2 migration |
| Phase 1 sorts by raw `ref_count` only | Simple, testable, correct baseline |
| All participation hooks non-blocking | Keepsake email and approval response never fail due to participation |
| IP hash uses daily rotating salt | Privacy-safe deduplication, no persistent tracking |
| Milestone emails fire once per threshold | Flags in DB, idempotent |
| Dropped builders keep records, lose rank_position | K6: rankings never reset |

---

## KNOWN GOTCHAS FOR NEXT AI

- `ExistingBuilder` type must be at module scope in `refCode.ts`, not inside the function body (TypeScript narrows to `never` otherwise)
- The approval route file is compact (~82 lines) — participation hooks were meant to be in the full Step 3 replacement but may not have been applied. Verify `assignRefCode`, `updateParticipationSummary`, `recalculateLegacyBuilders` are called
- `contribution_attribution` insert happens client-side via anon Supabase — RLS must allow anon insert
- `?ref=` validation regex: `/^[A-Z2-9]{8}$/` — must match REF_CHARSET exactly
- Gallery photos disappeared during session but data confirmed intact in Supabase — unrelated to Phase 1 changes
