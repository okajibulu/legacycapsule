// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/gallery/publication/route.ts
// PURPOSE:   Toggles include_in_publication for a contributor gallery photo.
//            Enforces a HARD CAP of 30 photos per capsule for publication.
//            When cap is reached and organiser tries to add another,
//            returns a clear error — system prevents the 31st selection.
// ARCHITECTURE: CG-SPEC-001 — Contributor Gallery
// BUILT BY:  AI25 · Claude Opus 4.6
// VERSION:   AI25v2.12.33
// DATE:      24 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Client + constants ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PUBLICATION_PHOTO_LIMIT = 30

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { photo_id, capsule_id, include } = await req.json()

    if (!photo_id || !capsule_id || typeof include !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // ── Verify photo belongs to capsule and is visible ──────────────────
    const { data: photo } = await db
      .from('contributor_gallery_photos')
      .select('id, capsule_id, status, include_in_publication')
      .eq('id', photo_id)
      .eq('capsule_id', capsule_id)
      .eq('status', 'visible')
      .maybeSingle()

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found or already removed.' }, { status: 404 })
    }

    // ── If selecting (include = true), enforce hard cap ──────────────────
    if (include) {
      const { count: currentSelected } = await db
        .from('contributor_gallery_photos')
        .select('id', { count: 'exact', head: true })
        .eq('capsule_id', capsule_id)
        .eq('status', 'visible')
        .eq('include_in_publication', true)

      const selectedCount = currentSelected ?? 0

      if (selectedCount >= PUBLICATION_PHOTO_LIMIT) {
        return NextResponse.json(
          {
            error: `Publication limit reached (${PUBLICATION_PHOTO_LIMIT} photos). Untick one to select another.`,
            limit_reached: true,
            current_count: selectedCount,
            limit: PUBLICATION_PHOTO_LIMIT,
          },
          { status: 400 }
        )
      }
    }

    // ── Update ──────────────────────────────────────────────────────────
    const { error: updateError } = await db
      .from('contributor_gallery_photos')
      .update({ include_in_publication: include })
      .eq('id', photo_id)

    if (updateError) {
      console.error('[gallery/publication] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update selection.' }, { status: 500 })
    }

    // ── Return updated count ────────────────────────────────────────────
    const { count: newCount } = await db
      .from('contributor_gallery_photos')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('status', 'visible')
      .eq('include_in_publication', true)

    return NextResponse.json({
      ok: true,
      selected_count: newCount ?? 0,
      limit: PUBLICATION_PHOTO_LIMIT,
    })

  } catch (err) {
    console.error('[gallery/publication]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
