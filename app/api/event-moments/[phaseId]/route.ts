// ============================================================
// FILE PATH: app/api/event-moments/[phaseId]/route.ts
// PURPOSE:   Returns paginated photos for a specific event
//            moment (programme item). Public route — no auth.
//            Separates guest snaps from official photography.
//            Also returns window status (open/closed).
// ARCHITECTURE: LC12 Event Moments
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.8
// DATE:      1 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 1 — Window check helper ═══
// D-Day window: 6am event day → 6am next day.
// event_date is stored as DATE (YYYY-MM-DD) in capsule_phases.

function isWindowOpen(eventDate: string | null): boolean {
  if (!eventDate) return false
  const now       = new Date()
  const open  = new Date(eventDate)
  open.setHours(6, 0, 0, 0)
  const close = new Date(open)
  close.setDate(close.getDate() + 1)
  return now >= open && now < close
}

// ═══ SECTION 2 — GET handler ═══

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const { phaseId } = await params

    const { searchParams } = new URL(req.url)
    const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const perPage = 20
    const offset  = (page - 1) * perPage

    // ── Fetch phase ────────────────────────────────────────────────────
    const { data: phase, error: phaseError } = await db
      .from('capsule_phases')
      .select('id, capsule_id, name, event_date, location, deleted_at')
      .eq('id', phaseId)
      .is('deleted_at', null)
      .maybeSingle()

    if (phaseError || !phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    // ── Fetch capsule (for honouree name + slug) ───────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('slug, honouree_name, event_tag, page_state')
      .eq('id', phase.capsule_id)
      .maybeSingle()

    if (!capsule || capsule.page_state === 'suspended') {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Fetch total counts (for pagination + live counter) ─────────────
    const { count: guestCount } = await db
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('phase_id', phaseId)
      .in('source', ['dday', 'contributor_gallery'])
      .eq('is_official_photography', false)
      .eq('approved', true)

    const { count: officialCount } = await db
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('phase_id', phaseId)
      .in('source', ['dday', 'contributor_gallery'])
      .eq('is_official_photography', true)

    // ── Fetch paginated photos ─────────────────────────────────────────
    // Guest snaps and official photography fetched separately
    // to support section rendering on the client

    const { data: guestPhotos } = await db
      .from('gallery_items')
      .select('id, image_url, uploaded_by_name, created_at, display_order, approved, featured_in_publication')
      .eq('phase_id', phaseId)
      .in('source', ['dday', 'contributor_gallery'])
      .eq('is_official_photography', false)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1)

    const { data: officialPhotos, error: officialError } = await db
      .from('gallery_items')
      .select('id, image_url, uploaded_by_name, created_at, display_order, approved, featured_in_publication')
      .eq('phase_id', phaseId)
      .in('source', ['dday', 'contributor_gallery'])
      .eq('is_official_photography', true)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('storage_path',  { ascending: true })
      .limit(30)

    if (officialError) {
      console.error('[event-moments/GET] officialPhotos error:', JSON.stringify(officialError))
    }
    console.log('[event-moments/GET] officialPhotos count:', officialPhotos?.length ?? 'null', 'phaseId:', phaseId)

    const windowOpen = isWindowOpen(phase.event_date)

    return NextResponse.json({
      ok: true,
      phase: {
        id:         phase.id,
        name:       phase.name,
        event_date: phase.event_date,
        location:   phase.location,
      },
      capsule: {
        slug:          capsule.slug,
        honouree_name: capsule.honouree_name,
        event_tag:     capsule.event_tag,
      },
      window_open:     windowOpen,
      guest_photos:    guestPhotos    ?? [],
      official_photos: officialPhotos ?? [],
      counts: {
        guest:    guestCount    ?? 0,
        official: officialCount ?? 0,
        total:    (guestCount ?? 0) + (officialCount ?? 0),
      },
      pagination: {
        page,
        per_page:  perPage,
        has_more:  (guestPhotos?.length ?? 0) === perPage,
      },
    })

  } catch (e: any) {
    console.error('[event-moments/GET]', e)
    return NextResponse.json(
      { error: e.message ?? 'Failed to load event moment' },
      { status: 500 }
    )
  }
}