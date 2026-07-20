// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/capsule/public-info/route.ts
// PURPOSE: Returns public capsule info needed by the D-Day page.
//          No auth required — public endpoint.
//          Returns: capsule basics, active phases, D-Day photo limit from config.
// ARCHITECTURE: LC02 · D-Day Collection
// BUILT BY: AI12 · Claude Opus 4.6 · 20 July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// RW-Ecosystem client for config
const rwDb = createClient(
  process.env.RW_SUPABASE_URL!,
  process.env.RW_SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    }

    // ── Fetch capsule basics ──────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, honouree_name, event_type, event_tag, page_state')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Fetch active phases ───────────────────────────────────────────────
    const { data: phases } = await db
      .from('capsule_phases')
      .select('id, name, event_date')
      .eq('capsule_id', capsule.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })

    // ── Fetch photo limit from platform_config ────────────────────────────
    let photoLimit = 6 // safe default
    try {
      const { data: config } = await rwDb
        .from('platform_config')
        .select('value')
        .eq('config_key', 'lc.dday.photos_per_device_per_phase')
        .maybeSingle()
      const parsed = parseInt(config?.value ?? '', 10)
      if (!isNaN(parsed)) photoLimit = parsed
    } catch {
      // Fall back to default silently
    }

    return NextResponse.json({
      capsule: {
        id:            capsule.id,
        honouree_name: capsule.honouree_name,
        event_type:    capsule.event_type,
        event_tag:     capsule.event_tag,
        page_state:    capsule.page_state,
        phases:        phases ?? [],
      },
      photo_limit: photoLimit,
    })

  } catch (e: any) {
    console.error('[capsule/public-info]', e)
    return NextResponse.json({ error: 'Failed to load capsule info' }, { status: 500 })
  }
}
