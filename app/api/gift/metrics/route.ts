// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/metrics/route.ts
// PURPOSE:    Gift Collection System — unified metrics endpoint
//             GET /api/gift/metrics?capsule_id=&scope=organiser|coordinator|frfa
//             Returns all data needed by the organiser console, FRFA console,
//             and coordinator dashboard in a single call.
//             Auto-refresh friendly — designed to be polled every 30 seconds.
// SPEC:       GCS-SPEC-001 Part Eight + AMD-002 Phase 6 Steps 22–24
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.23
// DATE:       19 August 2026
//
// SCOPES:
//   organiser — full metrics: summary, per-item, per-block, recent feed, alerts
//   frfa      — same as organiser (alias)
//   coordinator — block-scoped: own block only, own credentials, own stand activity
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
    .select('id, display_name, role, permissions')
    .eq('id', session.account_id)
    .maybeSingle()

  if (!account) throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: capsule } = await db
    .from('capsules').select('components').eq('id', capsuleId).maybeSingle()

  if (!capsule?.components?.includes('gift_collection')) {
    throw NextResponse.json({ error: 'Gift Collection is not active.' }, { status: 403 })
  }

  return { accountId: account.id, accountName: account.display_name, role: account.role }
}


// ═══ SECTION 3 — GET /api/gift/metrics ═════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const capsuleId        = searchParams.get('capsule_id')
    const scope            = searchParams.get('scope') ?? 'organiser'

    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    const { accountId, role } = await resolveSession(req, capsuleId)
    const db = getDb()

    const isCoordinator = !['organiser', 'frfa', 'family_rep_full'].includes(role)
    const blockFilter   = isCoordinator ? accountId : null  // coordinator scoped by coordinator_id

    // ── Parallel batch queries ────────────────────────────────────────────────
    const [
      credentialsResult,
      manifestResult,
      blocksResult,
      standSessionsResult,
      recentLedgerResult,
      alertsResult,
    ] = await Promise.all([

      // 1. Credential summary counts
      db.from('gift_credentials')
        .select('id, collection_status, coordinator_id, block_id, unable_to_collect, is_blocked')
        .eq('capsule_id', capsuleId)
        .is('deleted_at', null)
        .then(r => r),

      // 2. Manifest items with counters
      db.from('gift_manifest_items')
        .select('id, item_name, category, qty_in_stock, qty_allocated, qty_collected, qty_exceptions, is_active')
        .eq('capsule_id', capsuleId)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true }),

      // 3. Blocks with coordinator name
      db.from('gift_blocks')
        .select(`
          id, block_name, range_start, range_end, is_buffer, is_locked,
          coordinator_id,
          capsule_accounts!gift_blocks_coordinator_id_fkey (
            id, display_name
          )
        `)
        .eq('capsule_id', capsuleId)
        .order('range_start', { ascending: true }),

      // 4. Active stand sessions
      db.from('gift_stand_sessions')
        .select('id, stand_name, staff_name, status, dispatched_count, failed_count, session_start, session_end')
        .eq('capsule_id', capsuleId)
        .order('session_start', { ascending: false })
        .limit(20),

      // 5. Recent ledger events (collection feed)
      db.from('gift_fulfilment_ledger')
        .select('id, event_type, actor_name, credential_id, quantity, payload, created_at')
        .eq('capsule_id', capsuleId)
        .in('event_type', ['COLLECTION_COMPLETED', 'PARTIAL_COLLECTION', 'UNABLE_TO_COLLECT', 'ORGANISER_OVERRIDE'])
        .order('created_at', { ascending: false })
        .limit(30),

      // 6. Alert flags — unable + partial + blocked
      db.from('gift_credentials')
        .select('id, guest_name, guest_category, numeric_code, collection_status, unable_to_collect, unable_reason, is_blocked, block_reason, coordinator_id, block_id')
        .eq('capsule_id', capsuleId)
        .or('unable_to_collect.eq.true,collection_status.eq.partial,is_blocked.eq.true')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(50),
    ])

    const credentials  = credentialsResult.data  ?? []
    const manifest     = manifestResult.data      ?? []
    const blocks       = blocksResult.data        ?? []
    const standSessions = standSessionsResult.data ?? []
    const recentLedger = recentLedgerResult.data  ?? []
    const alertCreds   = alertsResult.data        ?? []

    // ── Summary bar ─────────────────────────────────────────────────────────
    const filteredCreds = isCoordinator
      ? credentials.filter(c => c.coordinator_id === accountId)
      : credentials

    const summary = {
      total_issued:       filteredCreds.length,
      total_collected:    filteredCreds.filter(c => c.collection_status === 'collected').length,
      total_partial:      filteredCreds.filter(c => c.collection_status === 'partial').length,
      total_outstanding:  filteredCreds.filter(c => c.collection_status === 'uncollected').length,
      total_unable:       filteredCreds.filter(c => c.unable_to_collect).length,
      total_blocked:      filteredCreds.filter(c => c.is_blocked).length,
      pct_complete:       filteredCreds.length > 0
        ? Math.round((filteredCreds.filter(c => c.collection_status === 'collected').length / filteredCreds.length) * 100)
        : 0,
    }

    // ── Per-item breakdown ───────────────────────────────────────────────────
    const itemBreakdown = manifest.map(item => ({
      id:              item.id,
      item_name:       item.item_name,
      category:        item.category,
      qty_in_stock:    item.qty_in_stock,
      qty_allocated:   item.qty_allocated,
      qty_collected:   item.qty_collected,
      qty_exceptions:  item.qty_exceptions,
      qty_unallocated: item.qty_in_stock - item.qty_allocated,
      qty_outstanding:  item.qty_allocated - item.qty_collected,
      is_active:       item.is_active,
    }))

    // ── Over-subscription alerts ─────────────────────────────────────────────
    const overSubscribed = manifest.filter(i => i.qty_allocated > i.qty_in_stock)

    // ── Per-block breakdown ──────────────────────────────────────────────────
    const blockBreakdown = blocks.map(block => {
      const blockCreds = credentials.filter(c => c.block_id === block.id)
      return {
        id:              block.id,
        block_name:      block.block_name,
        range_start:     block.range_start,
        range_end:       block.range_end,
        is_buffer:       block.is_buffer,
        is_locked:       block.is_locked,
        coordinator_id:  block.coordinator_id,
        coordinator_name: ((block.capsule_accounts as unknown) as { display_name: string } | null)?.display_name ?? null,
        codes_issued:    blockCreds.length,
        codes_collected: blockCreds.filter(c => c.collection_status === 'collected').length,
        codes_outstanding: blockCreds.filter(c => c.collection_status === 'uncollected').length,
        codes_unable:    blockCreds.filter(c => c.unable_to_collect).length,
      }
    })

    // ── Recent collections feed ──────────────────────────────────────────────
    const recentFeed = recentLedger.map(e => ({
      id:          e.id,
      event_type:  e.event_type,
      actor_name:  e.actor_name,
      guest_name:  (e.payload as { guest_name?: string })?.guest_name ?? null,
      stand_name:  (e.payload as { stand_name?: string })?.stand_name ?? null,
      quantity:    e.quantity,
      created_at:  e.created_at,
    }))

    // ── Alerts ───────────────────────────────────────────────────────────────
    const alerts = {
      unable:    alertCreds.filter(c => c.unable_to_collect),
      partial:   alertCreds.filter(c => c.collection_status === 'partial' && !c.unable_to_collect),
      blocked:   alertCreds.filter(c => c.is_blocked),
      over_subscribed: overSubscribed,
    }

    // ── Stand overview strip ─────────────────────────────────────────────────
    const standOverview = standSessions.map(s => ({
      id:               s.id,
      stand_name:       s.stand_name,
      staff_name:       s.staff_name,
      status:           s.status,
      dispatched_count: s.dispatched_count,
      failed_count:     s.failed_count,
      session_start:    s.session_start,
      session_end:      s.session_end,
    }))

    // ── Coordinator scope filter ──────────────────────────────────────────────
    // Coordinator only sees their own block
    const coordinatorBlock = isCoordinator
      ? blockBreakdown.find(b => b.coordinator_id === accountId) ?? null
      : null

    return NextResponse.json({
      summary,
      item_breakdown:   itemBreakdown,
      block_breakdown:  isCoordinator ? [coordinatorBlock].filter(Boolean) : blockBreakdown,
      recent_feed:      recentFeed,
      alerts:           isCoordinator ? null : alerts,
      stand_overview:   isCoordinator ? [] : standOverview,
      coordinator_block: coordinatorBlock,
      scope,
      generated_at:     new Date().toISOString(),
    })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Metrics GET] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}