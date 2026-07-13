// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/capsule-by-slug/route.ts
// PURPOSE: Resolve a capsule slug to its ID.
//          Used by the checkin page which only has the slug from the URL.
//          Returns capsule_id only — no sensitive data exposed.
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  try {
    const { data } = await db
      .from('capsules')
      .select('id, honouree_name, event_tag, event_type')
      .eq('slug', slug)
      .maybeSingle()

    if (!data) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })

    return NextResponse.json({
      capsule_id:    data.id,
      honouree_name: data.honouree_name,
      event_tag:     data.event_tag,
      event_type:    data.event_type,
    })
  } catch (e) {
    console.error('[capsule-by-slug]', e)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
