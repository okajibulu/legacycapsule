// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/dday/upload/route.ts
// PURPOSE: D-Day guest capture handler.
//          Accepts FormData with file (photo only — tribute text removed).
//          Photo → sharp compress → Supabase Storage → gallery_items (source='dday')
//          Enforces 6-photo limit per device per phase (config-driven).
//          Device identified by hashed IP + user-agent (no login required).
// ARCHITECTURE: LC02 Event Services Engine · D-Day Collection (LC-owned)
// BUILT BY: AI12 · Claude Opus 4.6 · 20 July 2026
// REPLACES: Previous version (Claude Sonnet 4.6 · July 2026)
//           Changes: compression added, 6-photo limit enforced,
//           tribute text pathway removed, config-driven limits
// ─────────────────────────────────────────────────────────────────────────────

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

// ═══ SECTION 3 — Compression config ═══
// Target: max 1200px on longest edge, JPEG quality 82, max ~400KB output.
// Sharp runs server-side — no client library needed.
// This is the primary compression strategy for all D-Day uploads.

const COMPRESS_CONFIG = {
  maxDimension: 1200,   // px — longest edge
  jpegQuality:  82,     // 0–100; 82 is high quality with good compression
  maxSizeKB:    500,    // soft target; sharp does not guarantee byte size
}

interface CompressResult {
  buffer:       Buffer
  width_px:     number
  height_px:    number
  aspect_ratio: number
}

async function compressImage(buffer: Buffer, mimeType: string): Promise<CompressResult> {
const pipeline = sharp(buffer).rotate().resize({
    width:              COMPRESS_CONFIG.maxDimension,
    height:             COMPRESS_CONFIG.maxDimension,
    fit:                'inside',
    withoutEnlargement: true,
  })

  let outBuffer: Buffer
  if (mimeType === 'image/png') {
    outBuffer = await pipeline.png({ quality: COMPRESS_CONFIG.jpegQuality, compressionLevel: 8 }).toBuffer()
  } else {
    outBuffer = await pipeline.jpeg({ quality: COMPRESS_CONFIG.jpegQuality, progressive: true }).toBuffer()
  }

  const meta         = await sharp(outBuffer).metadata()
  const width_px     = meta.width  ?? 0
  const height_px    = meta.height ?? 0
  const aspect_ratio = height_px > 0 ? Math.round((width_px / height_px) * 1000) / 1000 : 1

  return { buffer: outBuffer, width_px, height_px, aspect_ratio }
}

// ═══ SECTION 4 — Device fingerprint ═══
// Generates a stable token from IP + user-agent.
// Not cryptographically secure — used only for soft rate limiting.
// No personally identifiable data is stored — only the hash.

function generateDeviceToken(req: NextRequest): string {
  const ip        = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                 ?? req.headers.get('x-real-ip')
                 ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? 'unknown'
  return crypto
    .createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .slice(0, 32)   // 32 hex chars — sufficient for our purpose
}

// ═══ SECTION 5 — Config reader ═══
// Reads lc.dday.photos_per_device_per_phase from platform_config.
// Falls back to 6 if config is unavailable.

async function getPhotoLimit(): Promise<number> {
  try {
    const { data } = await db
      .from('platform_config')
      .select('value')
      .eq('key', 'lc.dday.photos_per_device_per_phase')
      .maybeSingle()
    const parsed = parseInt(data?.value ?? '', 10)
    return isNaN(parsed) ? 6 : parsed
  } catch {
    return 6
  }
}

// ═══ SECTION 6 — POST handler ═══

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const capsule_id        = formData.get('capsule_id')        as string
    const capsule_slug      = formData.get('capsule_slug')      as string
    const phase_id          = formData.get('phase_id')          as string | null
    const contributor_name  = formData.get('contributor_name')  as string
    const contributor_email = formData.get('contributor_email') as string | null
    const file              = formData.get('file')              as File | null

    // ── Validate required fields ──────────────────────────────────────────
    if (!capsule_id || !contributor_name?.trim()) {
      return NextResponse.json(
        { error: 'capsule_id and contributor_name are required' },
        { status: 400 }
      )
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'A photo is required. Please select an image to upload.' },
        { status: 400 }
      )
    }

    // ── Validate file type ────────────────────────────────────────────────
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Please upload a photo (JPEG, PNG, or HEIC).' },
        { status: 400 }
      )
    }

    // ── Fetch capsule ─────────────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, auto_approve_tributes, page_state')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    if (capsule.page_state !== 'active') {
      return NextResponse.json(
        { error: 'This capsule is not currently accepting uploads.' },
        { status: 403 }
      )
    }

    // ── Device fingerprint + photo limit check ────────────────────────────
    const deviceToken = generateDeviceToken(req)
    const photoLimit  = await getPhotoLimit()

    // Count existing photos from this device for this capsule+phase
    const { count: existingCount } = await db
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('source', 'dday')
      .eq('device_token', deviceToken)
      .eq('phase_id', phase_id ?? '')   // empty string if no phase — consistent match

    const currentCount = existingCount ?? 0

    if (currentCount >= photoLimit) {
      return NextResponse.json(
        {
          error:         `photo_limit_reached`,
          message:       `You've shared your ${photoLimit} photos for this event phase. To swap one out, delete it first and upload a new one.`,
          current_count: currentCount,
          limit:         photoLimit,
        },
        { status: 429 }
      )
    }

    // ── Compress image ────────────────────────────────────────────────────
    const rawBuffer      = Buffer.from(await file.arrayBuffer())
    const compressed     = await compressImage(rawBuffer, file.type)
    const compressedBuffer = compressed.buffer
    const outputMimeType   = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const outputExt        = file.type === 'image/png' ? 'png' : 'jpg'

    // ── Upload to Supabase Storage ────────────────────────────────────────
    const timestamp   = Date.now()
    const storagePath = `${capsule_id}/dday/${timestamp}-${crypto.randomBytes(6).toString('hex')}.${outputExt}`

    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const uploadUrl      = `${supabaseUrl}/storage/v1/object/tribute-photos/${storagePath}`

    const uploadRes = await fetch(uploadUrl, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type':  outputMimeType,
        'x-upsert':      'false',
      },
      body: new Uint8Array(compressedBuffer),
    })

    if (!uploadRes.ok) {
      const detail = await uploadRes.text()
      console.error('[dday/upload] Storage REST error:', uploadRes.status, detail)
      return NextResponse.json(
        { error: 'Photo upload failed. Please try again.' },
        { status: 500 }
      )
    }

    const image_url = `${supabaseUrl}/storage/v1/object/public/tribute-photos/${storagePath}`

    // ── Insert gallery_items record ───────────────────────────────────────
    // device_token stored for 6-photo limit enforcement — not displayed publicly
    const autoApprove = capsule.auto_approve_tributes ?? false

    const { data: galleryItem, error: galleryError } = await db
      .from('gallery_items')
      .insert({
capsule_id,
        phase_id:                phase_id || null,
        image_url,
        caption:                 contributor_name.trim(),
        source:                  'dday',
        approved:                autoApprove,
        is_official_photography: false,
        device_token:            deviceToken,
        storage_path:            storagePath,
        width_px:                compressed.width_px,
        height_px:               compressed.height_px,
        aspect_ratio:            compressed.aspect_ratio,
      })
      .select('id')
      .single()

    if (galleryError) {
      console.error('[dday/upload] Gallery insert error:', galleryError)
      // Clean up orphaned storage file
      await db.storage.from('gallery').remove([storagePath])
      return NextResponse.json(
        { error: 'Failed to save your photo. Please try again.' },
        { status: 500 }
      )
    }

    const newCount = currentCount + 1
    const remaining = photoLimit - newCount

    return NextResponse.json({
      ok:              true,
      gallery_item_id: galleryItem.id,
      auto_approved:   autoApprove,
      photos_used:     newCount,
      photos_remaining: remaining,
      photos_limit:    photoLimit,
    })

  } catch (e: any) {
    console.error('[dday/upload]', e)
    return NextResponse.json(
      { error: e.message ?? 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}

// ═══ SECTION 7 — DELETE handler ═══
// Allows a guest to delete one of their uploaded photos within the D-Day window.
// Only the device that uploaded the photo can delete it (matched by device_token).

export async function DELETE(req: NextRequest) {
  try {
    const { gallery_item_id, capsule_id } = await req.json()

    if (!gallery_item_id || !capsule_id) {
      return NextResponse.json(
        { error: 'gallery_item_id and capsule_id required' },
        { status: 400 }
      )
    }

    const deviceToken = generateDeviceToken(req)

    // Fetch the item — verify it belongs to this device
    const { data: item } = await db
      .from('gallery_items')
      .select('id, storage_path, device_token, capsule_id')
      .eq('id', gallery_item_id)
      .eq('capsule_id', capsule_id)
      .eq('source', 'dday')
      .maybeSingle()

    if (!item) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    if (item.device_token !== deviceToken) {
      return NextResponse.json(
        { error: 'You can only delete photos you uploaded.' },
        { status: 403 }
      )
    }

    // Delete from storage
    if (item.storage_path) {
      const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      await fetch(`${supabaseUrl}/storage/v1/object/tribute-photos/${item.storage_path}`, {
        method:  'DELETE',
        headers: { 'Authorization': `Bearer ${serviceRoleKey}` },
      })
    }

    // Delete record
    await db.from('gallery_items').delete().eq('id', gallery_item_id)

    return NextResponse.json({ ok: true, deleted: gallery_item_id })

  } catch (e: any) {
    console.error('[dday/upload DELETE]', e)
    return NextResponse.json(
      { error: e.message ?? 'Delete failed' },
      { status: 500 }
    )
  }
}
