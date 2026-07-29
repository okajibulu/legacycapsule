// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/rsvp/config/route.ts
// PURPOSE: Read and write RSVP configuration per capsule.
//          Stores private event details (venue, datetime, dress code) that
//          are shown on the guest RSVP page but NEVER on the public capsule.
//          Also stores feature toggles: show_dietary, allow_additional_guests,
//          allow_rsvp_message, show_event_details, rsvp_deadline.
// ARCHITECTURE: LC02 Event Services Engine · Guest Coordination System
// PHASE: Guest Management — RSVP Layer
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Supabase client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — GET: Fetch RSVP config for a capsule ═══

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')
  if (!capsule_id) {
    return NextResponse.json({ error: 'capsule_id required.' }, { status: 400 })
  }

  try {
    const { data: config } = await db
      .from('event_rsvp_config')
      .select('*')
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    // Return null config — client creates defaults on first save
    return NextResponse.json({ config: config ?? null })
  } catch (e: any) {
    console.error('[rsvp/config GET]', e)
    return NextResponse.json({ error: 'Failed to fetch RSVP config.' }, { status: 500 })
  }
}

// ═══ SECTION 3 — POST: Create or update RSVP config ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { capsule_id, ...fields } = body

    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id required.' }, { status: 400 })
    }

    // Allowed fields — explicit whitelist prevents overposting
    const allowed = [
      'show_event_details',
      'allow_additional_guests',
      'max_additional_per_guest',
      'show_dietary',
      'allow_rsvp_message',
      'rsvp_tone',
      'deadline_at',
      'event_venue',
      'event_datetime',
      'event_dress_code',
      'custom_message',
      'custom_closing',
    ]

    const payload: Record<string, any> = {
      capsule_id,
      updated_at: new Date().toISOString(),
    }
    for (const key of allowed) {
      if (fields[key] !== undefined) payload[key] = fields[key]
    }

    // Upsert — creates on first call, updates on subsequent calls
    const { data: config, error } = await db
      .from('event_rsvp_config')
      .upsert(payload, { onConflict: 'capsule_id' })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, config })
  } catch (e: any) {
    console.error('[rsvp/config POST]', e)
    return NextResponse.json({ error: 'Failed to save RSVP config.' }, { status: 500 })
  }
}
