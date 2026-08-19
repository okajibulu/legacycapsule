// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/blocks/route.ts
// PURPOSE:    Gift Collection System — block list and creation
//             GET  /api/gift/blocks?capsule_id=   — list all blocks
//             POST /api/gift/blocks               — create new block
// SPEC:       GCS-SPEC-001-AMD-001 v1.3 Part One + AMD-002 Phase 2 Step 5
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.18
// DATE:       19 August 2026
//
// RULES:
//   • Only FRFA or Organiser account role may create/edit blocks.
//   • API-level overlap check before every INSERT (no range_end uniqueness in DB).
//   • Overlap check query: range_start <= $new_range_end AND range_end >= $new_range_start.
//   • is_locked blocks cannot be renamed or range-edited (only coordinator reassignment).
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


// ═══ SECTION 2 — Auth helper (FRFA/Organiser only) ════════════════════════════

async function resolveOrgSession(
  req:       NextRequest,
  capsuleId: string
): Promise<{ accountId: string; accountName: string; role: string }> {
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

  // Only organiser / frfa roles may manage blocks
  if (!['organiser', 'frfa', 'family_rep_full'].includes(account.role)) {
    throw NextResponse.json(
      { error: 'Only the event organiser may manage gift collection blocks.' },
      { status: 403 }
    )
  }

  const { data: capsule } = await db
    .from('capsules').select('components').eq('id', capsuleId).maybeSingle()

  if (!capsule?.components?.includes('gift_collection')) {
    throw NextResponse.json({ error: 'Gift Collection is not active.' }, { status: 403 })
  }

  return { accountId: account.id, accountName: account.display_name, role: account.role }
}


// ═══ SECTION 3 — Overlap check helper ══════════════════════════════════════════
//
// Returns true if any existing block (excluding excludeId) overlaps the given range.
// Called before INSERT and UPDATE.

async function rangeOverlaps(
  db:          ReturnType<typeof getDb>,
  capsuleId:   string,
  rangeStart:  number,
  rangeEnd:    number,
  excludeId?:  string
): Promise<boolean> {
  let query = db
    .from('gift_blocks')
    .select('id')
    .eq('capsule_id', capsuleId)
    .lte('range_start', rangeEnd)
    .gte('range_end',   rangeStart)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query
  return (data?.length ?? 0) > 0
}


// ═══ SECTION 4 — GET /api/gift/blocks ══════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const capsuleId        = searchParams.get('capsule_id')
    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    await resolveOrgSession(req, capsuleId)
    const db = getDb()

    const { data: blocks, error } = await db
      .from('gift_blocks')
      .select(`
        id,
        block_name,
        range_start,
        range_end,
        coordinator_id,
        is_locked,
        is_buffer,
        created_by,
        created_at,
        updated_at,
        capsule_accounts!gift_blocks_coordinator_id_fkey (
          id,
          display_name,
          role
        )
      `)
      .eq('capsule_id', capsuleId)
      .order('range_start', { ascending: true })

    if (error) {
      console.error('[GCS Blocks GET] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to load blocks' }, { status: 500 })
    }

    return NextResponse.json({ blocks: blocks ?? [] })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Blocks GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// ═══ SECTION 5 — POST /api/gift/blocks ═════════════════════════════════════════
//
// Creates a new block.
// Validates: block_name required, range_start <= range_end, no overlap.

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json()
    const capsuleId = body.capsule_id as string | undefined
    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    const { accountId, accountName } = await resolveOrgSession(req, capsuleId)
    const db                         = getDb()

    const blockName     = (body.block_name ?? '').trim()
    const rangeStart    = parseInt(body.range_start, 10)
    const rangeEnd      = parseInt(body.range_end,   10)
    const coordinatorId = body.coordinator_id ?? null
    const isBuffer      = Boolean(body.is_buffer)

    if (!blockName) {
      return NextResponse.json({ error: 'Block name is required' }, { status: 400 })
    }
    if (isNaN(rangeStart) || isNaN(rangeEnd)) {
      return NextResponse.json({ error: 'Range start and end are required' }, { status: 400 })
    }
    if (rangeEnd < rangeStart) {
      return NextResponse.json(
        { error: 'Range end must be greater than or equal to range start' },
        { status: 400 }
      )
    }

    // Overlap check
    const overlaps = await rangeOverlaps(db, capsuleId, rangeStart, rangeEnd)
    if (overlaps) {
      return NextResponse.json(
        {
          error:
            `Range ${rangeStart}–${rangeEnd} overlaps with an existing block. ` +
            'Adjust the range so there is no overlap with other blocks.',
        },
        { status: 422 }
      )
    }

    const { data: newBlock, error: insertErr } = await db
      .from('gift_blocks')
      .insert({
        capsule_id:     capsuleId,
        block_name:     blockName,
        range_start:    rangeStart,
        range_end:      rangeEnd,
        coordinator_id: coordinatorId,
        is_locked:      false,
        is_buffer:      isBuffer,
        created_by:     accountId,
      })
      .select()
      .single()

    if (insertErr || !newBlock) {
      console.error('[GCS Blocks POST] Insert error:', insertErr?.message)
      return NextResponse.json({ error: 'Failed to create block' }, { status: 500 })
    }

    return NextResponse.json({ block: newBlock }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Blocks POST] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}