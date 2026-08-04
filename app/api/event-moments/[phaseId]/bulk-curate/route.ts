// ============================================================
// FILE PATH: app/api/event-moments/[phaseId]/bulk-curate/route.ts
// PURPOSE:   Organiser bulk action endpoint for Event Moment
//            photos. Supports bulk: feature, unfeature, hide,
//            show, delete across multiple photo IDs.
//            Verifies all photos belong to the phase + capsule.
// ARCHITECTURE: LC12 Event Moments
// BUILT BY:  AI17 · Claude Opus 4.6
// VERSION:   v2.11.45
// DATE:      4 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — PATCH handler ═══

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const { phaseId } = await params

    const body       = await req.json()
    const capsule_id = body.capsule_id as string
    const photo_ids  = body.photo_ids  as string[]
    const action     = body.action     as string

    if (!capsule_id || !Array.isArray(photo_ids) || photo_ids.length === 0 || !action) {
      return NextResponse.json(
        { error: 'capsule_id, photo_ids array, and action are required' },
        { status: 400 }
      )
    }

    const validActions = ['feature', 'unfeature', 'hide', 'show', 'delete']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // ── Verify phase belongs to capsule ────────────────────────────
    const { data: phase } = await db
      .from('capsule_phases')
      .select('id')
      .eq('id', phaseId)
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    // ── Handle delete separately — needs storage cleanup ──────────
    if (action === 'delete') {
      const { data: photos } = await db
        .from('gallery_items')
        .select('id, storage_path')
        .in('id', photo_ids)
        .eq('phase_id', phaseId)
        .eq('capsule_id', capsule_id)

      if (photos && photos.length > 0) {
        const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        // Delete storage files in parallel
        await Promise.all(
          photos
            .filter(p => p.storage_path)
            .map(p =>
              fetch(
                `${supabaseUrl}/storage/v1/object/tribute-photos/${p.storage_path}`,
                {
                  method:  'DELETE',
                  headers: { 'Authorization': `Bearer ${serviceRoleKey}` },
                }
              )
            )
        )

        // Delete DB rows
        const { error: deleteError } = await db
          .from('gallery_items')
          .delete()
          .in('id', photo_ids)
          .eq('phase_id', phaseId)
          .eq('capsule_id', capsule_id)

        if (deleteError) {
          console.error('[bulk-curate/delete]', deleteError)
          return NextResponse.json(
            { error: 'Some photos could not be deleted.' },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({ ok: true, action, affected: photos?.length ?? 0 })
    }

    // ── Handle feature/unfeature/hide/show ─────────────────────────
    const updatePayload: Record<string, boolean> = {
      feature:   { featured_in_publication: true  },
      unfeature: { featured_in_publication: false },
      hide:      { approved: false },
      show:      { approved: true  },
    }[action] as any

    const { error: updateError } = await db
      .from('gallery_items')
      .update(updatePayload)
      .in('id', photo_ids)
      .eq('phase_id', phaseId)
      .eq('capsule_id', capsule_id)

    if (updateError) {
      console.error('[bulk-curate]', updateError)
      return NextResponse.json(
        { error: 'Bulk action failed. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, action, affected: photo_ids.length })

  } catch (e: any) {
    console.error('[bulk-curate]', e)
    return NextResponse.json(
      { error: e.message ?? 'Bulk action failed' },
      { status: 500 }
    )
  }
}