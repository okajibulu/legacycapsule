/**
 * ============================================================
 * FILE PATH: app/api/phases/route.ts
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Event Phases — Full CRUD
 * DB table: capsule_phases (confirmed existing)
 *
 * Columns: id, capsule_id, community_id, name, event_date,
 *   location, sort_order, programme (jsonb),
 *   capture_window_closes_at, qr_token,
 *   created_at, deleted_at
 *
 * Business rules:
 *   - Free tier: max 2 phases per capsule
 *   - Extra phases: purchasable via upgrade
 *   - qr_token: auto-generated UUID on creation
 *
 * Sub-sections:
 *   1. Admin client + constants
 *   2. GET — list phases for capsule
 *   3. POST — create phase (enforces 2-phase limit)
 *   4. PUT — update phase
 *   5. DELETE — soft-delete phase
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// SECTION 1 — Admin client + constants
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FREE_PHASE_LIMIT = 2

function generateQrToken(): string {
  // UUID v4 format
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

// ============================================================
// SECTION 2 — GET: List phases for a capsule
// ============================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const capsuleId = req.nextUrl.searchParams.get('capsule_id')

  if (!capsuleId) {
    return NextResponse.json({ error: 'capsule_id required.' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('capsule_phases')
    .select('id, capsule_id, name, event_date, location, sort_order, programme, capture_window_closes_at, qr_token, created_at')
    .eq('capsule_id', capsuleId)
    .is('deleted_at', null)
    .order('sort_order')

  if (error) {
    console.error('[phases GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch phases.' }, { status: 500 })
  }

  return NextResponse.json({ phases: data ?? [] })
}

// ============================================================
// SECTION 3 — POST: Create a phase (enforces 2-phase free limit)
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    capsule_id: string
    name: string
    event_date?: string
    location?: string
    programme?: any
    capture_window_closes_at?: string
    override_limit?: boolean // set by LCAdmin to allow extra paid phases
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!body.capsule_id || !body.name?.trim()) {
    return NextResponse.json(
      { error: 'capsule_id and name are required.' },
      { status: 400 }
    )
  }

  // ── Check phase limit unless override ──────────────────
  if (!body.override_limit) {
    const { count } = await adminClient
      .from('capsule_phases')
      .select('id', { count: 'exact' })
      .eq('capsule_id', body.capsule_id)
      .is('deleted_at', null)

    if ((count ?? 0) >= FREE_PHASE_LIMIT) {
      return NextResponse.json(
        {
          error: 'phase_limit_reached',
          message: `Free capsules include ${FREE_PHASE_LIMIT} event phases. Contact us to add more.`,
          current_count: count,
          limit: FREE_PHASE_LIMIT,
        },
        { status: 403 }
      )
    }
  }

  // ── Get next sort order ────────────────────────────────
  const { data: existing } = await adminClient
    .from('capsule_phases')
    .select('sort_order')
    .eq('capsule_id', body.capsule_id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = (existing?.[0]?.sort_order ?? -1) + 1

  // ── Insert ─────────────────────────────────────────────
  const { data, error } = await adminClient
    .from('capsule_phases')
    .insert({
      capsule_id: body.capsule_id,
      name: body.name.trim(),
      event_date: body.event_date || null,
      location: body.location?.trim() || null,
      sort_order: nextSort,
      programme: body.programme ?? null,
      capture_window_closes_at: body.capture_window_closes_at || null,
      qr_token: generateQrToken(),
    })
    .select('id, qr_token')
    .single()

  if (error) {
    console.error('[phases POST]', error.message)
    return NextResponse.json({ error: 'Failed to create phase.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id, qr_token: data.qr_token }, { status: 201 })
}

// ============================================================
// SECTION 4 — PUT: Update a phase
// ============================================================

export async function PUT(req: NextRequest): Promise<NextResponse> {
  let body: {
    id: string
    name?: string
    event_date?: string | null
    location?: string | null
    programme?: any
    capture_window_closes_at?: string | null
    sort_order?: number
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
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.event_date !== undefined) updates.event_date = body.event_date || null
  if (body.location !== undefined) updates.location = body.location?.trim() || null
  if (body.programme !== undefined) updates.programme = body.programme
  if (body.capture_window_closes_at !== undefined) updates.capture_window_closes_at = body.capture_window_closes_at || null
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('capsule_phases')
    .update(updates)
    .eq('id', body.id)

  if (error) {
    console.error('[phases PUT]', error.message)
    return NextResponse.json({ error: 'Failed to update phase.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// ============================================================
// SECTION 5 — DELETE: Soft-delete a phase
// ============================================================

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('capsule_phases')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[phases DELETE]', error.message)
    return NextResponse.json({ error: 'Failed to delete phase.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
