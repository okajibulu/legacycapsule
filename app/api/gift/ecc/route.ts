// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/ecc/route.ts
// PURPOSE:    Gift Collection System — ECC integration contract routes
//             POST /api/gift/ecc?action=lockdown      — end-of-event lockdown
//             POST /api/gift/ecc?action=reconcile     — generate reconciliation report
//             GET  /api/gift/ecc?action=reconcile&capsule_id= — fetch last report
// SPEC:       GCS-SPEC-001-AMD-002 Phase 6 Step 25–26 + Rule 45
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.23
// DATE:       19 August 2026
//
// AMD-002 Rule 45: These routes must exist even if ECC itself is not yet live.
// They define the integration contract between GCS and the Event Command Centre.
//
// LOCKDOWN:
//   — Locks all non-locked gift_blocks (is_locked = true)
//   — Closes all active stand sessions (status = 'closed')
//   — Writes LOCKDOWN ledger event
//   — Organiser/FRFA only
//
// RECONCILIATION REPORT:
//   — Compiles full collection summary into payload
//   — Writes RECONCILIATION_GENERATED ledger event with full payload
//   — Returns structured report — organiser downloads / views in console
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse }          from 'next/server'
import { createClient }                        from '@supabase/supabase-js'
import { writeLedgerEvent, writeLedgerEvents } from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Auth helper (organiser only) ══════════════════════════════════

async function resolveOrgSession(req: NextRequest, capsuleId: string) {
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

  if (!account || !['organiser', 'frfa', 'family_rep_full'].includes(account.role)) {
    throw NextResponse.json({ error: 'Only the event organiser may perform this action.' }, { status: 403 })
  }

  const { data: capsule } = await db
    .from('capsules').select('components, event_name').eq('id', capsuleId).maybeSingle()

  if (!capsule?.components?.includes('gift_collection')) {
    throw NextResponse.json({ error: 'Gift Collection is not active.' }, { status: 403 })
  }

  return { accountId: account.id, accountName: account.display_name, eventName: capsule.event_name as string }
}


// ═══ SECTION 3 — Lockdown handler ══════════════════════════════════════════════

async function handleLockdown(req: NextRequest, capsuleId: string) {
  const { accountId, accountName, eventName } = await resolveOrgSession(req, capsuleId)
  const db = getDb()

  // Lock all unlocked blocks
  const { data: unlockedBlocks } = await db
    .from('gift_blocks')
    .select('id')
    .eq('capsule_id', capsuleId)
    .eq('is_locked', false)

  if (unlockedBlocks?.length) {
    await db.from('gift_blocks')
      .update({ is_locked: true, updated_at: new Date().toISOString() })
      .eq('capsule_id', capsuleId)
      .eq('is_locked', false)
  }

  // Close all active stand sessions
  const { data: activeSessions } = await db
    .from('gift_stand_sessions')
    .select('id')
    .eq('capsule_id', capsuleId)
    .eq('status', 'active')

  if (activeSessions?.length) {
    await db.from('gift_stand_sessions')
      .update({ status: 'closed', session_end: new Date().toISOString() })
      .eq('capsule_id', capsuleId)
      .eq('status', 'active')
  }

  // Ledger
  writeLedgerEvent({
    capsule_id: capsuleId,
    event_type: 'LOCKDOWN',
    actor_type: 'organiser',
    actor_id:   accountId,
    actor_name: accountName,
    payload: {
      event_name:            eventName,
      blocks_locked:         unlockedBlocks?.length ?? 0,
      sessions_closed:       activeSessions?.length ?? 0,
      locked_at:             new Date().toISOString(),
    },
  })

  return NextResponse.json({
    success:         true,
    blocks_locked:   unlockedBlocks?.length ?? 0,
    sessions_closed: activeSessions?.length ?? 0,
    locked_at:       new Date().toISOString(),
  })
}


// ═══ SECTION 4 — Reconciliation report builder ═════════════════════════════════

async function handleReconcile(req: NextRequest, capsuleId: string) {
  const { accountId, accountName, eventName } = await resolveOrgSession(req, capsuleId)
  const db = getDb()

  // Fetch all data in parallel
  const [credResult, manifestResult, blockResult, standResult] = await Promise.all([
    db.from('gift_credentials')
      .select('id, guest_name, guest_category, numeric_code, collection_status, unable_to_collect, unable_reason, collected_at, coordinator_id, block_id')
      .eq('capsule_id', capsuleId)
      .is('deleted_at', null),

    db.from('gift_manifest_items')
      .select('id, item_name, qty_in_stock, qty_allocated, qty_collected, qty_exceptions')
      .eq('capsule_id', capsuleId)
      .is('deleted_at', null),

    db.from('gift_blocks')
      .select('id, block_name, range_start, range_end, coordinator_id, capsule_accounts!gift_blocks_coordinator_id_fkey(display_name)')
      .eq('capsule_id', capsuleId),

    db.from('gift_stand_sessions')
      .select('id, stand_name, staff_name, status, dispatched_count, failed_count, session_start, session_end')
      .eq('capsule_id', capsuleId),
  ])

  const credentials = credResult.data   ?? []
  const manifest    = manifestResult.data ?? []
  const blocks      = blockResult.data   ?? []
  const stands      = standResult.data   ?? []

  // Build report
  const report = {
    event_name:    eventName,
    capsule_id:    capsuleId,
    generated_at:  new Date().toISOString(),
    generated_by:  accountName,

    summary: {
      total_credentials:  credentials.length,
      total_collected:    credentials.filter(c => c.collection_status === 'collected').length,
      total_partial:      credentials.filter(c => c.collection_status === 'partial').length,
      total_uncollected:  credentials.filter(c => c.collection_status === 'uncollected').length,
      total_unable:       credentials.filter(c => c.unable_to_collect).length,
      pct_complete:       credentials.length > 0
        ? Math.round((credentials.filter(c => c.collection_status === 'collected').length / credentials.length) * 100)
        : 0,
    },

    inventory: manifest.map(i => ({
      item_name:      i.item_name,
      qty_in_stock:   i.qty_in_stock,
      qty_allocated:  i.qty_allocated,
      qty_collected:  i.qty_collected,
      qty_exceptions: i.qty_exceptions,
      qty_returned:   i.qty_in_stock - i.qty_allocated,  // never allocated
    })),

    blocks: blocks.map(b => {
      const blockCreds = credentials.filter(c => c.block_id === b.id)
      return {
        block_name:       b.block_name,
        range:            `${b.range_start}–${b.range_end}`,
        coordinator_name: (b.capsule_accounts as { display_name: string } | null)?.display_name ?? 'Unassigned',
        codes_total:      blockCreds.length,
        codes_collected:  blockCreds.filter(c => c.collection_status === 'collected').length,
        codes_unable:     blockCreds.filter(c => c.unable_to_collect).length,
        codes_uncollected: blockCreds.filter(c => c.collection_status === 'uncollected').length,
      }
    }),

    stands: stands.map(s => ({
      stand_name:       s.stand_name,
      staff_name:       s.staff_name,
      status:           s.status,
      dispatched_count: s.dispatched_count,
      failed_count:     s.failed_count,
      session_start:    s.session_start,
      session_end:      s.session_end,
    })),

    exceptions: {
      unable_to_collect: credentials
        .filter(c => c.unable_to_collect)
        .map(c => ({
          guest_name:   c.guest_name,
          numeric_code: c.numeric_code,
          unable_reason: c.unable_reason,
        })),
      uncollected: credentials
        .filter(c => c.collection_status === 'uncollected' && !c.unable_to_collect)
        .map(c => ({
          guest_name:   c.guest_name,
          numeric_code: c.numeric_code,
          block_id:     c.block_id,
        })),
    },
  }

  // Write ledger event with full report payload
  writeLedgerEvent({
    capsule_id: capsuleId,
    event_type: 'RECONCILIATION_GENERATED',
    actor_type: 'organiser',
    actor_id:   accountId,
    actor_name: accountName,
    payload:    report as unknown as Record<string, unknown>,
  })

  return NextResponse.json({ report })
}


// ═══ SECTION 5 — Route dispatcher ══════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action           = searchParams.get('action')
    const body             = await req.json()
    const capsuleId        = body.capsule_id as string | undefined

    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    if (action === 'lockdown')   return await handleLockdown(req, capsuleId)
    if (action === 'reconcile')  return await handleReconcile(req, capsuleId)

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS ECC] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // GET reconcile — fetch last reconciliation report from ledger
  try {
    const { searchParams } = new URL(req.url)
    const capsuleId        = searchParams.get('capsule_id')
    const action           = searchParams.get('action')

    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
    if (action !== 'reconcile') return NextResponse.json({ error: 'action=reconcile required' }, { status: 400 })

    const db = getDb()

    const { data: entry } = await db
      .from('gift_fulfilment_ledger')
      .select('payload, created_at, actor_name')
      .eq('capsule_id', capsuleId)
      .eq('event_type', 'RECONCILIATION_GENERATED')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!entry) {
      return NextResponse.json({ report: null, message: 'No reconciliation report has been generated yet.' })
    }

    return NextResponse.json({ report: entry.payload, generated_at: entry.created_at, generated_by: entry.actor_name })
  } catch (err) {
    console.error('[GCS ECC GET] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}