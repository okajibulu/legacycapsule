// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/gallery/remove/route.ts
// PURPOSE:   Admin soft-deletes a contributor gallery photo.
//            Sets status = 'removed', records removed_by + removed_at.
//            Also clears include_in_publication if it was selected.
// ARCHITECTURE: CG-SPEC-001 — Contributor Gallery
// BUILT BY:  AI25 · Claude Opus 4.6
// VERSION:   AI25v2.12.33
// DATE:      24 August 2026
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
    const { photo_id, capsule_id, actor_email } = await req.json()

    if (!photo_id || !capsule_id) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // ── Verify photo belongs to capsule ──────────────────────────────────
    const { data: photo } = await db
      .from('contributor_gallery_photos')
      .select('id, capsule_id, status')
      .eq('id', photo_id)
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found.' }, { status: 404 })
    }

    if (photo.status === 'removed') {
      return NextResponse.json({ ok: true, already_removed: true })
    }

    // ── Soft delete ─────────────────────────────────────────────────────
    const { error: updateError } = await db
      .from('contributor_gallery_photos')
      .update({
        status:                 'removed',
        removed_at:             new Date().toISOString(),
        removed_by:             actor_email ?? 'organiser',
        include_in_publication: false,
      })
      .eq('id', photo_id)

    if (updateError) {
      console.error('[gallery/remove] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to remove photo.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[gallery/remove]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
