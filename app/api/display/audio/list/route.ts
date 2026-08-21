// ============================================================
// FILE PATH: app/api/display/audio/list/route.ts
// PURPOSE:   Returns all ready audio tracks for the capsule,
//            ordered by sort_order. Used by AudioTrackPanel.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.28
// DATE:      21 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkManageAuth } from '@/lib/manageAuth'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const slug = req.headers.get('x-capsule-slug') || req.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'Missing capsule slug' }, { status: 400 })

    const auth = await checkManageAuth(slug)
    if (auth.accountType === 'coadmin' && !auth.permissions.includes('event_display')) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    let capsuleId = auth.capsuleId
    if (!capsuleId) {
      const { data: capsuleRow } = await db.from('capsules').select('id').eq('slug', slug).maybeSingle()
      if (!capsuleRow) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
      capsuleId = capsuleRow.id
    }

    const { data: tracks, error } = await db
      .from('eds_display_audio')
      .select('id, original_filename, mime_type, duration_seconds, file_size_bytes, sort_order, status')
      .eq('capsule_id', capsuleId)
      .eq('status', 'ready')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[EDS audio/list] DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch tracks.' }, { status: 500 })
    }

    return NextResponse.json({ tracks: tracks || [] })
  } catch (err) {
    console.error('[EDS audio/list] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}