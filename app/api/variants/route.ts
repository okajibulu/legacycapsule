/**
 * ============================================================
 * FILE PATH: app/api/attire/variants/route.ts
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Attire Coordination Engine — Variant CRUD
 * DB table: attire_variants (confirmed existing)
 *
 * GET  — List all variants for a capsule (?capsule_id=xxx)
 * POST — Create a new variant (organiser only)
 * PUT  — Update a variant (organiser only)
 * DELETE — Soft-delete a variant (organiser only)
 *
 * Sub-sections:
 *   1. Admin client
 *   2. GET handler
 *   3. POST handler
 *   4. PUT handler
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

// ============================================================
// SECTION 2 — GET: List variants for a capsule
// ============================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const capsuleId = req.nextUrl.searchParams.get('capsule_id')

  if (!capsuleId) {
    return NextResponse.json({ error: 'capsule_id required.' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('attire_variants')
    .select('id, capsule_id, name, description, price_per_unit, unit_type, image_url, sort_order, cutoff_date, created_at')
    .eq('capsule_id', capsuleId)
    .is('deleted_at', null)
    .order('sort_order')

  if (error) {
    console.error('[attire/variants GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch variants.' }, { status: 500 })
  }

  return NextResponse.json({ variants: data ?? [] })
}

// ============================================================
// SECTION 3 — POST: Create a new variant
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    capsule_id: string
    name: string
    description?: string
    price_per_unit: number
    unit_type?: string
    image_url?: string
    cutoff_date?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!body.capsule_id || !body.name?.trim() || !body.price_per_unit) {
    return NextResponse.json(
      { error: 'capsule_id, name, and price_per_unit are required.' },
      { status: 400 }
    )
  }

  // ── Get next sort_order ────────────────────────────────
  const { data: existing } = await adminClient
    .from('attire_variants')
    .select('sort_order')
    .eq('capsule_id', body.capsule_id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = (existing?.[0]?.sort_order ?? -1) + 1

  // ── Insert ─────────────────────────────────────────────
  const { data, error } = await adminClient
    .from('attire_variants')
    .insert({
      capsule_id: body.capsule_id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      price_per_unit: body.price_per_unit,
      unit_type: body.unit_type ?? 'piece',
      image_url: body.image_url || null,
      cutoff_date: body.cutoff_date || null,
      sort_order: nextSort,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[attire/variants POST]', error.message)
    return NextResponse.json({ error: 'Failed to create variant.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}

// ============================================================
// SECTION 4 — PUT: Update a variant
// ============================================================

export async function PUT(req: NextRequest): Promise<NextResponse> {
  let body: {
    id: string
    name?: string
    description?: string
    price_per_unit?: number
    unit_type?: string
    image_url?: string
    cutoff_date?: string | null
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
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.price_per_unit !== undefined) updates.price_per_unit = body.price_per_unit
  if (body.unit_type !== undefined) updates.unit_type = body.unit_type
  if (body.image_url !== undefined) updates.image_url = body.image_url || null
  if (body.cutoff_date !== undefined) updates.cutoff_date = body.cutoff_date || null
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('attire_variants')
    .update(updates)
    .eq('id', body.id)

  if (error) {
    console.error('[attire/variants PUT]', error.message)
    return NextResponse.json({ error: 'Failed to update variant.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// ============================================================
// SECTION 5 — DELETE: Soft-delete a variant
// ============================================================

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('attire_variants')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[attire/variants DELETE]', error.message)
    return NextResponse.json({ error: 'Failed to delete variant.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
