// ============================================================
// FILE PATH: app/api/display/reel/route.ts
// PURPOSE:   Manage the video reel configuration for a capsule.
//            GET returns the active reel with all ordered items.
//            POST/PATCH upserts reel config and replaces items.
//            One reel per capsule (enforced by UNIQUE constraint).
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

// ═══ SECTION 2 — Shared Auth + Capsule Resolution ═══

async function resolveAuth(req: NextRequest) {
  const slug =
    req.headers.get('x-capsule-slug') ||
    req.nextUrl.searchParams.get('slug')

  if (!slug) return { error: 'Missing capsule slug', status: 400 }

  const auth = await checkManageAuth(slug)

  if (
    auth.accountType === 'coadmin' &&
    !auth.permissions.includes('event_display')
  ) {
    return { error: 'Unauthorised', status: 403 }
  }

  let capsuleId = auth.capsuleId
  if (!capsuleId) {
    const { data: capsuleRow } = await db
      .from('capsules')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!capsuleRow) return { error: 'Capsule not found', status: 404 }
    capsuleId = capsuleRow.id
  }

  return { capsuleId, accountType: auth.accountType }
}

// ═══ SECTION 3 — GET Handler ═══
// Returns the active reel with all items ordered by sort_order.
// Returns 404 with empty structure if no reel exists yet —
// client uses this to show the empty editor state.

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveAuth(req)
    if ('error' in resolved) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status }
      )
    }
    const { capsuleId } = resolved

    // ── 3a. Fetch reel ──
    const { data: reel, error: reelError } = await db
      .from('eds_video_reels')
      .select('*')
      .eq('capsule_id', capsuleId)
      .maybeSingle()

    if (reelError) {
      console.error('[EDS reel GET] DB error:', reelError)
      return NextResponse.json(
        { error: 'Failed to fetch reel.' },
        { status: 500 }
      )
    }

    if (!reel) {
      return NextResponse.json({ reel: null, items: [] }, { status: 200 })
    }

    // ── 3b. Fetch reel items with asset data ──
    const { data: items, error: itemsError } = await db
      .from('eds_video_reel_items')
      .select(`
        id,
        sort_order,
        display_title,
        attribution,
        attribution_visible,
        trim_start_seconds,
        trim_end_seconds,
        asset:eds_video_assets (
          id,
          original_filename,
          storage_path,
          mime_type,
          duration_seconds,
          orientation,
          file_size_bytes,
          title,
          status
        )
      `)
      .eq('reel_id', reel.id)
      .order('sort_order', { ascending: true })

    if (itemsError) {
      console.error('[EDS reel GET] Items error:', itemsError)
      return NextResponse.json(
        { error: 'Failed to fetch reel items.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reel, items: items || [] })
  } catch (err) {
    console.error('[EDS reel GET] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}

// ═══ SECTION 4 — POST/PATCH Handler ═══
// Upserts the reel configuration and replaces all items.
// Items are replaced atomically — delete existing, insert new set.
// Body: { title?, theme?, items: [{ asset_id, sort_order }] }

export async function POST(req: NextRequest) {
  return upsertReel(req)
}

export async function PATCH(req: NextRequest) {
  return upsertReel(req)
}

async function upsertReel(req: NextRequest) {
  try {
    const resolved = await resolveAuth(req)
    if ('error' in resolved) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status }
      )
    }
    const { capsuleId, accountType } = resolved

    // ── 4a. Parse body ──
    let body: {
      title?: string
      theme?: string
      items?: { asset_id: string; sort_order: number; display_title?: string; attribution?: string }[]
    }

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body.' },
        { status: 400 }
      )
    }

    const { title, theme, items } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items array is required.' },
        { status: 400 }
      )
    }

    // ── 4b. Validate all asset_ids belong to this capsule ──
    if (items.length > 0) {
      const assetIds = items.map((i) => i.asset_id)
      const { data: validAssets } = await db
        .from('eds_video_assets')
        .select('id')
        .eq('capsule_id', capsuleId)
        .eq('status', 'ready')
        .in('id', assetIds)

      const validIds = new Set((validAssets || []).map((a) => a.id))
      const invalid = assetIds.filter((id) => !validIds.has(id))
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Invalid or inaccessible asset IDs: ${invalid.join(', ')}` },
          { status: 422 }
        )
      }
    }

    // ── 4c. Upsert reel record ──
    const { data: reel, error: reelError } = await db
      .from('eds_video_reels')
      .upsert(
        {
          capsule_id: capsuleId,
          title: title || null,
          theme: theme || 'default',
          status: items.length > 0 ? 'ready' : 'draft',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'capsule_id' }
      )
      .select()
      .single()

    if (reelError || !reel) {
      console.error('[EDS reel UPSERT] Reel upsert failed:', reelError)
      return NextResponse.json(
        { error: 'Failed to save reel configuration.' },
        { status: 500 }
      )
    }

    // ── 4d. Replace all reel items ──
    // Delete existing items first, then insert new ordered set
    const { error: deleteError } = await db
      .from('eds_video_reel_items')
      .delete()
      .eq('reel_id', reel.id)

    if (deleteError) {
      console.error('[EDS reel UPSERT] Delete items failed:', deleteError)
      return NextResponse.json(
        { error: 'Failed to update reel items.' },
        { status: 500 }
      )
    }

    if (items.length > 0) {
      const insertRows = items.map((item, index) => ({
        reel_id: reel.id,
        asset_id: item.asset_id,
        sort_order: item.sort_order ?? index,
        display_title: item.display_title || null,
        attribution: item.attribution || null,
        attribution_visible: true,
        trim_start_seconds: 0,
        trim_end_seconds: null,
      }))

      const { error: insertError } = await db
        .from('eds_video_reel_items')
        .insert(insertRows)

      if (insertError) {
        console.error('[EDS reel UPSERT] Insert items failed:', insertError)
        return NextResponse.json(
          { error: 'Failed to save reel items.' },
          { status: 500 }
        )
      }
    }

    // ── 4e. Audit log — fire and forget ──
    void (async () => {
      try {
        await db.from('eds_video_reel_audit').insert({
          capsule_id: capsuleId,
          reel_id: reel.id,
          action: 'reel_saved',
          detail: {
            item_count: items.length,
            theme: theme || 'default',
            title: title || null,
          },
          performed_by: accountType || 'organiser',
        })
      } catch {
        // non-blocking
      }
    })()

    // ── 4f. Return updated reel with items ──
    const { data: updatedItems } = await db
      .from('eds_video_reel_items')
      .select(`
        id,
        sort_order,
        display_title,
        attribution,
        attribution_visible,
        trim_start_seconds,
        trim_end_seconds,
        asset:eds_video_assets (
          id,
          original_filename,
          storage_path,
          mime_type,
          duration_seconds,
          orientation,
          file_size_bytes,
          title,
          status
        )
      `)
      .eq('reel_id', reel.id)
      .order('sort_order', { ascending: true })

    return NextResponse.json(
      { reel, items: updatedItems || [] },
      { status: 200 }
    )
  } catch (err) {
    console.error('[EDS reel UPSERT] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}