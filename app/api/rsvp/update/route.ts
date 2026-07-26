// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/rsvp/update/route.ts
// PURPOSE:   Circle Leader RSVP override — allows a circle leader to update
//            a guest's RSVP status without requiring the guest's personal token.
//            Fixes BUG-CIRCLE-001.
// BUILT BY:  AI15 (Claude Sonnet 4.6) · 26 July 2026
// VERSION:   v2.9.0
// DEPENDS ON:
//   - honouree_portal_tokens (role, circle_id, display_name, expires_at)
//   - guests (rsvp_status, rsvp_responded_at, circle_id, deleted_at)
//   - event_action_log (actor_type, actor_name, actor_ref, action, target_*)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ═══ SECTION 1 — Supabase client (service role, bypasses RLS) ═══

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Type definitions ═══

type RsvpStatus = 'confirmed' | 'declined' | 'pending' | 'no_response'

interface UpdateBody {
  token:     string       // Circle leader portal token
  guest_id:  string       // UUID of guest to update
  status:    RsvpStatus   // New RSVP status
}

const VALID_STATUSES: RsvpStatus[] = ['confirmed', 'declined', 'pending', 'no_response']

// ═══ SECTION 3 — POST handler ═══

export async function POST(req: NextRequest) {

  // ── 3.1 Parse and validate body ──────────────────────────────────────────

  let body: UpdateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { token, guest_id, status } = body

  if (!token || !guest_id || !status) {
    return NextResponse.json(
      { error: 'token, guest_id, and status are required' },
      { status: 400 }
    )
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  // ── 3.2 Authenticate the circle leader token ──────────────────────────────

  const { data: tokenRecord, error: tokenErr } = await supabase
    .from('honouree_portal_tokens')
    .select('id, capsule_id, role, circle_id, display_name, expires_at')
    .eq('token', token)
    .eq('role', 'circle_leader')
    .single()

  if (tokenErr || !tokenRecord) {
    return NextResponse.json(
      { error: 'Invalid or unrecognised portal token' },
      { status: 401 }
    )
  }

  // ── 3.3 Check token has not expired ──────────────────────────────────────

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'This portal link has expired. Please ask the organiser for a new one.' },
      { status: 403 }
    )
  }

  // ── 3.4 Load the guest and verify circle membership ──────────────────────

  const { data: guest, error: guestErr } = await supabase
    .from('guests')
    .select('id, name, circle_id, capsule_id, rsvp_status')
    .eq('id', guest_id)
    .is('deleted_at', null)
    .single()

  if (guestErr || !guest) {
    return NextResponse.json(
      { error: 'Guest not found' },
      { status: 404 }
    )
  }

  // ── 3.5 Guard: guest must belong to the leader's circle ──────────────────

  if (guest.circle_id !== tokenRecord.circle_id) {
    return NextResponse.json(
      { error: 'You do not have permission to update this guest\'s RSVP' },
      { status: 403 }
    )
  }

  // ── 3.6 Guard: capsule must match ────────────────────────────────────────

  if (guest.capsule_id !== tokenRecord.capsule_id) {
    return NextResponse.json(
      { error: 'Guest does not belong to this capsule' },
      { status: 403 }
    )
  }

  // ── 3.7 Guard: no-op if status is already the same ───────────────────────

  if (guest.rsvp_status === status) {
    return NextResponse.json(
      {
        message: 'No change — guest already has that status',
        guest_id,
        status,
      },
      { status: 200 }
    )
  }

  // ── 3.8 Update the guest record ───────────────────────────────────────────

  const { error: updateErr } = await supabase
    .from('guests')
    .update({
      rsvp_status:    status,
      rsvp_responded_at: new Date().toISOString(),
    })
    .eq('id', guest_id)
    .is('deleted_at', null)

  if (updateErr) {
    console.error('[rsvp/update] guest update failed:', updateErr)
    return NextResponse.json(
      { error: 'Failed to update guest RSVP status' },
      { status: 500 }
    )
  }

  // ── 3.9 Write audit log entry ─────────────────────────────────────────────

  try {
    await supabase.from('event_action_log').insert({
      capsule_id:  tokenRecord.capsule_id,
      actor_type:  'circle_leader',
      actor_name:  tokenRecord.display_name ?? 'Circle Leader',
      actor_ref:   tokenRecord.id,
      action:      'rsvp_updated',
      target_type: 'guest',
      target_id:   guest_id,
      target_name: guest.name ?? guest_id,
      metadata: {
        previous_status: guest.rsvp_status,
        new_status:      status,
        circle_id:       tokenRecord.circle_id,
      },
    })
  } catch (logErr) {
    // Non-blocking — log failure must not fail the request
    console.warn('[rsvp/update] audit log write failed:', logErr)
  }

  // ── 3.10 Return success ───────────────────────────────────────────────────

  return NextResponse.json(
    {
      message:  'RSVP status updated successfully',
      guest_id,
      status,
    },
    { status: 200 }
  )
}