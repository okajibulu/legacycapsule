// ============================================================
// FILE PATH: app/api/display/video/import/route.ts
// PURPOSE:   Accept organiser-uploaded tribute videos, validate,
//            store in eds-video-assets private bucket via REST
//            fetch, and create eds_video_assets record.
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

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime']
const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.MOV', '.MP4']
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024 // 500MB — adjust when FD-4 confirmed
const BUCKET = 'eds-video-assets'

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    // ── 5a. Extract slug from header or query ──
    const slug =
      req.headers.get('x-capsule-slug') ||
      req.nextUrl.searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing capsule slug' },
        { status: 400 }
      )
    }

    // ── 5b. Auth check ──
    // checkManageAuth always returns — falls back to 'organiser' if no cookie
    const auth = await checkManageAuth(slug)

    // Co-admin must have event_display permission
    if (
      auth.accountType === 'coadmin' &&
      !auth.permissions.includes('event_display')
    ) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    // capsuleId comes from auth result for FRFA/Co-admin.
    // For organiser path, auth.capsuleId is null — look up by slug.
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

    // ── 5c. Parse multipart form ──
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string | null) || null
    const attribution = (formData.get('attribution') as string | null) || null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ── 5d. MIME type validation ──
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Please upload MP4 or MOV files.`,
        },
        { status: 422 }
      )
    }

    // ── 5e. Extension validation ──
    const ext = '.' + file.name.split('.').pop()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file extension: ${ext}. Please upload .mp4 or .mov files.`,
        },
        { status: 422 }
      )
    }

    // ── 5f. File size validation ──
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = Math.round(file.size / 1024 / 1024)
      return NextResponse.json(
        {
          error: `File is too large (${sizeMB}MB). Maximum allowed size is 500MB.`,
        },
        { status: 422 }
      )
    }

    // ── 5g. Idempotency check ──
    // Prevent duplicate uploads of same filename within 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: existing } = await db
      .from('eds_video_assets')
      .select('id, status')
      .eq('capsule_id', capsuleId)
      .eq('original_filename', file.name)
      .eq('status', 'uploading')
      .gte('created_at', tenMinutesAgo)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        {
          error:
            'This file is already being uploaded. Please wait a moment and try again.',
        },
        { status: 409 }
      )
    }

    // ── 5h. Build storage path ──
    const assetId = crypto.randomUUID()
    const sanitised = sanitiseFilename(file.name)
    const storagePath = `${capsuleId}/${assetId}-${sanitised}`

    // ── 5i. Upload to Supabase Storage via REST fetch ──
    // Must use direct REST — Supabase JS client cannot upload on Vercel
    // due to SharedArrayBuffer restrictions
    const arrayBuffer = await file.arrayBuffer()
    const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': file.type,
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

    // ── 5j. Insert eds_video_assets record ──
    const { data: asset, error: insertError } = await db
      .from('eds_video_assets')
      .insert({
        id: assetId,
        capsule_id: capsuleId,
        source_type: 'organiser_import',
        original_filename: file.name,
        storage_path: storagePath,
        mime_type: file.type,
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
      // Attempt storage cleanup — fire and forget
      fetch(uploadUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }).catch(() => {})
      return NextResponse.json(
        { error: 'Failed to save video record. Please try again.' },
        { status: 500 }
      )
    }

    // ── 5k. Audit log — fire and forget, never throws ──
    void (async () => {
      try {
        await db.from('eds_video_reel_audit').insert({
          capsule_id: capsuleId,
          asset_id: assetId,
          action: 'asset_imported',
          detail: {
            filename: file.name,
            size_bytes: file.size,
            mime_type: file.type,
          },
          performed_by: auth.accountType || 'organiser',
        })
      } catch {
        // non-blocking — audit failure never fails the request
      }
    })()

    // ── 5l. Return asset record ──
    return NextResponse.json({ asset }, { status: 201 })
  } catch (err) {
    console.error('[EDS video import] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}