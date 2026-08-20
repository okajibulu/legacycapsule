// ============================================================
// FILE PATH: app/api/display/queue/hide/route.ts
// PURPOSE:   Soft-remove or restore an item from the display
//            queue without deleting it from the capsule.
//            Uses display_queue_overrides table.
//            This is the ONLY mechanism for hiding eligible
//            content from display — never delete contributions.
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
// Body: { item_type: 'contribution' | 'gallery_item', item_id: string, hidden: boolean }

export async function POST(req: NextRequest) {
  try {
    // ── 2a. Auth ──
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

    // ── 2b. Parse body ──
    let body: { item_type?: string; item_id?: string; hidden?: boolean }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const { item_type, item_id, hidden } = body

    if (!item_type || !['contribution', 'gallery_item'].includes(item_type)) {
      return NextResponse.json(
        { error: 'item_type must be "contribution" or "gallery_item".' },
        { status: 400 }
      )
    }

    if (!item_id) {
      return NextResponse.json({ error: 'item_id is required.' }, { status: 400 })
    }

    if (typeof hidden !== 'boolean') {
      return NextResponse.json({ error: 'hidden must be a boolean.' }, { status: 400 })
    }

    // ── 2c. Upsert display_queue_overrides ──
    const { data: override, error: upsertError } = await db
      .from('display_queue_overrides')
      .upsert(
        {
          capsule_id: capsuleId,
          item_type,
          item_id,
          hidden,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'capsule_id,item_type,item_id' }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('[EDS queue/hide] Upsert failed:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update display queue.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ override, hidden })
  } catch (err) {
    console.error('[EDS queue/hide] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}