// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/list/route.ts
// PURPOSE: GET all access codes for a capsule with section names.
//          Called by GuestCodeList component on mount.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
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
    const { data: codes, error } = await db
      .from('event_access_codes')
      .select(`
        id, guest_id, guest_name, guest_email, participant_type,
        numeric_code, qr_payload, serial_number, status, use_count, special_note,
        event_sections ( name )
      `)
      .eq('capsule_id', capsule_id)
      .order('participant_type', { ascending: true })
      .order('guest_name', { ascending: true })

    if (error) throw error

    const mapped = (codes ?? []).map(c => ({
      ...c,
      section_name: (c.event_sections as any)?.name ?? null,
      event_sections: undefined,
    }))

    return NextResponse.json({ codes: mapped })
  } catch (e) {
    console.error('[access-codes/list]', e)
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 })
  }
}
