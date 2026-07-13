// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/usher/verify/route.ts
// PURPOSE: Verify a usher PIN entered on the check-in page.
//          Public route — PIN is the sole auth mechanism for ushers.
//          Returns session details on success so the usher interface
//          can display the event label and expiry time.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import crypto                        from 'crypto'

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
    const { capsule_id, pin } = await req.json()

    if (!capsule_id || !pin) {
      return NextResponse.json(
        { valid: false, error: 'capsule_id and pin required' },
        { status: 400 }
      )
    }

    // Hash the submitted PIN for comparison
    const pin_hash = crypto.createHash('sha256').update(String(pin)).digest('hex')
    const now      = new Date().toISOString()

    // Find active, unexpired session matching this capsule + PIN hash
    const { data: session } = await db
      .from('event_usher_sessions')
      .select('id, label, expires_at')
      .eq('capsule_id', capsule_id)
      .eq('pin_hash', pin_hash)
      .eq('is_active', true)
      .gt('expires_at', now)
      .maybeSingle()

    if (!session) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired PIN. Please ask the organiser to generate a new one.',
      })
    }

    return NextResponse.json({
      valid:         true,
      session_id:    session.id,
      session_label: session.label,
      expires_at:    session.expires_at,
    })

  } catch (e) {
    console.error('[usher/verify]', e)
    return NextResponse.json(
      { valid: false, error: 'Verification failed — please retry' },
      { status: 500 }
    )
  }
}
