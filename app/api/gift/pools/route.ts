// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/pools/route.ts
// PURPOSE:    Gift Collection System — pool list and creation
//             GET  /api/gift/pools?capsule_id=
//             POST /api/gift/pools — calls gcs_create_pool() RPC (atomic)
// SPEC:       GCS-SPEC-001-AMD-002 + Founder Amendment 19 August 2026
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.24
// DATE:       19 August 2026
//
// TRANSACTION MODEL:
//   POST delegates to gcs_create_pool() PostgreSQL function.
//   Lock all items → create pool → create pool_items → reserve inventory ×
//   max_collections → critical ledger events — all atomic.
//   Pool-code uniqueness enforced by trigger (cross-table: pools ↔ credentials).
//
// ACTOR TYPE: Organiser only. Derived from session.
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


// ═══ SECTION 2 — Auth helper (organiser only — pools are FRFA-level) ═══════════

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

  if (!account) throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!['organiser', 'frfa', 'family_rep_full'].includes(account.role)) {
    throw NextResponse.json({ error: 'Only the event organiser may manage gift pools.' }, { status: 403 })
  }

  const { data: capsule } = await db
    .from('capsules').select('components').eq('id', capsuleId).maybeSingle()

  if (!capsule?.components?.includes('gift_collection')) {
    throw NextResponse.json({ error: 'Gift Collection is not active.' }, { status: 403 })
  }

  return { accountId: account.id, accountName: account.display_name }
}


// ═══ SECTION 3 — RPC error parser ══════════════════════════════════════════════

function parseRpcError(message: string): { userMessage: string; status: number } {
  if (message.includes('INSUFFICIENT_STOCK')) {
    const parts = message.split(':')
    const item  = parts[1]?.trim()
    const needed = parts[2]?.trim()
    const avail  = parts[3]?.trim()
    return {
      userMessage: item
        ? `"${item}": need ${needed} units for this pool but only ${avail} are unallocated. Reduce max collections or add more stock.`
        : 'Insufficient stock available for this pool configuration.',
      status: 422,
    }
  }
  if (message.includes('POOL_CODE_COLLISION')) {
    return { userMessage: 'This pool code is already in use by a guest credential in this capsule. Choose a different code.', status: 409 }
  }
  if (message.includes('ITEM_NOT_FOUND')) {
    return { userMessage: 'One or more gift items not found or inactive.', status: 404 }
  }
  if (message.includes('INVALID_MAX_COLLECTIONS')) {
    return { userMessage: 'Maximum collections must be 1 or more.', status: 400 }
  }
  if (message.includes('NO_ITEMS')) {
    return { userMessage: 'At least one item must be added to the pool.', status: 400 }
  }
  if (message.includes('INVALID_QTY_PER_COLLECTION')) {
    return { userMessage: 'Quantity per collection must be 1 or more for each item.', status: 400 }
  }
  return { userMessage: 'Failed to create pool — please try again.', status: 500 }
}


// ═══ SECTION 4 — GET /api/gift/pools ═══════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const capsuleId        = searchParams.get('capsule_id')
    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    await resolveOrgSession(req, capsuleId)
    const db = getDb()

    const { data: pools, error } = await db
      .from('gift_pools')
      .select(`
        id,
        pool_name,
        pool_code,
        max_collections,
        collections_used,
        is_active,
        block_id,
        created_at,
        gift_pool_items (
          id,
          manifest_item_id,
          quantity_per_collection,
          gift_manifest_items ( id, item_name, category )
        )
      `)
      .eq('capsule_id', capsuleId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GCS Pools GET] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to load pools' }, { status: 500 })
    }

    const enriched = (pools ?? []).map(p => ({
      ...p,
      collections_remaining: p.max_collections - p.collections_used,
    }))

    return NextResponse.json({ pools: enriched })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Pools GET] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// ═══ SECTION 5 — POST /api/gift/pools ══════════════════════════════════════════
//
// Delegates entirely to gcs_create_pool() RPC — fully atomic.

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json()
    const capsuleId = body.capsule_id as string | undefined
    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    const { accountId, accountName } = await resolveOrgSession(req, capsuleId)
    const db = getDb()

    const poolName      = (body.pool_name ?? '').trim()
    const poolCode      = (body.pool_code ?? '').trim()
    const maxCollect    = parseInt(body.max_collections ?? '0', 10)
    const blockId       = body.block_id ?? null
    const items: { manifest_item_id: string; quantity_per_collection: number }[] = body.items ?? []

    if (!poolName)   return NextResponse.json({ error: 'Pool name is required' }, { status: 400 })
    if (!poolCode)   return NextResponse.json({ error: 'Pool code is required' }, { status: 400 })
    if (isNaN(maxCollect) || maxCollect < 1) {
      return NextResponse.json({ error: 'Maximum collections must be 1 or more' }, { status: 400 })
    }
    if (!items.length) {
      return NextResponse.json({ error: 'At least one item must be added to the pool' }, { status: 400 })
    }

    // Call atomic RPC — all validation, creation, allocation, and ledger in one transaction
    const { data: result, error: rpcError } = await db.rpc('gcs_create_pool', {
      p_capsule_id:      capsuleId,
      p_block_id:        blockId,
      p_pool_name:       poolName,
      p_pool_code:       poolCode,
      p_max_collections: maxCollect,
      p_created_by:      accountId,
      p_actor_name:      accountName,
      p_items:           JSON.stringify(items),
    })

    if (rpcError) {
      const { userMessage, status } = parseRpcError(rpcError.message)
      return NextResponse.json({ error: userMessage }, { status })
    }

    return NextResponse.json({ pool: result, collections_remaining: maxCollect }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Pools POST] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}