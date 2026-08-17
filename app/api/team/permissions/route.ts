// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/permissions/route.ts
// PURPOSE:   GET and PATCH co-admin permission grants.
//            GET: returns current permissions for an account.
//            PATCH: replaces all permissions for an account (full replace,
//            not incremental — simplest and safest pattern).
//            Deletes existing rows then inserts new set atomically.
//            Logs to capsule_activity_log.
// ARCHITECTURE: CA-SPEC-001 — Step 11.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.13
// DATE:      16 August 2026
//
// GET  ?account_id=[id]
// PATCH body: { account_id, permissions: string[], actor_name?, actor_email? }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAction, ACTION_KEYS }    from '@/lib/activity/logAction'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — GET handler ═══

export async function GET(req: NextRequest) {
  try {
    const account_id = req.nextUrl.searchParams.get('account_id')

    if (!account_id) {
      return NextResponse.json({ error: 'account_id is required.' }, { status: 400 })
    }

    const { data, error } = await db
      .from('capsule_account_permissions')
      .select('permission_key, granted_at')
      .eq('account_id', account_id)
      .order('granted_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    return NextResponse.json({
      permissions: (data ?? []).map(r => r.permission_key),
    })

  } catch (err) {
    console.error('[team/permissions GET]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

// ═══ SECTION 3 — PATCH handler ═══

export async function PATCH(req: NextRequest) {
  try {
    const { account_id, permissions, actor_name, actor_email } = await req.json()

    if (!account_id || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'account_id and permissions array are required.' },
        { status: 400 }
      )
    }

    if (permissions.length === 0) {
      return NextResponse.json(
        { error: 'At least one permission must be granted.' },
        { status: 400 }
      )
    }

    // ── Fetch account for capsule_id and validation ───────────────────────
    const { data: account } = await db
      .from('capsule_accounts')
      .select('id, capsule_id, account_type, name, is_active')
      .eq('id', account_id)
      .maybeSingle()

    if (!account || !account.is_active) {
      return NextResponse.json({ error: 'Account not found or inactive.' }, { status: 404 })
    }

    if (account.account_type !== 'coadmin') {
      return NextResponse.json(
        { error: 'Permissions can only be set for co-admin accounts.' },
        { status: 400 }
      )
    }

    // ── Delete existing permissions ───────────────────────────────────────
    const { error: deleteError } = await db
      .from('capsule_account_permissions')
      .delete()
      .eq('account_id', account_id)

    if (deleteError) {
      console.error('[team/permissions PATCH] Delete error:', deleteError)
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    // ── Insert new permissions ────────────────────────────────────────────
    const rows = permissions.map((key: string) => ({
      account_id,
      capsule_id:     account.capsule_id,
      permission_key: key,
      granted_by:     'organiser',
    }))

    const { error: insertError } = await db
      .from('capsule_account_permissions')
      .insert(rows)

    if (insertError) {
      console.error('[team/permissions PATCH] Insert error:', insertError)
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    // ── Log action ─────────────────────────────────────────────────────────
    await logAction({
      capsule_id:   account.capsule_id,
      actor_type:   'organiser',
      actor_name:   actor_name  ?? 'Organiser',
      actor_email:  actor_email ?? '',
      action_key:   ACTION_KEYS.TEAM_COADMIN_PERMISSIONS,
      action_label: `Updated access for ${account.name} — ${permissions.length} ${permissions.length === 1 ? 'area' : 'areas'} granted`,
      entity_type:  'capsule_account',
      entity_id:    account_id,
      payload:      { permissions },
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[team/permissions PATCH]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}