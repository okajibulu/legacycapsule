// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/gallery/reorder/route.ts
// PURPOSE:   Persists drag-and-drop reorder of contributor gallery photos.
//            Accepts ordered array of photo IDs, updates sort_order in batch.
//            Validates all photos belong to the capsule before updating.
// ARCHITECTURE: CG-SPEC-001 — Contributor Gallery
// BUILT BY:  AI25 · Claude Sonnet 4.6
// VERSION:   AI25v2.12.43
// DATE:      25 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, order } = await req.json()
    // order: Array<{ id: string; sort_order: number }>

    if (!capsule_id || !Array.isArray(order) || order.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      )
    }

    // ── Validate all IDs belong to this capsule ──────────────────────
    const ids = order.map((o: { id: string }) => o.id)

    const { data: existing } = await db
      .from('contributor_gallery_photos')
      .select('id')
      .eq('capsule_id', capsule_id)
      .in('id', ids)

    if (!existing || existing.length !== ids.length) {
      return NextResponse.json(
        { error: 'One or more photos do not belong to this capsule.' },
        { status: 400 }
      )
    }

    // ── Batch update sort_order ──────────────────────────────────────
    // Sequential updates — safe for max 30 photos (publication cap)
    const updates = await Promise.all(
      order.map(({ id, sort_order }: { id: string; sort_order: number }) =>
        db
          .from('contributor_gallery_photos')
          .update({ sort_order })
          .eq('id', id)
          .eq('capsule_id', capsule_id)
      )
    )

    const failed = updates.filter(r => r.error).length
    if (failed > 0) {
      console.error(`[gallery/reorder] ${failed} updates failed`)
      return NextResponse.json(
        { error: 'Some photos could not be reordered. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[gallery/reorder]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}