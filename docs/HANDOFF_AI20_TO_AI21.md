# HANDOFF_AI20_TO_AI21.md
# LegacyCapsule — AI20 → AI21 Handoff
# Compiled by: AI20 — Claude Opus 4.6 — 15 August 2026
# Platform: AI20v2.12.07

---

## CRITICAL READ ORDER FOR AI21

1. `START_HERE.md`
2. `PROJECT_RULES.md`
3. `CURRENT_STATE_v10.md` ← this session's state (replaces v9)
4. `HANDOFF_AI20_TO_AI21.md` ← this document
5. `COMPONENT_MAP_AI20_ADDENDUM.md` ← new components built this session
6. `LC_EMOTIONAL_COMMUNICATION_STANDARD.md`

Do NOT read the following unless debugging legacy behaviour:
- HANDOFF_AI16_TO_AI20.md (superseded)
- HANDOFF_AI19_TO_AI20.md (superseded)
- CURRENT_STATE_v9.md (superseded by v10)

---

## MULTI-AI DEPLOYMENT NOTE

AI21 may be deployed alongside other AI instances working on different aspects
simultaneously. Before touching any file:

1. Read the file in full from disk — never work from memory
2. Check git log for recent changes: `git log --oneline -20`
3. If a file was modified by another AI instance since your context was built, re-read it
4. Make surgical find/replace edits — never full rewrites unless explicitly requested
5. All edits to the same file must happen in one pass

The most likely collision points between parallel AI instances:
- `components/TributeWallClient.tsx` (wall experience + ?restore handler)
- `app/manage/[slug]/page.tsx` (TierUpgradePanel wiring)
- `lib/payments/featureUnlocker.ts` (if any payment keys are added)

---

## WHAT AI20 COMPLETED

### Commercial Model (Sprints 1–3)
- Full freemium model defined and locked (see CURRENT_STATE_v10.md)
- Sprint 1 migration run: 6 new tables, 9 new capsule columns, 18 new lc_pricing rows
- Sprint 2: featureUnlocker updated with all commercial keys, lifecycle events
- Sprint 3: Wall experience — wall-hit modal, queued submissions, TierUpgradePanel component

### Paystack Integration
- PaystackAdapter.ts — full implementation
- Paystack webhook handler — HMAC-SHA512 verification
- Bundle route — Paystack/Stripe routing by zone
- Test payment confirmed end-to-end ✅
- PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY added to Vercel ✅

### ServicesTab
- Full redesign: floating checkout bar, inline prices, no side column
- Preset buttons with toggle-deselect
- LimitsBar component
- Page header with plain English

### Booking Page
- Event type: visual card grid (was dropdown)
- Preset buttons
- Gift delivery date picker
- Free strip copy corrected

### Manage Dashboard
- FreeTierBar: "Expand Capsule" removed, plain English, amber colour
- Order history: new API route, filters abandoned pending payments

### Help Page
- Global nav removed via layout override

---

## WHAT AI21 MUST DO FIRST

### TASK 1 — ?restore= handler in TributeWallClient (🔴 HIGH)

When a contributor hits the wall, their work is saved to `queued_submissions`
with a `session_token`. The return URL is:
```
/for/[slug]?restore=[session_token]
```

When the contributor returns via this URL, `TributeWallClient` must:
1. Read `searchParams.get('restore')` on mount
2. If present, fetch `GET /api/capsule/restore-submission?token=[token]`
3. Pre-fill the form: name, email, city, country, relationship, tribute_text
4. Show a warm notice: "Welcome back — your tribute is right here, exactly as you left it."
5. The contributor reviews, optionally edits, and submits normally

**New route needed:** `app/api/capsule/restore-submission/route.ts`
- GET with `?token=`
- Returns queued_submission row fields
- Marks status = 'notified' if not already

**Note:** `TributeWallClient.tsx` is 1647+ lines. Read it in full before editing.
The `useEffect` on mount is the right place for the restore check.
Add `const searchParams = useSearchParams()` if not already present.

---

### TASK 2 — Batch notify route (🔴 HIGH)

When an organiser upgrades their contribution tier, all contributors whose
submissions are queued in `queued_submissions` for that capsule must receive
an email inviting them back.

**New route needed:** `app/api/capsule/batch-notify/route.ts`
- POST with `{ capsule_id, capsule_slug }`
- Fetch all queued_submissions for capsule where status = 'queued' AND contributor_email IS NOT NULL
- Send each one a Resend email with their return URL
- Mark status = 'notified', set notified_at = now()
- Log wall_cleared lifecycle event

**Trigger:** Called by `featureUnlocker.ts` after a contribution tier upgrade.
Add call in featureUnlocker after contribution_tier_growing_350v through estate_v unlocks.

**Email copy (ECS standard):**
Subject: "[Honouree name]'s capsule is open again — your tribute is waiting"
Body: Warm, personal. Their name. The honouree's name. Direct return link.
"Your words are safe and waiting. Just tap below to pick up where you left off."

**Email mindfulness:** We are on Resend free plan (100/day). Batch sends must
check count before firing. Add a check: if queued count > 50, log warning and
batch in 2 waves with delay.

---

### TASK 3 — Wire TierUpgradePanel into manage dashboard (🔴 HIGH)

The `TierUpgradePanel` component was built (AI20v2.12.01) at:
`components/manage/TierUpgradePanel.tsx`

It needs to be imported and rendered in `app/manage/[slug]/page.tsx`.

Place it: in the Overview tab, above the main capsule stats section.
Only renders when wall_status is not 'open' (component handles this internally).

Import:
```typescript
import TierUpgradePanel from '@/components/manage/TierUpgradePanel'
```

Render (pass capsule.id, capsule.slug, capsule.honouree_name):
```tsx
<TierUpgradePanel
  capsuleId={capsule.id}
  capsuleSlug={capsule.slug}
  honoureeName={capsule.honouree_name}
/>
```

Read `app/manage/[slug]/page.tsx` in full before editing — it is 2,283+ lines.

---

### TASK 4 — UX Audit Session (🔴 FOUNDER MANDATE)

A dedicated session must be run to audit the entire app for friction points
and add contextual guidance throughout. See PROJECT_RULES.md UX principle.

**Scope:**
- Every page/tab needs a clear header explaining what it is and what to do
- Every form field needs a contextual hint
- Every action needs a plain-English confirmation
- Every locked feature needs an explanation of what it does before asking for payment
- Help page copy needs updating (3mo/6mo → 90 days, 2 phases → 1 phase)
- Error messages must be plain English, never technical

This is a full session — do not attempt to combine with other build tasks.

---

## STANDING RULES REMINDER

These caused bugs this session — pay attention:

1. **Never chain .catch() on Supabase query builders** — always try/catch
2. **payments table has NO expires_at column** — caused orders route 500
3. **lifecycle_state = 'active' ≠ paid** — caused limits API wrong tier detection
4. **FREE_TRIBUTE_LIMIT was hardcoded as 50** — must be 30 to match spec
5. **PAYSTACK_SECRET_KEY must be in Vercel env vars** — not just .env.local
6. **guest_management and attire are coming_soon** — never add to SUGGESTED_BY_EVENT
7. **Preset features are defined in bundle/route.ts** — one place only
8. **ServicesTab has no side price column** — floating bar only. Don't re-add columns.

---

## ENV VARS — CURRENT STATE IN VERCEL

| Variable | Status |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | ✅ Set |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ Set |
| SUPABASE_SERVICE_ROLE_KEY | ✅ Set (was missing — caused /api/capsule/limits 404) |
| PAYSTACK_SECRET_KEY | ✅ Set (added this session) |
| PAYSTACK_PUBLIC_KEY | ✅ Set (added this session) |
| PAYSTACK_WEBHOOK_SECRET | ⏳ Blank — add when going live |
| STRIPE_SECRET_KEY | ❌ Not set — international payments return 503 gracefully |
| RESEND_API_KEY | ✅ Set |

---

## DATABASE — WHAT EXISTS NOW

Run this to verify Sprint 1 tables are present:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'contribution_tier_config', 'access_code_block_config',
  'queued_submissions', 'capsule_lifecycle_events',
  'dormant_reactivation_requests', 'lc_showcase_archive',
  'free_tier_limits'
)
ORDER BY table_name;
```

Expected: 7 rows. If fewer, Sprint 1 migration needs to be re-run.

---

## PRICING — LIVE IN lc_pricing TABLE

All 18 pricing keys are live with is_published = true (except guest_management = false).
Prices are set. Do not change prices in code — only via LCAdmin Pricing Configuration.

---

## GIT COMMIT FORMAT

```
git add .
git commit -m "AI21v2.12.XX - brief description of change"
git push origin main
```

Version must increment from AI20v2.12.07.
Next version: AI21v2.12.08 or start a new minor: AI21v2.13.00 for a significant new feature.

---

*Handoff compiled by AI20 — Claude Opus 4.6 — 15 August 2026*
*AI20 session: ACTIVE (on standby for tweaks)*
*Next AI: AI21*
