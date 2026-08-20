// ============================================================
// FILE PATH: app/api/display/video/[id]/signed-url/route.ts
// PURPOSE:   Generate a signed URL for a video asset in the
//            private eds-video-assets bucket. Used by
//            VideoAssetLibrary (preview) and VideoReelPlayer
//            (playback). TTL is generous enough to cover full
//            reel duration plus a 2-hour buffer.
// ARCHITECTURE: EDS / EDSVR P0 — Phase 1
// BUILT BY:  AI24 · Claude Sonnet 4.6
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

// ═══ SECTION 2 — Constants ═══

const BUCKET = 'eds-video-assets'

// TTL in seconds:
// preview = 1 hour (library browsing)
// playback = 4 hours (covers longest realistic reel + 2hr buffer)
const TTL_PREVIEW = 60 * 60        // 1 hour
const TTL_PLAYBACK = 4 * 60 * 60   // 4 hours

// ═══ SECTION 3 — Route Handler ═══

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params

    // ── 3a. Extract slug ──
    const slug =
      req.headers.get('x-capsule-slug') ||
      req.nextUrl.searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing capsule slug' },
        { status: 400 }
      )
    }

    // ── 3b. Auth check ──
    const auth = await checkManageAuth(slug)

    if (
      auth.accountType === 'coadmin' &&
      !auth.permissions.includes('event_display')
    ) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    // ── 3c. Resolve capsuleId ──
    let capsuleId = auth.capsuleId
    if (!capsuleId) {
      const { data: capsuleRow } = await db
        .from('capsules')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (!capsuleRow) {
        return NextResponse.json(
          { error: 'Capsule not found' },
          { status: 404 }
        )
      }
      capsuleId = capsuleRow.id
    }

    // ── 3d. Fetch asset — verify it belongs to this capsule ──
    const { data: asset, error: assetError } = await db
      .from('eds_video_assets')
      .select('id, storage_path, status, duration_seconds')
      .eq('id', assetId)
      .eq('capsule_id', capsuleId)
      .eq('status', 'ready')
      .maybeSingle()

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Video asset not found' },
        { status: 404 }
      )
    }

    // ── 3e. Determine TTL from query param ──
    const purpose = req.nextUrl.searchParams.get('purpose') || 'preview'
    const ttl = purpose === 'playback' ? TTL_PLAYBACK : TTL_PREVIEW

    // ── 3f. Generate signed URL ──
    const { data: signed, error: signError } = await db.storage
      .from(BUCKET)
      .createSignedUrl(asset.storage_path, ttl)

    if (signError || !signed?.signedUrl) {
      console.error('[EDS signed-url] Failed to generate:', signError)
      return NextResponse.json(
        { error: 'Failed to generate video URL. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: signed.signedUrl,
      asset_id: assetId,
      duration_seconds: asset.duration_seconds,
      expires_in_seconds: ttl,
    })
  } catch (err) {
    console.error('[EDS signed-url] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}