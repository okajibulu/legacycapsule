// ============================================================
// FILE PATH: app/api/event-moments/[phaseId]/photos/[photoId]/route.ts
// PURPOSE:   Organiser-only endpoint to delete a single photo
//            from an Event Moment phase gallery.
//            Removes gallery_items row + storage file.
//            Verifies photo belongs to the phase and capsule.
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

// ═══ SECTION 2 — DELETE handler ═══

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ phaseId: string; photoId: string }> }
) {
  try {
    const { phaseId, photoId } = await params

    const body       = await req.json()
    const capsule_id = body.capsule_id as string

    if (!capsule_id) {
      return NextResponse.json(
        { error: 'capsule_id is required' },
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

    // ── Fetch the photo record ─────────────────────────────────────
    const { data: photo } = await db
      .from('gallery_items')
      .select('id, storage_path, capsule_id')
      .eq('id', photoId)
      .eq('phase_id', phaseId)
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // ── Delete from storage via REST ───────────────────────────────
    if (photo.storage_path) {
      const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      await fetch(
        `${supabaseUrl}/storage/v1/object/tribute-photos/${photo.storage_path}`,
        {
          method:  'DELETE',
          headers: { 'Authorization': `Bearer ${serviceRoleKey}` },
        }
      )
    }

    // ── Delete gallery_items row ───────────────────────────────────
    const { error: deleteError } = await db
      .from('gallery_items')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      console.error('[photos/DELETE]', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete photo. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, deleted: photoId })

  } catch (e: any) {
    console.error('[photos/DELETE]', e)
    return NextResponse.json(
      { error: e.message ?? 'Delete failed' },
      { status: 500 }
    )
  }
}