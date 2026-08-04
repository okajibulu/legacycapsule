// ============================================================
// FILE PATH: app/api/event-moments/[phaseId]/reorder/route.ts
// PURPOSE:   Saves organiser-defined display order for official
//            photos in an Event Moment phase gallery.
//            Accepts ordered array of photo IDs and writes
//            display_order to gallery_items.
//            Auth-gated — organiser must own the capsule.
// ARCHITECTURE: LC12 Event Moments
// BUILT BY:  AI17 · Claude Opus 4.6
// VERSION:   v2.11.42
// DATE:      4 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — POST handler ═══

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const { phaseId } = await params

    // ── Parse body ─────────────────────────────────────────────────
    const body       = await req.json()
    const capsule_id = body.capsule_id as string
    const order      = body.order      as Array<{ id: string; display_order: number }>

    if (!capsule_id || !Array.isArray(order) || order.length === 0) {
      return NextResponse.json(
        { error: 'capsule_id and order array are required' },
        { status: 400 }
      )
    }

    // ── Verify phase belongs to capsule ────────────────────────────
    const { data: phase } = await db
      .from('capsule_phases')
      .select('id, capsule_id')
      .eq('id', phaseId)
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    // ── Verify capsule exists ──────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Batch update display_order ─────────────────────────────────
    // Update each photo individually — Supabase JS client does not
    // support bulk upsert with per-row values in a single call
    const updates = order.map(({ id, display_order }) =>
      db
        .from('gallery_items')
        .update({ display_order })
        .eq('id', id)
        .eq('phase_id', phaseId)
        .eq('is_official_photography', true)
    )

    const results = await Promise.all(updates)
    const failed  = results.filter(r => r.error)

    if (failed.length > 0) {
      console.error('[reorder] Some updates failed:', failed.map(r => r.error))
      return NextResponse.json(
        { error: 'Some photos could not be reordered. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, updated: order.length })

  } catch (e: any) {
    console.error('[reorder]', e)
    return NextResponse.json(
      { error: e.message ?? 'Reorder failed' },
      { status: 500 }
    )
  }
}