// ============================================================
// FILE PATH: app/api/display/video/import/route.ts
// PURPOSE:   Accept organiser-uploaded tribute videos, validate
//            by extension (not MIME — WhatsApp exports use
//            inconsistent MIME types), check for duplicate
//            filenames in the capsule, store in private bucket
//            via REST fetch, insert eds_video_assets record.
// ARCHITECTURE: EDS / EDSVR P0 — Phase 1
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.30
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

// ═══ SECTION 2 — Constants ═══

// Extension-based validation — MIME is unreliable for WhatsApp/phone exports
const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'MP4', 'MOV', 'm4v', 'M4V', 'mpeg', 'mpg', 'avi', 'webm']
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024 // 500MB
const BUCKET = 'eds-video-assets'

function getExtension(filename: string): string {
  return filename.split('.').pop() || ''
}

// ═══ SECTION 3 — Orientation Detection ═══

function detectOrientation(
  width: number | null,
  height: number | null
): 'landscape' | 'portrait' | 'square' | null {
  if (!width || !height) return null
  if (width > height) return 'landscape'
  if (height > width) return 'portrait'
  return 'square'
}

// ═══ SECTION 4 — Filename Sanitiser ═══

function sanitiseFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 100)
}

// ═══ SECTION 5 — Route Handler ═══

export async function POST(req: NextRequest) {
  try {
    // ── 5a. Auth ──
    const slug =
      req.headers.get('x-capsule-slug') ||
      req.nextUrl.searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Missing capsule slug' }, { status: 400 })
    }

    const auth = await checkManageAuth(slug)
    if (auth.accountType === 'coadmin' && !auth.permissions.includes('event_display')) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    // ── 5b. Resolve capsuleId ──
    let capsuleId = auth.capsuleId
    if (!capsuleId) {
      const { data: capsuleRow } = await db
        .from('capsules').select('id').eq('slug', slug).maybeSingle()
      if (!capsuleRow) {
        return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
      }
      capsuleId = capsuleRow.id
    }

    // ── 5c. Parse multipart form ──
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string | null) || null
    const attribution = (formData.get('attribution') as string | null) || null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ── 5d. Extension validation (not MIME) ──
    const ext = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: 'Unsupported file type: ' + file.name + '. Please upload MP4, MOV, or M4V files.' },
        { status: 422 }
      )
    }

    // ── 5e. File size validation ──
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = Math.round(file.size / 1024 / 1024)
      return NextResponse.json(
        { error: 'File is too large (' + sizeMB + 'MB). Maximum allowed size is 500MB.' },
        { status: 422 }
      )
    }

    // ── 5f. Duplicate detection — same filename already uploaded for this capsule ──
    const { data: existing } = await db
      .from('eds_video_assets')
      .select('id, status')
      .eq('capsule_id', capsuleId)
      .eq('original_filename', file.name)
      .neq('status', 'deleted')
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'DUPLICATE:' + file.name },
        { status: 409 }
      )
    }

    // ── 5g. Build storage path ──
    const assetId = crypto.randomUUID()
    const sanitised = sanitiseFilename(file.name)
    const storagePath = capsuleId + '/' + assetId + '-' + sanitised

    // ── 5h. Upload to Supabase Storage via REST fetch ──
    const arrayBuffer = await file.arrayBuffer()
    const uploadUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      + '/storage/v1/object/' + BUCKET + '/' + storagePath

    // Force video/mp4 content-type for WhatsApp and other inconsistent exports
    const contentType = file.type && file.type.startsWith('video/')
      ? file.type
      : 'video/mp4'

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
      body: arrayBuffer,
    })

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text()
      console.error('[EDS video import] Storage upload failed:', uploadError)
      return NextResponse.json(
        { error: 'Failed to store video file. Please try again.' },
        { status: 500 }
      )
    }

    // ── 5i. Insert eds_video_assets record ──
    const { data: asset, error: insertError } = await db
      .from('eds_video_assets')
      .insert({
        id: assetId,
        capsule_id: capsuleId,
        source_type: 'organiser_import',
        original_filename: file.name,
        storage_path: storagePath,
        mime_type: contentType,
        file_size_bytes: file.size,
        title: title || null,
        attribution: attribution || null,
        attribution_visible: true,
        orientation: detectOrientation(null, null),
        status: 'ready',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[EDS video import] DB insert failed:', insertError)
      fetch(uploadUrl, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY },
      }).catch(() => {})
      return NextResponse.json(
        { error: 'Failed to save video record. Please try again.' },
        { status: 500 }
      )
    }

    // ── 5j. Audit log — fire and forget ──
    void (async () => {
      try {
        await db.from('eds_video_reel_audit').insert({
          capsule_id: capsuleId,
          asset_id: assetId,
          action: 'asset_imported',
          detail: { filename: file.name, size_bytes: file.size, mime_type: contentType },
          performed_by: auth.accountType || 'organiser',
        })
      } catch { /* non-blocking */ }
    })()

    return NextResponse.json({ asset }, { status: 201 })
  } catch (err) {
    console.error('[EDS video import] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}