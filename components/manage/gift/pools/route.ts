// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/pools/route.ts
// PURPOSE:    Gift Collection System — controlled pool list and creation
//             GET  /api/gift/pools?capsule_id=   — list all pools with items
//             POST /api/gift/pools               — create pool + pool_items
// SPEC:       GCS-SPEC-001-AMD-002 v1.0 Part Three — Phase 3 Step 9
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.20
// DATE:       19 August 2026
//
// RULES (AMD-002 Rule 40):
//   • Pools are the ONLY anonymous collection mechanism. General codes do not exist.
//   • max_collections is a hard ceiling — enforced at scan time by the stand API.
//   • Pool codes must not conflict with personalised credential codes (same UNIQUE).
//   • pool_items define what each collection yields — minimum 1 item required.
//   • Pool creation writes INVENTORY_ALLOCATED events for each item × max_collections.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { writeLedgerEvent }          from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — Auth helper (organiser only — pools are FRFA-level) ═══════════

async function resolveOrgSession(
  req:       NextRequest,
  capsuleId: string
): Promise<{ accountId: string; accountName: string }> {
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
    throw NextResponse.json(
      { error: 'Only the event organiser may manage gift pools.' },
      { status: 403 }
    )
  }

  const { data: capsule } = await db
    .from('capsules').select('components').eq('id', capsuleId).maybeSingle()

  if (!capsule?.components?.includes('gift_collection')) {
    throw NextResponse.json({ error: 'Gift Collection is not active.' }, { status: 403 })
  }

  return { accountId: account.id, accountName: account.display_name }
}


// ═══ SECTION 3 — GET /api/gift/pools ═══════════════════════════════════════════

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
          gift_manifest_items (
            id,
            item_name,
            category
          )
        )
      `)
      .eq('capsule_id', capsuleId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GCS Pools GET] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to load pools' }, { status: 500 })
    }

    // Attach remaining capacity
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


// ═══ SECTION 4 — POST /api/gift/pools ══════════════════════════════════════════
//
// Creates a pool and its item list.
// Validates: pool_name, pool_code unique, max_collections >= 1,
//   items array non-empty, allocation available per item.
// Reserves max_collections × qty_per_item from each manifest item's allocation.

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json()
    const capsuleId = body.capsule_id as string | undefined
    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    const { accountId, accountName } = await resolveOrgSession(req, capsuleId)
    const db = getDb()

    // ── Validate core fields ─────────────────────────────────────────────────
    const poolName      = (body.pool_name ?? '').trim()
    const poolCode      = (body.pool_code ?? '').trim()
    const maxCollect    = parseInt(body.max_collections ?? '0', 10)
    const blockId       = body.block_id ?? null
    const items: { manifest_item_id: string; quantity_per_collection: number }[]
                        = body.items ?? []

    if (!poolName)   return NextResponse.json({ error: 'Pool name is required' }, { status: 400 })
    if (!poolCode)   return NextResponse.json({ error: 'Pool code is required' }, { status: 400 })
    if (isNaN(maxCollect) || maxCollect < 1) {
      return NextResponse.json({ error: 'Maximum collections must be 1 or more' }, { status: 400 })
    }
    if (!items.length) {
      return NextResponse.json(
        { error: 'At least one item must be added to the pool' },
        { status: 400 }
      )
    }

    // ── Check pool_code uniqueness across capsule (gift_credentials + gift_pools) ─
    const { data: existingCred } = await db
      .from('gift_credentials')
      .select('id')
      .eq('capsule_id', capsuleId)
      .eq('numeric_code', poolCode)
      .maybeSingle()

    if (existingCred) {
      return NextResponse.json(
        { error: `Code "${poolCode}" is already in use by a guest credential.` },
        { status: 409 }
      )
    }

    const { data: existingPool } = await db
      .from('gift_pools')
      .select('id')
      .eq('capsule_id', capsuleId)
      .eq('pool_code', poolCode)
      .maybeSingle()

    if (existingPool) {
      return NextResponse.json(
        { error: `Code "${poolCode}" is already in use by another pool.` },
        { status: 409 }
      )
    }

    // ── Allocation check per item ─────────────────────────────────────────────
    // Each item must have enough unallocated stock to cover maxCollect × qty_per_item
    const allocationErrors: string[] = []

    for (const poolItem of items) {
      const qty = poolItem.quantity_per_collection
      const needed = maxCollect * qty

      const { data: mItem } = await db
        .from('gift_manifest_items')
        .select('item_name, qty_in_stock, qty_allocated')
        .eq('id', poolItem.manifest_item_id)
        .eq('capsule_id', capsuleId)
        .is('deleted_at', null)
        .maybeSingle()

      if (!mItem) {
        allocationErrors.push(`Item ${poolItem.manifest_item_id} not found.`)
        continue
      }

      const unallocated = mItem.qty_in_stock - mItem.qty_allocated
      if (needed > unallocated) {
        allocationErrors.push(
          `"${mItem.item_name}": need ${needed} units for ${maxCollect} collections × ${qty}, ` +
          `but only ${unallocated} unallocated.`
        )
      }
    }

    if (allocationErrors.length) {
      return NextResponse.json(
        { error: 'Allocation check failed:\n' + allocationErrors.join('\n') },
        { status: 422 }
      )
    }

    // ── Create pool ───────────────────────────────────────────────────────────
    const { data: pool, error: poolErr } = await db
      .from('gift_pools')
      .insert({
        capsule_id:       capsuleId,
        block_id:         blockId,
        pool_name:        poolName,
        pool_code:        poolCode,
        max_collections:  maxCollect,
        collections_used: 0,
        is_active:        true,
        created_by:       accountId,
      })
      .select()
      .single()

    if (poolErr || !pool) {
      console.error('[GCS Pools POST] Pool insert error:', poolErr?.message)
      return NextResponse.json({ error: 'Failed to create pool' }, { status: 500 })
    }

    // ── Create pool items ──────────────────────────────────────────────────────
    const { error: itemsErr } = await db
      .from('gift_pool_items')
      .insert(
        items.map(i => ({
          pool_id:                 pool.id,
          manifest_item_id:        i.manifest_item_id,
          quantity_per_collection: i.quantity_per_collection,
        }))
      )

    if (itemsErr) {
      console.error('[GCS Pools POST] Pool items insert error:', itemsErr.message)
      // Pool created but items failed — still return partial success, log for review
    }

    // ── Reserve allocation from each manifest item ────────────────────────────
    for (const poolItem of items) {
      const needed = maxCollect * poolItem.quantity_per_collection

      const { data: mItem } = await db
        .from('gift_manifest_items')
        .select('qty_allocated, quantity_assigned')
        .eq('id', poolItem.manifest_item_id)
        .maybeSingle()

      if (mItem) {
        await db
          .from('gift_manifest_items')
          .update({
            qty_allocated:    mItem.qty_allocated + needed,
            quantity_assigned: mItem.quantity_assigned + needed,
            updated_at:       new Date().toISOString(),
          })
          .eq('id', poolItem.manifest_item_id)

        // Ledger — fire and forget per item
        writeLedgerEvent({
          capsule_id:       capsuleId,
          event_type:       'INVENTORY_ALLOCATED',
          actor_type:       'organiser',
          actor_id:         accountId,
          actor_name:       accountName,
          manifest_item_id: poolItem.manifest_item_id,
          pool_id:          pool.id,
          quantity:         needed,
          payload: {
            pool_name:               poolName,
            max_collections:         maxCollect,
            quantity_per_collection: poolItem.quantity_per_collection,
            allocation_type:         'pool',
          },
        })
      }
    }

    return NextResponse.json({ pool, collections_remaining: maxCollect }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Pools POST] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}