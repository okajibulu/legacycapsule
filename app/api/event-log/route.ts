// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/event-log/route.ts
// PURPOSE: Fetch event_action_log entries for a capsule.
//          Filterable by circle_id (for circle leader portal),
//          actor_type, and date range. Returns paginated results,
//          newest first. Used by ActivityFeed component.
// ARCHITECTURE: LC02 Event Services Engine · Guest Coordination System
// PHASE: Guest Management — Audit Layer
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Supabase client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Action label map ═══
// Human-readable descriptions for each action code.
// Keeps display logic out of the component.

export const ACTION_LABELS: Record<string, string> = {
  circle_created:          'Created a circle',
  circle_updated:          'Updated circle details',
  circle_deactivated:      'Removed a circle',
  circle_portal_sent:      'Sent circle leader portal link',
  guest_added:             'Added a guest',
  guest_updated:           'Updated guest details',
  guest_deleted:           'Removed a guest',
  guest_circle_assigned:   'Assigned guest to circle',
  rsvp_invite_sent:        'Sent RSVP invitation',
  rsvp_reminder_sent:      'Sent RSVP reminder',
  rsvp_confirmed:          'Confirmed attendance',
  rsvp_declined:           'Declined attendance',
  rsvp_updated_by_organiser: 'Updated RSVP on behalf of guest',
  rsvp_updated_by_leader:  'Updated RSVP on behalf of guest',
  tribute_submitted:       'Left a message for the honouree',
}

// ═══ SECTION 3 — GET handler ═══

export async function GET(req: NextRequest) {
  const params     = req.nextUrl.searchParams
  const capsule_id = params.get('capsule_id')
  const circle_id  = params.get('circle_id')    // optional — scopes to one circle
  const actor_type = params.get('actor_type')   // optional — 'organiser' | 'circle_leader' | 'guest'
  const limit      = Math.min(Number(params.get('limit') ?? '50'), 200)
  const offset     = Number(params.get('offset') ?? '0')

  if (!capsule_id) {
    return NextResponse.json({ error: 'capsule_id required.' }, { status: 400 })
  }

  try {
    let query = db
      .from('event_action_log')
      .select('*', { count: 'exact' })
      .eq('capsule_id', capsule_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (actor_type) {
      query = query.eq('actor_type', actor_type)
    }

    // Circle filter: if circle_id provided, only return actions where
    // target is a guest in that circle, or target is the circle itself.
    // We do this via metadata since target_id may be a guest or circle UUID.
    if (circle_id) {
      // Fetch guest IDs in this circle first for the filter
      const { data: circleGuests } = await db
        .from('guests')
        .select('id')
        .eq('circle_id', circle_id)
        .is('deleted_at', null)

      const guestIds = (circleGuests ?? []).map(g => g.id)

      // Filter: target is the circle itself, OR target is one of its guests
      if (guestIds.length > 0) {
        query = query.or(
          `target_id.eq.${circle_id},target_id.in.(${guestIds.join(',')})`
        )
      } else {
        query = query.eq('target_id', circle_id)
      }
    }

    const { data: entries, error, count } = await query

    if (error) throw error

    // Enrich entries with human-readable label
    const enriched = (entries ?? []).map(e => ({
      ...e,
      label: ACTION_LABELS[e.action] ?? e.action,
    }))

    return NextResponse.json({
      entries: enriched,
      total:   count ?? 0,
      limit,
      offset,
    })
  } catch (e: any) {
    console.error('[event-log GET]', e)
    return NextResponse.json({ error: 'Failed to fetch activity log.' }, { status: 500 })
  }
}
