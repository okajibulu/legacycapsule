// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/manual-checkin/route.ts
// PURPOSE: Manual check-in by guest lookup. Records as manual_override.
//          Used when a guest cannot scan their code on event day.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
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
// SECTION 2 — POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { access_code_id, capsule_id, usher_session_id, notes } = await req.json()

    if (!access_code_id || !capsule_id) {
      return NextResponse.json(
        { error: 'access_code_id and capsule_id required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const { data: ac } = await db
      .from('event_access_codes')
      .select('id, guest_id, guest_name, participant_type, event_sections(name)')
      .eq('id', access_code_id)
      .single()

    if (!ac) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 })
    }

    // Mark code as used
    await db
      .from('event_access_codes')
      .update({ use_count: 1, status: 'used', updated_at: now })
      .eq('id', access_code_id)

    // Update guest check-in time
    if (ac.guest_id) {
      await db.from('guests').update({ checked_in_at: now }).eq('id', ac.guest_id)
    }

    // Append to immutable checkin log
    await db.from('event_checkin_log').insert({
      capsule_id,
      access_code_id,
      outcome:          'manual_override',
      guest_name:       ac.guest_name,
      participant_type: ac.participant_type,
      section_name:     (ac.event_sections as any)?.name ?? null,
      checked_in_at:    now,
      usher_session_id: usher_session_id ?? null,
      notes:            notes ?? 'Manual check-in by organiser or usher',
    })

    return NextResponse.json({ ok: true, guest_name: ac.guest_name })

  } catch (e) {
    console.error('[access-codes/manual-checkin]', e)
    return NextResponse.json({ error: 'Manual check-in failed' }, { status: 500 })
  }
}
