// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/capsule/queue-update-email/route.ts
// PURPOSE:   Adds or updates the email address on a queued_submissions record.
//            Called when a contributor provides their email after seeing the
//            wall-hit modal (if email was not already in the form).
//            Required to send the return notification when organiser upgrades.
// ARCHITECTURE: Sprint 3 — Wall Experience.
// BUILT BY:  AI20 · Claude Opus 4.6
// VERSION:   AI20v2.12.01
// DATE:      13 August 2026
// POST body: { session_token, email }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { session_token, email } = await req.json()

    if (!session_token || !email?.trim()) {
      return NextResponse.json(
        { error: 'session_token and email are required.' },
        { status: 400 }
      )
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    // ── Find the queued submission ─────────────────────────────────────────
    const { data: queued } = await db
      .from('queued_submissions')
      .select('id, status')
      .eq('session_token', session_token)
      .maybeSingle()

    if (!queued || queued.status !== 'queued') {
      return NextResponse.json(
        { error: 'Queued submission not found or already completed.' },
        { status: 404 }
      )
    }

    // ── Update email ───────────────────────────────────────────────────────
    const { error: updateError } = await db
      .from('queued_submissions')
      .update({ contributor_email: email.trim().toLowerCase() })
      .eq('session_token', session_token)

    if (updateError) {
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[queue-update-email]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}