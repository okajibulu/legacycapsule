// ============================================================
// FILE PATH: app/api/display/video/list/route.ts
// PURPOSE:   Returns all ready video assets for the capsule.
//            Used by VideoAssetLibrary to populate the editor.
//            Ordered by created_at ASC (upload order).
// ARCHITECTURE: EDS / EDSVR P0 — Phase 1
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkManageAuth } from '@/lib/manageAuth'

// ═══ SECTION 1 — Supabase Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route Handler ═══

export async function GET(req: NextRequest) {
  try {
    // ── Auth ──
    const slug =
      req.headers.get('x-capsule-slug') ||
      req.nextUrl.searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Missing capsule slug' }, { status: 400 })
    }

    const auth = await checkManageAuth(slug)

    if (
      auth.accountType === 'coadmin' &&
      !auth.permissions.includes('event_display')
    ) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    let capsuleId = auth.capsuleId
    if (!capsuleId) {
      const { data: capsuleRow } = await db
        .from('capsules')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (!capsuleRow) {
        return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
      }
      capsuleId = capsuleRow.id
    }

    // ── Fetch all ready assets ──
    const { data: assets, error: assetsError } = await db
      .from('eds_video_assets')
      .select(
        'id, original_filename, title, attribution, attribution_visible, duration_seconds, orientation, file_size_bytes, status, created_at'
      )
      .eq('capsule_id', capsuleId)
      .eq('status', 'ready')
      .order('created_at', { ascending: true })

    if (assetsError) {
      console.error('[EDS video/list] DB error:', assetsError)
      return NextResponse.json({ error: 'Failed to fetch videos.' }, { status: 500 })
    }

    return NextResponse.json({ assets: assets || [] })
  } catch (err) {
    console.error('[EDS video/list] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}