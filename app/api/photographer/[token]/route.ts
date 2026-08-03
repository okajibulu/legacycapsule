// ============================================================
// FILE PATH: app/api/photographer/[token]/route.ts
// PURPOSE:   Validates a photographer token and returns phase
//            info + existing photo count. Public route.
// ARCHITECTURE: LC12 Event Moments Spec
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.17
// DATE:      2 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // ── Validate token ─────────────────────────────────────────────────
    const { data: phase } = await db
      .from('capsule_phases')
      .select('id, capsule_id, name, event_date, location, photographer_token_expires_at')
      .eq('photographer_token', token)
      .is('deleted_at', null)
      .maybeSingle()

    if (!phase) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 404 })
    }

    if (new Date(phase.photographer_token_expires_at!) < new Date()) {
      return NextResponse.json({ error: 'token_expired' }, { status: 410 })
    }

    // ── Fetch capsule info ─────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('slug, honouree_name, event_tag')
      .eq('id', phase.capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Count existing official photos ─────────────────────────────────
    const { count: officialCount } = await db
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('phase_id', phase.id)
      .eq('source', 'dday')
      .eq('is_official_photography', true)

    // ── Fetch thumbnails of existing photos ────────────────────────────
    const { data: existingPhotos } = await db
      .from('gallery_items')
      .select('id, image_url, created_at')
      .eq('phase_id', phase.id)
      .eq('source', 'dday')
      .eq('is_official_photography', true)
      .order('created_at', { ascending: false })

    const CAP = 30
    const remaining = Math.max(0, CAP - (officialCount ?? 0))

    return NextResponse.json({
      ok: true,
      phase: {
        id:         phase.id,
        name:       phase.name,
        event_date: phase.event_date,
        location:   phase.location,
        expires_at: phase.photographer_token_expires_at,
      },
      capsule: {
        slug:          capsule.slug,
        honouree_name: capsule.honouree_name,
        event_tag:     capsule.event_tag,
      },
      photos: {
        uploaded:  officialCount ?? 0,
        cap:       CAP,
        remaining,
        thumbnails: existingPhotos ?? [],
      },
    })

  } catch (e: any) {
    console.error('[photographer/token GET]', e)
    return NextResponse.json({ error: 'Failed to validate token' }, { status: 500 })
  }
}