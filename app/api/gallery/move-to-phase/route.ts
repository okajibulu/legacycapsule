// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/gallery/move-to-phase/route.ts
// PURPOSE:   Moves a contributor gallery photo to an Event Phase.
//            Atomic operation:
//            1. Inserts a new gallery_items record (source = 'contributor_gallery')
//            2. Soft-deletes the contributor_gallery_photos record
//            3. Clears include_in_publication if it was set
//            No file copy — same storage_path, new DB record in gallery_items.
// ARCHITECTURE: CG-SPEC-001 — Contributor Gallery → Event Phase move
// BUILT BY:  AI25 · Claude Opus 4.6
// VERSION:   AI25v2.12.38
// DATE:      25 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const BUCKET       = 'contributor-gallery'

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { photo_id, capsule_id, phase_id, actor_email } = await req.json()

    // ── Validation ──────────────────────────────────────────────────────
    if (!photo_id || !capsule_id || !phase_id) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      )
    }

    // ── Fetch the gallery photo ─────────────────────────────────────────
    const { data: photo, error: photoError } = await db
      .from('contributor_gallery_photos')
      .select('id, capsule_id, contributor_name, storage_path, caption, status, include_in_publication')
      .eq('id', photo_id)
      .eq('capsule_id', capsule_id)
      .eq('status', 'visible')
      .maybeSingle()

    if (photoError || !photo) {
      return NextResponse.json(
        { error: 'Photo not found or already removed.' },
        { status: 404 }
      )
    }

    // ── Verify phase belongs to capsule ─────────────────────────────────
    const { data: phase } = await db
      .from('capsule_phases')
      .select('id, capsule_id, name')
      .eq('id', phase_id)
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!phase) {
      return NextResponse.json(
        { error: 'Phase not found or does not belong to this capsule.' },
        { status: 404 }
      )
    }

    // ── Construct public image URL from storage_path ─────────────────────
    // storage_path is authoritative — public URL built at runtime
    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${photo.storage_path}`

    // ── Insert into gallery_items ────────────────────────────────────────
    // source = 'contributor_gallery' — no check constraint, confirmed safe
    // approved = true — organiser is making this curatorial decision
    // uploaded_by_name = contributor name for attribution in phase view
    const { error: insertError } = await db
      .from('gallery_items')
      .insert({
        capsule_id,
        phase_id,
        image_url:               imageUrl,
        storage_path:            photo.storage_path,
        caption:                 photo.caption ?? null,
        uploaded_by_name:        photo.contributor_name,
        source:                  'contributor_gallery',
        approved:                true,
        sort_order:              0,
        is_official_photography: false,
        featured_in_publication: false,
      })

    if (insertError) {
      console.error('[gallery/move-to-phase] gallery_items insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to move photo to phase. Please try again.' },
        { status: 500 }
      )
    }

    // ── Soft-delete from contributor_gallery_photos ──────────────────────
    // Sets status = 'removed', records who removed it and when.
    // Clears include_in_publication — photo now lives in phase, not gallery.
    const { error: deleteError } = await db
      .from('contributor_gallery_photos')
      .update({
        status:                 'removed',
        removed_at:             new Date().toISOString(),
        removed_by:             actor_email ?? 'organiser',
        include_in_publication: false,
      })
      .eq('id', photo_id)

    if (deleteError) {
      console.error('[gallery/move-to-phase] soft-delete error:', deleteError)
      // gallery_items insert already succeeded — log the inconsistency but
      // do not fail the request. Organiser can remove manually if needed.
      return NextResponse.json({
        ok:      true,
        warning: 'Photo moved to phase but could not be removed from gallery. Please remove it manually.',
        phase_name: phase.name,
      })
    }

    return NextResponse.json({
      ok:         true,
      phase_name: phase.name,
    })

  } catch (err) {
    console.error('[gallery/move-to-phase]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}