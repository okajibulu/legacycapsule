// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/gallery/upload/route.ts
// PURPOSE:   Handles contributor gallery photo uploads.
//            Validates per-person limit (20), stores to contributor-gallery
//            bucket via direct REST fetch (SharedArrayBuffer workaround),
//            creates contributor_gallery_photos records, triggers thank-you email.
// ARCHITECTURE: CG-SPEC-001 — Contributor Gallery
// BUILT BY:  AI25 · Claude Opus 4.6
// VERSION:   AI25v2.12.33
// DATE:      24 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { sendContributorThankYou }   from '@/lib/email/sendContributorThankYou'

// ═══ SECTION 1 — Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET         = 'contributor-gallery'
const MAX_PER_PERSON = 20
const MAX_FILE_SIZE  = 5 * 1024 * 1024 // 5MB safety net (client compresses to ~0.8MB)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const capsuleId       = formData.get('capsule_id')       as string | null
    const contributorName = formData.get('contributor_name')  as string | null
    const contributorEmail = formData.get('contributor_email') as string | null
    const captionsRaw     = formData.get('captions')          as string | null

    // ── Validation ──────────────────────────────────────────────────────
    if (!capsuleId || !contributorName?.trim() || !contributorEmail?.trim()) {
      return NextResponse.json(
        { error: 'Please provide your name and email address.' },
        { status: 400 }
      )
    }

    if (!contributorEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    // ── Capsule check ───────────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, honouree_name, slug, page_state')
      .eq('id', capsuleId)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
    }

    if (capsule.page_state === 'suspended') {
      return NextResponse.json({ error: 'This capsule is currently unavailable.' }, { status: 403 })
    }

    // ── Per-person limit check ──────────────────────────────────────────
    const { count: existingCount } = await db
      .from('contributor_gallery_photos')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)
      .eq('contributor_email', contributorEmail.toLowerCase().trim())
      .eq('status', 'visible')

    const currentCount = existingCount ?? 0

    // ── Collect files from form ─────────────────────────────────────────
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('photo_') && value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No photos selected.' }, { status: 400 })
    }

    const remaining = MAX_PER_PERSON - currentCount
    if (remaining <= 0) {
      return NextResponse.json(
        { error: `You have already uploaded ${MAX_PER_PERSON} photos for this event. Thank you for your contributions!` },
        { status: 400 }
      )
    }

    if (files.length > remaining) {
      return NextResponse.json(
        { error: `You can upload ${remaining} more photo${remaining === 1 ? '' : 's'} (${currentCount} already uploaded, limit is ${MAX_PER_PERSON}).` },
        { status: 400 }
      )
    }

    // ── Parse captions ──────────────────────────────────────────────────
    let captions: string[] = []
    try {
      captions = captionsRaw ? JSON.parse(captionsRaw) : []
    } catch {
      captions = []
    }

    // ── Upload each file ────────────────────────────────────────────────
    const uploaded: { storage_path: string; file_size_bytes: number; caption: string | null }[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Size check
      if (file.size > MAX_FILE_SIZE) {
        continue // Skip oversized — client should have compressed
      }

      // Validate type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        continue
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).slice(2, 8)
      const storagePath = `${capsuleId}/${timestamp}-${randomSuffix}.${ext}`

      // ── Direct REST upload (SharedArrayBuffer workaround) ───────────
      const arrayBuffer = await file.arrayBuffer()
      const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type':  file.type,
            'x-upsert':     'false',
          },
          body: Buffer.from(arrayBuffer),
        }
      )

      if (!uploadRes.ok) {
        console.error(`[gallery/upload] Storage upload failed for file ${i}:`, await uploadRes.text())
        continue
      }

      uploaded.push({
        storage_path:   storagePath,
        file_size_bytes: file.size,
        caption:        captions[i]?.trim() || null,
      })
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { error: 'No photos could be uploaded. Please check your files and try again.' },
        { status: 400 }
      )
    }

    // ── Fetch current max sort_order for this capsule ───────────────────
    const { data: maxRow } = await db
      .from('contributor_gallery_photos')
      .select('sort_order')
      .eq('capsule_id', capsuleId)
      .eq('status', 'visible')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextSortBase = (maxRow?.sort_order ?? 0) + 1

    // ── Insert DB records ───────────────────────────────────────────────
    const rows = uploaded.map((u, i) => ({
      capsule_id:        capsuleId,
      contributor_name:  contributorName.trim(),
      contributor_email: contributorEmail.toLowerCase().trim(),
      storage_path:      u.storage_path,
      caption:           u.caption,
      file_size_bytes:   u.file_size_bytes,
      status:            'visible',
      sort_order:        nextSortBase + i,
    }))

    const { error: insertError } = await db
      .from('contributor_gallery_photos')
      .insert(rows)

    if (insertError) {
      console.error('[gallery/upload] DB insert error:', insertError)
      return NextResponse.json(
        { error: 'Photos uploaded but could not be saved. Please try again.' },
        { status: 500 }
      )
    }

    // ── Send thank-you email (non-blocking) ─────────────────────────────
    sendContributorThankYou({
      recipientEmail: contributorEmail.toLowerCase().trim(),
      recipientName:  contributorName.trim(),
      honoureeName:   capsule.honouree_name,
      capsuleSlug:    capsule.slug,
      contentType:    'photos',
      count:          uploaded.length,
    }).catch(err => console.error('[gallery/upload] Thank-you email error:', err))

    return NextResponse.json({
      ok: true,
      uploaded: uploaded.length,
      remaining: remaining - uploaded.length,
    })

  } catch (err) {
    console.error('[gallery/upload]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
