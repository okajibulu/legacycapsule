// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/usher/session/route.ts
// PURPOSE: Create, list, and deactivate temporary usher sessions.
//          Organiser generates a PIN → gives it to usher → usher enters it
//          on the check-in page to gain scan-only access.
//          PIN is hashed before storage — never retrievable after generation.
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
// SECTION 2 — POST: generate a new usher session
// Returns the plain PIN once — it is never retrievable again
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, label, expires_hours } = await req.json()

    if (!capsule_id || !label) {
      return NextResponse.json(
        { error: 'capsule_id and label required' },
        { status: 400 }
      )
    }

    // Generate 6-digit PIN
    const pin = String(Math.floor(100000 + Math.random() * 900000))

    // Hash before storing — never store plain PIN
    const pin_hash = crypto.createHash('sha256').update(pin).digest('hex')

    // Default expiry: 12 hours (covers a full event day including late start)
    const hours      = expires_hours ?? 12
    const expires_at = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

    const { data: session, error } = await db
      .from('event_usher_sessions')
      .insert({
        capsule_id,
        label: label.trim(),
        pin_hash,
        expires_at,
        is_active: true,
      })
      .select('id, label, expires_at')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, pin, session })

  } catch (e) {
    console.error('[usher/session POST]', e)
    return NextResponse.json({ error: 'Failed to create usher session' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — GET: list all sessions for a capsule
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')

  if (!capsule_id) {
    return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
  }

  try {
    const { data: sessions } = await db
      .from('event_usher_sessions')
      .select('id, label, expires_at, is_active, created_at')
      .eq('capsule_id', capsule_id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ sessions: sessions ?? [] })

  } catch (e) {
    console.error('[usher/session GET]', e)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — DELETE: deactivate a usher session
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  try {
    await db
      .from('event_usher_sessions')
      .update({ is_active: false })
      .eq('id', id)

    return NextResponse.json({ ok: true })

  } catch (e) {
    console.error('[usher/session DELETE]', e)
    return NextResponse.json({ error: 'Failed to deactivate session' }, { status: 500 })
  }
}
