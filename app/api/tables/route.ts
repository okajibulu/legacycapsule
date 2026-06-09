/**
 * ============================================================
 * FILE PATH: app/api/tables/route.ts
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Table Management — CRUD
 * DB table: event_tables (confirmed existing)
 *
 * Columns: id, capsule_id, community_id, name, capacity,
 *   tier_designation, created_at
 *
 * Sub-sections:
 *   1. Admin client
 *   2. GET — list tables with guest counts
 *   3. POST — create table
 *   4. PUT — update table
 *   5. DELETE — delete table (hard delete, no soft-delete column)
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
// SECTION 2 — GET: List tables with guest counts
// ============================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const capsuleId = req.nextUrl.searchParams.get('capsule_id')

  if (!capsuleId) {
    return NextResponse.json({ error: 'capsule_id required.' }, { status: 400 })
  }

  const { data: tables, error } = await adminClient
    .from('event_tables')
    .select('id, capsule_id, name, capacity, tier_designation, created_at')
    .eq('capsule_id', capsuleId)
    .order('name')

  if (error) {
    console.error('[tables GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch tables.' }, { status: 500 })
  }

  // ── Fetch guest counts per table ──────────────────────
  const tableIds = (tables ?? []).map(t => t.id)
  let guestCounts: Record<string, number> = {}

  if (tableIds.length > 0) {
    const { data: guests } = await adminClient
      .from('guests')
      .select('table_id')
      .eq('capsule_id', capsuleId)
      .in('table_id', tableIds)
      .is('deleted_at', null)

    for (const g of guests ?? []) {
      if (g.table_id) {
        guestCounts[g.table_id] = (guestCounts[g.table_id] ?? 0) + 1
      }
    }
  }

  const tablesWithCounts = (tables ?? []).map(t => ({
    ...t,
    guest_count: guestCounts[t.id] ?? 0,
  }))

  return NextResponse.json({ tables: tablesWithCounts })
}

// ============================================================
// SECTION 3 — POST: Create a table
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    capsule_id: string
    name: string
    capacity: number
    tier_designation?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!body.capsule_id || !body.name?.trim() || !body.capacity) {
    return NextResponse.json(
      { error: 'capsule_id, name, and capacity are required.' },
      { status: 400 }
    )
  }

  if (body.capacity < 1 || body.capacity > 500) {
    return NextResponse.json({ error: 'Capacity must be between 1 and 500.' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('event_tables')
    .insert({
      capsule_id: body.capsule_id,
      name: body.name.trim(),
      capacity: body.capacity,
      tier_designation: body.tier_designation?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[tables POST]', error.message)
    return NextResponse.json({ error: 'Failed to create table.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}

// ============================================================
// SECTION 4 — PUT: Update a table
// ============================================================

export async function PUT(req: NextRequest): Promise<NextResponse> {
  let body: {
    id: string
    name?: string
    capacity?: number
    tier_designation?: string | null
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
  if (body.capacity !== undefined) updates.capacity = body.capacity
  if (body.tier_designation !== undefined) updates.tier_designation = body.tier_designation?.trim() || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('event_tables')
    .update(updates)
    .eq('id', body.id)

  if (error) {
    console.error('[tables PUT]', error.message)
    return NextResponse.json({ error: 'Failed to update table.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// ============================================================
// SECTION 5 — DELETE: Delete a table
// (event_tables has no deleted_at — hard delete)
// Un-assigns any guests from this table first
// ============================================================

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required.' }, { status: 400 })
  }

  // ── Un-assign guests from this table ─────────────────
  await adminClient
    .from('guests')
    .update({ table_id: null })
    .eq('table_id', id)

  // ── Delete table ──────────────────────────────────────
  const { error } = await adminClient
    .from('event_tables')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[tables DELETE]', error.message)
    return NextResponse.json({ error: 'Failed to delete table.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
