// ============================================================
// FILE PATH: app/api/display/video/[id]/route.ts
// PURPOSE:   DELETE a video asset — removes from
//            eds-video-assets bucket, marks deleted in DB,
//            removes from any active reel items.
//            GET returns single asset details.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.29
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

// ═══ SECTION 2 — Shared Auth Helper ═══

async function resolveAuth(req: NextRequest) {
  const slug = req.headers.get('x-capsule-slug') || req.nextUrl.searchParams.get('slug')
  if (!slug) return { error: 'Missing capsule slug', status: 400 }

  const auth = await checkManageAuth(slug)
  if (auth.accountType === 'coadmin' && !auth.permissions.includes('event_display')) {
    return { error: 'Unauthorised', status: 403 }
  }

  let capsuleId = auth.capsuleId
  if (!capsuleId) {
    const { data: capsuleRow } = await db.from('capsules').select('id').eq('slug', slug).maybeSingle()
    if (!capsuleRow) return { error: 'Capsule not found', status: 404 }
    capsuleId = capsuleRow.id
  }

  return { capsuleId, accountType: auth.accountType }
}

// ═══ SECTION 3 — GET Handler ═══

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resolved = await resolveAuth(req)
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status })

    const { data: asset } = await db
      .from('eds_video_assets')
      .select('id, original_filename, title, attribution, duration_seconds, orientation, file_size_bytes, status, created_at')
      .eq('id', id)
      .eq('capsule_id', resolved.capsuleId)
      .maybeSingle()

    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    return NextResponse.json({ asset })
  } catch (err) {
    console.error('[EDS video GET] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ═══ SECTION 4 — PATCH Handler — Update title/attribution ═══

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resolved = await resolveAuth(req)
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status })

    let body: { title?: string; attribution?: string; attribution_visible?: boolean }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if ('title' in body) updates.title = body.title || null
    if ('attribution' in body) updates.attribution = body.attribution || null
    if ('attribution_visible' in body) updates.attribution_visible = body.attribution_visible

    const { data: asset, error } = await db
      .from('eds_video_assets')
      .update(updates)
      .eq('id', id)
      .eq('capsule_id', resolved.capsuleId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to update asset.' }, { status: 500 })
    return NextResponse.json({ asset })
  } catch (err) {
    console.error('[EDS video PATCH] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ═══ SECTION 5 — DELETE Handler ═══

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resolved = await resolveAuth(req)
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status })

    // ── Fetch asset to get storage_path ──
    const { data: asset } = await db
      .from('eds_video_assets')
      .select('id, storage_path')
      .eq('id', id)
      .eq('capsule_id', resolved.capsuleId)
      .neq('status', 'deleted')
      .maybeSingle()

    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    // ── Remove from any active reel items first ──
    await db.from('eds_video_reel_items').delete().eq('asset_id', id)

    // ── Delete from storage bucket ──
    const deleteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      + '/storage/v1/object/' + BUCKET + '/' + asset.storage_path

    await fetch(deleteUrl, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY },
    }).catch(() => {})

    // ── Mark deleted in DB ──
    await db.from('eds_video_assets')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id)

    // ── Audit log — fire and forget ──
    void (async () => {
      try {
        await db.from('eds_video_reel_audit').insert({
          capsule_id: resolved.capsuleId,
          asset_id: id,
          action: 'asset_deleted',
          performed_by: resolved.accountType || 'organiser',
        })
      } catch { /* non-blocking */ }
    })()

    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('[EDS video DELETE] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}