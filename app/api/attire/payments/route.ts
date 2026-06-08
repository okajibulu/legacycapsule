/**
 * ============================================================
 * FILE PATH: app/api/attire/payments/route.ts
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Attire Coordination Engine — Payment tracking
 * DB table: attire_payments (confirmed existing)
 *
 * POST — Record a payment (guest self-report or organiser entry)
 * PUT  — Verify a payment (organiser confirms)
 * GET  — List payments for an order (?order_id=xxx)
 *
 * LegacyCapsule NEVER handles funds. All payments go directly
 * to the organiser. This route tracks reported payments only.
 *
 * Sub-sections:
 *   1. Admin client
 *   2. GET handler
 *   3. POST handler — record payment
 *   4. PUT handler — verify payment + update order amount_paid
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

// ============================================================
// SECTION 2 — GET: List payments for an order
// ============================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const orderId = req.nextUrl.searchParams.get('order_id')
  const capsuleId = req.nextUrl.searchParams.get('capsule_id')

  if (!orderId && !capsuleId) {
    return NextResponse.json({ error: 'order_id or capsule_id required.' }, { status: 400 })
  }

  let query = adminClient
    .from('attire_payments')
    .select('id, order_id, amount, payment_date, reported_by, proof_url, verified, verified_at, created_at')
    .order('created_at', { ascending: false })

  if (orderId) {
    query = query.eq('order_id', orderId)
  }

  if (capsuleId) {
    // Join through attire_orders to filter by capsule
    const { data: orderIds } = await adminClient
      .from('attire_orders')
      .select('id')
      .eq('capsule_id', capsuleId)
      .is('deleted_at', null)

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json({ payments: [] })
    }

    query = query.in('order_id', orderIds.map(o => o.id))
  }

  const { data, error } = await query

  if (error) {
    console.error('[attire/payments GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch payments.' }, { status: 500 })
  }

  return NextResponse.json({ payments: data ?? [] })
}

// ============================================================
// SECTION 3 — POST: Record a payment
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    order_id: string
    amount: number
    payment_date?: string
    reported_by: string
    proof_url?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!body.order_id || !body.amount || !body.reported_by?.trim()) {
    return NextResponse.json(
      { error: 'order_id, amount, and reported_by are required.' },
      { status: 400 }
    )
  }

  if (body.amount <= 0) {
    return NextResponse.json({ error: 'Amount must be positive.' }, { status: 400 })
  }

  // ── Verify order exists ───────────────────────────────
  const { data: order } = await adminClient
    .from('attire_orders')
    .select('id, total_due, amount_paid')
    .eq('id', body.order_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  // ── Insert payment record ─────────────────────────────
  const { data, error } = await adminClient
    .from('attire_payments')
    .insert({
      order_id: body.order_id,
      amount: body.amount,
      payment_date: body.payment_date || new Date().toISOString().split('T')[0],
      reported_by: body.reported_by.trim(),
      proof_url: body.proof_url || null,
      verified: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[attire/payments POST]', error.message)
    return NextResponse.json({ error: 'Failed to record payment.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}

// ============================================================
// SECTION 4 — PUT: Verify a payment (organiser confirms)
// ============================================================

export async function PUT(req: NextRequest): Promise<NextResponse> {
  let body: { id: string; verified: boolean }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 })
  }

  // ── Update payment verification status ────────────────
  const { error: payErr } = await adminClient
    .from('attire_payments')
    .update({
      verified: body.verified,
      verified_at: body.verified ? new Date().toISOString() : null,
    })
    .eq('id', body.id)

  if (payErr) {
    console.error('[attire/payments PUT]', payErr.message)
    return NextResponse.json({ error: 'Failed to update payment.' }, { status: 500 })
  }

  // ── Recalculate order amount_paid from all verified payments ──
  const { data: payment } = await adminClient
    .from('attire_payments')
    .select('order_id')
    .eq('id', body.id)
    .single()

  if (payment?.order_id) {
    const { data: verifiedPayments } = await adminClient
      .from('attire_payments')
      .select('amount')
      .eq('order_id', payment.order_id)
      .eq('verified', true)

    const totalPaid = (verifiedPayments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)

    await adminClient
      .from('attire_orders')
      .update({ amount_paid: totalPaid })
      .eq('id', payment.order_id)

    // ── Auto-advance to payment_confirmed if fully paid ──
    const { data: order } = await adminClient
      .from('attire_orders')
      .select('total_due, status')
      .eq('id', payment.order_id)
      .single()

    if (order && totalPaid >= order.total_due && order.status === 'ordered') {
      await adminClient
        .from('attire_orders')
        .update({ status: 'payment_confirmed' })
        .eq('id', payment.order_id)
    }
  }

  return NextResponse.json({ ok: true })
}
