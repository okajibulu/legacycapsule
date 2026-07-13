// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/sections/route.ts
// PURPOSE: Manage event sections/tables/zones for a capsule.
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')
  if (!capsule_id) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
  try {
    const { data: sections } = await db().from('event_sections').select('*').eq('capsule_id', capsule_id).order('sort_order')
    return NextResponse.json({ sections: sections ?? [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { capsule_id, name, section_type, capacity, tier_restriction, sort_order } = body
    if (!capsule_id || !name || !section_type) {
      return NextResponse.json({ error: 'capsule_id, name, section_type required' }, { status: 400 })
    }
    const { data: section, error } = await db().from('event_sections').insert({
      capsule_id, name, section_type, capacity: capacity ?? null,
      tier_restriction: tier_restriction ?? null, sort_order: sort_order ?? 0,
    }).select().single()
    if (error) throw error
    return NextResponse.json({ section })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    await db().from('event_sections').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
  }
}
