// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/contributions/pending/route.ts
// PURPOSE: Fetch pending contributions for a capsule.
//          Used by the fast-approve mobile moderation interface.
//          Returns pending and pending_correction contributions.
// ARCHITECTURE: LC02 Event Services Engine · Live Contributor Wall
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')
  if (!capsule_id) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

  try {
    const { data: contributions, error } = await db
      .from('contributions')
      .select('id, contributor_name, city, country, tribute_text, thumbnail_url, email, created_at, is_dday, story_topic_id')
      .eq('capsule_id', capsule_id)
      .in('status', ['pending', 'pending_correction'])
      .is('deleted_at', null)
      .order('created_at', { ascending: true }) // oldest first for fair queue

    if (error) throw error

    return NextResponse.json({ contributions: contributions ?? [] })
  } catch (e) {
    console.error('[contributions/pending]', e)
    return NextResponse.json({ error: 'Failed to fetch pending contributions' }, { status: 500 })
  }
}
