// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/dday/upload/route.ts
// PURPOSE: D-Day guest capture handler.
//          Accepts FormData with optional file + optional tribute text.
//          Photo/video → Supabase Storage → gallery_items (source='dday')
//          Tribute text → contributions (is_dday=true)
//          Auto-approve based on capsule's auto_approve_tributes setting.
// ARCHITECTURE: LC02 Event Services Engine · D-Day Collection
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Client
// ─────────────────────────────────────────────────────────────────────────────

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Route config
// Large file uploads need extended body size — disable default body parser
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic  = 'force-dynamic'
export const maxDuration = 30  // Vercel: 30s for uploads

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const capsule_id       = formData.get('capsule_id')       as string
    const capsule_slug     = formData.get('capsule_slug')     as string
    const phase_id         = formData.get('phase_id')         as string | null
    const contributor_name = formData.get('contributor_name') as string
    const contributor_email = formData.get('contributor_email') as string | null
    const tribute_text     = formData.get('tribute_text')     as string | null
    const action           = formData.get('action')           as string  // photo | tribute | both
    const file             = formData.get('file')             as File | null

    if (!capsule_id || !contributor_name?.trim()) {
      return NextResponse.json({ error: 'capsule_id and contributor_name required' }, { status: 400 })
    }

    // ── Fetch capsule settings ────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, auto_approve_tributes, page_state')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    if (capsule.page_state !== 'active') {
      return NextResponse.json({ error: 'Capsule is not active' }, { status: 403 })
    }

    // D-Day: auto-approve is default ON (fast-approval for event day)
    // But respects the capsule's auto_approve_tributes setting
    const autoApprove = capsule.auto_approve_tributes ?? false
    const status      = autoApprove ? 'approved' : 'pending'

    let galleryItemId: string | null = null
    let contributionId: string | null = null

    // ── Upload photo/video ────────────────────────────────────────────────
    if ((action === 'photo' || action === 'both') && file && file.size > 0) {
      try {
        const ext         = file.name.split('.').pop() ?? 'jpg'
        const timestamp   = Date.now()
        const storagePath = `${capsule_id}/dday/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer      = Buffer.from(arrayBuffer)

        const { error: uploadError } = await db.storage
          .from('gallery')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert:      false,
          })

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

        const { data: publicUrlData } = db.storage.from('gallery').getPublicUrl(storagePath)
        const image_url = publicUrlData.publicUrl

        const { data: galleryItem, error: galleryError } = await db
          .from('gallery_items')
          .insert({
            capsule_id,
            phase_id:          phase_id || null,
            image_url,
            caption:           contributor_name.trim(),
            source:            'dday',
            approved:          autoApprove,
            contributor_name:  contributor_name.trim(),
            contributor_email: contributor_email?.trim() || null,
          })
          .select('id')
          .single()

        if (galleryError) throw new Error(`Gallery insert failed: ${galleryError.message}`)
        galleryItemId = galleryItem.id

      } catch (uploadErr: any) {
        console.error('[dday/upload] Photo upload error:', uploadErr)
        // Continue — don't fail entire submission for photo error
      }
    }

    // ── Save tribute text ─────────────────────────────────────────────────
    if ((action === 'tribute' || action === 'both') && tribute_text?.trim()) {
      const { data: contrib, error: contribError } = await db
        .from('contributions')
        .insert({
          capsule_id,
          phase_id:          phase_id || null,
          contributor_name:  contributor_name.trim(),
          contributor_email: contributor_email?.trim() || null,
          tribute_text:      tribute_text.trim(),
          is_dday:           true,
          status,
          thumbnail_url:     null,
        })
        .select('id')
        .single()

      if (contribError) {
        console.error('[dday/upload] Contribution error:', contribError)
      } else {
        contributionId = contrib.id
      }
    }

    return NextResponse.json({
      ok:               true,
      gallery_item_id:  galleryItemId,
      contribution_id:  contributionId,
      auto_approved:    autoApprove,
    })

  } catch (e: any) {
    console.error('[dday/upload]', e)
    return NextResponse.json({ error: e.message ?? 'Upload failed' }, { status: 500 })
  }
}
