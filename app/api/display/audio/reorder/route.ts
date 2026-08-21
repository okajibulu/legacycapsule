// ============================================================
// FILE PATH: app/api/display/audio/reorder/route.ts
// PURPOSE:   Update sort_order for all audio tracks in a capsule.
//            Called after drag-to-reorder in AudioTrackPanel.
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

export async function POST(req: NextRequest) {
  try {
    const slug = req.headers.get('x-capsule-slug') || req.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'Missing capsule slug' }, { status: 400 })

    const auth = await checkManageAuth(slug)
    if (auth.accountType === 'coadmin' && !auth.permissions.includes('event_display')) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    let body: { capsule_id: string; order: { id: string; sort_order: number }[] }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    await Promise.all(
      body.order.map(({ id, sort_order }) =>
        db.from('eds_display_audio').update({ sort_order }).eq('id', id).eq('capsule_id', body.capsule_id)
      )
    )

    return NextResponse.json({ reordered: true })
  } catch (err) {
    console.error('[EDS audio/reorder] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}