// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/capsule/queue-submission/route.ts
// PURPOSE:   Autosaves a contributor's work to queued_submissions when the
//            capsule hits its contribution tier ceiling.
//            Called by TributeWallClient immediately on wall-hit.
//            Photo/audio/video already uploaded by client before this call.
//            Returns a session_token for the return URL.
//            Contributor is notified via batch email when organiser upgrades.
// ARCHITECTURE: Sprint 3 — Wall Experience.
//               queued_submissions table created in Sprint 1 migration.
//               Purge job (30 days) handled separately.
// BUILT BY:  AI20 · Claude Opus 4.6
// VERSION:   AI20v2.12.01
// DATE:      13 August 2026
// POST body: {
//   capsule_id, contributor_name?, contributor_email?, city?, country?,
//   relationship?, tribute_text?, photo_url?, audio_url?, video_url?
// }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import crypto                        from 'crypto'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Token generator ═══

function generateSessionToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

// ═══ SECTION 3 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      capsule_id,
      contributor_name,
      contributor_email,
      city,
      country,
      relationship,
      tribute_text,
      photo_url,
      audio_url,
      video_url,
    } = body

    if (!capsule_id) {
      return NextResponse.json(
        { error: 'capsule_id is required.' },
        { status: 400 }
      )
    }

    // ── Verify capsule exists ──────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('id, voice_ceiling')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
    }

    // ── Generate session token ─────────────────────────────────────────────
    const session_token = generateSessionToken()
    const purge_after   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // ── Insert queued submission ───────────────────────────────────────────
    const { error: insertError } = await db
      .from('queued_submissions')
      .insert({
        capsule_id,
        session_token,
        contributor_name:  contributor_name  ?? null,
        contributor_email: contributor_email ?? null,
        city:              city              ?? null,
        country:           country           ?? null,
        relationship:      relationship      ?? null,
        tribute_text:      tribute_text      ?? null,
        photo_url:         photo_url         ?? null,
        audio_url:         audio_url         ?? null,
        video_url:         video_url         ?? null,
        assets_pending:    true,
        status:            'queued',
        purge_after,
      })

    if (insertError) {
      console.error('[queue-submission] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Something went wrong saving your tribute. Please try again.' },
        { status: 500 }
      )
    }

    // ── Log wall_hit lifecycle event ───────────────────────────────────────
    // Non-blocking — do not fail if this errors
    try {
      await db.from('capsule_lifecycle_events').insert({
        capsule_id,
        event_type:  'wall_hit',
        payload:     { session_token, has_email: !!contributor_email },
        created_by:  'system',
      })
    } catch {}

    return NextResponse.json({
      ok:            true,
      session_token,
      return_url:    `/for/${body.capsule_slug ?? capsule_id}?restore=${session_token}`,
      purge_after,
    })

  } catch (err) {
    console.error('[queue-submission]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}