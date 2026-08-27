// ============================================================
// FILE PATH: app/api/display/export/status/route.ts
// PURPOSE:   Returns last export timestamp and count of new
//            approved content since that export. Used by
//            DisplayExportPanel to show re-export indicator.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.55
// DATE:      27 August 2026
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
      const { data: capsuleRow } = await db
        .from('capsules').select('id').eq('slug', slug).maybeSingle()
      if (!capsuleRow) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
      capsuleId = capsuleRow.id
    }

    // ── Fetch last offline HTML export ──
    const { data: lastExport } = await db
      .from('display_exports')
      .select('created_at, voice_count, story_count, photo_count')
      .eq('capsule_id', capsuleId)
      .eq('export_type', 'html_offline')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastExport) {
      return NextResponse.json({ last_export: null, new_since_export: null })
    }

    const lastExportAt = lastExport.created_at

    // ── Count new approved contributions since last export ──
    const { count: newVoices } = await db
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('story_topic_id', null)
      .gt('created_at', lastExportAt)

    const { count: newStories } = await db
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .not('story_topic_id', 'is', null)
      .gt('created_at', lastExportAt)

    const { count: newPhotos } = await db
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)
      .eq('source', 'dday')
      .eq('approved', true)
      .eq('is_official_photography', false)
      .gt('created_at', lastExportAt)

    const totalNew = (newVoices || 0) + (newStories || 0) + (newPhotos || 0)

    return NextResponse.json({
      last_export: {
        at: lastExportAt,
        voice_count: lastExport.voice_count,
        story_count: lastExport.story_count,
        photo_count: lastExport.photo_count,
      },
      new_since_export: {
        voices: newVoices || 0,
        stories: newStories || 0,
        photos: newPhotos || 0,
        total: totalNew,
      },
    })
  } catch (err) {
    console.error('[EDS export/status] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}