// ============================================================
// FILE PATH: app/api/event-moments/[phaseId]/curate/route.ts
// PURPOSE:   Organiser-only curation actions on Event Moment
//            photos. Non-destructive — never deletes.
//            Actions: show | hide | reorder | feature
//            Auth-gated — valid organiser session required.
// ARCHITECTURE: LC12 Event Moments
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.9
// DATE:      1 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Auth helper ═══

async function getOrganiserSession(req: NextRequest): Promise<{ email: string } | null> {
  try {
    const sessionCookie = req.cookies.get('organiser_session')?.value
    if (!sessionCookie) return null
    const { data: session } = await db
      .from('organiser_sessions')
      .select('email, expires_at')
      .eq('token', sessionCookie)
      .maybeSingle()
    if (!session) return null
    if (new Date(session.expires_at) < new Date()) return null
    return { email: session.email }
  } catch {
    return null
  }
}

// ═══ SECTION 3 — PATCH handler ═══

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const { phaseId } = await params

    // ── Auth gate ──────────────────────────────────────────────────
    const session = await getOrganiserSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // ── Parse body ─────────────────────────────────────────────────
    const body = await req.json()
    const { capsule_id, photo_id, action, display_order } = body

    if (!capsule_id || !photo_id || !action) {
      return NextResponse.json(
        { error: 'capsule_id, photo_id and action are required' },
        { status: 400 }
      )
    }

    const validActions = ['show', 'hide', 'reorder', 'feature', 'unfeature']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // ── Verify organiser owns capsule ──────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, organiser_email')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule || capsule.organiser_email !== session.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Verify photo belongs to this phase ─────────────────────────
    const { data: photo } = await db
      .from('gallery_items')
      .select('id, approved, display_order, featured_in_publication')
      .eq('id', photo_id)
      .eq('phase_id', phaseId)
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // ── Apply action ───────────────────────────────────────────────
    let updatePayload: Record<string, any> = {}

    switch (action) {
      case 'show':
        updatePayload = { approved: true }
        break

      case 'hide':
        updatePayload = { approved: false }
        break

      case 'reorder':
        if (typeof display_order !== 'number') {
          return NextResponse.json(
            { error: 'display_order (number) required for reorder action' },
            { status: 400 }
          )
        }
        updatePayload = { display_order }
        break

      case 'feature':
        updatePayload = { featured_in_publication: true }
        break

      case 'unfeature':
        updatePayload = { featured_in_publication: false }
        break
    }

    const { error: updateError } = await db
      .from('gallery_items')
      .update(updatePayload)
      .eq('id', photo_id)

    if (updateError) {
      console.error('[curate] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update photo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, photo_id, action })

  } catch (e: any) {
    console.error('[curate]', e)
    return NextResponse.json(
      { error: e.message ?? 'Curation action failed' },
      { status: 500 }
    )
  }
}