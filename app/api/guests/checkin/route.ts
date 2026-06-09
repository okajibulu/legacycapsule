/**
 * ============================================================
 * FILE PATH: app/api/guests/checkin/route.ts
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Guest Check-in — validate access code and mark as checked in
 *
 * POST  — Validate code + check in
 * DELETE — Undo check-in
 *
 * Sub-sections:
 *   1. Admin client
 *   2. POST — validate code and check in
 *   3. DELETE — undo check-in
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
// SECTION 2 — POST: Validate access code + check in
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { capsule_id: string; access_code: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!body.capsule_id || !body.access_code?.trim()) {
    return NextResponse.json(
      { error: 'capsule_id and access_code are required.' },
      { status: 400 }
    )
  }

  // ── Find guest by access code ──────────────────────────
  const { data: guest, error } = await adminClient
    .from('guests')
    .select('id, name, tier, rsvp_status, checked_in_at, table_id, invited_phases, dietary_requirements')
    .eq('capsule_id', body.capsule_id)
    .eq('access_code', body.access_code.trim().toUpperCase())
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    console.error('[checkin POST]', error.message)
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 })
  }

  if (!guest) {
    return NextResponse.json(
      { error: 'invalid_code', message: 'Access code not found.' },
      { status: 404 }
    )
  }

  // ── Already checked in ────────────────────────────────
  if (guest.checked_in_at) {
    return NextResponse.json({
      ok: true,
      already_checked_in: true,
      guest: {
        id: guest.id,
        name: guest.name,
        tier: guest.tier,
        table_id: guest.table_id,
        invited_phases: guest.invited_phases,
        dietary_requirements: guest.dietary_requirements,
        checked_in_at: guest.checked_in_at,
      }
    })
  }

  // ── Mark as checked in ────────────────────────────────
  const now = new Date().toISOString()
  const { error: updateErr } = await adminClient
    .from('guests')
    .update({ checked_in_at: now, rsvp_status: 'confirmed' })
    .eq('id', guest.id)

  if (updateErr) {
    console.error('[checkin POST update]', updateErr.message)
    return NextResponse.json({ error: 'Failed to record check-in.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    already_checked_in: false,
    guest: {
      id: guest.id,
      name: guest.name,
      tier: guest.tier,
      table_id: guest.table_id,
      invited_phases: guest.invited_phases,
      dietary_requirements: guest.dietary_requirements,
      checked_in_at: now,
    }
  })
}

// ============================================================
// SECTION 3 — DELETE: Undo a check-in
// ============================================================

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const guestId = req.nextUrl.searchParams.get('guest_id')

  if (!guestId) {
    return NextResponse.json({ error: 'guest_id required.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('guests')
    .update({ checked_in_at: null })
    .eq('id', guestId)

  if (error) {
    console.error('[checkin DELETE]', error.message)
    return NextResponse.json({ error: 'Failed to undo check-in.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
