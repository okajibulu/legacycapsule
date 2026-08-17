// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/revoke/route.ts
// PURPOSE:   Deactivates a capsule_accounts record.
//            Sets is_active = false. Account record preserved for audit trail.
//            Cookie sessions for this account will fail on next portal load
//            (session hash lookup returns no active account).
//            Logs to capsule_activity_log.
// ARCHITECTURE: CA-SPEC-001 — Step 5.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
//
// POST body: { account_id, actor_name?, actor_email? }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAction, ACTION_KEYS }    from '@/lib/activity/logAction'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { account_id, actor_name, actor_email } = await req.json()

    if (!account_id) {
      return NextResponse.json({ error: 'account_id is required.' }, { status: 400 })
    }

    // ── Fetch account ─────────────────────────────────────────────────────
    const { data: account } = await db
      .from('capsule_accounts')
      .select('id, capsule_id, account_type, name, email, is_active')
      .eq('id', account_id)
      .maybeSingle()

    if (!account) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
    }

    if (!account.is_active) {
      return NextResponse.json({ error: 'This account is already inactive.' }, { status: 409 })
    }

    // ── Deactivate ────────────────────────────────────────────────────────
    const { error: updateError } = await db
      .from('capsule_accounts')
      .update({ is_active: false })
      .eq('id', account_id)

    if (updateError) {
      console.error('[team/revoke] Update error:', updateError)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    // ── Log action ─────────────────────────────────────────────────────────
    const actionKeyMap: Record<string, string> = {
      family_rep_elder:       ACTION_KEYS.TEAM_ELDER_REVOKED,
      family_rep_full_access: ACTION_KEYS.TEAM_FULL_ACCESS_REVOKED,
      coadmin:                ACTION_KEYS.TEAM_COADMIN_REVOKED,
    }

    await logAction({
      capsule_id:   account.capsule_id,
      actor_type:   'organiser',
      actor_name:   actor_name  ?? 'Organiser',
      actor_email:  actor_email ?? '',
      action_key:   actionKeyMap[account.account_type] ?? 'team.revoked',
      action_label: `Ended access for ${account.name} (${account.account_type.replace(/_/g, ' ')})`,
      entity_type:  'capsule_account',
      entity_id:    account_id,
      payload:      { account_type: account.account_type, email: account.email },
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[team/revoke]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}