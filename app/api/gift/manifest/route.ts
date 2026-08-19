// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/manifest/route.ts
// PURPOSE:    Gift Collection System — manifest items list and creation
//             GET  /api/gift/manifest?capsule_id=   — list all items
//             POST /api/gift/manifest                — add new item
// SPEC:       GCS-SPEC-001 v1.1 + AMD-002 v1.0 Phase 2 Step 4
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.18
// DATE:       19 August 2026
//
// AUTH:       Manage dashboard session (manageAuth.ts pattern)
//             Gated on capsule.components.includes('gift_collection')
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


// ═══ SECTION 2 — Auth helper ═══════════════════════════════════════════════════
//
// Validates manage session cookie and confirms GCS is active on the capsule.
// Returns { account, capsule } or throws with an error response.

async function resolveManageSession(
  req:       NextRequest,
  capsuleId: string
): Promise<{ accountId: string; accountName: string; role: string; capsuleId: string }> {
  const db        = getDb()
  const sessionId = req.cookies.get('manage_session')?.value

  if (!sessionId) {
    throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Validate session
  const { data: session, error: sessionErr } = await db
    .from('manage_sessions')
    .select('account_id, capsule_id, expires_at')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionErr || !session) {
    throw NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  if (new Date(session.expires_at) < new Date()) {
    throw NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }
  if (session.capsule_id !== capsuleId) {
    throw NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
  }

  // Load account
  const { data: account, error: accountErr } = await db
    .from('capsule_accounts')
    .select('id, display_name, role, permissions')
    .eq('id', session.account_id)
    .maybeSingle()

  if (accountErr || !account) {
    throw NextResponse.json({ error: 'Account not found' }, { status: 401 })
  }

  // Check GCS is active on capsule
  const { data: capsule } = await db
    .from('capsules')
    .select('components')
    .eq('id', capsuleId)
    .maybeSingle()

  if (!capsule?.components?.includes('gift_collection')) {
    throw NextResponse.json(
      { error: 'Gift Collection is not active on this capsule.' },
      { status: 403 }
    )
  }

  return {
    accountId:   account.id,
    accountName: account.display_name,
    role:        account.role,
    capsuleId,
  }
}


// ═══ SECTION 3 — GET /api/gift/manifest ════════════════════════════════════════
//
// Returns all active manifest items with derived counters.
// Derived: qty_unallocated = qty_in_stock - qty_allocated
// Derived: qty_outstanding  = qty_allocated - qty_collected

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const capsuleId        = searchParams.get('capsule_id')

    if (!capsuleId) {
      return NextResponse.json({ error: 'capsule_id is required' }, { status: 400 })
    }

    await resolveManageSession(req, capsuleId)

    const db = getDb()

    const { data: items, error } = await db
      .from('gift_manifest_items')
      .select(`
        id,
        item_name,
        category,
        description,
        donor_name,
        donor_name_visible,
        qty_in_stock,
        qty_allocated,
        qty_collected,
        qty_exceptions,
        is_active,
        sort_order,
        created_at,
        updated_at
      `)
      .eq('capsule_id', capsuleId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[GCS Manifest GET] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to load manifest' }, { status: 500 })
    }

    // Attach derived counters
    const enriched = (items ?? []).map(item => ({
      ...item,
      qty_unallocated: item.qty_in_stock   - item.qty_allocated,
      qty_outstanding:  item.qty_allocated - item.qty_collected,
    }))

    return NextResponse.json({ items: enriched })
  } catch (err) {
    // resolveManageSession throws NextResponse objects on auth failures
    if (err instanceof NextResponse) return err
    console.error('[GCS Manifest GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// ═══ SECTION 4 — POST /api/gift/manifest ═══════════════════════════════════════
//
// Creates a new manifest item.
// qty_in_stock is the stock quantity — sets the inventory baseline.
// Validates: item_name required, qty_in_stock >= 0.
// Writes INVENTORY_ADDED ledger event on success.

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json()
    const capsuleId = body.capsule_id as string | undefined

    if (!capsuleId) {
      return NextResponse.json({ error: 'capsule_id is required' }, { status: 400 })
    }

    const { accountId, accountName } = await resolveManageSession(req, capsuleId)

    // ── Validate required fields ─────────────────────────────────────────────
    const itemName: string = (body.item_name ?? '').trim()
    if (!itemName) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
    }

    const qtyInStock: number = parseInt(body.qty_in_stock ?? '0', 10)
    if (isNaN(qtyInStock) || qtyInStock < 0) {
      return NextResponse.json(
        { error: 'Stock quantity must be zero or greater' },
        { status: 400 }
      )
    }

    const donorName:        string  = (body.donor_name ?? '').trim() || null!
    const donorNameVisible: boolean = body.donor_name_visible !== false

    const db = getDb()

    // ── Get max sort_order for capsule ───────────────────────────────────────
    const { data: maxRow } = await db
      .from('gift_manifest_items')
      .select('sort_order')
      .eq('capsule_id', capsuleId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextSort = ((maxRow?.sort_order ?? -1) + 1)

    // ── Insert item ──────────────────────────────────────────────────────────
    const { data: newItem, error: insertErr } = await db
      .from('gift_manifest_items')
      .insert({
        capsule_id:          capsuleId,
        item_name:           itemName,
        category:            (body.category ?? '').trim() || null,
        description:         (body.description ?? '').trim() || null,
        donor_name:          donorName ?? null,
        donor_name_visible:  donorNameVisible,
        qty_in_stock:        qtyInStock,
        qty_allocated:       0,
        qty_collected:       0,
        qty_exceptions:      0,
        quantity_total:      qtyInStock,   // legacy counter kept in sync
        quantity_assigned:   0,
        quantity_collected_legacy: 0,
        is_active:           true,
        sort_order:          nextSort,
      })
      .select()
      .single()

    if (insertErr || !newItem) {
      console.error('[GCS Manifest POST] Insert error:', insertErr?.message)
      return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
    }

    // ── Ledger — fire and forget ─────────────────────────────────────────────
    writeLedgerEvent({
      capsule_id:       capsuleId,
      event_type:       'INVENTORY_ADDED',
      actor_type:       'organiser',
      actor_id:         accountId,
      actor_name:       accountName,
      manifest_item_id: newItem.id,
      quantity:         qtyInStock,
      payload: {
        item_name:    itemName,
        qty_in_stock: qtyInStock,
        action:       'item_created',
      },
    })

    return NextResponse.json(
      {
        item: {
          ...newItem,
          qty_unallocated: newItem.qty_in_stock - newItem.qty_allocated,
          qty_outstanding:  newItem.qty_allocated - newItem.qty_collected,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[GCS Manifest POST] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}