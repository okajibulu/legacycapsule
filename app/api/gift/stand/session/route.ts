// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/api/gift/stand/session/route.ts
// PURPOSE:    Gift Collection System — stand session management
//             POST /api/gift/stand/session  — staff claims a stand session
//             GET  /api/gift/stand/session?capsule_id=  — list active sessions (co-admin)
// SPEC:       GCS-SPEC-001-AMD-001 Parts Two Section 2.9 + AMD-002 Phase 5 Step 16
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.22
// DATE:       19 August 2026
//
// RULES:
//   • Staff PIN is bcrypt-hashed before storage. Never store plain text.
//   • One active session per stand name per capsule (enforced — staff must close
//     previous session before a new one can be claimed on the same stand).
//   • Stand name and staff name are set by staff at claim time — not pre-configured.
//   • No manage_session auth for stand API — stand staff access via session PIN only.
//   • GET is co-admin/organiser only — uses manage_session cookie.
//   • Writes STAND_SESSION_STARTED ledger event on success.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import bcrypt                        from 'bcryptjs'
import { writeLedgerEvent }          from '@/lib/gift/ledger'


// ═══ SECTION 1 — Supabase admin client ═════════════════════════════════════════

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// ═══ SECTION 2 — GET /api/gift/stand/session ═══════════════════════════════════
//
// Returns all active sessions for the capsule.
// Co-admin / organiser only — requires manage_session cookie.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const capsuleId        = searchParams.get('capsule_id')
    if (!capsuleId) return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })

    const db        = getDb()
    const sessionId = req.cookies.get('manage_session')?.value
    if (!sessionId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: session } = await db
      .from('manage_sessions')
      .select('account_id, capsule_id, expires_at')
      .eq('id', sessionId)
      .maybeSingle()

    if (!session || new Date(session.expires_at) < new Date() || session.capsule_id !== capsuleId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { data: standSessions, error } = await db
      .from('gift_stand_sessions')
      .select(`
        id,
        stand_name,
        staff_name,
        status,
        dispatched_count,
        failed_count,
        session_start,
        session_end,
        suspended_at,
        suspended_by,
        suspension_reason
      `)
      .eq('capsule_id', capsuleId)
      .order('session_start', { ascending: false })

    if (error) {
      console.error('[GCS Stand Session GET] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
    }

    return NextResponse.json({ sessions: standSessions ?? [] })
  } catch (err) {
    console.error('[GCS Stand Session GET] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// ═══ SECTION 3 — POST /api/gift/stand/session ══════════════════════════════════
//
// Staff claims a stand session.
// No manage_session required — stand access is PIN-only.
// Enforces one active session per stand_name per capsule.

export async function POST(req: NextRequest) {
  try {
    const body       = await req.json()
    const capsuleId  = (body.capsule_id  ?? '').trim()
    const standName  = (body.stand_name  ?? '').trim()
    const staffName  = (body.staff_name  ?? '').trim()
    const sessionPin = (body.session_pin ?? '').trim()

    if (!capsuleId)  return NextResponse.json({ error: 'capsule_id required' },  { status: 400 })
    if (!standName)  return NextResponse.json({ error: 'Stand name is required' },  { status: 400 })
    if (!staffName)  return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    if (!sessionPin || sessionPin.length < 4) {
      return NextResponse.json(
        { error: 'Session PIN must be at least 4 digits' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Verify GCS active on capsule
    const { data: capsule } = await db
      .from('capsules').select('components, event_name').eq('id', capsuleId).maybeSingle()

    if (!capsule?.components?.includes('gift_collection')) {
      return NextResponse.json({ error: 'Gift Collection is not active for this event.' }, { status: 403 })
    }

    // Check for existing active session on this stand
    const { data: existingSession } = await db
      .from('gift_stand_sessions')
      .select('id, staff_name, status')
      .eq('capsule_id', capsuleId)
      .eq('stand_name', standName)
      .eq('status', 'active')
      .maybeSingle()

    if (existingSession) {
      return NextResponse.json(
        {
          error:
            `${standName} already has an active session opened by ${existingSession.staff_name}. ` +
            `That session must be closed before a new one can be started on this stand.`,
        },
        { status: 409 }
      )
    }

    // Hash session PIN
    const pinHash = await bcrypt.hash(sessionPin, 10)

    // Create session
    const { data: newSession, error: insertErr } = await db
      .from('gift_stand_sessions')
      .insert({
        capsule_id:       capsuleId,
        stand_name:       standName,
        staff_name:       staffName,
        session_pin_hash: pinHash,
        status:           'active',
        dispatched_count: 0,
        failed_count:     0,
      })
      .select()
      .single()

    if (insertErr || !newSession) {
      console.error('[GCS Stand Session POST] Insert error:', insertErr?.message)
      return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
    }

    // Ledger — fire and forget
    writeLedgerEvent({
      capsule_id:       capsuleId,
      event_type:       'STAND_SESSION_STARTED',
      actor_type:       'staff',
      actor_name:       staffName,
      stand_session_id: newSession.id,
      payload: {
        stand_name: standName,
        staff_name: staffName,
      },
    })

    // Return session WITHOUT pin_hash
    return NextResponse.json(
      {
        session: {
          id:               newSession.id,
          stand_name:       newSession.stand_name,
          staff_name:       newSession.staff_name,
          status:           newSession.status,
          dispatched_count: newSession.dispatched_count,
          failed_count:     newSession.failed_count,
          session_start:    newSession.session_start,
          capsule_id:       newSession.capsule_id,
          event_name:       capsule.event_name,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[GCS Stand Session POST] Unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}