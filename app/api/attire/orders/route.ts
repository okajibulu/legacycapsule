/**
 * ============================================================
 * FILE PATH: app/api/attire/orders/route.ts
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Attire Coordination Engine — Order management
 * DB table: attire_orders (confirmed existing)
 *
 * GET    — List orders for capsule (?capsule_id=xxx)
 * POST   — Create a new order (guest submission)
 * PUT    — Update order status (organiser: dispatch lifecycle)
 * DELETE — Soft-delete an order
 *
 * Order statuses: ordered → payment_confirmed → ready →
 *                 dispatched → collected
 *
 * Sub-sections:
 *   1. Admin client
 *   2. GET handler
 *   3. POST handler — guest order submission
 *   4. PUT handler — organiser status updates
 *   5. DELETE handler
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// SECTION 1 — Admin client
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_STATUSES = ['ordered', 'payment_confirmed', 'ready', 'dispatched', 'collected', 'cancelled']

// ============================================================
// SECTION 2 — GET: List orders for a capsule
// ============================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const capsuleId = req.nextUrl.searchParams.get('capsule_id')
  const variantId = req.nextUrl.searchParams.get('variant_id')

  if (!capsuleId) {
    return NextResponse.json({ error: 'capsule_id required.' }, { status: 400 })
  }

  let query = adminClient
    .from('attire_orders')
    .select(`
      id, capsule_id, variant_id, guest_name, phone, email,
      quantity, total_due, amount_paid, custodian_name,
      custodian_address, custodian_phone, delivery_type,
      dispatch_cost, status, created_at
    `)
    .eq('capsule_id', capsuleId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (variantId) {
    query = query.eq('variant_id', variantId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[attire/orders GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 })
  }

  return NextResponse.json({ orders: data ?? [] })
}

// ============================================================
// SECTION 3 — POST: Create a new order (guest submission)
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    capsule_id: string
    variant_id: string
    guest_name: string
    phone?: string
    email?: string
    quantity: number
    delivery_type: 'pickup' | 'custodian'
    custodian_name?: string
    custodian_address?: string
    custodian_phone?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  // ── Validate required fields ──────────────────────────
  if (!body.capsule_id || !body.variant_id || !body.guest_name?.trim() || !body.quantity) {
    return NextResponse.json(
      { error: 'capsule_id, variant_id, guest_name, and quantity are required.' },
      { status: 400 }
    )
  }

  if (body.quantity < 1 || body.quantity > 100) {
    return NextResponse.json({ error: 'Quantity must be between 1 and 100.' }, { status: 400 })
  }

  // ── Fetch variant to calculate total_due ──────────────
  const { data: variant, error: varErr } = await adminClient
    .from('attire_variants')
    .select('id, price_per_unit, cutoff_date')
    .eq('id', body.variant_id)
    .eq('capsule_id', body.capsule_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (varErr || !variant) {
    return NextResponse.json({ error: 'Attire variant not found.' }, { status: 404 })
  }

  // ── Check cutoff date ─────────────────────────────────
  if (variant.cutoff_date && new Date(variant.cutoff_date) < new Date()) {
    return NextResponse.json(
      { error: 'Orders for this item have closed. The cutoff date has passed.' },
      { status: 400 }
    )
  }

  // ── Validate custodian fields if delivery_type is custodian ──
  if (body.delivery_type === 'custodian') {
    if (!body.custodian_name?.trim() || !body.custodian_address?.trim()) {
      return NextResponse.json(
        { error: 'Custodian name and address are required for custodian delivery.' },
        { status: 400 }
      )
    }
  }

  const totalDue = variant.price_per_unit * body.quantity

  // ── Insert order ──────────────────────────────────────
  const { data, error } = await adminClient
    .from('attire_orders')
    .insert({
      capsule_id: body.capsule_id,
      variant_id: body.variant_id,
      guest_name: body.guest_name.trim(),
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      quantity: body.quantity,
      total_due: totalDue,
      amount_paid: 0,
      delivery_type: body.delivery_type,
      custodian_name: body.custodian_name?.trim() || null,
      custodian_address: body.custodian_address?.trim() || null,
      custodian_phone: body.custodian_phone?.trim() || null,
      dispatch_cost: 0,
      status: 'ordered',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[attire/orders POST]', error.message)
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id, total_due: totalDue }, { status: 201 })
}

// ============================================================
// SECTION 4 — PUT: Update order (organiser status changes)
// ============================================================

export async function PUT(req: NextRequest): Promise<NextResponse> {
  let body: {
    id: string
    status?: string
    amount_paid?: number
    dispatch_cost?: number
    custodian_name?: string
    custodian_address?: string
    custodian_phone?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 })
  }

  const updates: Record<string, any> = {}

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status. Valid: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }
    updates.status = body.status
  }

  if (body.amount_paid !== undefined) updates.amount_paid = body.amount_paid
  if (body.dispatch_cost !== undefined) updates.dispatch_cost = body.dispatch_cost
  if (body.custodian_name !== undefined) updates.custodian_name = body.custodian_name?.trim() || null
  if (body.custodian_address !== undefined) updates.custodian_address = body.custodian_address?.trim() || null
  if (body.custodian_phone !== undefined) updates.custodian_phone = body.custodian_phone?.trim() || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('attire_orders')
    .update(updates)
    .eq('id', body.id)

  if (error) {
    console.error('[attire/orders PUT]', error.message)
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// ============================================================
// SECTION 5 — DELETE: Soft-delete an order
// ============================================================

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('attire_orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[attire/orders DELETE]', error.message)
    return NextResponse.json({ error: 'Failed to delete order.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
