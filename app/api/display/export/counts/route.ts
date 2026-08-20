// ============================================================
// FILE PATH: app/api/display/export/counts/route.ts
// PURPOSE:   Returns approved content counts for the capsule.
//            Used by DisplayExportPanel to show organiser
//            how much content will be in the export before
//            they trigger it. Voices, stories, photos.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.26
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

    // ── 2b. Resolve capsuleId ──
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

    // ── 2c. Fetch hidden item IDs to exclude ──
    const { data: hiddenItems } = await db
      .from('display_queue_overrides')
      .select('item_id')
      .eq('capsule_id', capsuleId)
      .eq('hidden', true)

    const hiddenIds = new Set((hiddenItems || []).map((h) => h.item_id))

    // ── 2d. Count approved voices ──
    // Voices: contributions with status=approved and story_topic_id IS NULL
    const { data: voices } = await db
      .from('contributions')
      .select('id')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('story_topic_id', null)

    const voiceCount = (voices || []).filter((v) => !hiddenIds.has(v.id)).length

    // ── 2e. Count approved stories ──
    // Stories: contributions with story_topic_id IS NOT NULL
    const { data: stories } = await db
      .from('contributions')
      .select('id')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .not('story_topic_id', 'is', null)

    const storyCount = (stories || []).filter((s) => !hiddenIds.has(s.id)).length

    // ── 2f. Count eligible D-Day photos ──
    // Photos: gallery_items from dday source, approved, not official photography
    const { data: photos } = await db
      .from('gallery_items')
      .select('id')
      .eq('capsule_id', capsuleId)
      .eq('source', 'dday')
      .eq('approved', true)
      .eq('is_official_photography', false)

    const photoCount = (photos || []).filter((p) => !hiddenIds.has(p.id)).length

    return NextResponse.json({
      counts: {
        voices: voiceCount,
        stories: storyCount,
        photos: photoCount,
        total: voiceCount + storyCount + photoCount,
      },
    })
  } catch (err) {
    console.error('[EDS export/counts] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}