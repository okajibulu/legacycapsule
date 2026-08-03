// ============================================================
// FILE PATH: app/api/photographer/token/revoke/route.ts
// PURPOSE:   Organiser revokes the photographer token for a
//            phase. Clears token + expiry. Auth-gated.
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

async function getOrganiserSession(req: NextRequest): Promise<{ email: string } | null> {
  try {
    const token = req.cookies.get('organiser_session')?.value
    if (!token) return null
    const { data } = await db
      .from('organiser_sessions')
      .select('email, expires_at')
      .eq('token', token)
      .maybeSingle()
    if (!data || new Date(data.expires_at) < new Date()) return null
    return { email: data.email }
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOrganiserSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { phase_id, capsule_id } = await req.json()

    if (!phase_id || !capsule_id) {
      return NextResponse.json(
        { error: 'phase_id and capsule_id are required' },
        { status: 400 }
      )
    }

    // ── Verify organiser owns capsule ──────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, organiser_email')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule || capsule.organiser_email !== session.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Clear token ────────────────────────────────────────────────────
    const { error } = await db
      .from('capsule_phases')
      .update({
        photographer_token:            null,
        photographer_token_expires_at: null,
      })
      .eq('id', phase_id)
      .eq('capsule_id', capsule_id)

    if (error) {
      console.error('[token/revoke]', error)
      return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, revoked: true })

  } catch (e: any) {
    console.error('[token/revoke]', e)
    return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 })
  }
}