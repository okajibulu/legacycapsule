// ============================================================
// FILE PATH: app/api/display/video/presign/route.ts
// PURPOSE:   Generates a Supabase signed upload URL for direct
//            browser-to-storage upload. File never touches
//            Vercel — bypasses the 4.5MB payload limit entirely.
//            Returns signed URL + storage path for the browser
//            to upload directly to Supabase eds-video-assets bucket.
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

const BUCKET = 'eds-video-assets'
const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'MP4', 'MOV', 'm4v', 'M4V', 'mpeg', 'mpg', 'avi', 'webm']
const MAX_SIZE_BYTES = 500 * 1024 * 1024

function getExtension(filename: string): string {
  return filename.split('.').pop() || ''
}

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

    let capsuleId = auth.capsuleId
    if (!capsuleId) {
      const { data: capsuleRow } = await db.from('capsules').select('id').eq('slug', slug).maybeSingle()
      if (!capsuleRow) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
      capsuleId = capsuleRow.id
    }

    // ── Parse request ──
    const body = await req.json()
    const { filename, file_size, mime_type } = body

    if (!filename) return NextResponse.json({ error: 'filename is required' }, { status: 400 })

    // ── Extension validation ──
    const ext = getExtension(filename)
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: 'Unsupported format: ' + filename + '. Please upload MP4, MOV, or M4V files.' },
        { status: 422 }
      )
    }

    // ── Size validation ──
    if (file_size && file_size > MAX_SIZE_BYTES) {
      const mb = Math.round(file_size / 1024 / 1024)
      return NextResponse.json(
        { error: 'File too large (' + mb + 'MB). Maximum 500MB per file.' },
        { status: 422 }
      )
    }

    // ── Duplicate check ──
    const { data: existing } = await db
      .from('eds_video_assets')
      .select('id')
      .eq('capsule_id', capsuleId)
      .eq('original_filename', filename)
      .neq('status', 'deleted')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'DUPLICATE:' + filename }, { status: 409 })
    }

    // ── Build storage path ──
    const assetId = crypto.randomUUID()
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase().slice(0, 100)
    const storagePath = capsuleId + '/' + assetId + '-' + safeName

    // ── Generate signed upload URL (5 minute expiry — enough for upload) ──
    const { data: signedData, error: signError } = await db.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (signError || !signedData) {
      console.error('[EDS video/presign] Signed URL error:', signError)
      return NextResponse.json({ error: 'Failed to prepare upload. Please try again.' }, { status: 500 })
    }

    // ── Return signed URL + metadata for browser to use ──
    return NextResponse.json({
      signed_url: signedData.signedUrl,
      token: signedData.token,
      storage_path: storagePath,
      asset_id: assetId,
      capsule_id: capsuleId,
      content_type: mime_type && mime_type.startsWith('video/') ? mime_type : 'video/mp4',
    })
  } catch (err) {
    console.error('[EDS video/presign] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}