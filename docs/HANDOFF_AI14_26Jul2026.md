# HANDOFF: AI14 Session Closure
# Date: 26 July 2026
# Outgoing: AI14 (Claude Opus 4.6)
# Platform version at close: v2.8.0
# Branch: main (deployed)

---

## 1. WHAT AI14 COMPLETED

### Access Code Module — Complete (Phases 1–7)

| Phase | Version | Files Delivered |
|-------|---------|----------------|
| 1 — Routing + orchestrator | v2.2.0 | `app/manage/[slug]/access/page.tsx`, `AccessCodeModule.tsx`, ServicesTab edit |
| 2 — Setup rebuild | v2.2.0 | `AccessCodeSetup.tsx` (tooltips, validation, localStorage, smart defaults) |
| 3 — Section builder | v2.3.0 | `SectionManager.tsx` (numbered tables, named tables, group sections, tier zones) |
| 4 — Generate + code list | v2.4.0 | `generate/route.ts` (hardened), `GuestCodeList.tsx` (search, per-code actions) |
| 5 — Bulk import | v2.5.0 | `BulkGuestImport.tsx` (paste-a-list, CSV, duplicate detection, preview) |
| 6 — Card print | v2.6.0 | `AccessCardPrint.tsx` (5 themes), `cards/print/page.tsx` |
| 7 — Metrics + ushers | v2.7.0 | `AccessMetricsDashboard.tsx` (sparkline, live pulse), `UsherSessionManager.tsx` (copy buttons) |

### Guest Coordination System — API Layer Complete, UI Partial

| File | Status |
|------|--------|
| `app/api/circles/route.ts` | ✅ Built — GET/POST/PUT/DELETE with audit log |
| `app/api/circles/portal/route.ts` | ✅ Built — portal token + welcome email |
| `app/api/rsvp/config/route.ts` | ✅ Built — GET/POST upsert for event_rsvp_config |
| `app/api/rsvp/invite/route.ts` | ✅ Built — sends RSVP emails, generates rsvp_token per guest |
| `app/api/rsvp/respond/route.ts` | ✅ Built — public token-auth submission, optional tribute insert |
| `app/api/event-log/route.ts` | ✅ Built — paginated audit log with circle filtering |
| `app/api/guests/route.ts` | ✅ Edited — circle_id, invited_by, household_size in POST/PUT |
| `app/for/[slug]/rsvp/page.tsx` | ✅ Built — guest-facing RSVP page (token-auth, event-aware) |
| `app/portal/circle/[token]/page.tsx` | ❌ NOT BUILT — Circle Leader portal |
| `app/manage/[slug]/guests/page.tsx` | ❌ NOT BUILT — Guest Management page |
| `components/manage/guests/CircleManager.tsx` | ❌ NOT BUILT |
| `components/manage/guests/RSVPDashboard.tsx` | ❌ NOT BUILT |
| `components/manage/guests/ActivityFeed.tsx` | ❌ NOT BUILT |
| `components/manage/ServicesTab.tsx` | ❌ NOT EDITED — guest_management externalLink wiring |

### SQL Migrations Run (LC Supabase — confirmed by founder)

```sql
-- Tables created
event_circles (id, capsule_id, name, description, leader_name, leader_email, leader_phone, portal_token, portal_expires_at, portal_sent_at, is_active, sort_order, created_at, updated_at)
event_rsvp_config (id, capsule_id, show_event_details, allow_additional_guests, max_additional_per_guest, show_dietary, allow_rsvp_message, rsvp_tone, deadline_at, event_venue, event_datetime, event_dress_code, created_at, updated_at)
event_action_log (id, capsule_id, actor_type, actor_name, actor_ref, action, target_type, target_id, target_name, metadata, created_at)

-- Columns added to guests
circle_id, invited_by, household_size, rsvp_token (UNIQUE), rsvp_sent_at, rsvp_responded_at, additional_guests, rsvp_message, dietary_requirements

-- Columns added to honouree_portal_tokens
role (default 'honouree'), circle_id, display_name

-- Indexes created
idx_event_circles_capsule, idx_event_action_log_capsule, idx_event_action_log_created, idx_guests_circle, idx_guests_rsvp_token
```

---

## 2. REMAINING BUILD — Guest Coordination System UI

### Priority order (critical path first)

**File 1 — `app/manage/[slug]/guests/page.tsx`**
Dedicated Guest Management page. Same pattern as `/manage/[slug]/access`:
- Auth via lc_visitor_email + organiser_email check
- Verifies `guest_management` in capsule.components
- Renders GuestModule orchestrator

**File 2 — `components/manage/guests/CircleManager.tsx`**
Circle CRUD UI. Create/edit/delete circles. Assign leaders with name, email, phone.
Show per-circle RSVP counts (confirmed/pending/declined).
"Send Portal Link" button per circle (calls `/api/circles/portal`).
Assign guests to circles (dropdown or bulk assign).

**File 3 — `components/manage/guests/RSVPDashboard.tsx`**
RSVP management panel:
- Summary stats: Confirmed / Declined / Pending / No Response / Total
- "Send RSVP Invitations" button with count (calls `/api/rsvp/invite`)
- "Send Reminders" button for unresponded guests
- Config section: toggle show_dietary, allow_additional_guests, allow_rsvp_message, rsvp_tone
- Event details section: event_venue, event_datetime, event_dress_code (private — only shown on RSVP page)
- RSVP deadline setting

**File 4 — `components/manage/guests/ActivityFeed.tsx`**
Renders event_action_log as a readable timeline. Shared between organiser and circle leader portal.
Each entry shows: icon, actor name, action description, target name, timestamp.
Paginated with "Load more" button.

**File 5 — `app/portal/circle/[token]/page.tsx`**
Circle Leader portal page. Token-authenticated (reads `honouree_portal_tokens` where role='circle_leader').
Shows:
- Circle name and leader name
- Guest list with RSVP status badges
- Inline confirm/decline toggle per guest (calls `/api/rsvp/respond` or a new circle-leader endpoint)
- ActivityFeed for this circle only
- Read-only capsule activity strip (tribute count, recent activity)

**File 6 — `components/manage/ServicesTab.tsx` edit**
Add `externalLink` to "Guest Management & Seating" ServiceCard when active:
```tsx
externalLink={guestMgmtActive ? `/manage/${capsule.slug}/guests` : undefined}
```
Remove the inline GuestManagementSection and TableManagementSection rendering.
Same pattern as the Access Codes card.

---

## 3. ARCHITECTURAL DECISIONS ALREADY MADE

1. **Circles replace "Invited By"** — organiser manages 15 circles not 300 individuals
2. **Venue/datetime/dress code in event_rsvp_config** — NEVER on capsules table (public vs private)
3. **Circle Leaders reuse honouree_portal_tokens** — role='circle_leader', circle_id FK
4. **Dietary off by default** — organiser toggles in RSVP config (cultural context: African events)
5. **RSVP message → tribute pipeline** — confirmed RSVP messages insert into contributions as pending tributes
6. **Guest RSVP page token-auth** — no login, rsvp_token in URL query param
7. **Audit log on every mutation** — event_action_log records all actor/action/target/timestamp
8. **Family Rep extension** — existing portal tokens now support role-based views
9. **RSVP tone setting** — 'warm' (default) or 'formal', affects email subject line

---

## 4. BUGS AND KNOWN ISSUES

| Issue | Detail | Status |
|-------|--------|--------|
| BUG-023 | Memories tab "page cannot be displayed" | Unresolved — AI13 was investigating |
| BUG-028 | Payment activation post-checkout | Webhook URL corrected — needs E2E test |
| CapsuleBottomNav icons | Unicode ? fallback on some browsers | Noted — replace with SVG |
| Premiums drawer | Full-width flat style, should be capped at 420px | Noted |
| RSVP page preflight | Currently no GET endpoint to validate rsvp_token without submitting. Page loads on faith, validates at submit. Consider adding `/api/rsvp/verify?t=token` that returns guest name + response status for better UX. |
| Circle leader inline RSVP | Circle leader needs to update guest RSVP without the guest's token. Options: (a) create a new endpoint `/api/rsvp/update` for authorised actors, or (b) reuse guests PUT with circle_id verification |

---

## 5. STANDING RULES

1. Recommend → confirm → build
2. File paths at top of every script, section sub-headers with `// ═══ SECTION N — Description ═══`
3. PowerShell (semicolons not `&&`)
4. No `src/` prefix — all `@/` imports
5. Never chain `.catch()` on Supabase
6. Python write for multi-edit files (no heredoc)
7. Update COMPONENT_MAP after session
8. AI attribution + date + task in file headers
9. One pass per file — no revisits
10. Include mkdir CLI commands for new directories

---

## 6. GIT COMMIT HISTORY THIS SESSION

```
v2.2.0 - feat: Access Code module restructure
v2.3.0 - feat: SectionManager component
v2.3.1 - fix: GuestManagementSection eventDate prop
v2.4.0 - feat: Phase 4 — hardened generate route, GuestCodeList rebuild
v2.4.1 - fix: generate route guest query TS cast
v2.4.2 - fix: generate route double-cast via unknown
v2.5.0 - feat: Phase 5 — BulkGuestImport
v2.6.0 - feat: Phase 6 — AccessCardPrint (5 themes, print CSS)
v2.7.0 - feat: Phase 7 — AccessMetricsDashboard + UsherSessionManager
v2.8.0 - feat: Guest Coordination System API layer + RSVP page
```

Current version: **v2.8.0**

---

## 7. COMPONENT_MAP ADDITIONS NEEDED

All Access Code module entries were documented inline during the build but should be consolidated into COMPONENT_MAP.md. The Guest Coordination System entries (API routes + RSVP page) also need documenting.

---

## 8. ENVIRONMENT

- Next.js 16.2.6, TypeScript, Tailwind CSS v4, Supabase, Resend, Stripe, Vercel Hobby
- Windows PowerShell
- Two Supabase projects: LC operational (Frankfurt) + RW-Ecosystem (Frankfurt)
- Repo: okajibulu/legacycapsule, deploying from main

---

*AI14 · Claude Opus 4.6 · 26 July 2026*
*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule v2.8.0*
