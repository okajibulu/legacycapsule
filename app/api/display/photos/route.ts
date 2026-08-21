// ============================================================
// FILE PATH: app/api/display/photos/route.ts
// PURPOSE:   Returns approved gallery photos eligible for
//            display — not hidden, not official photography.
//            Used by VideoReelEditor and DisplayPhotoSelector.
//            image_url is public — no signed URL needed.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.29
// DATE:      21 August 2026
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

    // ── Fetch all eligible photos ──
    const { data: photos, error } = await db
      .from('gallery_items')
      .select('id, image_url, caption, uploaded_by_name, created_at')
      .eq('capsule_id', capsuleId)
      .eq('source', 'dday')
      .eq('approved', true)
      .eq('is_official_photography', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[EDS display/photos] DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch photos.' }, { status: 500 })
    }

    // ── Fetch hidden overrides ──
    const { data: hiddenItems } = await db
      .from('display_queue_overrides')
      .select('item_id, hidden')
      .eq('capsule_id', capsuleId)
      .eq('item_type', 'gallery_item')

    const hiddenMap = new Map((hiddenItems || []).map((h: { item_id: string; hidden: boolean }) => [h.item_id, h.hidden]))

    // ── Annotate with selection state ──
    const annotated = (photos || []).map((p: {
      id: string; image_url: string; caption: string | null
      uploaded_by_name: string | null; created_at: string
    }) => ({
      ...p,
      // Default: included (hidden = false or no override)
      included: hiddenMap.has(p.id) ? !hiddenMap.get(p.id) : true,
    }))

    return NextResponse.json({
      photos: annotated,
      total: annotated.length,
      included: annotated.filter((p: { included: boolean }) => p.included).length,
    })
  } catch (err) {
    console.error('[EDS display/photos] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}