// ============================================================
// FILE PATH: app/api/display/reel/export-urls/route.ts
// PURPOSE:   Returns signed URLs + metadata for all items in
//            the active reel. Used by VideoReelZipExport to
//            download videos directly from Supabase for
//            client-side zip packaging. No file data passes
//            through Vercel — only signed URLs and metadata.
// ARCHITECTURE: EDS / EDSVR P0 — Phase 1
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.33
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

const BUCKET = 'eds-video-assets'

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

    // ── Fetch active reel ──
    const { data: reel } = await db
      .from('eds_video_reels')
      .select('id, title')
      .eq('capsule_id', capsuleId)
      .maybeSingle()

    if (!reel) {
      return NextResponse.json(
        { error: 'No reel found. Please save a reel first.' },
        { status: 404 }
      )
    }

    // ── Fetch reel items with asset data ──
    const { data: items } = await db
      .from('eds_video_reel_items')
      .select(`
        id, sort_order, display_title, attribution,
        asset:eds_video_assets(id, storage_path, original_filename, mime_type, duration_seconds)
      `)
      .eq('reel_id', reel.id)
      .order('sort_order', { ascending: true })

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No videos in reel.' }, { status: 404 })
    }

    // ── Generate signed URLs (4 hour TTL — enough for download + packaging) ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportItems = await Promise.all(
      (items as any[]).map(async (item: {
        id: string
        sort_order: number
        display_title: string | null
        attribution: string | null
        asset: {
          id: string
          storage_path: string
          original_filename: string
          mime_type: string
          duration_seconds: number | null
        } | null
      }, index: number) => {
        if (!item.asset) return null

        const { data: signed } = await db.storage
          .from(BUCKET)
          .createSignedUrl(item.asset.storage_path, 14400) // 4 hours

        // Safe filename for zip: padded index + sanitised original name
        const safeName = (index + 1).toString().padStart(2, '0')
          + '-'
          + item.asset.original_filename
              .replace(/[^a-zA-Z0-9._-]/g, '-')
              .toLowerCase()

        return {
          sort_order: item.sort_order,
          display_title: item.display_title,
          attribution: item.attribution,
          filename: safeName,
          original_filename: item.asset.original_filename,
          mime_type: item.asset.mime_type,
          duration_seconds: item.asset.duration_seconds,
          signed_url: signed?.signedUrl || null,
        }
      })
    )

    const validItems = exportItems.filter(Boolean)

    return NextResponse.json({
      reel_title: reel.title,
      items: validItems,
    })
  } catch (err) {
    console.error('[EDS reel/export-urls] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}