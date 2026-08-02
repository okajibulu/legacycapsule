// ============================================================
// FILE PATH: app/api/event-moments/[phaseId]/upload-official/route.ts
// PURPOSE:   Organiser-only endpoint to upload official
//            photographer shots to an Event Moment gallery.
//            Stores with is_official_photography=true.
//            Auth-gated — valid organiser session required.
//            Reuses D-Day compression pipeline (sharp).
// ARCHITECTURE: LC12 Event Moments
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.9
// DATE:      1 August 2026
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

async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  let pipeline = sharp(buffer).resize({
    width:              1200,
    height:             1200,
    fit:                'inside',
    withoutEnlargement: true,
  })
  if (mimeType === 'image/png') {
    pipeline = pipeline.png({ quality: 82, compressionLevel: 8 })
  } else {
    pipeline = pipeline.jpeg({ quality: 82, progressive: true })
  }
  return pipeline.toBuffer()
}

// ═══ SECTION 4 — Auth helper ═══
// Validates organiser session cookie — same pattern as manage dashboard.

async function getOrganiserSession(req: NextRequest): Promise<{ email: string } | null> {
  try {
    const sessionCookie = req.cookies.get('organiser_session')?.value
    if (!sessionCookie) return null

    const { data: session } = await db
      .from('organiser_sessions')
      .select('email, expires_at')
      .eq('token', sessionCookie)
      .maybeSingle()

    if (!session) return null
    if (new Date(session.expires_at) < new Date()) return null
    return { email: session.email }
  } catch {
    return null
  }
}

// ═══ SECTION 5 — POST handler ═══

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const { phaseId } = await params

    // ── Auth gate ──────────────────────────────────────────────────
    const session = await getOrganiserSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // ── Parse form data ────────────────────────────────────────────
    const formData      = await req.formData()
    const capsule_id    = formData.get('capsule_id') as string
    const file          = formData.get('file')       as File | null

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

    if (!capsule || capsule.organiser_email !== session.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Compress ───────────────────────────────────────────────────
    const rawBuffer      = Buffer.from(await file.arrayBuffer())
    const compressed     = await compressImage(rawBuffer, file.type)
    const outputMimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const outputExt      = file.type === 'image/png' ? 'png' : 'jpg'

    // ── Upload to storage ──────────────────────────────────────────
    const storagePath = `${capsule_id}/dday/official-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${outputExt}`

    const { error: uploadError } = await db.storage
      .from('gallery')
      .upload(storagePath, compressed, {
        contentType: outputMimeType,
        upsert:      false,
      })

    if (uploadError) {
      console.error('[upload-official] Storage error:', uploadError)
      return NextResponse.json(
        { error: 'Upload failed. Please try again.' },
        { status: 500 }
      )
    }

    const { data: urlData } = db.storage.from('gallery').getPublicUrl(storagePath)

    // ── Insert gallery_items record ────────────────────────────────
    const { data: item, error: insertError } = await db
      .from('gallery_items')
      .insert({
        capsule_id,
        phase_id:                phaseId,
        image_url:               urlData.publicUrl,
        caption:                 'Official Photography',
        source:                  'dday',
        approved:                true,
        is_official_photography: true,
        contributor_name:        'Official Photography',
        storage_path:            storagePath,
      })
      .select('id')
      .single()

    if (insertError) {
      await db.storage.from('gallery').remove([storagePath])
      console.error('[upload-official] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save photo. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok:              true,
      gallery_item_id: item.id,
      image_url:       urlData.publicUrl,
    })

  } catch (e: any) {
    console.error('[upload-official]', e)
    return NextResponse.json(
      { error: e.message ?? 'Upload failed' },
      { status: 500 }
    )
  }
}