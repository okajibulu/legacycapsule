/**
 * ============================================================
 * FILE PATH: app/api/guests/route.ts
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Guest Management — CRUD + access code generation
 * DB table: guests (confirmed existing)
 *
 * Columns: id, capsule_id, community_id, name, phone, email,
 *   tier, invited_phases (jsonb), access_code, rsvp_status,
 *   dietary_requirements, table_id, checked_in_at,
 *   created_at, deleted_at
 *
 * Guest tiers: VVIP · VIP · General · Reception Only ·
 *              Staff · Media · Vendor
 *
 * Sub-sections:
 *   1. Admin client + helpers
 *   2. GET — list guests for capsule
 *   3. POST — create guest + auto-generate access code
 *   4. PUT — update guest details
 *   5. DELETE — soft-delete guest
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

export const GUEST_TIERS = [
  'VVIP', 'VIP', 'General', 'Reception Only', 'Staff', 'Media', 'Vendor'
] as const

export const RSVP_STATUSES = [
  'pending', 'confirmed', 'declined', 'no_response'
] as const

/**
 * Generate a unique 8-character access code for a guest.
 * Format: LC-XXXXXX (uppercase alphanumeric, no ambiguous chars)
 */
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LC-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Ensure access code is unique within a capsule.
 * Retries up to 5 times before failing.
 */
async function generateUniqueCode(capsuleId: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateAccessCode()
    const { count } = await adminClient
      .from('guests')
      .select('id', { count: 'exact' })
      .eq('capsule_id', capsuleId)
      .eq('access_code', code)
      .is('deleted_at', null)

    if ((count ?? 0) === 0) return code
  }
  throw new Error('Could not generate unique access code after 5 attempts.')
}

// ============================================================
// SECTION 2 — GET: List guests for a capsule
// ============================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const capsuleId = req.nextUrl.searchParams.get('capsule_id')
  const tier = req.nextUrl.searchParams.get('tier')
  const tableId = req.nextUrl.searchParams.get('table_id')

  if (!capsuleId) {
    return NextResponse.json({ error: 'capsule_id required.' }, { status: 400 })
  }

  let query = adminClient
    .from('guests')
    .select(`
      id, capsule_id, name, phone, email, tier,
      invited_phases, access_code, rsvp_status,
      dietary_requirements, table_id, checked_in_at,
      created_at
    `)
    .eq('capsule_id', capsuleId)
    .is('deleted_at', null)
    .order('tier')
    .order('name')

  if (tier) query = query.eq('tier', tier)
  if (tableId) query = query.eq('table_id', tableId)

  const { data, error } = await query

  if (error) {
    console.error('[guests GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch guests.' }, { status: 500 })
  }

  return NextResponse.json({ guests: data ?? [] })
}

// ============================================================
// SECTION 3 — POST: Create a guest + auto-generate access code
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    capsule_id: string
    name: string
    phone?: string
    email?: string
    tier?: string
    invited_phases?: string[]
    dietary_requirements?: string
    table_id?: string
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

  // ── Generate unique access code ────────────────────────
  let accessCode: string
  try {
    accessCode = await generateUniqueCode(body.capsule_id)
  } catch (err) {
    console.error('[guests POST] Code generation failed:', err)
    return NextResponse.json({ error: 'Failed to generate access code.' }, { status: 500 })
  }

  // ── Insert guest ───────────────────────────────────────
  const { data, error } = await adminClient
    .from('guests')
    .insert({
      capsule_id: body.capsule_id,
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      tier: body.tier ?? 'General',
      invited_phases: body.invited_phases ?? [],
      access_code: accessCode,
      rsvp_status: 'pending',
      dietary_requirements: body.dietary_requirements?.trim() || null,
      table_id: body.table_id || null,
    })
    .select('id, access_code')
    .single()

  if (error) {
    console.error('[guests POST]', error.message)
    return NextResponse.json({ error: 'Failed to create guest.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id, access_code: data.access_code }, { status: 201 })
}

// ============================================================
// SECTION 4 — PUT: Update guest details
// ============================================================

export async function PUT(req: NextRequest): Promise<NextResponse> {
  let body: {
    id: string
    name?: string
    phone?: string | null
    email?: string | null
    tier?: string
    invited_phases?: string[]
    dietary_requirements?: string | null
    table_id?: string | null
    rsvp_status?: string
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
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null
  if (body.email !== undefined) updates.email = body.email?.trim() || null
  if (body.tier !== undefined) updates.tier = body.tier
  if (body.invited_phases !== undefined) updates.invited_phases = body.invited_phases
  if (body.dietary_requirements !== undefined) updates.dietary_requirements = body.dietary_requirements?.trim() || null
  if (body.table_id !== undefined) updates.table_id = body.table_id || null
  if (body.rsvp_status !== undefined) updates.rsvp_status = body.rsvp_status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('guests')
    .update(updates)
    .eq('id', body.id)

  if (error) {
    console.error('[guests PUT]', error.message)
    return NextResponse.json({ error: 'Failed to update guest.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// ============================================================
// SECTION 5 — DELETE: Soft-delete a guest
// ============================================================

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('guests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[guests DELETE]', error.message)
    return NextResponse.json({ error: 'Failed to delete guest.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
