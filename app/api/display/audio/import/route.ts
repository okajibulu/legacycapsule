// ============================================================
// FILE PATH: app/api/display/audio/import/route.ts
// PURPOSE:   Upload background music track to eds-audio-assets
//            private bucket via REST fetch. Inserts
//            eds_display_audio record. Max 3 tracks per capsule.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.28
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

const BUCKET = 'eds-audio-assets'
const MAX_TRACKS = 3
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIMES = [
  'audio/mpeg', 'audio/mp4', 'audio/aac',
  'audio/wav', 'audio/ogg', 'audio/x-m4a',
]

// ═══ SECTION 3 — Route Handler ═══

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──
    const slug = req.headers.get('x-capsule-slug') || req.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'Missing capsule slug' }, { status: 400 })

    const auth = await checkManageAuth(slug)
    if (auth.accountType === 'coadmin' && !auth.permissions.includes('event_display')) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    // ── Resolve capsule ──
    let capsuleId = auth.capsuleId
    if (!capsuleId) {
      const { data: capsuleRow } = await db.from('capsules').select('id').eq('slug', slug).maybeSingle()
      if (!capsuleRow) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
      capsuleId = capsuleRow.id
    }

    // ── Parse form ──
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // ── Validate ──
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported format. Please upload MP3, M4A, AAC, WAV, or OGG.' },
        { status: 422 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum 50MB per track.' },
        { status: 422 }
      )
    }

    // ── Track limit check ──
    const { count } = await db
      .from('eds_display_audio')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)
      .eq('status', 'ready')

    if ((count || 0) >= MAX_TRACKS) {
      return NextResponse.json(
        { error: 'Maximum ' + MAX_TRACKS + ' tracks allowed. Remove one before adding another.' },
        { status: 422 }
      )
    }

    // ── Build storage path ──
    const assetId = crypto.randomUUID()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase().slice(0, 80)
    const storagePath = capsuleId + '/' + assetId + '-' + safeName

    // ── Upload via REST fetch (SharedArrayBuffer restriction) ──
    const arrayBuffer = await file.arrayBuffer()
    const uploadUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + storagePath

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': file.type,
        'x-upsert': 'false',
      },
      body: arrayBuffer,
    })

    if (!uploadRes.ok) {
      console.error('[EDS audio/import] Upload failed:', await uploadRes.text())
      return NextResponse.json({ error: 'Failed to store audio file. Please try again.' }, { status: 500 })
    }

    // ── Get current max sort_order ──
    const { data: existing } = await db
      .from('eds_display_audio')
      .select('sort_order')
      .eq('capsule_id', capsuleId)
      .eq('status', 'ready')
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    // ── Insert DB record ──
    const { data: track, error: insertError } = await db
      .from('eds_display_audio')
      .insert({
        id: assetId,
        capsule_id: capsuleId,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        sort_order: nextOrder,
        status: 'ready',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[EDS audio/import] DB insert failed:', insertError)
      fetch(uploadUrl, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY },
      }).catch(() => {})
      return NextResponse.json({ error: 'Failed to save audio record.' }, { status: 500 })
    }

    return NextResponse.json({ track }, { status: 201 })
  } catch (err) {
    console.error('[EDS audio/import] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}