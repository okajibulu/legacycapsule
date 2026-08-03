/**
 * ============================================================
 * FILE PATH: app/api/phases/route.ts
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 * Updated: Claude Sonnet 4.6 · July 2026
 *   — Phase limit now reads from capsule tier + purchased additional phases
 *   — Free capsule: 1 phase
 *   — Paid/booked capsule: 2 phases
 *   — Each 'additional_phase' purchase in capsule.components adds 1 more
 *   — override_limit flag retained for LCAdmin use
 *
 * DB table: capsule_phases
 * Columns: id, capsule_id, community_id, name, event_date,
 *   location, sort_order, programme (jsonb),
 *   capture_window_closes_at, qr_token, created_at, deleted_at
 *
 * Sub-sections:
 *   1. Admin client + helpers
 *   2. GET — list phases for capsule
 *   3. POST — create phase (tier-aware limit)
 *   4. PUT — update phase
 *   5. DELETE — soft-delete phase
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// SECTION 1 — Admin client + helpers
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateQrToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

/**
 * Compute the phase limit for a capsule.
 *
 * Rules:
 *   - Free (tier = null / 'free' / unpaid): 1 phase
 *   - Paid / booked (any other tier):        2 phases
 *   - Each 'additional_phase' in components: +1 per occurrence
 *
 * 'additional_phase' can appear multiple times in the components array
 * (one per purchase), so we count occurrences rather than checking inclusion.
 */
function computePhaseLimit(tier: string | null, components: string[]): number {
  const isFree  = !tier || tier === 'free' || tier === 'Free'
  const base    = isFree ? 1 : 2
  const extras  = components.filter(c => c === 'additional_phase').length
  return base + extras
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
// SECTION 3 — POST: Create a phase (tier-aware limit)
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    capsule_id: string
    name: string
    event_date?: string
    location?: string
    programme?: any
    capture_window_closes_at?: string
    override_limit?: boolean
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

  // ── Fetch capsule tier + components for limit computation ─────────────────
  if (!body.override_limit) {
    const { data: capsule } = await adminClient
      .from('capsules')
      .select('tier, components')
      .eq('id', body.capsule_id)
      .maybeSingle()

    const tier       = capsule?.tier ?? null
    const components: string[] = capsule?.components ?? []
    const limit      = computePhaseLimit(tier, components)

    // Count existing active phases
    const { count } = await adminClient
      .from('capsule_phases')
      .select('id', { count: 'exact' })
      .eq('capsule_id', body.capsule_id)
      .is('deleted_at', null)

    const currentCount = count ?? 0

    if (currentCount >= limit) {
      const isFree = !tier || tier === 'free' || tier === 'Free'
      return NextResponse.json(
        {
          error:         'phase_limit_reached',
          message:       isFree
            ? `Free capsules include 1 event phase. Upgrade your capsule or purchase an Additional Event Phase to add more.`
            : `Your capsule includes ${limit} event phase${limit !== 1 ? 's' : ''}. Purchase an Additional Event Phase from the Services tab to add more.`,
          current_count: currentCount,
          limit,
          is_free:       isFree,
        },
        { status: 403 }
      )
    }
  }

  // ── Get next sort order ───────────────────────────────────────────────────
  const { data: existing } = await adminClient
    .from('capsule_phases')
    .select('sort_order')
    .eq('capsule_id', body.capsule_id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = (existing?.[0]?.sort_order ?? -1) + 1

  // ── Insert ────────────────────────────────────────────────────────────────
  const { data, error } = await adminClient
    .from('capsule_phases')
    .insert({
      capsule_id:               body.capsule_id,
      name:                     body.name.trim(),
      event_date:               body.event_date || null,
      location:                 body.location?.trim() || null,
      sort_order:               nextSort,
      programme:                body.programme ?? null,
      capture_window_closes_at: body.capture_window_closes_at || null,
      qr_token:                 generateQrToken(),
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
  if (body.name                     !== undefined) updates.name                     = body.name.trim()
  if (body.event_date               !== undefined) updates.event_date               = body.event_date || null
  if (body.location                 !== undefined) updates.location                 = body.location?.trim() || null
  if (body.programme                !== undefined) updates.programme                = body.programme
  if (body.capture_window_closes_at !== undefined) updates.capture_window_closes_at = body.capture_window_closes_at || null
  if (body.sort_order               !== undefined) updates.sort_order               = body.sort_order

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
// SECTION 4B — PATCH: Alias for PUT (used by EditPhaseForm)
// ============================================================

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return PUT(req)
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
