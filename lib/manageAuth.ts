// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/manageAuth.ts
// PURPOSE:   Server-side authentication for the manage dashboard.
//            Validates the lc_mgr_[slug] cookie set by /api/team/verify
//            for FR Full Access and Co-admin accounts.
//            If no mgr cookie found: returns accountType 'organiser' —
//            the existing client-side localStorage flow handles organiser
//            identity unchanged.
//            SERVER-SIDE ONLY. Never import in client components.
// ARCHITECTURE: CA-SPEC-001 — Step 15b.
//               Parallel to lib/portalAuth.ts (honouree portal) and
//               lib/familyRepAuth.ts (FR Elder portal).
//               Session stored as 'session:[sha256hash]' in
//               capsule_accounts.invite_token — same pattern as familyRepAuth.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.15
// DATE:      16 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { createHash }   from 'crypto'
import { cookies }      from 'next/headers'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Constants ═══

const cookieName = (slug: string) => `lc_mgr_${slug}`

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

// ═══ SECTION 3 — Auth result type ═══

export type ManageAccountType =
  | 'organiser'
  | 'family_rep_full_access'
  | 'coadmin'

export interface ManageAuthResult {
  accountType:  ManageAccountType
  accountId:    string | null       // null for organiser (uses email identity)
  accountName:  string | null
  accountEmail: string | null
  permissions:  string[]            // populated for coadmin only
  capsuleId:    string | null
}

// ═══ SECTION 4 — Validate mgr session cookie ═══
// Returns null if no valid cookie found — caller falls back to organiser flow.

export async function validateManageSession(
  slug: string
): Promise<ManageAuthResult | null> {
  try {
    const cookieStore   = await cookies()
    const sessionCookie = cookieStore.get(cookieName(slug))

    if (!sessionCookie?.value) return null

    const sessionHash = sha256(sessionCookie.value)

    // ── Fetch capsule ──────────────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!capsule) return null

    // ── Find account by session hash ───────────────────────────────────────
    const { data: account } = await db
      .from('capsule_accounts')
      .select('id, name, email, account_type, is_active')
      .eq('capsule_id', capsule.id)
      .eq('invite_token', `session:${sessionHash}`)
      .eq('is_active', true)
      .in('account_type', ['family_rep_full_access', 'coadmin'])
      .maybeSingle()

    if (!account) return null

    // ── Fetch permissions for coadmin ──────────────────────────────────────
    let permissions: string[] = []
    if (account.account_type === 'coadmin') {
      const { data: permRows } = await db
        .from('capsule_account_permissions')
        .select('permission_key')
        .eq('account_id', account.id)
      permissions = (permRows ?? []).map(r => r.permission_key)
    }

    // ── Update last active (non-blocking) ─────────────────────────────────
    db.from('capsule_accounts')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', account.id)
      .then(() => {})

    return {
      accountType:  account.account_type as ManageAccountType,
      accountId:    account.id,
      accountName:  account.name,
      accountEmail: account.email,
      permissions,
      capsuleId:    capsule.id,
    }

  } catch (err) {
    console.error('[manageAuth] validateManageSession error:', err)
    return null
  }
}

// ═══ SECTION 5 — Main auth check ═══
// Called at the top of app/manage/[slug]/page.tsx (server component).
// Returns organiser result if no mgr cookie — organiser flow unchanged.

export async function checkManageAuth(slug: string): Promise<ManageAuthResult> {
  // Try mgr session cookie first — FRFA or Co-admin
  const mgrSession = await validateManageSession(slug)
  if (mgrSession) return mgrSession

  // No mgr cookie — return organiser default.
  // Organiser identity is handled client-side via localStorage (unchanged).
  return {
    accountType:  'organiser',
    accountId:    null,
    accountName:  null,
    accountEmail: null,
    permissions:  [],
    capsuleId:    null,
  }
}
