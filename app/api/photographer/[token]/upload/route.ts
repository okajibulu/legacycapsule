// ============================================================
// FILE PATH: app/api/photographer/[token]/upload/route.ts
// PURPOSE:   Photographer uploads official photos via token.
//            Validates token, enforces 30-photo cap,
//            compresses, stores with is_official_photography=true.
//            Stores width_px, height_px, aspect_ratio.
// ARCHITECTURE: LC12 Event Moments Spec
// BUILT BY:  AI16 · Claude Opus 4.6
// UPDATED:   AI26 · Claude Sonnet 4.6 · 27 August 2026
//            — Cap raised 30→60, shared pool (organiser + photographer)
//            — Cap query: removed source filter, added approved=true
//            — SHA-256 deduplication: skip already-uploaded photos
//            — file_hash stored on insert
// VERSION:   v2.11.19
// DATE:      2 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import sharp                         from 'sharp'
import crypto                        from 'crypto'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic     = 'force-dynamic'
export const maxDuration = 30

// ═══ SECTION 1 — Compression ═══

interface CompressResult {
  buffer:       Buffer
  width_px:     number
  height_px:    number
  aspect_ratio: number
}

async function compressImage(buffer: Buffer, mimeType: string): Promise<CompressResult> {
  const pipeline = sharp(buffer).resize({
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
  const aspect_ratio = height_px > 0
    ? Math.round((width_px / height_px) * 1000) / 1000
    : 1

  return { buffer: outBuffer, width_px, height_px, aspect_ratio }
}

// ═══ SECTION 2 — POST handler ═══

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // ── Validate token ─────────────────────────────────────────────────
    const { data: phase } = await db
      .from('capsule_phases')
      .select('id, capsule_id, photographer_token_expires_at')
      .eq('photographer_token', token)
      .is('deleted_at', null)
      .maybeSingle()

    if (!phase) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
    }

    if (new Date(phase.photographer_token_expires_at!) < new Date()) {
      return NextResponse.json({ error: 'This upload link has expired' }, { status: 410 })
    }

    // ── Parse form data ────────────────────────────────────────────────
    const formData = await req.formData()
    const file     = formData.get('file') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'A photo is required' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Please upload a photo (JPEG, PNG, WEBP, or HEIC).' },
        { status: 400 }
      )
    }

    // ── Read raw buffer + dedup check ─────────────────────────────
    const rawBuffer = Buffer.from(await file.arrayBuffer())
    const fileHash  = crypto.createHash('sha256').update(rawBuffer).digest('hex')

    const { data: existingPhoto } = await db
      .from('gallery_items')
      .select('id, image_url')
      .eq('phase_id', phase.id)
      .eq('file_hash', fileHash)
      .eq('is_official_photography', true)
      .maybeSingle()

    if (existingPhoto) {
      return NextResponse.json({
        ok:        true,
        duplicate: true,
        photo_id:  existingPhoto.id,
        image_url: existingPhoto.image_url,
        message:   'Photo already uploaded — skipped.',
      })
    }

    // ── Enforce 60-photo cap (shared pool: organiser + photographer) ───
    const { count: existingCount } = await db
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('phase_id', phase.id)
      .eq('is_official_photography', true)
      .eq('approved', true)

    const CAP = 60
    if ((existingCount ?? 0) >= CAP) {
      return NextResponse.json(
        {
          error:   'photo_cap_reached',
          message: `This phase already has 60 official photos — the maximum allowed. Ask the organiser to remove some photos before uploading more.`,
          count:   existingCount,
          cap:     CAP,
        },
        { status: 429 }
      )
    }

      // ── Compress ───────────────────────────────────────────────────
    const compressed = await compressImage(rawBuffer, file.type)
    const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const outputExt  = file.type === 'image/png' ? 'png'       : 'jpg'

    // ── Upload to storage ──────────────────────────────────────────────
    const storagePath = `${phase.capsule_id}/dday/official-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${outputExt}`

    const { error: uploadError } = await db.storage
      .from('gallery')
      .upload(storagePath, compressed.buffer, {
        contentType: outputMime,
        upsert:      false,
      })

    if (uploadError) {
      console.error('[photographer/upload] Storage error:', uploadError)
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
    }

    const { data: urlData } = db.storage.from('gallery').getPublicUrl(storagePath)

    // ── Insert gallery_items record ────────────────────────────────────
    const { data: item, error: insertError } = await db
      .from('gallery_items')
      .insert({
        capsule_id:              phase.capsule_id,
        phase_id:                phase.id,
        image_url:               urlData.publicUrl,
        caption:                 'Official Photography',
        source:                  'dday',
        approved:                true,
        is_official_photography: true,
        storage_path:            storagePath,
        width_px:                compressed.width_px,
        height_px:               compressed.height_px,
        aspect_ratio:            compressed.aspect_ratio,
        file_hash:               fileHash,
      })
      .select('id, image_url')
      .single()

    if (insertError) {
      await db.storage.from('gallery').remove([storagePath])
      console.error('[photographer/upload] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save photo.' }, { status: 500 })
    }

    const newCount  = (existingCount ?? 0) + 1
    const remaining = Math.max(0, CAP - newCount)

    return NextResponse.json({
      ok:        true,
      photo_id:  item.id,
      image_url: item.image_url,
      uploaded:  newCount,
      remaining,
      cap:       CAP,
    })

  } catch (e: any) {
    console.error('[photographer/upload]', e)
    return NextResponse.json({ error: e.message ?? 'Upload failed' }, { status: 500 })
  }
}