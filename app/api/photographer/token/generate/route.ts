// ============================================================
// FILE PATH: app/api/photographer/token/generate/route.ts
// PURPOSE:   Organiser generates a photographer upload token
//            for a specific phase. Token expires in 7 days.
//            One active token per phase at a time.
//            Auth-gated — valid organiser session required.
// ARCHITECTURE: LC12 Event Moments Spec
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.17
// DATE:      2 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import crypto                        from 'crypto'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 1 — Auth helper ═══

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

// ═══ SECTION 2 — POST handler ═══

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

    // ── Verify organiser owns this capsule ─────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, organiser_email')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule || capsule.organiser_email !== session.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Verify phase belongs to capsule ───────────────────────────────
    const { data: phase } = await db
      .from('capsule_phases')
      .select('id, name')
      .eq('id', phase_id)
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    // ── Generate token ────────────────────────────────────────────────
    const token      = crypto.randomBytes(32).toString('hex')
    const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: updateError } = await db
      .from('capsule_phases')
      .update({
        photographer_token:            token,
        photographer_token_expires_at: expiresAt,
      })
      .eq('id', phase_id)

    if (updateError) {
      console.error('[token/generate]', updateError)
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
    }

    const appUrl    = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
    const portalUrl = `${appUrl}/photographer/${token}`

    return NextResponse.json({
      ok:         true,
      token,
      portal_url: portalUrl,
      expires_at: expiresAt,
      phase_name: phase.name,
    })

  } catch (e: any) {
    console.error('[token/generate]', e)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}