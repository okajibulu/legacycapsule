// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/qr/[token]/route.ts
// PURPOSE: Context-aware QR redirect for event phases.
//          A single QR code on a table card redirects to the right destination
//          depending on when it is scanned — before, during, or after the event.
//
// THREE STATES:
//   Before event date:              → /for/[slug]          (tribute wall)
//   On event day + window open:     → /for/[slug]/dday     (D-Day upload portal)
//   After capture window closes:    → /for/[slug]          (back to tribute wall)
//
// The QR code printed on table cards never needs to change.
// The server decides where to send the scanner based on real time.
//
// ARCHITECTURE: LC02 Event Services Engine · D-Day Collection
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

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — GET handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/`, { status: 302 })
  }

  try {
    // ── Fetch phase by QR token ───────────────────────────────────────────
    const { data: phase } = await db
      .from('capsule_phases')
      .select(`
        id,
        capsule_id,
        event_date,
        capture_window_closes_at,
        capsules ( id, slug, page_state, components )
      `)
      .eq('qr_token', token)
      .maybeSingle()

    if (!phase) {
      // Token not found — redirect to homepage
      return NextResponse.redirect(`${APP_URL}/`, { status: 302 })
    }

    const capsule = (phase.capsules as any)
    if (!capsule || capsule.page_state !== 'active') {
      return NextResponse.redirect(`${APP_URL}/`, { status: 302 })
    }

    const slug = capsule.slug
    const now  = new Date()
    const todayUtc = now.toISOString().split('T')[0]

    // ── Determine redirect state ──────────────────────────────────────────

    // State 1: No event date set → always go to tribute wall
    if (!phase.event_date) {
      return NextResponse.redirect(`${APP_URL}/for/${slug}`, { status: 302 })
    }

    const eventDate = phase.event_date // YYYY-MM-DD
    const isEventDay = eventDate === todayUtc

    // State 2: Before event date → tribute wall
    if (eventDate > todayUtc) {
      return NextResponse.redirect(`${APP_URL}/for/${slug}`, { status: 302 })
    }

    // State 3: After capture window closes → tribute wall
    if (phase.capture_window_closes_at) {
      const windowCloses = new Date(phase.capture_window_closes_at)
      if (now > windowCloses) {
        return NextResponse.redirect(`${APP_URL}/for/${slug}`, { status: 302 })
      }
    }

    // State 4: On event day + window open → D-Day upload portal
    if (isEventDay || eventDate < todayUtc) {
      // Build D-Day URL with context params so the page can display the event name
      const ddayUrl = new URL(`${APP_URL}/for/${slug}/dday`)
      ddayUrl.searchParams.set('phase', phase.id)
      ddayUrl.searchParams.set('cid', capsule.id)

      return NextResponse.redirect(ddayUrl.toString(), { status: 302 })
    }

    // Fallback: tribute wall
    return NextResponse.redirect(`${APP_URL}/for/${slug}`, { status: 302 })

  } catch (err) {
    console.error('[qr/token]', err)
    return NextResponse.redirect(`${APP_URL}/`, { status: 302 })
  }
}
