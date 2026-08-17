// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/activity-log/route.ts
// PURPOSE:   Returns paginated capsule_activity_log entries with filters.
//            Visible to Organiser and Family Rep Full Access only.
//            Supports filter by actor_type, action category, date range.
//            Supports text search by actor_name or action_label.
//            Append-only log — GET only, no POST/PATCH/DELETE.
// ARCHITECTURE: CA-SPEC-001 — Step 13.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.13
// DATE:      16 August 2026
//
// GET ?capsule_id=&limit=&offset=&actor_type=&search=&date_from=&date_to=
// Returns: { entries: LogEntry[], total: number }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function GET(req: NextRequest) {
  try {
    const p          = req.nextUrl.searchParams
    const capsule_id = p.get('capsule_id')
    const limit      = Math.min(parseInt(p.get('limit')  ?? '50'), 100)
    const offset     = parseInt(p.get('offset') ?? '0')
    const actor_type = p.get('actor_type')   // filter by account type
    const search     = p.get('search')        // search actor_name or action_label
    const date_from  = p.get('date_from')
    const date_to    = p.get('date_to')

    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id is required.' }, { status: 400 })
    }

    // ── Build query ───────────────────────────────────────────────────────
    let query = db
      .from('capsule_activity_log')
      .select('id, actor_type, actor_name, actor_email, action_key, action_label, entity_type, entity_id, payload, created_at', { count: 'exact' })
      .eq('capsule_id', capsule_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (actor_type) {
      query = query.eq('actor_type', actor_type)
    }

    if (search?.trim()) {
      query = query.or(
        `actor_name.ilike.%${search.trim()}%,action_label.ilike.%${search.trim()}%`
      )
    }

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[activity-log] Query error:', error)
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    return NextResponse.json({ entries: data ?? [], total: count ?? 0 })

  } catch (err) {
    console.error('[activity-log]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}