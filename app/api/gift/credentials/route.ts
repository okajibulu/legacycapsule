// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/credentials/route.ts
// PURPOSE:    Gift Collection System — credential list for coordinator dashboard
//             GET /api/gift/credentials?capsule_id=&coordinator_id=
//             Returns credentials with entitlements for the coordinator dashboard.
//             Coordinator scoped: coordinator_id filter enforced server-side.
// SPEC:       GCS-SPEC-001-AMD-001 Section 1.6 + AMD-002 Phase 6 Step 22
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.23
// DATE:       19 August 2026
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Auth helper ════════════════════════════════════════════════════

async function resolveSession(req: NextRequest, capsuleId: string) {
  const db        = getDb()
  const sessionId = req.cookies.get('manage_session')?.value
  if (!sessionId) throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: session } = await db
    .from('manage_sessions')
    .select('account_id, capsule_id, expires_at')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session || new Date(session.expires_at) < new Date() || session.capsule_id !== capsuleId) {
    throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { data: account } = await db
    .from('capsule_accounts')
    .select('id, display_name, role')
    .eq('id', session.account_id)
    .maybeSingle()

  if (!account) throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: capsule } = await db
    .from('capsules').select('components').eq('id', capsuleId).maybeSingle()

  if (!capsule?.components?.includes('gift_collection')) {
    throw NextResponse.json({ error: 'Gift Collection is not active.' }, { status: 403 })
  }

  return { accountId: account.id, role: account.role }
}


// ═══ SECTION 3 — GET /api/gift/credentials ═════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const capsuleId        = searchParams.get('capsule_id')
    const coordinatorId    = searchParams.get('coordinator_id')

    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    const { accountId, role } = await resolveSession(req, capsuleId)
    const db = getDb()

    const isCoordinator = !['organiser', 'frfa', 'family_rep_full'].includes(role)

    // Coordinator can ONLY see their own credentials — enforce server-side
    const effectiveCoordinatorId = isCoordinator ? accountId : (coordinatorId ?? undefined)

    let query = db
      .from('gift_credentials')
      .select(`
        id,
        guest_name,
        guest_category,
        guest_email,
        numeric_code,
        code_type,
        collection_status,
        delivery_sent_at,
        unable_to_collect,
        unable_reason,
        is_blocked,
        is_active,
        block_id,
        coordinator_id,
        created_at,
        gift_entitlements (
          id,
          quantity_entitled,
          quantity_collected,
          gift_manifest_items (
            id,
            item_name
          )
        )
      `)
      .eq('capsule_id', capsuleId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (effectiveCoordinatorId) {
      query = query.eq('coordinator_id', effectiveCoordinatorId)
    }

    const { data: credentials, error } = await query

    if (error) {
      console.error('[GCS Credentials GET] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to load credentials' }, { status: 500 })
    }

    // Flatten entitlements for easier client consumption
    const enriched = (credentials ?? []).map(c => ({
      id:               c.id,
      guest_name:       c.guest_name,
      guest_category:   c.guest_category,
      guest_email:      c.guest_email,
      numeric_code:     c.numeric_code,
      code_type:        c.code_type,
      collection_status: c.collection_status,
      delivery_sent_at: c.delivery_sent_at,
      unable_to_collect: c.unable_to_collect,
      unable_reason:    c.unable_reason,
      is_blocked:       c.is_blocked,
      is_active:        c.is_active,
      block_id:         c.block_id,
      coordinator_id:   c.coordinator_id,
      entitlements: (c.gift_entitlements ?? []).map((e: Record<string, unknown>) => ({
        id:                 e.id,
        quantity_entitled:  e.quantity_entitled,
        quantity_collected: e.quantity_collected,
        item_name:          (e.gift_manifest_items as { item_name: string } | null)?.item_name ?? '—',
      })),
    }))

    return NextResponse.json({ credentials: enriched })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Credentials GET] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}