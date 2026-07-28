// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/rsvp/verify/route.ts
// PURPOSE:   Token preflight for the guest-facing RSVP page.
//            Validates rsvp_token, returns guest identity, current RSVP status,
//            capsule info, and RSVP config — all in one call.
//            Allows the page to load fully personalised before any submission.
//            Fixes BUG-RSVP-001.
// BUILT BY:  AI15 (Claude Sonnet 4.6) · 27 July 2026
// VERSION:   v2.10.1
// DEPENDS ON:
//   - guests (rsvp_token, name, rsvp_status, rsvp_responded_at, capsule_id)
//   - capsules (honouree_name, event_type, event_tag, hero_image_url, slug)
//   - event_rsvp_config (all config fields)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — Supabase client (service role) ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — GET handler ═══

export async function GET(req: NextRequest) {

  // ── 2.1 Read token from query param ──────────────────────────────────────

  const token = req.nextUrl.searchParams.get('t')

  if (!token) {
    return NextResponse.json(
      { error: 'No RSVP token provided', token_valid: false },
      { status: 400 }
    )
  }

  // ── 2.2 Look up guest by rsvp_token ──────────────────────────────────────

  const { data: guest, error: guestErr } = await db
    .from('guests')
    .select('id, name, rsvp_status, rsvp_responded_at, capsule_id, additional_guests, dietary_requirements')
    .eq('rsvp_token', token)
    .is('deleted_at', null)
    .single()

  if (guestErr || !guest) {
    return NextResponse.json(
      { error: 'This invitation link is not recognised. Please check your email for the correct link.', token_valid: false },
      { status: 404 }
    )
  }

  // ── 2.3 Load capsule info + RSVP config in parallel ──────────────────────

  const [capsuleRes, configRes] = await Promise.all([

    db
      .from('capsules')
      .select('id, slug, honouree_name, event_type, event_tag, hero_image_url, page_state')
      .eq('id', guest.capsule_id)
      .single(),

    db
      .from('event_rsvp_config')
      .select('show_event_details, allow_additional_guests, max_additional_per_guest, show_dietary, allow_rsvp_message, rsvp_tone, deadline_at, event_venue, event_datetime, event_dress_code')
      .eq('capsule_id', guest.capsule_id)
      .single(),
  ])

  if (!capsuleRes.data) {
    return NextResponse.json(
      { error: 'Event not found.', token_valid: false },
      { status: 404 }
    )
  }

  const capsule = capsuleRes.data
  const config  = configRes.data ?? null

  // ── 2.4 Check deadline ────────────────────────────────────────────────────

  const deadlinePassed = config?.deadline_at
    ? new Date(config.deadline_at) < new Date()
    : false

  // ── 2.5 Return verified payload ───────────────────────────────────────────

  return NextResponse.json({
    token_valid:    true,
    deadline_passed: deadlinePassed,
    guest: {
      id:                guest.id,
      name:              guest.name,
      rsvp_status:       guest.rsvp_status,
      rsvp_responded_at: guest.rsvp_responded_at,
      additional_guests: guest.additional_guests ?? 0,
      dietary_requirements: guest.dietary_requirements ?? null,
    },
    capsule: {
      slug:          capsule.slug,
      honouree_name: capsule.honouree_name,
      event_type:    capsule.event_type,
      event_tag:     capsule.event_tag  ?? null,
      hero_image_url: capsule.hero_image_url ?? null,
    },
    config: config ? {
      show_event_details:       config.show_event_details      ?? true,
      allow_additional_guests:  config.allow_additional_guests ?? false,
      max_additional_per_guest: config.max_additional_per_guest ?? 2,
      show_dietary:             config.show_dietary            ?? false,
      allow_rsvp_message:       config.allow_rsvp_message      ?? true,
      rsvp_tone:                config.rsvp_tone               ?? 'warm',
      deadline_at:              config.deadline_at              ?? null,
      event_venue:              config.event_venue              ?? null,
      event_datetime:           config.event_datetime           ?? null,
      event_dress_code:         config.event_dress_code         ?? null,
    } : null,
  })
}