// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/config/route.ts
// PURPOSE: Get or save hall configuration for a capsule.
//          Step 2 of LC-ACCESS-001 build sequence.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Client
// ─────────────────────────────────────────────────────────────────────────────

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — GET: fetch hall configuration for a capsule
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')
  if (!capsule_id) {
    return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
  }

  try {
    const { data: config } = await db
      .from('event_access_config')
      .select('*')
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    const { data: sections } = await db
      .from('event_sections')
      .select('*')
      .eq('capsule_id', capsule_id)
      .order('sort_order', { ascending: true })

    return NextResponse.json({ config: config ?? null, sections: sections ?? [] })
  } catch (e) {
    console.error('[access-codes/config GET]', e)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — POST: save or update hall configuration
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      capsule_id, hall_config, capacity, code_mode,
      allow_reentry, checkin_opens_at, checkin_closes_at,
      show_table_on_scan, show_tier_on_scan, is_active,
    } = body

    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
    }

    const { data: config, error } = await db
      .from('event_access_config')
      .upsert({
        capsule_id,
        hall_config:        hall_config ?? 'free_seating',
        capacity:           capacity ?? null,
        code_mode:          code_mode ?? 'single',
        allow_reentry:      allow_reentry ?? false,
        checkin_opens_at:   checkin_opens_at ?? null,
        checkin_closes_at:  checkin_closes_at ?? null,
        show_table_on_scan: show_table_on_scan ?? true,
        show_tier_on_scan:  show_tier_on_scan ?? true,
        is_active:          is_active ?? false,
        updated_at:         new Date().toISOString(),
      }, { onConflict: 'capsule_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ config })
  } catch (e) {
    console.error('[access-codes/config POST]', e)
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
  }
}
