// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/rsvp/respond/route.ts
// PURPOSE: Public route — no session required. Authenticated by rsvp_token
//          stored on the guest record. Handles guest RSVP submission:
//          - Validates token against guests.rsvp_token
//          - Updates rsvp_status, additional_guests, rsvp_message
//          - Optionally inserts a tribute contribution if message provided
//          - Marks rsvp_responded_at timestamp
//          - Writes to event_action_log
//          Called from /for/[slug]/rsvp page.
// ARCHITECTURE: LC02 Event Services Engine · Guest Coordination System
// PHASE: Guest Management — RSVP Layer
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Supabase client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Audit log helper ═══

async function logAction(params: {
  capsule_id:  string
  actor_type:  string
  actor_name:  string
  actor_ref:   string
  action:      string
  target_id:   string
  target_name: string
  metadata?:   Record<string, any>
}) {
  try {
    await db.from('event_action_log').insert({
      capsule_id:  params.capsule_id,
      actor_type:  params.actor_type,
      actor_name:  params.actor_name,
      actor_ref:   params.actor_ref,
      action:      params.action,
      target_type: 'guest',
      target_id:   params.target_id,
      target_name: params.target_name,
      metadata:    params.metadata ?? null,
    })
  } catch (e) {
    console.warn('[rsvp/respond] Audit log write failed:', e)
  }
}

// ═══ SECTION 3 — POST handler ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      rsvp_token,
      status,              // 'confirmed' | 'declined'
      additional_guests,   // number — how many extra people coming
      rsvp_message,        // optional tribute/message for honouree
      dietary_requirements, // optional — only if config.show_dietary is true
    } = body

    // ── Input validation ────────────────────────────────────────────────────

    if (!rsvp_token) {
      return NextResponse.json(
        { error: 'Invalid RSVP link. Please use the link from your invitation email.' },
        { status: 400 }
      )
    }

    if (!['confirmed', 'declined'].includes(status)) {
      return NextResponse.json(
        { error: 'Please select whether you are attending or unable to attend.' },
        { status: 400 }
      )
    }

    // ── Resolve guest from token ────────────────────────────────────────────

    const { data: guest, error: guestErr } = await db
      .from('guests')
      .select('id, capsule_id, name, email, tier, rsvp_status, rsvp_responded_at')
      .eq('rsvp_token', rsvp_token)
      .is('deleted_at', null)
      .maybeSingle()

    if (guestErr || !guest) {
      return NextResponse.json(
        { error: 'This RSVP link is not valid or has expired. Please contact the event organiser.' },
        { status: 404 }
      )
    }

    // ── Fetch capsule for tribute insertion context ─────────────────────────

    const { data: capsule } = await db
      .from('capsules')
      .select('id, slug, honouree_name, event_tag, page_state')
      .eq('id', guest.capsule_id)
      .single()

    if (!capsule || capsule.page_state === 'suspended') {
      return NextResponse.json(
        { error: 'This event is no longer accepting RSVPs.' },
        { status: 410 }
      )
    }

    // ── Build update payload ────────────────────────────────────────────────

    const updatePayload: Record<string, any> = {
      rsvp_status:       status,
      rsvp_responded_at: new Date().toISOString(),
    }

    if (typeof additional_guests === 'number' && additional_guests >= 0) {
      updatePayload.additional_guests = additional_guests
    }

    if (rsvp_message?.trim()) {
      updatePayload.rsvp_message = rsvp_message.trim()
    }

    if (dietary_requirements?.trim()) {
      updatePayload.dietary_requirements = dietary_requirements.trim()
    }

    // ── Update guest record ─────────────────────────────────────────────────

    const { error: updateErr } = await db
      .from('guests')
      .update(updatePayload)
      .eq('id', guest.id)

    if (updateErr) {
      console.error('[rsvp/respond] Guest update error:', updateErr)
      return NextResponse.json(
        { error: 'Could not save your RSVP. Please try again.' },
        { status: 500 }
      )
    }

    // ── Insert tribute if message provided and status is confirmed ──────────
    // Only insert if guest is confirming attendance — a declined RSVP message
    // is context for the organiser only, not a public tribute.

    let tributeInserted = false

    if (status === 'confirmed' && rsvp_message?.trim()) {
      try {
        const { error: tribErr } = await db
          .from('contributions')
          .insert({
            capsule_id:       guest.capsule_id,
            contributor_name: guest.name,
            email:            guest.email ?? null,
            tribute_text:     rsvp_message.trim(),
            relationship:     'Event Guest',
            status:           'pending',   // goes through normal moderation
            source:           'rsvp',
          })

        if (!tribErr) tributeInserted = true
      } catch {
        // Non-blocking — RSVP is still valid without tribute insertion
      }
    }

    // ── Write audit log ─────────────────────────────────────────────────────

    await logAction({
      capsule_id:  guest.capsule_id,
      actor_type:  'guest',
      actor_name:  guest.name,
      actor_ref:   guest.email ?? rsvp_token.slice(0, 8),
      action:      status === 'confirmed' ? 'rsvp_confirmed' : 'rsvp_declined',
      target_id:   guest.id,
      target_name: guest.name,
      metadata: {
        previous_status:    guest.rsvp_status,
        additional_guests:  additional_guests ?? 0,
        tribute_inserted:   tributeInserted,
      },
    })

    return NextResponse.json({
      ok:               true,
      status,
      guest_name:       guest.name,
      honouree_name:    capsule.honouree_name,
      capsule_slug:     capsule.slug,
      tribute_inserted: tributeInserted,
    })

  } catch (e: any) {
    console.error('[rsvp/respond] Unexpected error:', e)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
