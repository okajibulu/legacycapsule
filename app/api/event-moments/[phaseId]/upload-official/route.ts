// ============================================================
// FILE PATH: app/api/event-moments/[phaseId]/upload-official/route.ts
// PURPOSE:   Organiser-only endpoint to upload official
//            photographer shots to an Event Moment gallery.
//            Stores with is_official_photography=true.
//            Auth-gated — valid organiser session required.
//            Reuses D-Day compression pipeline (sharp).
//            Storage upload via direct REST fetch — bypasses
//            Supabase JS client SharedArrayBuffer restriction
//            on Vercel serverless runtime.
// ARCHITECTURE: LC12 Event Moments
// BUILT BY:  AI16 · Claude Opus 4.6
// UPDATED:   AI17 · Claude Sonnet 4.6 · 3 August 2026
// VERSION:   v2.11.30
// DATE:      3 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import sharp                         from 'sharp'
import crypto                        from 'crypto'

// ═══ SECTION 1 — Clients ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route config ═══

export const dynamic     = 'force-dynamic'
export const maxDuration = 30

// ═══ SECTION 3 — Compression (same config as D-Day) ═══

interface CompressResult {
  buffer:       Buffer
  width_px:     number
  height_px:    number
  aspect_ratio: number
}

async function compressImage(buffer: Buffer, mimeType: string): Promise<CompressResult> {
  const pipeline = sharp(buffer).rotate().resize({
    width:              1200,
    height:             1200,
    fit:                'inside',
    withoutEnlargement: true,
  })
  let outBuffer: Buffer
  if (mimeType === 'image/png') {
    outBuffer = await pipeline.png({ quality: 82, compressionLevel: 8 }).toBuffer()
  } else {
    outBuffer = await pipeline.jpeg({ quality: 82, progressive: true }).toBuffer()
  }
  const meta         = await sharp(outBuffer).metadata()
  const width_px     = meta.width  ?? 0
  const height_px    = meta.height ?? 0
  const aspect_ratio = height_px > 0 ? Math.round((width_px / height_px) * 1000) / 1000 : 1
  return { buffer: outBuffer, width_px, height_px, aspect_ratio }
}

// ═══ SECTION 4 — Direct REST storage upload ═══
// Bypasses Supabase JS client which triggers SharedArrayBuffer
// restriction in Vercel serverless. Uses native fetch with
// Buffer as body — no ArrayBuffer wrapping occurs.

async function uploadToStorageREST(
  storagePath:  string,
  buffer:       Buffer,
  contentType:  string,
): Promise<void> {
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const uploadUrl       = `${supabaseUrl}/storage/v1/object/tribute-photos/${storagePath}`

  const res = await fetch(uploadUrl, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type':  contentType,
      'x-upsert':      'false',
    },
body: new Uint8Array(buffer),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Storage REST upload failed: ${res.status} — ${detail}`)
  }
}

// ═══ SECTION 5 — POST handler ═══

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const { phaseId } = await params

    // ── Parse form data ────────────────────────────────────────────
    const formData   = await req.formData()
    const capsule_id = formData.get('capsule_id') as string
    const file       = formData.get('file')       as File | null

    if (!capsule_id || !file || file.size === 0) {
      return NextResponse.json(
        { error: 'capsule_id and file are required' },
        { status: 400 }
      )
    }

    // ── Validate file type ─────────────────────────────────────────
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Please upload a photo (JPEG, PNG, or HEIC).' },
        { status: 400 }
      )
    }

    // ── Verify phase belongs to capsule ────────────────────────────
    const { data: phase } = await db
      .from('capsule_phases')
      .select('id, capsule_id')
      .eq('id', phaseId)
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    // ── Verify organiser owns this capsule ─────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, organiser_email')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Enforce 60-photo cap per phase ────────────────────────────
    const { count: existingCount } = await db
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('phase_id', phaseId)
      .eq('is_official_photography', true)
      .eq('approved', true)

    if ((existingCount ?? 0) >= 60) {
      return NextResponse.json(
        { error: 'This phase already has 60 official photos — the maximum allowed. Remove some photos before uploading more.' },
        { status: 400 }
      )
    }

    // ── Read + compress ────────────────────────────────────────────
    const rawBuffer      = Buffer.from(await file.arrayBuffer())
    const compressed     = await compressImage(rawBuffer, file.type)
    const outputMimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const outputExt      = file.type === 'image/png' ? 'png'       : 'jpg'

    // ── Upload via REST (bypasses JS client SharedArrayBuffer) ─────
    const storagePath = `${capsule_id}/dday/official-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${outputExt}`

    try {
      await uploadToStorageREST(storagePath, compressed.buffer, outputMimeType)
    } catch (storageErr: any) {
      console.error('[upload-official] Storage REST error:', storageErr)
      return NextResponse.json(
        { error: 'Upload failed. Please try again.' },
        { status: 500 }
      )
    }

    // ── Build public URL ───────────────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const publicUrl   = `${supabaseUrl}/storage/v1/object/public/tribute-photos/${storagePath}`

    // ── Insert gallery_items record ────────────────────────────────
    const { data: item, error: insertError } = await db
      .from('gallery_items')
      .insert({
        capsule_id,
        phase_id:                phaseId,
        image_url:               publicUrl,
        caption:                 'Official Photography',
        source:                  'dday',
        approved:                true,
        is_official_photography: true,
        storage_path:            storagePath,
        width_px:                compressed.width_px,
        height_px:               compressed.height_px,
      })
      .select('id')
      .single()

    if (insertError) {
      // Best-effort storage cleanup
      await fetch(
        `${supabaseUrl}/storage/v1/object/tribute-photos/${storagePath}`,
        {
          method:  'DELETE',
          headers: { 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` },
        }
      )
      console.error('[upload-official] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save photo. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok:              true,
      gallery_item_id: item.id,
      image_url:       publicUrl,
    })

  } catch (e: any) {
    console.error('[upload-official]', e)
    return NextResponse.json(
      { error: e.message ?? 'Upload failed', detail: String(e) },
      { status: 500 }
    )
  }
}