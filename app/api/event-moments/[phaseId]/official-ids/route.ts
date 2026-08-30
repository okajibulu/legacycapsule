// ============================================================
// FILE PATH: app/api/event-moments/[phaseId]/official-ids/route.ts
// PURPOSE:   Returns all official photo IDs for a phase.
//            Used by purge operation — client state only holds
//            the first 60, this returns the full set.
// ARCHITECTURE: LC12 Event Moments
// BUILT BY:  AI26 · Claude Sonnet 4.6
// VERSION:   v2.12.56
// DATE:      27 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const { phaseId }    = await params
    const { searchParams } = new URL(req.url)
    const capsule_id     = searchParams.get('capsule_id')

    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
    }

    // ── Verify phase belongs to capsule ────────────────────────────
    const { data: phase } = await db
      .from('capsule_phases')
      .select('id')
      .eq('id', phaseId)
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    // ── Fetch ALL official photo IDs — no limit ────────────────────
    const { data: photos } = await db
      .from('gallery_items')
      .select('id')
      .eq('phase_id', phaseId)
      .eq('capsule_id', capsule_id)
      .eq('is_official_photography', true)

    return NextResponse.json({
      ok:    true,
      ids:   (photos ?? []).map(p => p.id),
      count: photos?.length ?? 0,
    })

  } catch (e: any) {
    console.error('[official-ids]', e)
    return NextResponse.json({ error: e.message ?? 'Failed' }, { status: 500 })
  }
}