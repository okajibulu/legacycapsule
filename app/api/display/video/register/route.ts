// ============================================================
// FILE PATH: app/api/display/video/register/route.ts
// PURPOSE:   Called by browser after direct Supabase upload
//            completes. Creates the eds_video_assets DB record.
//            No file data passes through Vercel — only metadata.
// ARCHITECTURE: EDS / EDSVR P0 — Phase 1
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.31
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

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──
    const slug = req.headers.get('x-capsule-slug') || req.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'Missing capsule slug' }, { status: 400 })

    const auth = await checkManageAuth(slug)
    if (auth.accountType === 'coadmin' && !auth.permissions.includes('event_display')) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    // ── Parse body ──
    const body = await req.json()
    const {
      asset_id,
      capsule_id,
      storage_path,
      original_filename,
      mime_type,
      file_size_bytes,
      duration_seconds,
      orientation,
      title,
      attribution,
    } = body

    if (!asset_id || !capsule_id || !storage_path || !original_filename) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Verify the file actually exists in storage ──
    const { data: fileData, error: fileError } = await db.storage
      .from('eds-video-assets')
      .list(capsule_id + '/', { search: asset_id })

    if (fileError || !fileData?.length) {
      console.error('[EDS video/register] File not found in storage:', fileError)
      return NextResponse.json(
        { error: 'Upload not found in storage. Please try again.' },
        { status: 404 }
      )
    }

    // ── Insert DB record ──
    const { data: asset, error: insertError } = await db
      .from('eds_video_assets')
      .insert({
        id: asset_id,
        capsule_id,
        source_type: 'organiser_import',
        original_filename,
        storage_path,
        mime_type: mime_type || 'video/mp4',
        file_size_bytes: file_size_bytes || null,
        title: title || null,
        attribution: attribution || null,
        attribution_visible: true,
        orientation: null,
        status: 'ready',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[EDS video/register] DB insert failed:', insertError)
      return NextResponse.json({ error: 'Failed to save video record.' }, { status: 500 })
    }

    // ── Audit log — fire and forget ──
    void (async () => {
      try {
        await db.from('eds_video_reel_audit').insert({
          capsule_id,
          asset_id,
          action: 'asset_imported',
          detail: { filename: original_filename, size_bytes: file_size_bytes, mime_type },
          performed_by: auth.accountType || 'organiser',
        })
      } catch { /* non-blocking */ }
    })()

    return NextResponse.json({ asset }, { status: 201 })
  } catch (err) {
    console.error('[EDS video/register] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}